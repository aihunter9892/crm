"""Leads = unqualified prospects, before they become Account + Contact + Deal."""
from __future__ import annotations

from . import db
from .common import insert, like, must_get, patch, payload
from .errors import Conflict
from .models import (AccountIn, ContactIn, DealIn, LeadIn, LeadStatus, new_id,
                     now_iso)

BASE = """
SELECT l.*,
       l.first_name || ' ' || l.last_name AS full_name,
       u.name AS owner_name
FROM leads l
LEFT JOIN users u ON u.id = l.owner_id
"""


def search_leads(
    q: str | None = None,
    status: str | None = None,
    source: str | None = None,
    rating: str | None = None,
    owner_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    where, params = [], []
    if q:
        where.append("(l.first_name LIKE ? OR l.last_name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)")
        params += [like(q)] * 4
    for col, val in (("status", status), ("source", source), ("rating", rating), ("owner_id", owner_id)):
        if val:
            where.append(f"l.{col} = ?")
            params.append(val)
    sql = BASE + (" WHERE " + " AND ".join(where) if where else "")
    sql += " ORDER BY l.created_at DESC LIMIT ? OFFSET ?"
    return db.query(sql, [*params, limit, offset])


def get_lead(lead_id: str) -> dict:
    must_get("leads", lead_id, "Lead")
    return db.query_one(BASE + " WHERE l.id = ?", (lead_id,))


def create_lead(data: LeadIn) -> dict:
    row = payload(data)
    row["id"] = new_id("led")
    row["created_at"] = row["updated_at"] = now_iso()
    insert("leads", row)
    return get_lead(row["id"])


def update_lead(lead_id: str, changes: dict) -> dict:
    must_get("leads", lead_id, "Lead")
    allowed = set(LeadIn.model_fields)
    clean_changes = {k: v for k, v in changes.items() if k in allowed}
    clean_changes["updated_at"] = now_iso()
    patch("leads", lead_id, clean_changes)
    return get_lead(lead_id)


def delete_lead(lead_id: str) -> dict:
    must_get("leads", lead_id, "Lead")
    db.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
    return {"deleted": lead_id}


def convert_lead(lead_id: str, deal_name: str | None = None, deal_amount: float = 0) -> dict:
    """Turn a lead into Account + Contact (+ optional Deal).

    This is the single most valuable multi-step operation in a CRM, so it lives
    in the core exactly once and every adapter reuses it.
    """
    from . import accounts, contacts, deals

    lead = must_get("leads", lead_id, "Lead")
    if lead["converted_at"]:
        raise Conflict(
            f"Lead '{lead_id}' was already converted on {lead['converted_at']}.",
            account_id=lead["converted_account_id"],
            contact_id=lead["converted_contact_id"],
        )

    company = lead["company"] or f"{lead['first_name']} {lead['last_name']}"
    existing = db.query_one("SELECT * FROM accounts WHERE lower(name) = lower(?)", (company,))
    account = existing if existing else accounts.create_account(
        AccountIn(name=company, owner_id=lead["owner_id"])
    )

    contact = contacts.create_contact(ContactIn(
        first_name=lead["first_name"],
        last_name=lead["last_name"],
        email=lead["email"],
        phone=lead["phone"],
        title=lead["title"],
        account_id=account["id"],
        owner_id=lead["owner_id"],
    ))

    deal = None
    if deal_name or deal_amount:
        deal = deals.create_deal(DealIn(
            name=deal_name or f"{company} - new opportunity",
            account_id=account["id"],
            contact_id=contact["id"],
            amount=deal_amount,
            source=lead["source"],
            owner_id=lead["owner_id"],
        ))

    patch("leads", lead_id, {
        "status": LeadStatus.converted.value,
        "converted_at": now_iso(),
        "converted_account_id": account["id"],
        "converted_contact_id": contact["id"],
        "converted_deal_id": deal["id"] if deal else None,
        "updated_at": now_iso(),
    })
    return {"lead": get_lead(lead_id), "account": account, "contact": contact, "deal": deal}
