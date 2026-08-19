# Session 2 — Build the CLI adapter

**Time:** ~60 minutes
**Prerequisite:** Session 1 (the CRM web app runs on your machine)

---

## Why a CLI before MCP?

Because a CLI proves the architecture with no new concepts.

In Session 1 we built a web UI. If our business logic were tangled up in
`web/app.py`, adding a second interface would mean rewriting everything. So
this session tests that claim: **can we add a completely different interface
without touching `core/` at all?**

If yes, adding MCP later is the same move again. If no, we would have found
the problem now instead of in Session 4.

```
                    core/            <- unchanged this session
                      |
        +-------------+-------------+
        |                           |
      web/                       cli.py
   (Session 1)                 (Session 2)
        |                           |
     browser                     terminal
```

---

## What an adapter is allowed to do

Exactly three things:

1. Read what the user typed
2. Call **one** function in `core/`
3. Print the result

Look at any command in `cli.py` and you will see that shape. For example:

```python
@deals_app.command("move")
def deals_move(deal_id: str, stage: str = ..., reason: Optional[str] = None):
    """Move a deal to another pipeline stage."""
    rec = run(deals.move_stage, deal_id, stage, reason)      # <- the only real work
    ok(f"'{rec['name']}' moved to {rec['stage']} ({rec['probability']}%).", rec)
```

Nowhere does the CLI know that `proposal` means 50% probability, or that
`closed_lost` needs a reason. `core/deals.py` owns those rules, and it owned
them before this file existed.

---

## Try it

```bash
cd minicrm
python cli.py --help
python cli.py dashboard
python cli.py users
python cli.py accounts list
python cli.py deals list --open-only --limit 5
python cli.py report stale-accounts --days 30
```

Now do a full workflow from the terminal:

```bash
python cli.py accounts create --name "Orbit Foods" --industry Retail --city Indore
python cli.py deals create --name "Orbit Foods - pilot" --account acc_xxxx --amount 800000
python cli.py deals move dea_xxxx --stage proposal
python cli.py tasks create --subject "Send pricing" --related-type deal --related-id dea_xxxx --due 2026-09-30
python cli.py activities log --type call --subject "Intro call" --related-type deal --related-id dea_xxxx
```

Then open http://127.0.0.1:8000 and look at the pipeline board. **Everything
you did in the terminal is already there.** Two interfaces, one database, one
set of rules. No syncing code was written.

---

## The `--json` flag — the most important thing in this file

Every command accepts a global `--json`:

```bash
python cli.py --json accounts list --limit 1
python cli.py --json deals list --open-only
```

Human output is a pretty table. Machine output is JSON.

This is not a convenience feature. In **Session 5** we hand an AI agent a Skill
that says "to look at the CRM, run `python cli.py --json ...`". The agent will
read that JSON and act on it — and we will not have written one line of
agent-specific code to make it work.

Rule to remember: **any tool you build for humans should have a machine-readable
mode.** That mode is what makes it agent-ready later.

---

## Errors are part of the interface

Run these deliberately wrong commands:

```bash
python cli.py deals move dea_xxxx --stage almost_won
python cli.py deals move dea_xxxx --stage closed_lost
python cli.py accounts show acc_nope
python cli.py leads create --first A --last B --source telepathy
python cli.py --json accounts show acc_nope
```

You get back:

```
validation_failed: 'almost_won' is not a valid deal stage.
  field: stage
  allowed: ['qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
```

Three things to notice:

1. **The error names the field and lists the valid values.** A human can fix it.
   So can an agent — this is what stops a model from guessing a second time.
2. **Exit codes are meaningful**: `0` success, `1` business rule broken,
   `2` bad input shape. Scripts and agents branch on these.
3. **The web API returns the exact same error object.** One definition in
   `core/errors.py`, three consumers.

This is the idea we will lean on hardest in Session 4:

> In the age of agents, your schemas and your error messages *are* the
> communication protocol between your software and the model.

---

## Exercise

1. Add a `contacts update` command. Time yourself.
   It should take under five minutes, because `core.contacts.update_contact()`
   already exists. If it takes longer, something leaked out of the core.

2. Find one thing in `cli.py` that is *business logic* rather than interface
   logic, and move it into `core/`.
   (Hint: look at how `--reason` is handled for `closed_lost`. Is the rule in
   the CLI, or in the core? Check `core/deals.py:move_stage`.)

3. Answer without opening the file: if we delete `cli.py` entirely, does the
   web app still work? Why?

---

## What you should be able to say now

- A CLI is an interface for humans.
- The shared core is where the capability actually lives.
- Adding an interface should be cheap. If it is expensive, your logic is in
  the wrong place.
- A machine-readable output mode makes a human tool agent-ready for free.

**Next session:** the same core, exposed as a Local MCP server — so a coding
agent can call it directly instead of a person typing commands.
