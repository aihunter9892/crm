# MCP Training — build once, expose everywhere

A hands-on course project. One business capability (a CRM), progressively
exposed to humans, local coding agents and cloud AI through different adapters.

```
                       core/          <- all business logic, one copy
                         |
     +---------+---------+---------+-----------+
     |         |         |         |           |
   web/     cli.py   mcp_local  mcp_remote   SKILL.md
  (done)    (done)     (next)     (next)      (next)
```

## Stages 1-2 — the application and its first two adapters (done)

[`minicrm/`](minicrm/) — a working CRM: leads, accounts, contacts, deals,
tasks, activities, dashboard and reports. FastAPI + SQLite + vanilla HTML/JS,
plus a full CLI over the identical core.

```bash
cd minicrm
pip install -r requirements.txt
python seed.py --reset
python run.py          # http://127.0.0.1:8000
python cli.py --help   # the same CRM, from the terminal
```

See [minicrm/README.md](minicrm/README.md) for the full walkthrough.

## Roadmap

| Stage | Adds | Consumer | Status |
|---|---|---|---|
| 1 | Web UI + REST | humans in a browser | done |
| 2 | `cli.py` | humans in a terminal | done |
| 3 | `mcp_local.py` (stdio) | Claude Code / Codex | next |
| 4 | `mcp_remote.py` (HTTP) | Claude.ai / ChatGPT | |
| 5 | `SKILL.md` | any agent, via the CLI | |

## The one-line takeaway

Build the capability once in a shared, validated core; then expose it through
CLI, Local MCP, Remote MCP and Skills depending on where the human or agent
needs it.
