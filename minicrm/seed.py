"""Populate the CRM with realistic demo data.

Run:  python seed.py           (adds data if DB is empty)
      python seed.py --reset   (wipes and rebuilds)
"""
from __future__ import annotations

import random
import sys
from datetime import date, datetime, timedelta, timezone

from core import db
from core.accounts import create_account
from core.activities import log_activity
from core.contacts import create_contact
from core.deals import create_deal
from core.leads import create_lead
from core.tasks import create_task
from core.users import create_user
from core.models import (AccountIn, ActivityIn, ActivityType, ContactIn,
                         DealIn, DealStage, LeadIn, LeadSource, Priority,
                         Rating, RelatedType, TaskIn, TaskStatus)

random.seed(7)

USERS = [
    ("Rahul Mehta", "rahul@minicrm.io", "sales_manager"),
    ("Priya Nair", "priya@minicrm.io", "sales_rep"),
    ("Aditya Rao", "aditya@minicrm.io", "sales_rep"),
    ("Sneha Kulkarni", "sneha@minicrm.io", "sales_rep"),
]

COMPANIES = [
    ("Nimbus Logistics", "Logistics", "Mumbai", 480, 62_00_00_000),
    ("Vertex Analytics", "Software", "Bengaluru", 120, 18_00_00_000),
    ("Kadam Textiles", "Manufacturing", "Surat", 1500, 210_00_00_000),
    ("BlueOrbit Fintech", "Financial Services", "Pune", 260, 45_00_00_000),
    ("Saffron Hospitality", "Hospitality", "Jaipur", 800, 95_00_00_000),
    ("Corex Pharma", "Pharmaceuticals", "Hyderabad", 640, 130_00_00_000),
    ("Anvil Engineering", "Manufacturing", "Chennai", 310, 52_00_00_000),
    ("Peak Retail Group", "Retail", "Delhi", 2200, 340_00_00_000),
    ("Helio Energy", "Energy", "Ahmedabad", 190, 78_00_00_000),
    ("Trailhead EdTech", "Education", "Bengaluru", 85, 9_00_00_000),
    ("Meridian Health", "Healthcare", "Kolkata", 950, 160_00_00_000),
    ("Quantic Media", "Media", "Mumbai", 140, 22_00_00_000),
]

FIRST = ["Arjun", "Kavya", "Rohit", "Meera", "Vikram", "Ananya", "Sameer",
         "Divya", "Nikhil", "Tara", "Karan", "Ishita", "Manav", "Pooja"]
LAST = ["Sharma", "Iyer", "Banerjee", "Desai", "Reddy", "Chopra", "Menon",
        "Joshi", "Verma", "Pillai", "Ghosh", "Bhatt"]
TITLES = ["CTO", "VP Sales", "Head of Ops", "Procurement Lead", "CFO",
          "IT Manager", "Founder", "Director - Supply Chain"]

DEAL_SUFFIX = ["Platform Rollout", "Annual Renewal", "Pilot Program",
               "Expansion - 50 seats", "Migration Project", "Support Contract",
               "Q4 Upgrade", "Regional Deployment"]


def reset():
    # order matters: children first, because leads point at contacts/accounts
    for t in ["activities", "tasks", "deals", "leads", "contacts", "accounts", "users"]:
        db.execute(f"DELETE FROM {t}")


def iso_days_ago(n: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=n)).isoformat(timespec="seconds")


def run():
    db.init_db()
    if "--reset" in sys.argv:
        reset()
    if db.query_one("SELECT COUNT(*) AS c FROM accounts")["c"]:
        print("Database already has data. Use --reset to rebuild.")
        return

    users = [create_user(n, e, r) for n, e, r in USERS]
    uids = [u["id"] for u in users]

    accounts, contacts, deals = [], [], []

    for name, industry, city, emp, rev in COMPANIES:
        acc = create_account(AccountIn(
            name=name, industry=industry, city=city, country="India",
            employees=emp, annual_revenue=rev,
            website=f"https://{name.lower().replace(' ', '')}.example.com",
            phone=f"+91 {random.randint(70,99)}{random.randint(10000000,99999999)}",
            owner_id=random.choice(uids),
        ))
        accounts.append(acc)

        for _ in range(random.randint(1, 3)):
            c = create_contact(ContactIn(
                first_name=random.choice(FIRST), last_name=random.choice(LAST),
                email=f"{random.choice(FIRST).lower()}.{random.choice(LAST).lower()}@{name.split()[0].lower()}.example.com",
                phone=f"+91 {random.randint(70,99)}{random.randint(10000000,99999999)}",
                title=random.choice(TITLES), account_id=acc["id"],
                owner_id=acc["owner_id"],
            ))
            contacts.append(c)

        acc_contacts = [c for c in contacts if c["account_id"] == acc["id"]]
        for _ in range(random.randint(1, 3)):
            stage = random.choice(list(DealStage))
            d = create_deal(DealIn(
                name=f"{name} - {random.choice(DEAL_SUFFIX)}",
                account_id=acc["id"],
                contact_id=random.choice(acc_contacts)["id"],
                amount=random.choice([4, 8, 12, 18, 25, 40, 60, 95]) * 100000,
                stage=stage,
                close_date=date.today() + timedelta(days=random.randint(-20, 75)),
                source=random.choice(list(LeadSource)),
                owner_id=acc["owner_id"],
            ))
            deals.append(d)

    for _ in range(18):
        create_lead(LeadIn(
            first_name=random.choice(FIRST), last_name=random.choice(LAST),
            company=random.choice([
                "Orbit Foods", "Zen Interiors", "Crest Mobility", "Lumen Labs",
                "Falcon Freight", "Aster Devices", "Ridge Consulting", "Nova Print"]),
            email=f"lead{random.randint(100,999)}@example.com",
            phone=f"+91 {random.randint(70,99)}{random.randint(10000000,99999999)}",
            title=random.choice(TITLES),
            source=random.choice(list(LeadSource)),
            status=random.choice(["new", "new", "contacted", "qualified", "unqualified"]),
            rating=random.choice(list(Rating)),
            owner_id=random.choice(uids),
        ))

    subjects = ["Follow up on proposal", "Schedule technical demo",
                "Send revised pricing", "Chase signed MSA", "Quarterly check-in",
                "Share implementation plan", "Confirm PO timeline"]
    for d in random.sample(deals, k=min(20, len(deals))):
        create_task(TaskIn(
            subject=f"{random.choice(subjects)} - {d['account_name']}",
            related_type=RelatedType.deal, related_id=d["id"],
            assignee_id=d["owner_id"],
            priority=random.choice(list(Priority)),
            status=random.choice([TaskStatus.open, TaskStatus.open, TaskStatus.in_progress, TaskStatus.completed]),
            due_date=date.today() + timedelta(days=random.randint(-12, 21)),
        ))

    notes = ["Discussed scope and timelines.", "Left voicemail, will retry.",
             "Demo went well, security review pending.", "Sent pricing sheet.",
             "Procurement wants a 3-year option.", "Champion moved teams - re-map."]
    for acc in accounts:
        for _ in range(random.randint(0, 4)):
            log_activity(ActivityIn(
                type=random.choice(list(ActivityType)),
                subject=random.choice(["Intro call", "Pricing discussion", "Product demo",
                                       "Email follow-up", "Site visit"]),
                notes=random.choice(notes),
                related_type=RelatedType.account, related_id=acc["id"],
                owner_id=acc["owner_id"],
                occurred_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 70)),
            ))

    print(f"Seeded: {len(users)} users, {len(accounts)} accounts, "
          f"{len(contacts)} contacts, {len(deals)} deals, 18 leads.")


if __name__ == "__main__":
    run()
