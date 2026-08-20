# Building the PPTX

```bash
npm install
node build_deck.js      # writes ../MCP-Workshop-Sessions-1-2.pptx
```

## Files

| File | Role |
|---|---|
| `build_deck.js` | All 28 slides. Content + layout + speaker notes. |
| `deck_helpers.js` | The Skillopedia visual language. Do not edit; do not redefine colours. |

Every slide calls `s.addNotes(...)`, which is what puts the speaker notes into
PowerPoint's presenter view.

## Geometry rules

The slide is 13.33" x 7.5". Usable width is 12.3" (0.5" margins).

| Rule | Why |
|---|---|
| Content starts at `y = 2.0` on slides using `addTitle` | The title block occupies 0.55–2.0 |
| Nothing may extend past `y = 7.0` | The page-number footer sits at `y = 7.05` |
| A bottom callout maxes out at `y=6.6, h=0.4` | Same reason |
| Use `addYellowUnderline`, never a custom rectangle behind text | pptxgenjs draws in call order, so a filled rect over text reads as a strikethrough |

## Checking the output

LibreOffice is not required. This checks geometry and notes directly from the
generated file:

```bash
cd ..
python - <<'PY'
import zipfile, re, collections
EMU = 914400.0
z = zipfile.ZipFile("MCP-Workshop-Sessions-1-2.pptx")
slides = sorted([n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)],
                key=lambda n: int(re.search(r"\d+", n.split("/")[-1]).group()))
bad = collections.defaultdict(list)
for n in slides:
    i = int(re.search(r"\d+", n.split("/")[-1]).group())
    for m in re.finditer(r'<a:off x="(-?\d+)" y="(-?\d+)"/><a:ext cx="(\d+)" cy="(\d+)"/>',
                         z.read(n).decode()):
        x, y, w, h = (int(g) / EMU for g in m.groups())
        if h >= 7.4 or w >= 13.2 or abs(y - 7.05) < 0.01:
            continue                      # backgrounds and the footer itself
        if y + h > 7.02: bad[i].append(f"bottom={y+h:.2f}")
        if x + w > 13.34: bad[i].append(f"right={x+w:.2f}")
print("slides:", len(slides),
      "| notes:", len([n for n in z.namelist() if "notesSlide" in n and n.endswith(".xml")]))
print("geometry:", dict(bad) or "clean")
PY
```

Then open the deck once and look at it. The check above catches overflow, not
ugliness.
