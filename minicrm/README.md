# MiniCRM — Stage 1: the business application

A small but complete CRM (Zoho-shaped): leads, accounts, contacts, deals,
tasks, activities, dashboard and reports.

This is **Stage 1** of the MCP training program. Right now the CRM has exactly
one interface: a web UI. In later stages the *same* `core/` package gains a
CLI, a local MCP server, a remote MCP server and a Skill — with zero business
logic duplicated.

```
                       core/          <- all business logic, one copy
                         |
     +---------+---------+---------+-----------+
     |         |         |         |           |
   web/     cli.py   mcp_local  mcp_remote   SKILL.md
  (built)   (next)     (next)     (next)      (next)
```

## Run it

```bash
cd minicrm
pip install -r requirements.txt
python seed.py --reset
python run.py
```

Open http://127.0.0.1:8000 — REST docs at http://127.0.0.1:8000/docs

## Layout

| Path | Role |
|---|---|
| `core/models.py` | Pydantic schemas + enums. The contract, for humans and agents. |
| `core/db.py` | SQLite connection + schema. No ORM, no setup. |
| `core/errors.py` | Structured errors (`code`, `message`, `details`). |
| `core/accounts.py` `contacts.py` `leads.py` `deals.py` `tasks.py` `activities.py` | Business operations. |
| `core/analytics.py` | Dashboard rollups + `stale_accounts()` (the follow-up query). |
| `web/app.py` | REST adapter. Thin. Contains **no** business logic. |
| `web/static/` | Vanilla HTML/CSS/JS UI. No build step. |
| `seed.py` | 12 accounts, 28 contacts, 21 deals, 18 leads of demo data. |

## What the UI does

- **Dashboard** — 8 KPIs, pipeline-by-stage bars, rep performance, leads by source, recent activity, overdue tasks
- **Leads** — filter by status/source/rating/owner, **convert** to Account + Contact + Deal in one action
- **Accounts** — contact count, open pipeline per account, full detail drawer
- **Contacts** — searchable, linked to accounts
- **Pipeline** — drag-and-drop kanban across 6 stages (dropping into *Closed Lost* demands a reason)
- **Deals** — list view, stage mover, probability auto-derived from stage
- **Tasks** — overdue highlighting, one-click complete
- **Activities** — a timeline of calls, emails, meetings and notes
- **Reports** — sales funnel, rep leaderboard, *accounts going cold*
- **Global search** across all four record types

## The teaching points already baked in

1. **Business logic lives in `core/` only.** Every route in `web/app.py` is
   parse → call core → return. Delete the web folder and the CRM still works.
2. **Enums are guardrails.** `DealStage`, `Priority`, `TaskStatus` etc. make an
   invalid value impossible — for a human form *and* for an AI tool call.
3. **Errors are structured, not strings.** Move a deal to a bad stage and you
   get back the field name and the list of allowed values. That is what lets an
   agent correct itself instead of hallucinating.
4. **`convert_lead()` is a multi-step operation written once.** The UI calls it,
   and later the MCP tool will call the same function.

## Next stages

| Stage | Adds | Consumer |
|---|---|---|
| 2 | `cli.py` | humans in a terminal |
| 3 | `mcp_local.py` (stdio) | Claude Code / Codex |
| 4 | `mcp_remote.py` (HTTP) | Claude.ai / ChatGPT |
| 5 | `.claude/skills/crm-followup/SKILL.md` | any agent, via the CLI |
