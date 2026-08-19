"""REST adapter over the shared core.

Every route below is a thin translation layer:
    HTTP request  ->  pydantic model  ->  core function  ->  JSON
No business logic lives in this file. That is the whole point.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import Body, FastAPI, Query, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core import (accounts, activities, analytics, contacts, db, deals, leads,  # noqa: E402
                  tasks, users)
from core.errors import CRMError  # noqa: E402
from core.models import (AccountIn, ActivityIn, ActivityType, ContactIn,  # noqa: E402
                         DealIn, DealStage, LeadIn, LeadSource, LeadStatus,
                         Priority, Rating, TaskIn, TaskStatus)

STATIC = Path(__file__).resolve().parent / "static"

app = FastAPI(
    title="MiniCRM API",
    version="1.0.0",
    description="A small but complete CRM. The same core also powers a CLI and MCP servers.",
)


@app.on_event("startup")
def _startup():
    db.init_db()


@app.exception_handler(CRMError)
def _crm_error(request: Request, exc: CRMError):
    """Structured errors: identical shape for browsers and for agents."""
    return JSONResponse(status_code=exc.http_status, content=exc.to_dict())


# ---------------------------------------------------------------- meta
@app.get("/api/meta")
def meta():
    """Enum values + users. The UI builds all its dropdowns from this."""
    return {
        "deal_stages": [s.value for s in DealStage],
        "lead_statuses": [s.value for s in LeadStatus],
        "lead_sources": [s.value for s in LeadSource],
        "ratings": [r.value for r in Rating],
        "priorities": [p.value for p in Priority],
        "task_statuses": [s.value for s in TaskStatus],
        "activity_types": [t.value for t in ActivityType],
        "users": users.list_users(),
    }


# ---------------------------------------------------------------- dashboard
@app.get("/api/dashboard")
def get_dashboard():
    return {
        "kpis": analytics.dashboard(),
        "pipeline_by_stage": analytics.pipeline_by_stage(),
        "leads_by_source": analytics.leads_by_source(),
        "revenue_by_owner": analytics.revenue_by_owner(),
        "recent_activities": activities.list_activities(limit=8),
        "overdue_tasks": tasks.search_tasks(overdue_only=True, limit=8),
    }


@app.get("/api/reports/stale-accounts")
def stale_accounts(days: int = 30, min_open_value: float = 0):
    return analytics.stale_accounts(days=days, min_open_value=min_open_value)


# ---------------------------------------------------------------- accounts
@app.get("/api/accounts")
def list_accounts(q: str | None = None, industry: str | None = None,
                  owner_id: str | None = None, limit: int = 100, offset: int = 0):
    return accounts.search_accounts(q, industry, owner_id, limit, offset)


@app.get("/api/accounts/{account_id}")
def get_account(account_id: str):
    acc = accounts.get_account(account_id)
    return {
        "account": acc,
        "contacts": contacts.search_contacts(account_id=account_id),
        "deals": deals.search_deals(account_id=account_id),
        "activities": activities.list_activities(related_type="account", related_id=account_id),
        "tasks": tasks.search_tasks(related_type="account", related_id=account_id),
    }


@app.post("/api/accounts")
def post_account(data: AccountIn):
    return accounts.create_account(data)


@app.patch("/api/accounts/{account_id}")
def patch_account(account_id: str, changes: dict = Body(...)):
    return accounts.update_account(account_id, changes)


@app.delete("/api/accounts/{account_id}")
def del_account(account_id: str):
    return accounts.delete_account(account_id)


# ---------------------------------------------------------------- contacts
@app.get("/api/contacts")
def list_contacts(q: str | None = None, account_id: str | None = None,
                  owner_id: str | None = None, limit: int = 100, offset: int = 0):
    return contacts.search_contacts(q, account_id, owner_id, limit, offset)


@app.get("/api/contacts/{contact_id}")
def get_contact(contact_id: str):
    return {
        "contact": contacts.get_contact(contact_id),
        "activities": activities.list_activities(related_type="contact", related_id=contact_id),
        "tasks": tasks.search_tasks(related_type="contact", related_id=contact_id),
    }


@app.post("/api/contacts")
def post_contact(data: ContactIn):
    return contacts.create_contact(data)


@app.patch("/api/contacts/{contact_id}")
def patch_contact(contact_id: str, changes: dict = Body(...)):
    return contacts.update_contact(contact_id, changes)


@app.delete("/api/contacts/{contact_id}")
def del_contact(contact_id: str):
    return contacts.delete_contact(contact_id)


# ---------------------------------------------------------------- leads
@app.get("/api/leads")
def list_leads(q: str | None = None, status: str | None = None, source: str | None = None,
               rating: str | None = None, owner_id: str | None = None,
               limit: int = 100, offset: int = 0):
    return leads.search_leads(q, status, source, rating, owner_id, limit, offset)


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: str):
    return {
        "lead": leads.get_lead(lead_id),
        "activities": activities.list_activities(related_type="lead", related_id=lead_id),
        "tasks": tasks.search_tasks(related_type="lead", related_id=lead_id),
    }


@app.post("/api/leads")
def post_lead(data: LeadIn):
    return leads.create_lead(data)


@app.patch("/api/leads/{lead_id}")
def patch_lead(lead_id: str, changes: dict = Body(...)):
    return leads.update_lead(lead_id, changes)


@app.post("/api/leads/{lead_id}/convert")
def convert(lead_id: str, body: dict = Body(default={})):
    return leads.convert_lead(lead_id, body.get("deal_name"), float(body.get("deal_amount") or 0))


@app.delete("/api/leads/{lead_id}")
def del_lead(lead_id: str):
    return leads.delete_lead(lead_id)


# ---------------------------------------------------------------- deals
@app.get("/api/deals")
def list_deals(q: str | None = None, stage: str | None = None, owner_id: str | None = None,
               account_id: str | None = None, min_amount: float | None = None,
               open_only: bool = False, limit: int = 200, offset: int = 0):
    return deals.search_deals(q, stage, owner_id, account_id, min_amount,
                              open_only, None, limit, offset)


@app.get("/api/pipeline")
def pipeline():
    return deals.pipeline_board()


@app.get("/api/deals/{deal_id}")
def get_deal(deal_id: str):
    return {
        "deal": deals.get_deal(deal_id),
        "activities": activities.list_activities(related_type="deal", related_id=deal_id),
        "tasks": tasks.search_tasks(related_type="deal", related_id=deal_id),
    }


@app.post("/api/deals")
def post_deal(data: DealIn):
    return deals.create_deal(data)


@app.patch("/api/deals/{deal_id}")
def patch_deal(deal_id: str, changes: dict = Body(...)):
    return deals.update_deal(deal_id, changes)


@app.post("/api/deals/{deal_id}/stage")
def move_deal_stage(deal_id: str, body: dict = Body(...)):
    return deals.move_stage(deal_id, body["stage"], body.get("lost_reason"))


@app.delete("/api/deals/{deal_id}")
def del_deal(deal_id: str):
    return deals.delete_deal(deal_id)


# ---------------------------------------------------------------- tasks
@app.get("/api/tasks")
def list_tasks(q: str | None = None, status: str | None = None, priority: str | None = None,
               assignee_id: str | None = None, related_type: str | None = None,
               related_id: str | None = None, overdue_only: bool = False,
               limit: int = 200, offset: int = 0):
    return tasks.search_tasks(q, status, priority, assignee_id, related_type,
                              related_id, None, overdue_only, limit, offset)


@app.post("/api/tasks")
def post_task(data: TaskIn):
    return tasks.create_task(data)


@app.patch("/api/tasks/{task_id}")
def patch_task(task_id: str, changes: dict = Body(...)):
    return tasks.update_task(task_id, changes)


@app.post("/api/tasks/{task_id}/complete")
def do_complete(task_id: str):
    return tasks.complete_task(task_id)


@app.delete("/api/tasks/{task_id}")
def del_task(task_id: str):
    return tasks.delete_task(task_id)


# ---------------------------------------------------------------- activities
@app.get("/api/activities")
def list_acts(related_type: str | None = None, related_id: str | None = None,
              type: str | None = None, owner_id: str | None = None,
              limit: int = 100, offset: int = 0):
    return activities.list_activities(related_type, related_id, type, owner_id, limit, offset)


@app.post("/api/activities")
def post_activity(data: ActivityIn):
    return activities.log_activity(data)


@app.delete("/api/activities/{activity_id}")
def del_activity(activity_id: str):
    return activities.delete_activity(activity_id)


# ---------------------------------------------------------------- global search
@app.get("/api/search")
def global_search(q: str = Query(min_length=1), limit: int = 5):
    return {
        "accounts": accounts.search_accounts(q=q, limit=limit),
        "contacts": contacts.search_contacts(q=q, limit=limit),
        "deals": deals.search_deals(q=q, limit=limit),
        "leads": leads.search_leads(q=q, limit=limit),
    }


# ---------------------------------------------------------------- static UI
app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")
