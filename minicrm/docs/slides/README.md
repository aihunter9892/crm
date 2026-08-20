# Workshop decks — Sessions 1 & 2

Three formats, one set of content.

| File | Use it for |
|---|---|
| `MCP-Workshop-Sessions-1-2.pptx` | Presenting and editing. Speaker notes land in PowerPoint's presenter view. |
| `MCP-Workshop-Sessions-1-2.html` | Presenting from a browser, or sharing a link. Notes in a side panel. |
| `sessions-1-2-slides.md` | Reading, reviewing, or pasting into another tool. |

## The HTML deck

Open the file in any browser. No server or internet needed.

| Key | Action |
|---|---|
| `→` / `Space` | next slide |
| `←` | previous slide |
| `N` | toggle speaker notes |
| `F` | fullscreen |
| `Home` / `End` | first / last slide |
| `1`…`9` | jump to slide |
| `?` | keyboard help |
| `Ctrl+P` | print all 28 slides to PDF |

Clicking the left third of a slide goes back; anywhere else goes forward.
The URL carries the slide number (`...html#14`), so you can link to one slide.

## Rebuilding the PPTX

```bash
cd build
npm install
node build_deck.js
```

`build/deck_helpers.js` holds the Skillopedia visual language — colours, cards,
callouts, the two-dot logo. Do not redefine colours in `build_deck.js`; use the
`C` palette. `build/README-build.md` has the geometry rules.

## Deck structure

| Part | Slides | Minutes |
|---|---|---|
| A — Why (the trap, the shape, the map) | 1–6 | 20 |
| B — The application (CRM basics, folders, the adapter rule) | 7–12 | 30 |
| C — The core (schemas, enums, errors, convert_lead) | 13–18 | 30 |
| *break* | | 10 |
| D — The CLI adapter (why CLI first, `--json`, exit codes) | 19–25 | 45 |
| E — Wrap (what we proved, what's next) | 26–28 | 10 |
| **Total** | **28** | **~2h 25m** |

## Five live demos

Every one is scripted in the speaker notes of its slide.

1. **Slide 3** — browser tour: dashboard, drag a deal, open a record, convert a lead
2. **Slide 16** — three failing CLI commands, then the same rule firing in the browser
3. **Slide 20** — `python cli.py dashboard` next to the browser dashboard
4. **Slide 21** — create an account and deal in the terminal, refresh the browser
5. **Slide 23** — `--json` before and after

## Before you present

```bash
cd ../..            # into minicrm/
python seed.py --reset
python run.py       # http://127.0.0.1:8000
```

Second terminal open in `minicrm/`, font 16pt or larger. Browser at 125% zoom.
Copy a real account id and deal id somewhere handy — slides 16 and 21 need them.
