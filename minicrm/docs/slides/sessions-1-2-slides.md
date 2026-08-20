# Slides — Sessions 1 & 2
### "Build the capability once. Expose it everywhere."

**Audience:** freshers / developers new to AI tooling
**Total run time:** ~3 hours (Session 1: 90 min, Session 2: 60 min, buffer 30 min)
**Format per slide:** what goes on the slide → what you say → what you demo

**Before you start:** have the web app running at http://127.0.0.1:8000 and a
terminal open in `minicrm/`. Do not start with theory. Start with Slide 3.

---
---

# PART A — WHY (Slides 1–6) · 20 min

---

## Slide 1 — Title

**On screen**

> # Build Once. Expose Everywhere.
> ### From a normal app → to an app that AI agents can operate
> Session 1 & 2 · MiniCRM

**Speaker notes**

Keep this on screen for 20 seconds only. Do not introduce yourself yet — the
demo earns their attention faster than your bio does.

⏱ 1 min

---

## Slide 2 — The question everyone is asking

**On screen**

> ### "Should I learn MCP, or Skills, or build a CLI?"
>
> Wrong question.
>
> ### "How do I build one thing that works everywhere?"
>
> Right question.

**Speaker notes**

Ask the room by show of hands: who has heard of MCP? Who has built one? Usually
a few hands for the first, almost none for the second.

Say this plainly: the tools change every few months. MCP was hot, then Skills
arrived, and something else will arrive next year. If you rebuild your work
every time, you lose. So today we are not learning a tool — we are learning a
shape you can pour any tool into.

⏱ 2 min

---

## Slide 3 — Start with the demo, not the theory

**On screen**

> ### Here is a CRM.
> (nothing about AI yet)

**Speaker notes**

Switch to the browser. Do not explain the architecture yet. Just use the app
like a salesperson would.

**Do this live** (3 minutes, no commentary about code):
1. Dashboard — point at the numbers. "₹6 crore of open pipeline, 15 open tasks."
2. Pipeline — **drag a deal card** from one column to another.
3. Accounts — click a row, the drawer opens, show deals + contacts + timeline.
4. Leads — click a lead, click **Convert →**. Show that it created an account,
   a contact and a deal in one action.

Then say: "This is a normal business application. No AI anywhere. Remember what
it looks like — by the end of this course, an AI agent will be doing everything
I just did."

⏱ 4 min

---

## Slide 4 — The trap: building the same logic four times

**On screen**

> ```
> CLI          -> Telegram/CRM logic
> Local MCP    -> Telegram/CRM logic
> Remote MCP   -> Telegram/CRM logic
> Skill        -> Telegram/CRM logic
> ```
> ### Four copies. Four places to fix every bug.

**Speaker notes**

This is what most people do when they discover MCP. They already have an app,
so they write the MCP server as a *new project* and re-implement the logic
inside it.

Ask: "If your company changes its discount rule, how many files do you edit in
this picture?" Answer: four. And you will forget one.

⏱ 2 min

---

## Slide 5 — The shape we will build instead

**On screen**

> ```
>                    SHARED CORE
>                (all business logic)
>                         |
>      +---------+--------+--------+----------+
>      |         |        |        |          |
>     CLI    Web/REST  Local MCP  Remote MCP  Skill
>      |         |        |        |          |
>   terminal  browser  Claude Code  ChatGPT  instructions
> ```

**Speaker notes**

Draw this on a whiteboard as you talk — do not just show it. Make them copy it
into their notes. They will see this diagram in every session.

Two sentences to repeat until they are bored of them:

> **The core owns the capability. The adapter owns the interface.**

An adapter is thin. It reads input, calls one core function, prints the result.
That's all.

⏱ 3 min

---

## Slide 6 — Where each interface is used

**On screen**

| Interface | Who uses it | How it talks |
|---|---|---|
| Web / REST | humans | browser |
| CLI | humans | terminal |
| Local MCP | coding agents on your laptop | STDIO |
| Remote MCP | ChatGPT / Claude on the web | HTTP |
| Skill | any agent | instructions |
| **Shared core** | **all of them** | **actual logic** |

**Speaker notes**

Read the table across, one row at a time. Emphasise the last row.

Anticipate the question "why is Remote MCP separate?" — answer it now in one
line: *ChatGPT runs in a data centre. It cannot reach a program running on your
laptop.* That is the only reason. Same code, different door.

We build rows 1 and 2 today. Rows 3, 4, 5 in the coming sessions.

⏱ 3 min

---
---

# PART B — THE APPLICATION (Slides 7–12) · 30 min

---

## Slide 7 — What is a CRM? (for people who have never used one)

**On screen**

> A CRM tracks **who you are selling to** and **what you promised to do next**.
>
> - **Lead** — a stranger who might buy. Not qualified yet.
> - **Account** — a company that is now a real prospect or customer.
> - **Contact** — a person at that company.
> - **Deal** — a specific opportunity, with a value and a stage.
> - **Task** — something you must do, by a date.
> - **Activity** — something that already happened. A call, an email, a meeting.

**Speaker notes**

Do not assume they know this. Half the room has never seen Salesforce or Zoho.

Use one concrete story and reuse it all day:

> *Priya gets a business card at a conference. That's a* **lead**. *She calls,
> it goes well, so she converts it: the company becomes an* **account**, *the
> person becomes a* **contact**, *and the ₹8 lakh opportunity becomes a*
> **deal**. *She logs the call as an* **activity** *and creates a* **task** *to
> send pricing by Friday.*

⏱ 4 min

---

## Slide 8 — The pipeline: six stages

**On screen**

> ```
> qualification -> needs_analysis -> proposal -> negotiation -> closed_won
>                                                            \-> closed_lost
> ```
> Every deal sits in exactly one stage.
> Each stage carries a probability: 10% → 25% → 50% → 75% → 100% / 0%

**Speaker notes**

This is the single most important business rule in the whole application.
Everything downstream depends on it — forecasts, the kanban board, the reports.

Point out that `closed_lost` demands a **reason**. That rule will show up three
more times today, and it will be written exactly once.

⏱ 3 min

---

## Slide 9 — The data model

**On screen**

> ```
> users
>   |
> accounts ------< contacts
>   |                 |
>   +-----< deals >---+
>
> leads  --(convert)--> account + contact + deal
>
> tasks       -> can attach to any of the four
> activities  -> can attach to any of the four
> ```

**Speaker notes**

Seven tables. That is the whole database. Keep it small deliberately — the
lesson is the architecture, not the schema.

Point at the `convert` arrow. Say: "Hold on to that one. It is the most
interesting function in the codebase and we will come back to it twice."

⏱ 3 min

---

## Slide 10 — Tour the folders

**On screen**

> ```
> minicrm/
> ├── core/          <- ALL the business logic. One copy.
> │   ├── models.py      the contract: what a valid record looks like
> │   ├── db.py          SQLite tables
> │   ├── errors.py      structured errors
> │   ├── accounts.py  contacts.py  leads.py
> │   ├── deals.py     tasks.py     activities.py
> │   └── analytics.py   dashboard numbers
> │
> ├── web/           <- ADAPTER 1: REST API + browser UI
> ├── cli.py         <- ADAPTER 2: terminal
> └── seed.py           demo data
> ```

**Speaker notes**

Open the folder in the editor while you talk. Show that `core/` is the biggest
part and `web/app.py` is surprisingly small for a 40-route API.

Ask them to predict: "If I delete the `web/` folder, does the CRM still work?"
Let them argue for 30 seconds. Answer: **yes** — the capability survives, only
one door closes.

⏱ 4 min

---

## Slide 11 — What an adapter is allowed to do

**On screen**

> ### An adapter does exactly three things:
> 1. Read what the user sent
> 2. Call **one** function in `core/`
> 3. Return / print the result
>
> ### If it does anything else, it is in the wrong file.

**Speaker notes**

This is the rule they must be able to recite tomorrow morning.

Give the counter-example out loud: "If you find yourself writing
`if stage == 'closed_lost': require a reason` inside your web route — stop.
That belongs in the core, because the CLI needs the same rule, and next week
the MCP server will too."

⏱ 3 min

---

## Slide 12 — Proof: look at one route

**On screen**

> ```python
> # web/app.py
> @app.post("/api/deals/{deal_id}/stage")
> def move_deal_stage(deal_id: str, body: dict = Body(...)):
>     return deals.move_stage(deal_id, body["stage"], body.get("lost_reason"))
> ```
>
> That is the entire route. One line of real work.

**Speaker notes**

Open `web/app.py` and scroll through it live. Let them see that every route
looks like this.

Then open `core/deals.py` and show `move_stage()` — the validation, the
probability lookup, the `lost_reason` rule. Say: "*That* is where the thinking
lives. The route is a doorway."

⏱ 4 min

---
---

# PART C — THE CORE (Slides 13–18) · 30 min

---

## Slide 13 — Schemas are a contract, not paperwork

**On screen**

> ```python
> class DealIn(BaseModel):
>     name: str = Field(min_length=1)
>     account_id: str
>     amount: float = Field(default=0, ge=0)
>     stage: DealStage = DealStage.qualification
>     probability: int | None = Field(default=None, ge=0, le=100)
>     close_date: date | None = None
> ```

**Speaker notes**

For beginners, define the word: a **schema** is a written description of what a
valid record looks like. Pydantic turns that description into a check that runs
automatically.

Walk the fields: `ge=0` means amount cannot be negative. `le=100` means
probability cannot be 150%. Nobody has to remember these rules — the code
refuses bad data on its own.

⏱ 4 min

---

## Slide 14 — Enums: the most underrated line of code

**On screen**

> ```python
> class DealStage(str, Enum):
>     qualification = "qualification"
>     needs_analysis = "needs_analysis"
>     proposal = "proposal"
>     negotiation = "negotiation"
>     closed_won = "closed_won"
>     closed_lost = "closed_lost"
> ```
>
> ### A list of the only allowed values.

**Speaker notes**

Without this, someone types `"Proposal "` with a capital P and a trailing space,
and your pipeline report silently splits into two columns. Everyone in the room
who has worked with real data will nod here.

Now the part that matters for this course:

> Today this enum protects a dropdown in a form.
> In three sessions, the exact same enum will stop an AI model from inventing a
> stage called `"almost_won"`.

Same guardrail. Two very different users. Write it once.

⏱ 4 min

---

## Slide 15 — Errors are part of your interface

**On screen**

> ### Bad error
> ```
> Error: invalid input
> ```
>
> ### Good error
> ```json
> { "code": "validation_failed",
>   "message": "'almost_won' is not a valid deal stage.",
>   "details": { "field": "stage",
>                "allowed": ["qualification", "needs_analysis",
>                            "proposal", "negotiation",
>                            "closed_won", "closed_lost"] } }
> ```

**Speaker notes**

Ask: "Which of these can a person fix without asking a colleague?" Obvious.

Then the real point: an AI agent reads the second one and **corrects itself on
the next attempt**. It reads the first one and guesses again — and guessing is
where hallucinated tool calls come from.

Line to land:

> In the age of agents, your error messages are not error messages.
> They are documentation delivered at exactly the right moment.

⏱ 4 min

---

## Slide 16 — Live: break it on purpose

**On screen**

> ```bash
> python cli.py deals move dea_xxxx --stage almost_won
> python cli.py deals move dea_xxxx --stage closed_lost
> python cli.py accounts show acc_nope
> ```

**Speaker notes**

**Do this live.** Run all three. Let them read the output on the projector.

Then go to the browser and drag a deal card into **Closed Lost** — it asks for
a reason there too.

Ask: "How many places is that rule written?" Let someone answer "one." Then
show them: `core/deals.py`, one `if` statement, about line 100.

⏱ 5 min

---

## Slide 17 — `convert_lead()`: one operation, many callers

**On screen**

> ```python
> def convert_lead(lead_id, deal_name=None, deal_amount=0):
>     lead    = must_get("leads", lead_id, "Lead")
>     account = accounts.create_account(...)   # reuse or create
>     contact = contacts.create_contact(...)
>     deal    = deals.create_deal(...)         # optional
>     patch("leads", lead_id, {"status": "converted", ...})
>     return {"lead": ..., "account": ..., "contact": ..., "deal": ...}
> ```

**Speaker notes**

This is a **multi-step business operation**: five things that must happen
together, in order, with a duplicate check in the middle.

The browser calls it. The CLI calls it. In Session 3 the MCP tool will call it
and an AI agent will trigger the whole chain with one sentence.

Say it out loud: "If this logic lived in the web route, we would be
re-implementing it three more times before this course ends."

⏱ 4 min

---

## Slide 18 — Session 1 scoreboard

**On screen**

> ### What we have
> - A working CRM: 9 screens, 7 tables, ~40 API routes
> - All logic in `core/` — one copy
> - Schemas with enums, guarding every write
> - Structured errors that name the field and list valid values
>
> ### What we have NOT done
> - Anything AI-related. Not one line.

**Speaker notes**

Close Session 1 here. The last bullet is the punchline — say it slowly.

"Everything we did today was ordinary software engineering. And that ordinary
work is 80% of what makes an application agent-ready. Most people skip it and
then wonder why their MCP server is unreliable."

Break.

⏱ 5 min

---
---

# PART D — SESSION 2: THE CLI ADAPTER (Slides 19–25) · 45 min

---

## Slide 19 — Why build a CLI before MCP?

**On screen**

> ### A CLI is a test of our claim.
>
> We said: *"Adding a new interface should be cheap."*
>
> So let us add one — with **zero** new concepts —
> and see whether we have to touch `core/`.

**Speaker notes**

If we jumped straight to MCP, and things went wrong, they would not know
whether the problem was the architecture or the unfamiliar protocol.

The CLI removes that ambiguity. It is a boring, well-understood interface. If
the architecture holds here, it will hold for MCP.

⏱ 3 min

---

## Slide 20 — Live: the same numbers, two doors

**On screen**

> ```bash
> python cli.py dashboard
> ```

**Speaker notes**

**Do this live.** Put the browser dashboard and the terminal side by side on the
projector.

Read one number off each. They match, because they are the same number — one
function, `analytics.dashboard()`, called from two places.

No sync code was written. No API call from the CLI to the web app. Both are
peers over the same core.

⏱ 4 min

---

## Slide 21 — Live: do real work in the terminal

**On screen**

> ```bash
> python cli.py accounts create --name "Orbit Foods" --industry Retail
> python cli.py deals create --name "Orbit Foods - pilot" \
>                            --account acc_xxxx --amount 800000
> python cli.py deals move dea_xxxx --stage proposal
> ```
> ### Now refresh the browser.

**Speaker notes**

**Do this live, slowly.** Copy each printed id into the next command so they see
how the pieces connect.

Then switch to the browser, refresh the Pipeline page — the new deal is sitting
in the Proposal column.

Pause. Let it land. Then ask: "How much integration code did I write to make
the terminal and the browser agree?" None. They are not integrated. They share
a core.

⏱ 6 min

---

## Slide 22 — Anatomy of one command

**On screen**

> ```python
> @deals_app.command("move")
> def deals_move(deal_id: str, stage: str = ..., reason: str = None):
>     """Move a deal to another pipeline stage."""
>     rec = run(deals.move_stage, deal_id, stage, reason)   # <- the only work
>     ok(f"'{rec['name']}' moved to {rec['stage']} ({rec['probability']}%).")
> ```
>
> Read input → call core → print. Same three things.

**Speaker notes**

Put this next to Slide 12 (the web route) if you can — same shape, different
clothes.

Ask: "Where does the CLI learn that `proposal` means 50%?" It does not. It
prints whatever the core hands back.

⏱ 4 min

---

## Slide 23 — `--json`: the bridge to agents

**On screen**

> ```bash
> python cli.py deals list --open-only          # pretty table, for a human
> python cli.py --json deals list --open-only   # JSON, for a machine
> ```
>
> ### Every human tool should have a machine mode.

**Speaker notes**

**Do this live.** Run both. The visual difference does the teaching.

Now tell them what it is really for: in Session 5 we hand an agent a Skill — a
short instruction file — that says *"to read the CRM, run
`python cli.py --json ...`"*. The agent runs it, reads the JSON, and acts.

And we will not write a single line of agent-specific code to make that work.
It already works, because we added one flag today.

⏱ 5 min

---

## Slide 24 — Exit codes: how programs talk to programs

**On screen**

> | Code | Meaning |
> |---|---|
> | `0` | it worked |
> | `1` | a business rule said no |
> | `2` | the input was the wrong shape |

**Speaker notes**

For beginners: every command-line program returns a number when it finishes.
Zero means success. Anything else means something went wrong. Scripts and
agents branch on that number.

Demo it if your shell allows:

```bash
python cli.py deals move dea_xxxx --stage almost_won
echo $LASTEXITCODE      # PowerShell   (bash: echo $?)
```

⏱ 4 min

---

## Slide 25 — Exercise (do it in the room)

**On screen**

> ### 1. Add a `contacts update` command. Time yourself.
> Under 5 minutes? Good. Longer? Logic has leaked out of the core.
>
> ### 2. Find business logic hiding in `cli.py`.
> Hint: how is `--reason` handled for `closed_lost`?
>
> ### 3. Answer without opening a file:
> If we delete `cli.py`, does the web app still work? Why?

**Speaker notes**

Give them 15 minutes on exercise 1. Walk the room. The ones who finish in three
minutes have understood the architecture; ask them to explain it to their
neighbour rather than starting exercise 2.

Exercise 2 is a trick — the rule is *already* in the core, and `cli.py` is
clean. Learners who go looking and find nothing have learned to check.

⏱ 15 min

---
---

# PART E — WRAP (Slides 26–28) · 10 min

---

## Slide 26 — What we proved today

**On screen**

> | Claim | Evidence |
> |---|---|
> | Logic lives in one place | Two interfaces, one `core/`, no duplication |
> | Adding an interface is cheap | The CLI took one file and no core changes |
> | Rules are enforced everywhere | `closed_lost` needs a reason in browser AND terminal |
> | Errors can teach the caller | Field name + allowed values, every time |
> | Human tools can be agent-ready | One `--json` flag |

**Speaker notes**

Walk the table. Ask the room to supply the evidence column from memory before
you reveal it.

⏱ 4 min

---

## Slide 27 — What comes next

**On screen**

> | Session | We add | Who uses it |
> |---|---|---|
> | ~~1~~ | ~~Web UI + REST~~ | ~~humans, browser~~ |
> | ~~2~~ | ~~CLI~~ | ~~humans, terminal~~ |
> | **3** | **Local MCP server** | **coding agents (Claude Code)** |
> | 4 | Remote MCP server | ChatGPT, Claude on the web |
> | 5 | Skill | any agent, via the CLI |
> | 6 | Capstone: the CRM Agent | "Prepare my follow-ups for tomorrow." |

**Speaker notes**

Set up the next session with the exact promise:

> "Next time we add a third interface. Same core, untouched again. But this
> time the user is not a person — it is an AI agent, and it will pick which
> function to call by itself."

Then preview the capstone: *"Prepare my sales follow-up for tomorrow"* → the
agent searches accounts, checks last activity, finds gaps, creates tasks,
assigns them, and reports back. Every step will be a function we already wrote
today.

⏱ 4 min

---

## Slide 28 — One line to remember

**On screen**

> # MCP does not make your application intelligent.
> # MCP makes your application's capabilities available to intelligence.

**Speaker notes**

End here. Do not add anything after it.

If you want one closing question for the room: "So where should you spend your
effort — on the MCP server, or on the core?" The answer they should give: the
core.

⏱ 2 min

---
---

## Appendix — facilitator checklist

**Before the session**
- [ ] `pip install -r requirements.txt` inside a venv, on the projector machine
- [ ] `python seed.py --reset` — fresh demo data
- [ ] `python run.py` — web app up at http://127.0.0.1:8000
- [ ] Second terminal open in `minicrm/`, font size 16pt or larger
- [ ] Browser zoomed to 125%, one window, no bookmarks bar
- [ ] Copy a real account id and deal id into a scratch file for Slide 21

**Live demos in order**
1. Slide 3 — browser tour, incl. drag a deal, convert a lead
2. Slide 16 — three failing commands + the closed_lost drag in the browser
3. Slide 20 — dashboard in both interfaces, side by side
4. Slide 21 — create account + deal in terminal, refresh browser
5. Slide 23 — `--json` before and after

**If a demo breaks**
- `ModuleNotFoundError` → wrong Python; activate the venv
- `no such table` → `python seed.py --reset`
- Port 8000 busy → the app is already running, just use it
- Data looks wrong after experiments → `python seed.py --reset`

**Timing at a glance**

| Part | Slides | Minutes |
|---|---|---|
| A — Why | 1–6 | 20 |
| B — The application | 7–12 | 30 |
| C — The core | 13–18 | 30 |
| — break — | | 10 |
| D — The CLI adapter | 19–25 | 45 |
| E — Wrap | 26–28 | 10 |
| **Total** | **28** | **~2h 25m** |
