"""MiniCRM command line — ADAPTER 2.

The web app was adapter 1. This is adapter 2. Notice what is NOT in this file:
no SQL, no pipeline rules, no validation logic. Every command does the same
three things:

    1. read what the human typed
    2. call one function in core/
    3. print the result

That is the whole job of an adapter.

    python cli.py --help
    python cli.py dashboard
    python cli.py deals list --open-only
    python cli.py deals move dea_xxx --stage proposal
    python cli.py accounts list --json          <- machine-readable output

The --json flag matters later: it is how an AI agent will read this CLI
in Stage 5, without us writing a single line of agent-specific code.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path
from typing import Optional

import typer
from pydantic import ValidationError
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

sys.path.insert(0, str(Path(__file__).resolve().parent))

from core import (accounts, activities, analytics, contacts, db, deals, leads,
                  tasks, users)
from core.errors import CRMError
from core.models import (AccountIn, ActivityIn, ContactIn, DealIn, LeadIn,
                         TaskIn)

# Windows consoles default to a legacy codepage; rich needs UTF-8 for its
# box characters and ellipsis. Do this before creating any Console.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):  # already fine, or not reconfigurable
        pass

# Floor the width so tables stay readable even in a small terminal.
WIDTH = max(shutil.get_terminal_size((120, 24)).columns, 118)

console = Console(width=WIDTH)
err_console = Console(stderr=True, width=WIDTH)

STATE = {"json": False}

app = typer.Typer(
    help="MiniCRM - a CRM you can drive from the terminal.",
    no_args_is_help=True,
    add_completion=False,
)


# ==========================================================================
# output helpers
# ==========================================================================
def money(n) -> str:
    v = float(n or 0)
    if v >= 1e7:
        return f"Rs {v / 1e7:,.2f} Cr"
    if v >= 1e5:
        return f"Rs {v / 1e5:,.1f} L"
    return f"Rs {v:,.0f}"


def short(s, n: int = 34) -> str:
    s = str(s or "-")
    return s if len(s) <= n else s[: n - 1] + "~"


def emit(rows: list[dict], columns: list[tuple], title: str = "") -> None:
    """columns = [(header, key, kind)] where kind is text | money | num."""
    if STATE["json"]:
        console.print_json(json.dumps(rows, default=str))
        return
    if not rows:
        console.print(f"[dim]No records found.[/dim]")
        return
    table = Table(title=title or None, header_style="bold magenta",
                  title_style="bold", border_style="bright_black", show_lines=False)
    for header, _, kind in columns:
        table.add_column(
            header,
            justify="right" if kind in ("money", "num") else "left",
            style={"money": "bold", "id": "cyan"}.get(kind),
            no_wrap=(kind == "id"),      # ids are what you paste into the next command
        )
    for r in rows:
        cells = []
        for _, key, kind in columns:
            v = r.get(key)
            if kind == "money":
                cells.append(money(v))
            elif kind == "num":
                cells.append("-" if v is None else str(v))
            elif kind == "id":
                cells.append(str(v or "-"))
            else:
                cells.append(short(v))
        table.add_row(*cells)
    console.print(table)
    console.print(f"[dim]{len(rows)} record(s)[/dim]")


def emit_one(record: dict, fields: list[tuple], title: str = "") -> None:
    """fields = [(label, key, kind)]"""
    if STATE["json"]:
        console.print_json(json.dumps(record, default=str))
        return
    lines = []
    for label, key, kind in fields:
        v = record.get(key)
        v = money(v) if kind == "money" else ("-" if v in (None, "") else str(v))
        lines.append(f"[dim]{label:<16}[/dim] {v}")
    console.print(Panel("\n".join(lines), title=title or record.get("id", ""),
                        border_style="magenta", title_align="left"))


def ok(msg: str, record: dict | None = None) -> None:
    if STATE["json"]:
        console.print_json(json.dumps(record if record is not None else {"ok": True, "message": msg},
                                      default=str))
        return
    console.print(f"[green]OK[/green] {msg}")
    if record and record.get("id"):
        console.print(f"[dim]id: {record['id']}[/dim]")


def clean(d: dict) -> dict:
    """Drop the options the user did not pass."""
    return {k: v for k, v in d.items() if v is not None}


# ==========================================================================
# global options + error handling
# ==========================================================================
@app.callback()
def main(json_out: bool = typer.Option(False, "--json", help="Machine-readable JSON output.")):
    db.init_db()
    STATE["json"] = json_out


def run(fn, *args, **kwargs):
    """Call a core function and translate its errors into shell behaviour.

    Structured core errors become structured CLI output plus a non-zero exit
    code — the same information the web API returns, and the same information
    an MCP tool will return later.
    """
    try:
        return fn(*args, **kwargs)
    except CRMError as e:
        if STATE["json"]:
            err_console.print_json(json.dumps(e.to_dict()))
        else:
            err_console.print(f"[red]{e.code}[/red]: {e.message}")
            for k, v in e.details.items():
                err_console.print(f"  [dim]{k}:[/dim] {v}")
        raise typer.Exit(1)
    except ValidationError as e:
        problems = [{"field": ".".join(str(p) for p in err["loc"]), "problem": err["msg"]}
                    for err in e.errors()]
        if STATE["json"]:
            err_console.print_json(json.dumps(
                {"ok": False, "error": {"code": "validation_failed", "details": problems}}))
        else:
            err_console.print("[red]validation_failed[/red]: check these fields")
            for p in problems:
                err_console.print(f"  [dim]{p['field']}:[/dim] {p['problem']}")
        raise typer.Exit(2)


# ==========================================================================
# dashboard / pipeline / search
# ==========================================================================
@app.command()
def dashboard():
    """Headline numbers for the whole CRM."""
    k = run(analytics.dashboard)
    if STATE["json"]:
        console.print_json(json.dumps(k, default=str))
        return
    grid = Table.grid(padding=(0, 3))
    grid.add_column(style="dim")
    grid.add_column(style="bold magenta", justify="right")
    grid.add_row("Open pipeline", money(k["open_pipeline_value"]))
    grid.add_row("Weighted forecast", money(k["weighted_pipeline_value"]))
    grid.add_row("Won this month", f"{money(k['won_this_month_value'])} ({k['won_this_month_count']} deals)")
    grid.add_row("Win rate", f"{k['win_rate_pct']}%")
    grid.add_row("Avg deal size", money(k["avg_deal_size"]))
    grid.add_row("Open deals", str(k["open_deal_count"]))
    grid.add_row("Open tasks", f"{k['open_tasks']} ({k['overdue_tasks']} overdue)")
    grid.add_row("New leads", str(k["new_leads"]))
    grid.add_row("Accounts / contacts", f"{k['total_accounts']} / {k['total_contacts']}")
    console.print(Panel(grid, title="MiniCRM dashboard", border_style="magenta", title_align="left"))

    if k["closing_next_30_days"]:
        emit(k["closing_next_30_days"],
             [("Deal", "name", "text"), ("Account", "account_name", "text"),
              ("Amount", "amount", "money"), ("Stage", "stage", "text"),
              ("Close date", "close_date", "text")],
             title="Closing in the next 30 days")


@app.command()
def pipeline():
    """Deal counts and value per stage."""
    board = run(deals.pipeline_board)
    rows = [{"stage": s, "count": v["count"], "total": v["total"]} for s, v in board.items()]
    emit(rows, [("Stage", "stage", "text"), ("Deals", "count", "num"), ("Value", "total", "money")],
         title="Pipeline by stage")


@app.command()
def search(q: str = typer.Argument(..., help="Text to look for across all record types.")):
    """Search accounts, contacts, deals and leads at once."""
    result = {
        "accounts": run(accounts.search_accounts, q=q, limit=10),
        "contacts": run(contacts.search_contacts, q=q, limit=10),
        "deals": run(deals.search_deals, q=q, limit=10),
        "leads": run(leads.search_leads, q=q, limit=10),
    }
    if STATE["json"]:
        console.print_json(json.dumps(result, default=str))
        return
    for label, rows, name_key in [("Accounts", result["accounts"], "name"),
                                  ("Contacts", result["contacts"], "full_name"),
                                  ("Deals", result["deals"], "name"),
                                  ("Leads", result["leads"], "full_name")]:
        if rows:
            emit(rows, [("Id", "id", "id"), (label[:-1], name_key, "text")], title=label)


# ==========================================================================
# accounts
# ==========================================================================
accounts_app = typer.Typer(help="Companies you sell to.", no_args_is_help=True)
app.add_typer(accounts_app, name="accounts")


@accounts_app.command("list")
def accounts_list(
    q: Optional[str] = typer.Option(None, "--q", help="Search name, website or city."),
    industry: Optional[str] = typer.Option(None, "--industry"),
    owner: Optional[str] = typer.Option(None, "--owner", help="Owner user id."),
    limit: int = typer.Option(50, "--limit"),
):
    """List accounts."""
    rows = run(accounts.search_accounts, q=q, industry=industry, owner_id=owner, limit=limit)
    emit(rows, [("Id", "id", "id"), ("Account", "name", "text"),
                ("Industry", "industry", "text"), ("City", "city", "text"),
                ("Contacts", "contact_count", "num"), ("Open pipeline", "open_pipeline", "money"),
                ("Owner", "owner_name", "text")], title="Accounts")


@accounts_app.command("show")
def accounts_show(account_id: str):
    """Show one account with its deals, contacts and recent activity."""
    acc = run(accounts.get_account, account_id)
    if STATE["json"]:
        console.print_json(json.dumps({
            "account": acc,
            "contacts": contacts.search_contacts(account_id=account_id),
            "deals": deals.search_deals(account_id=account_id),
            "activities": activities.list_activities(related_type="account", related_id=account_id),
            "tasks": tasks.search_tasks(related_type="account", related_id=account_id),
        }, default=str))
        return
    emit_one(acc, [("Name", "name", "text"), ("Industry", "industry", "text"),
                   ("Website", "website", "text"), ("Phone", "phone", "text"),
                   ("City", "city", "text"), ("Employees", "employees", "text"),
                   ("Revenue", "annual_revenue", "money"), ("Owner", "owner_name", "text"),
                   ("Open pipeline", "open_pipeline", "money")], title=acc["name"])
    emit(deals.search_deals(account_id=account_id),
         [("Deal", "name", "text"), ("Amount", "amount", "money"),
          ("Stage", "stage", "text"), ("Close", "close_date", "text")], title="Deals")
    emit(contacts.search_contacts(account_id=account_id),
         [("Contact", "full_name", "text"), ("Title", "title", "text"),
          ("Email", "email", "text")], title="Contacts")
    emit(activities.list_activities(related_type="account", related_id=account_id, limit=5),
         [("When", "occurred_at", "text"), ("Type", "type", "text"),
          ("Subject", "subject", "text")], title="Recent activity")


@accounts_app.command("create")
def accounts_create(
    name: str = typer.Option(..., "--name"),
    industry: Optional[str] = typer.Option(None, "--industry"),
    website: Optional[str] = typer.Option(None, "--website"),
    phone: Optional[str] = typer.Option(None, "--phone"),
    city: Optional[str] = typer.Option(None, "--city"),
    employees: Optional[int] = typer.Option(None, "--employees"),
    revenue: Optional[float] = typer.Option(None, "--revenue", help="Annual revenue."),
    owner: Optional[str] = typer.Option(None, "--owner"),
):
    """Create an account."""
    data = run(AccountIn, **clean(dict(name=name, industry=industry, website=website,
                                       phone=phone, city=city, employees=employees,
                                       annual_revenue=revenue, owner_id=owner)))
    rec = run(accounts.create_account, data)
    ok(f"Account '{rec['name']}' created.", rec)


@accounts_app.command("update")
def accounts_update(
    account_id: str,
    name: Optional[str] = typer.Option(None, "--name"),
    industry: Optional[str] = typer.Option(None, "--industry"),
    phone: Optional[str] = typer.Option(None, "--phone"),
    city: Optional[str] = typer.Option(None, "--city"),
    employees: Optional[int] = typer.Option(None, "--employees"),
    owner: Optional[str] = typer.Option(None, "--owner"),
):
    """Update fields on an account."""
    changes = clean(dict(name=name, industry=industry, phone=phone, city=city,
                         employees=employees, owner_id=owner))
    if not changes:
        err_console.print("[red]Nothing to update.[/red] Pass at least one option.")
        raise typer.Exit(2)
    rec = run(accounts.update_account, account_id, changes)
    ok(f"Account '{rec['name']}' updated.", rec)


@accounts_app.command("delete")
def accounts_delete(account_id: str,
                    yes: bool = typer.Option(False, "--yes", help="Skip the confirmation.")):
    """Delete an account and its deals."""
    acc = run(accounts.get_account, account_id)
    if not yes and not STATE["json"]:
        typer.confirm(f"Delete '{acc['name']}' and its {acc['deal_count']} deal(s)?", abort=True)
    ok(f"Account '{acc['name']}' deleted.", run(accounts.delete_account, account_id))


# ==========================================================================
# contacts
# ==========================================================================
contacts_app = typer.Typer(help="People at your accounts.", no_args_is_help=True)
app.add_typer(contacts_app, name="contacts")


@contacts_app.command("list")
def contacts_list(
    q: Optional[str] = typer.Option(None, "--q"),
    account: Optional[str] = typer.Option(None, "--account", help="Account id."),
    limit: int = typer.Option(50, "--limit"),
):
    """List contacts."""
    rows = run(contacts.search_contacts, q=q, account_id=account, limit=limit)
    emit(rows, [("Id", "id", "id"), ("Name", "full_name", "text"),
                ("Title", "title", "text"), ("Account", "account_name", "text"),
                ("Email", "email", "text")], title="Contacts")


@contacts_app.command("show")
def contacts_show(contact_id: str):
    """Show one contact."""
    c = run(contacts.get_contact, contact_id)
    emit_one(c, [("Name", "full_name", "text"), ("Title", "title", "text"),
                 ("Account", "account_name", "text"), ("Email", "email", "text"),
                 ("Phone", "phone", "text"), ("Owner", "owner_name", "text")],
             title=c["full_name"])


@contacts_app.command("create")
def contacts_create(
    first: str = typer.Option(..., "--first"),
    last: str = typer.Option(..., "--last"),
    email: Optional[str] = typer.Option(None, "--email"),
    phone: Optional[str] = typer.Option(None, "--phone"),
    title_: Optional[str] = typer.Option(None, "--title"),
    account: Optional[str] = typer.Option(None, "--account", help="Account id."),
    owner: Optional[str] = typer.Option(None, "--owner"),
):
    """Create a contact."""
    data = run(ContactIn, **clean(dict(first_name=first, last_name=last, email=email,
                                       phone=phone, title=title_, account_id=account,
                                       owner_id=owner)))
    rec = run(contacts.create_contact, data)
    ok(f"Contact '{rec['full_name']}' created.", rec)


# ==========================================================================
# leads
# ==========================================================================
leads_app = typer.Typer(help="Prospects not yet qualified.", no_args_is_help=True)
app.add_typer(leads_app, name="leads")


@leads_app.command("list")
def leads_list(
    q: Optional[str] = typer.Option(None, "--q"),
    status: Optional[str] = typer.Option(None, "--status", help="new|contacted|qualified|unqualified|converted"),
    source: Optional[str] = typer.Option(None, "--source"),
    rating: Optional[str] = typer.Option(None, "--rating", help="hot|warm|cold"),
    limit: int = typer.Option(50, "--limit"),
):
    """List leads."""
    rows = run(leads.search_leads, q=q, status=status, source=source, rating=rating, limit=limit)
    emit(rows, [("Id", "id", "id"), ("Name", "full_name", "text"),
                ("Company", "company", "text"), ("Source", "source", "text"),
                ("Rating", "rating", "text"), ("Status", "status", "text"),
                ("Owner", "owner_name", "text")], title="Leads")


@leads_app.command("show")
def leads_show(lead_id: str):
    """Show one lead."""
    l = run(leads.get_lead, lead_id)
    emit_one(l, [("Name", "full_name", "text"), ("Company", "company", "text"),
                 ("Title", "title", "text"), ("Email", "email", "text"),
                 ("Phone", "phone", "text"), ("Source", "source", "text"),
                 ("Rating", "rating", "text"), ("Status", "status", "text"),
                 ("Owner", "owner_name", "text"), ("Converted", "converted_at", "text")],
             title=l["full_name"])


@leads_app.command("create")
def leads_create(
    first: str = typer.Option(..., "--first"),
    last: str = typer.Option(..., "--last"),
    company: Optional[str] = typer.Option(None, "--company"),
    email: Optional[str] = typer.Option(None, "--email"),
    phone: Optional[str] = typer.Option(None, "--phone"),
    source: Optional[str] = typer.Option(None, "--source", help="website|referral|cold_call|event|partner|ads|other"),
    rating: Optional[str] = typer.Option(None, "--rating"),
    owner: Optional[str] = typer.Option(None, "--owner"),
):
    """Create a lead."""
    data = run(LeadIn, **clean(dict(first_name=first, last_name=last, company=company,
                                    email=email, phone=phone, source=source,
                                    rating=rating, owner_id=owner)))
    rec = run(leads.create_lead, data)
    ok(f"Lead '{rec['full_name']}' created.", rec)


@leads_app.command("convert")
def leads_convert(
    lead_id: str,
    deal_name: Optional[str] = typer.Option(None, "--deal-name", help="Skip to convert without a deal."),
    amount: float = typer.Option(0, "--amount"),
):
    """Convert a lead into an account, a contact and optionally a deal."""
    r = run(leads.convert_lead, lead_id, deal_name, amount)
    if STATE["json"]:
        console.print_json(json.dumps(r, default=str))
        return
    console.print(f"[green]OK[/green] Lead converted.")
    console.print(f"  [dim]account:[/dim] {r['account']['name']}  ({r['account']['id']})")
    console.print(f"  [dim]contact:[/dim] {r['contact']['full_name']}  ({r['contact']['id']})")
    if r["deal"]:
        console.print(f"  [dim]deal:   [/dim] {r['deal']['name']}  ({r['deal']['id']})")


# ==========================================================================
# deals
# ==========================================================================
deals_app = typer.Typer(help="Your sales pipeline.", no_args_is_help=True)
app.add_typer(deals_app, name="deals")


@deals_app.command("list")
def deals_list(
    q: Optional[str] = typer.Option(None, "--q"),
    stage: Optional[str] = typer.Option(None, "--stage"),
    owner: Optional[str] = typer.Option(None, "--owner"),
    account: Optional[str] = typer.Option(None, "--account"),
    min_amount: Optional[float] = typer.Option(None, "--min-amount"),
    open_only: bool = typer.Option(False, "--open-only", help="Exclude closed deals."),
    limit: int = typer.Option(50, "--limit"),
):
    """List deals."""
    rows = run(deals.search_deals, q=q, stage=stage, owner_id=owner, account_id=account,
               min_amount=min_amount, open_only=open_only, limit=limit)
    emit(rows, [("Id", "id", "id"), ("Deal", "name", "text"),
                ("Account", "account_name", "text"), ("Amount", "amount", "money"),
                ("Stage", "stage", "text"), ("Prob", "probability", "num"),
                ("Close", "close_date", "text"), ("Owner", "owner_name", "text")],
         title="Deals")


@deals_app.command("show")
def deals_show(deal_id: str):
    """Show one deal with its tasks and activity."""
    d = run(deals.get_deal, deal_id)
    emit_one(d, [("Deal", "name", "text"), ("Account", "account_name", "text"),
                 ("Contact", "contact_name", "text"), ("Amount", "amount", "money"),
                 ("Stage", "stage", "text"), ("Probability", "probability", "text"),
                 ("Close date", "close_date", "text"), ("Owner", "owner_name", "text"),
                 ("Lost reason", "lost_reason", "text")], title=d["name"])
    if not STATE["json"]:
        emit(tasks.search_tasks(related_type="deal", related_id=deal_id),
             [("Task", "subject", "text"), ("Due", "due_date", "text"),
              ("Status", "status", "text")], title="Tasks")


@deals_app.command("create")
def deals_create(
    name: str = typer.Option(..., "--name"),
    account: str = typer.Option(..., "--account", help="Account id."),
    amount: float = typer.Option(0, "--amount"),
    stage: Optional[str] = typer.Option(None, "--stage"),
    close_date: Optional[str] = typer.Option(None, "--close-date", help="YYYY-MM-DD"),
    owner: Optional[str] = typer.Option(None, "--owner"),
):
    """Create a deal."""
    data = run(DealIn, **clean(dict(name=name, account_id=account, amount=amount,
                                    stage=stage, close_date=close_date, owner_id=owner)))
    rec = run(deals.create_deal, data)
    ok(f"Deal '{rec['name']}' created at {money(rec['amount'])}.", rec)


@deals_app.command("move")
def deals_move(
    deal_id: str,
    stage: str = typer.Option(..., "--stage", help="qualification|needs_analysis|proposal|negotiation|closed_won|closed_lost"),
    reason: Optional[str] = typer.Option(None, "--reason", help="Required for closed_lost."),
):
    """Move a deal to another pipeline stage."""
    rec = run(deals.move_stage, deal_id, stage, reason)
    ok(f"'{rec['name']}' moved to {rec['stage']} ({rec['probability']}%).", rec)


# ==========================================================================
# tasks
# ==========================================================================
tasks_app = typer.Typer(help="Follow-ups.", no_args_is_help=True)
app.add_typer(tasks_app, name="tasks")


@tasks_app.command("list")
def tasks_list(
    q: Optional[str] = typer.Option(None, "--q"),
    status: Optional[str] = typer.Option(None, "--status"),
    priority: Optional[str] = typer.Option(None, "--priority"),
    assignee: Optional[str] = typer.Option(None, "--assignee", help="User id."),
    overdue: bool = typer.Option(False, "--overdue", help="Only tasks past their due date."),
    limit: int = typer.Option(50, "--limit"),
):
    """List tasks."""
    rows = run(tasks.search_tasks, q=q, status=status, priority=priority,
               assignee_id=assignee, overdue_only=overdue, limit=limit)
    emit(rows, [("Id", "id", "id"), ("Subject", "subject", "text"),
                ("Assignee", "assignee_name", "text"), ("Due", "due_date", "text"),
                ("Priority", "priority", "text"), ("Status", "status", "text")],
         title="Overdue tasks" if overdue else "Tasks")


@tasks_app.command("create")
def tasks_create(
    subject: str = typer.Option(..., "--subject"),
    due: Optional[str] = typer.Option(None, "--due", help="YYYY-MM-DD"),
    priority: Optional[str] = typer.Option(None, "--priority", help="low|medium|high|urgent"),
    assignee: Optional[str] = typer.Option(None, "--assignee"),
    related_type: Optional[str] = typer.Option(None, "--related-type", help="lead|account|contact|deal"),
    related_id: Optional[str] = typer.Option(None, "--related-id"),
    description: Optional[str] = typer.Option(None, "--description"),
):
    """Create a task."""
    data = run(TaskIn, **clean(dict(subject=subject, due_date=due, priority=priority,
                                    assignee_id=assignee, related_type=related_type,
                                    related_id=related_id, description=description)))
    rec = run(tasks.create_task, data)
    ok(f"Task '{rec['subject']}' created.", rec)


@tasks_app.command("assign")
def tasks_assign(task_id: str, user_id: str = typer.Option(..., "--to", help="User id.")):
    """Assign a task to a user."""
    rec = run(tasks.assign_task, task_id, user_id)
    ok(f"'{rec['subject']}' assigned to {rec['assignee_name']}.", rec)


@tasks_app.command("complete")
def tasks_complete(task_id: str):
    """Mark a task completed."""
    rec = run(tasks.complete_task, task_id)
    ok(f"'{rec['subject']}' completed.", rec)


# ==========================================================================
# activities
# ==========================================================================
act_app = typer.Typer(help="Calls, emails, meetings and notes.", no_args_is_help=True)
app.add_typer(act_app, name="activities")


@act_app.command("list")
def act_list(
    related_type: Optional[str] = typer.Option(None, "--related-type"),
    related_id: Optional[str] = typer.Option(None, "--related-id"),
    type_: Optional[str] = typer.Option(None, "--type", help="call|email|meeting|note|demo"),
    limit: int = typer.Option(25, "--limit"),
):
    """List activities, newest first."""
    rows = run(activities.list_activities, related_type=related_type, related_id=related_id,
               type=type_, limit=limit)
    emit(rows, [("When", "occurred_at", "text"), ("Type", "type", "text"),
                ("Subject", "subject", "text"), ("Related", "related_type", "text"),
                ("By", "owner_name", "text")], title="Activities")


@act_app.command("log")
def act_log(
    type_: str = typer.Option(..., "--type", help="call|email|meeting|note|demo"),
    subject: str = typer.Option(..., "--subject"),
    notes: Optional[str] = typer.Option(None, "--notes"),
    related_type: Optional[str] = typer.Option(None, "--related-type"),
    related_id: Optional[str] = typer.Option(None, "--related-id"),
    owner: Optional[str] = typer.Option(None, "--owner"),
):
    """Log something that happened."""
    data = run(ActivityIn, **clean(dict(type=type_, subject=subject, notes=notes,
                                        related_type=related_type, related_id=related_id,
                                        owner_id=owner)))
    rec = run(activities.log_activity, data)
    ok(f"Logged {rec['type']}: '{rec['subject']}'.", rec)


# ==========================================================================
# reports
# ==========================================================================
report_app = typer.Typer(help="Rollups an agent will read later.", no_args_is_help=True)
app.add_typer(report_app, name="report")


@report_app.command("stale-accounts")
def report_stale(
    days: int = typer.Option(30, "--days", help="No activity in this many days."),
    min_value: float = typer.Option(0, "--min-value", help="Minimum open pipeline value."),
):
    """Accounts with open pipeline and no recent activity."""
    rows = run(analytics.stale_accounts, days=days, min_open_value=min_value)
    emit(rows, [("Id", "id", "id"), ("Account", "name", "text"),
                ("Owner", "owner_name", "text"), ("Open deals", "open_deals", "num"),
                ("Open value", "open_value", "money"), ("Last activity", "last_activity", "text")],
         title=f"Accounts with no activity in {days} days")


@report_app.command("leaderboard")
def report_leaderboard():
    """Open and won value per sales rep."""
    rows = run(analytics.revenue_by_owner)
    emit(rows, [("Rep", "owner_name", "text"), ("Open", "open_value", "money"),
                ("Won", "won_value", "money"), ("Deals", "deal_count", "num")],
         title="Rep leaderboard")


@report_app.command("funnel")
def report_funnel():
    """Deal count and value per stage."""
    rows = run(analytics.pipeline_by_stage)
    emit(rows, [("Stage", "stage", "text"), ("Deals", "count", "num"), ("Value", "total", "money")],
         title="Sales funnel")


@report_app.command("sources")
def report_sources():
    """Lead counts per source."""
    rows = run(analytics.leads_by_source)
    emit(rows, [("Source", "source", "text"), ("Leads", "count", "num")], title="Leads by source")


# ==========================================================================
# users
# ==========================================================================
@app.command("users")
def users_list():
    """List users you can assign work to."""
    emit(run(users.list_users), [("Id", "id", "id"), ("Name", "name", "text"),
                                 ("Email", "email", "text"), ("Role", "role", "text")],
         title="Users")


if __name__ == "__main__":
    app()
