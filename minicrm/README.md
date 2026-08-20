# MiniCRM — Stages 1-2: the application and its first two adapters

A small but complete CRM (Zoho-shaped): leads, accounts, contacts, deals,
tasks, activities, dashboard and reports.

The CRM now has **two** interfaces over one core: a web UI and a CLI. In later
stages the same `core/` package gains a local MCP server, a remote MCP server
and a Skill — with zero business logic duplicated.

```
                       core/          <- all business logic, one copy
                         |
     +---------+---------+---------+-----------+
     |         |         |         |           |
   web/     cli.py   mcp_local  mcp_remote   SKILL.md
  (done)    (done)     (next)     (next)      (next)
```

## Setup

**Use a virtual environment.** Most Windows machines have two or three Pythons
installed (a python.org one, a conda one, a Microsoft Store one). Installing
into a venv means everyone in the room runs the same interpreter with the same
packages, and nothing you install here can break another project.

### Windows (PowerShell)

```powershell
cd minicrm
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell refuses to run the activate script, allow it for this session
only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

### macOS / Linux

```bash
cd minicrm
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Check you are in the right Python

```bash
python -c "import sys; print(sys.executable)"
```

The path printed must end in `.venv`. If it does not, activation did not take
effect — the commands below will fail with `ModuleNotFoundError`.

<details>
<summary><b>Already using Anaconda / conda?</b></summary>

If your prompt starts with `(base)` you are inside conda's Python, which is a
different interpreter from the one `python.org` installed. Two options:

**Option A — a conda env (recommended if you live in conda):**

```bash
conda create -n minicrm python=3.12 -y
conda activate minicrm
pip install -r requirements.txt
```

**Option B — install into conda's base env:**

```bash
python -m pip install -r requirements.txt
```

Either way, the rule is the same: whichever `python` your prompt resolves to is
the one that needs the packages.
</details>

<details>
<summary><b>Common errors and what they mean</b></summary>

| Error | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: No module named 'email_validator'` | Packages installed into a different Python than the one you are running | Activate the venv, then `pip install -r requirements.txt` |
| `ModuleNotFoundError: No module named 'fastapi'` / `'typer'` | Same cause | Same fix |
| `ModuleNotFoundError: No module named 'core'` | You ran the command from the wrong folder | `cd minicrm` first |
| `Address already in use` on port 8000 | The web app is already running | Use the running one, or stop it with Ctrl+C |
| `no such table: accounts` | Database never created | `python seed.py --reset` |
</details>

## Run it

```bash
python seed.py --reset      # create the database and fill it with demo data
python run.py               # start the web app
```

Open http://127.0.0.1:8000 — REST docs at http://127.0.0.1:8000/docs

Or drive the same CRM from the terminal:

```bash
python cli.py --help
python cli.py dashboard
python cli.py deals list --open-only
python cli.py deals move dea_xxxx --stage proposal
python cli.py --json accounts list        # machine-readable, for agents later
```

## Layout

| Path | Role |
|---|---|
| `core/models.py` | Pydantic schemas + enums. The contract, for humans and agents. |
| `core/db.py` | SQLite connection + schema. No ORM, no setup. |
| `core/errors.py` | Structured errors (`code`, `message`, `details`). |
| `core/accounts.py` `contacts.py` `leads.py` `deals.py` `tasks.py` `activities.py` | Business operations. |
| `core/analytics.py` | Dashboard rollups + `stale_accounts()` (the follow-up query). |
| `web/app.py` | REST adapter. Thin. Contains **no** business logic. |
| `cli.py` | CLI adapter. Also thin. Same core, different interface. |
| `web/static/` | Vanilla HTML/CSS/JS UI. No build step. |
| `seed.py` | 12 accounts, 28 contacts, 21 deals, 18 leads of demo data. |
| `docs/` | Session-by-session teaching notes. |

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

| Stage | Adds | Consumer | Status |
|---|---|---|---|
| 1 | Web UI + REST | humans in a browser | done |
| 2 | `cli.py` | humans in a terminal | done |
| 3 | `mcp_local.py` (stdio) | Claude Code / Codex | next |
| 4 | `mcp_remote.py` (HTTP) | Claude.ai / ChatGPT | |
| 5 | `.claude/skills/crm-followup/SKILL.md` | any agent, via the CLI | |

## Teaching material

- [Slides — Sessions 1 & 2](docs/slides/sessions-1-2-slides.md) — 28 slides with
  speaker notes, live-demo cues and timings
- [Session 2 handout — Build the CLI adapter](docs/02-cli-adapter.md)
