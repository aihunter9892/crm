// Builds "Build Once. Expose Everywhere." — Sessions 1 & 2 of the MCP workshop.
//
//   cd docs/slides/build && npm install && node build_deck.js
//
// Visual language comes from deck_helpers.js (Skillopedia workshop brand).
// Speaker notes are attached to every slide via slide.addNotes() so they show
// up in PowerPoint's presenter view.

const path = require("path");
const helpers = require(path.join(__dirname, "deck_helpers.js"));

const TOTAL = 28;

const {
  pres, C, FONT_HEAD, FONT_BODY, FONT_MONO,
  newSlide, addFooter, addTitle, addSectionBadge,
  addCard, addYellowUnderline, addCallout, addCodeBlock,
  addTimePill, addNumberedStep, finalize,
} = helpers.init({
  title: "Build Once. Expose Everywhere. — Sessions 1 & 2",
  chapter: "MCP Workshop  ·  Sessions 1 & 2",
  totalSlides: TOTAL,
});

// ---------- small local helpers ----------
const label = (s, x, y, w, text, color = C.purpleDeep) =>
  s.addText(text, {
    x, y, w, h: 0.3, fontSize: 10.5, fontFace: FONT_HEAD,
    color, bold: true, charSpacing: 1.4, margin: 0,
  });

const bullets = (s, x, y, w, h, items, opts = {}) =>
  s.addText(
    items.map((t, i) => ({
      text: t,
      options: {
        bullet: { code: opts.code || "27A4" },
        breakLine: i < items.length - 1,
      },
    })),
    {
      x, y, w, h,
      fontSize: opts.fontSize || 11.5, fontFace: FONT_BODY,
      color: opts.color || C.ink, paraSpaceAfter: opts.gap ?? 4, margin: 0,
    },
  );

// ==========================================================================
// SLIDE 1 — Title
// ==========================================================================
{
  const s = newSlide();

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 4.4, h: 7.5,
    fill: { color: C.purpleSoft }, line: { color: C.purpleSoft, width: 0 },
  });

  // Doodle: one core in the middle, four adapters radiating out.
  const cx = 2.2, cy = 3.3;
  s.addShape(pres.shapes.OVAL, {
    x: cx - 0.75, y: cy - 0.75, w: 1.5, h: 1.5,
    fill: { color: C.yellow }, line: { color: C.purpleDeep, width: 2 },
  });
  s.addText("CORE", {
    x: cx - 0.75, y: cy - 0.75, w: 1.5, h: 1.5,
    fontSize: 14, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
    align: "center", valign: "middle", margin: 0, charSpacing: 1,
  });

  const spokes = [
    { dx: -1.55, dy: -1.55, t: "CLI" },
    { dx: 1.55, dy: -1.55, t: "WEB" },
    { dx: -1.55, dy: 1.55, t: "MCP" },
    { dx: 1.55, dy: 1.55, t: "SKILL" },
  ];
  spokes.forEach((sp) => {
    s.addShape(pres.shapes.LINE, {
      x: cx, y: cy, w: sp.dx, h: sp.dy,
      line: { color: C.purple, width: 2, dashType: "dash" },
    });
  });
  spokes.forEach((sp) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx + sp.dx - 0.55, y: cy + sp.dy - 0.24, w: 1.1, h: 0.48,
      fill: { color: C.bg }, line: { color: C.purpleDeep, width: 1.5 },
      rectRadius: 0.12,
    });
    s.addText(sp.t, {
      x: cx + sp.dx - 0.55, y: cy + sp.dy - 0.24, w: 1.1, h: 0.48,
      fontSize: 11, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
  });

  [[0.45, 1.0], [3.85, 0.8], [3.9, 6.3], [0.4, 6.5]].forEach(([sx, sy]) => {
    s.addShape(pres.shapes.OVAL, {
      x: sx, y: sy, w: 0.15, h: 0.15,
      fill: { color: C.purpleDeep }, line: { color: C.purpleDeep },
    });
  });

  s.addText("Build Once.", {
    x: 4.8, y: 1.3, w: 8.2, h: 0.85,
    fontSize: 44, fontFace: FONT_HEAD, color: C.ink, bold: true, margin: 0,
  });
  s.addText("Expose", {
    x: 4.8, y: 2.1, w: 8.2, h: 0.85,
    fontSize: 44, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true, margin: 0,
  });
  s.addText("Everywhere.", {
    x: 4.8, y: 2.9, w: 8.2, h: 0.85,
    fontSize: 44, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true, margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.8, y: 3.65, w: 4.9, h: 0.12,
    fill: { color: C.yellow, transparency: 25 },
    line: { color: C.yellow, transparency: 100 }, rectRadius: 0.05,
  });

  s.addText('"From a normal app, to an app an AI agent can operate."', {
    x: 4.8, y: 3.95, w: 8.2, h: 0.5,
    fontSize: 17, fontFace: FONT_BODY, color: C.inkSoft, italic: true, margin: 0,
  });

  s.addText([
    { text: "Sessions 1 & 2  ·  we build a real CRM.", options: { breakLine: true } },
    { text: "Then we give it a second interface without touching its logic.", options: { breakLine: true } },
    { text: "", options: { breakLine: true, fontSize: 4 } },
    { text: "By Session 6, an AI agent runs the whole thing.", options: { italic: true, color: C.purpleDeep, bold: true } },
  ], {
    x: 4.8, y: 4.75, w: 8.2, h: 1.6,
    fontSize: 15, fontFace: FONT_BODY, color: C.ink, paraSpaceAfter: 4,
  });

  s.addText("Sessions 1 & 2  ·  MCP Workshop  ·  Skillopedia × Claude Code", {
    x: 4.8, y: 6.6, w: 8.2, h: 0.4,
    fontSize: 11, fontFace: FONT_BODY, color: C.inkLight, margin: 0,
  });

  s.addNotes(
    "Keep this slide up for 20 seconds only. Do not introduce yourself yet — the demo on slide 3 earns their attention far faster than your bio does.\n\n" +
    "If you want one opening line: \"By the end of this course, an AI agent will run a CRM for you. Today we build the CRM.\"\n\n" +
    "TIMING: 1 min",
  );
}

// ==========================================================================
// SLIDE 2 — The question everyone asks
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART A · WHY");
  addTitle(s, "You Are Asking the Wrong Question",
    "And that is fine — almost everyone starts here.");

  addCard(s, 0.5, 2.4, 6.05, 3.6, { line: C.red, lineWidth: 1.75, fill: C.redSoft });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: 2.6, w: 2.2, h: 0.35,
    fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.15,
  });
  s.addText("WRONG QUESTION", {
    x: 0.7, y: 2.6, w: 2.2, h: 0.35,
    fontSize: 10, fontFace: FONT_HEAD, color: C.bg, bold: true,
    align: "center", valign: "middle", margin: 0, charSpacing: 1.2,
  });
  s.addText('"Should I learn MCP,\nor Skills, or build a CLI?"', {
    x: 0.7, y: 3.15, w: 5.65, h: 1.0,
    fontSize: 20, fontFace: FONT_HEAD, color: C.ink, bold: true, margin: 0,
  });
  bullets(s, 0.85, 4.25, 5.5, 1.5, [
    "The answer changes every few months",
    "You rebuild your work each time it changes",
    "You are always behind",
  ], { color: C.inkSoft });

  addCard(s, 6.75, 2.4, 6.05, 3.6, { line: C.greenDeep, lineWidth: 1.75, fill: C.greenSoft });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.95, y: 2.6, w: 2.2, h: 0.35,
    fill: { color: C.greenDeep }, line: { color: C.greenDeep }, rectRadius: 0.15,
  });
  s.addText("RIGHT QUESTION", {
    x: 6.95, y: 2.6, w: 2.2, h: 0.35,
    fontSize: 10, fontFace: FONT_HEAD, color: C.bg, bold: true,
    align: "center", valign: "middle", margin: 0, charSpacing: 1.2,
  });
  s.addText('"How do I build one thing\nthat works everywhere?"', {
    x: 6.95, y: 3.15, w: 5.65, h: 1.0,
    fontSize: 20, fontFace: FONT_HEAD, color: C.ink, bold: true, margin: 0,
  });
  bullets(s, 7.1, 4.25, 5.5, 1.5, [
    "The answer does not change",
    "New tool arrives, you add one small file",
    "Everything you already built keeps working",
  ], { code: "2713", color: C.inkSoft });

  addCallout(s, 0.5, 6.2, 12.3, 0.45,
    "Today we are not learning a tool. We are learning a shape you can pour any tool into.",
    { fontSize: 13, bold: true });
  addFooter(s);

  s.addNotes(
    "Show of hands: who has HEARD of MCP? Who has BUILT one? Usually many hands for the first, almost none for the second. That gap is the whole reason for this course.\n\n" +
    "Say plainly: MCP was the hot thing, then Skills arrived, and something else arrives next year. If you rebuild your work every time, you lose. So we learn the shape, not the tool.\n\n" +
    "Do not define MCP yet. Deliberately. They get the demo first.\n\n" +
    "TIMING: 2 min",
  );
}

// ==========================================================================
// SLIDE 3 — Start with the demo
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART A · LIVE DEMO");
  addYellowUnderline(s, 0.5, 1.0, 6.6);
  addTitle(s, "🔥 Live Demo — Here Is a CRM",
    "Nothing about AI yet. Just watch it work.");

  addCard(s, 0.5, 2.3, 6.05, 4.3, { line: C.purpleDeep, lineWidth: 1.75 });
  label(s, 0.7, 2.5, 5.65, "DO THIS ON THE PROJECTOR");
  bullets(s, 0.85, 2.85, 5.5, 3.5, [
    "Dashboard — read one number out loud",
    "Pipeline — drag a deal card to another column",
    "Accounts — click a row, show the drawer",
    "Leads — click Convert, show it created an account, a contact and a deal",
  ], { fontSize: 12.5, gap: 8 });

  addCard(s, 6.75, 2.3, 6.05, 4.3, { line: C.yellowDeep, lineWidth: 2, fill: C.yellowSoft });
  label(s, 6.95, 2.5, 5.65, "SAY THIS AFTERWARDS", C.yellowDeep);
  s.addText(
    "\"This is an ordinary business application.\n\n" +
    "No AI anywhere in it.\n\n" +
    "Remember what I just did with my hands —\n" +
    "by the end of this course, an AI agent\nwill be doing all of it.\"",
    {
      x: 6.95, y: 2.9, w: 5.65, h: 3.4,
      fontSize: 15, fontFace: FONT_BODY, color: C.ink, italic: true, margin: 0,
    });
  addFooter(s);

  s.addNotes(
    "Switch to the browser NOW. Do not explain architecture. Use the app like a salesperson would.\n\n" +
    "URL: http://127.0.0.1:8000\n\n" +
    "Order matters. Dashboard first (numbers feel real), then the kanban drag (movement holds attention), then a record drawer (depth), then Convert (the wow — three records created from one click).\n\n" +
    "Do not talk about code during this. Three minutes of pure product.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 4 — The trap
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART A · THE TRAP");
  addTitle(s, "The Trap: Writing the Same Logic Four Times",
    "This is what most people do the week they discover MCP.");

  addCodeBlock(s, 0.5, 2.3, 6.05, 2.9,
    "CLI\n  └── CRM logic\n\nLocal MCP\n  └── CRM logic\n\nRemote MCP\n  └── CRM logic\n\nSkill\n  └── CRM logic", 13);

  addCard(s, 6.75, 2.3, 6.05, 2.9, { line: C.red, lineWidth: 1.75, fill: C.redSoft });
  label(s, 6.95, 2.5, 5.65, "WHAT THIS COSTS YOU", C.red);
  bullets(s, 7.1, 2.9, 5.5, 2.2, [
    "Four copies of every business rule",
    "Four places to fix every bug",
    "They drift apart within a month",
    "You will forget one. Everyone does.",
  ], { code: "2715", fontSize: 12 });

  addCallout(s, 0.5, 5.45, 12.3, 1.1,
    "Ask the room: \"Your company changes its discount rule. How many files do you edit in this picture?\"\n" +
    "Answer: four. And the one you forget is the one production uses.",
    { fontSize: 13, bold: true });
  addFooter(s);

  s.addNotes(
    "This is genuinely what happens. People already have an app, then they discover MCP, and they write the MCP server as a NEW project — re-implementing the logic inside it.\n\n" +
    "Ask the discount-rule question and wait for an answer. Do not answer it yourself. Someone will say \"four\" and the room will wince.\n\n" +
    "Optional real example: mention any system at your company that has a web version and a batch job with subtly different rules. Every room has one.\n\n" +
    "TIMING: 2 min",
  );
}

// ==========================================================================
// SLIDE 5 — The shape
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART A · THE SHAPE");
  addTitle(s, "The Shape We Build Instead",
    "Copy this into your notes. You will see it in every session.");

  // Core box
  addCard(s, 4.6, 2.25, 4.1, 0.95, { line: C.purpleDeep, lineWidth: 2.5, fill: C.yellowSoft });
  s.addText("SHARED CORE", {
    x: 4.6, y: 2.35, w: 4.1, h: 0.4,
    fontSize: 18, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
    align: "center", margin: 0, charSpacing: 1,
  });
  s.addText("all business logic  ·  one copy", {
    x: 4.6, y: 2.75, w: 4.1, h: 0.3,
    fontSize: 11, fontFace: FONT_BODY, color: C.inkSoft,
    align: "center", italic: true, margin: 0,
  });

  const cols = [
    { t: "CLI", who: "terminal", sub: "humans", color: C.greenDeep, done: true },
    { t: "WEB / REST", who: "browser", sub: "humans", color: C.greenDeep, done: true },
    { t: "LOCAL MCP", who: "Claude Code", sub: "coding agents", color: C.purpleDeep },
    { t: "REMOTE MCP", who: "ChatGPT", sub: "cloud agents", color: C.purple },
    { t: "SKILL", who: "instructions", sub: "any agent", color: C.yellowDeep },
  ];
  const cw = 2.38, gap = 0.13;
  cols.forEach((c, i) => {
    const x = 0.5 + i * (cw + gap);
    s.addShape(pres.shapes.LINE, {
      x: 6.65, y: 3.2, w: (x + cw / 2) - 6.65, h: 0.75,
      line: { color: C.purpleLine, width: 1.5, dashType: "dash" },
    });
    addCard(s, x, 3.95, cw, 1.9, { line: c.color, lineWidth: c.done ? 2 : 1.4 });
    s.addText(c.t, {
      x, y: 4.15, w: cw, h: 0.35,
      fontSize: 13, fontFace: FONT_HEAD, color: c.color, bold: true,
      align: "center", margin: 0,
    });
    s.addText(c.who, {
      x, y: 4.5, w: cw, h: 0.3,
      fontSize: 11, fontFace: FONT_MONO, color: C.ink, align: "center", margin: 0,
    });
    s.addText(c.sub, {
      x, y: 4.8, w: cw, h: 0.3,
      fontSize: 10.5, fontFace: FONT_BODY, color: C.inkLight,
      align: "center", italic: true, margin: 0,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.55, y: 5.25, w: cw - 1.1, h: 0.35,
      fill: { color: c.done ? C.greenSoft : C.purpleSoft },
      line: { color: c.done ? C.greenDeep : C.purpleLine, width: 1 },
      rectRadius: 0.12,
    });
    s.addText(c.done ? "TODAY" : "LATER", {
      x: x + 0.55, y: 5.25, w: cw - 1.1, h: 0.35,
      fontSize: 9.5, fontFace: FONT_HEAD,
      color: c.done ? C.greenDeep : C.purple, bold: true,
      align: "center", valign: "middle", margin: 0, charSpacing: 1,
    });
  });

  addCallout(s, 0.5, 6.15, 12.3, 0.5,
    "The core owns the CAPABILITY.  The adapter owns the INTERFACE.",
    { fontSize: 15, bold: true, italic: false });
  addFooter(s);

  s.addNotes(
    "Draw this on the whiteboard while you talk — do not just project it. Make them copy it into their notes. It reappears in every session.\n\n" +
    "The one line to repeat until they are bored of it: \"The core owns the capability. The adapter owns the interface.\"\n\n" +
    "Define adapter now, in one sentence: an adapter reads input, calls one core function, prints the result. Nothing else.\n\n" +
    "Point at the two green TODAY boxes. That is the whole scope of Sessions 1 and 2.\n\n" +
    "TIMING: 3 min",
  );
}

// ==========================================================================
// SLIDE 6 — Where each interface is used
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART A · MAP");
  addTitle(s, "Five Doors Into the Same Room",
    "Different users, different protocols, identical logic behind them.");

  const rows = [
    ["Web / REST", "humans", "browser", "Session 1", C.greenDeep],
    ["CLI", "humans", "terminal", "Session 2", C.greenDeep],
    ["Local MCP", "coding agents on your laptop", "STDIO", "Session 3", C.purpleDeep],
    ["Remote MCP", "ChatGPT, Claude on the web", "HTTP", "Session 4", C.purple],
    ["Skill", "any agent", "instructions", "Session 5", C.yellowDeep],
    ["SHARED CORE", "all of them", "the actual logic", "built today", C.ink],
  ];

  const hx = [0.5, 3.3, 7.4, 10.4];
  const hw = [2.7, 4.0, 2.9, 2.4];
  ["INTERFACE", "WHO USES IT", "HOW IT TALKS", "WHEN WE BUILD IT"].forEach((h, i) =>
    label(s, hx[i], 2.3, hw[i], h));

  rows.forEach((r, i) => {
    const y = 2.7 + i * 0.66;
    const last = i === rows.length - 1;
    addCard(s, 0.5, y, 12.3, 0.56, {
      line: last ? C.purpleDeep : C.cardLine,
      lineWidth: last ? 2 : 1,
      fill: last ? C.yellowSoft : C.bg,
    });
    s.addText(r[0], {
      x: hx[0] + 0.15, y, w: hw[0], h: 0.56,
      fontSize: 13, fontFace: FONT_HEAD, color: r[4], bold: true,
      valign: "middle", margin: 0,
    });
    s.addText(r[1], {
      x: hx[1], y, w: hw[1], h: 0.56,
      fontSize: 12, fontFace: FONT_BODY, color: C.ink, valign: "middle", margin: 0,
    });
    s.addText(r[2], {
      x: hx[2], y, w: hw[2], h: 0.56,
      fontSize: 11.5, fontFace: FONT_MONO, color: C.inkSoft, valign: "middle", margin: 0,
    });
    s.addText(r[3], {
      x: hx[3], y, w: hw[3], h: 0.56,
      fontSize: 12, fontFace: FONT_BODY, color: last ? C.purpleDeep : C.inkSoft,
      italic: true, bold: last, valign: "middle", margin: 0,
    });
  });

  addFooter(s);

  s.addNotes(
    "Read the table across, one row at a time. Do not rush it — this is the map for the whole course.\n\n" +
    "Someone will ask \"why is Remote MCP separate from Local MCP?\" Answer it in one line before they ask: ChatGPT runs in a data centre. It cannot reach a program running on your laptop. That is the ONLY reason. Same code, different door.\n\n" +
    "Emphasise the last row. Everything above it is a door. The last row is the room.\n\n" +
    "TIMING: 3 min",
  );
}

// ==========================================================================
// SLIDE 7 — What is a CRM
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART B · THE APPLICATION");
  addTitle(s, "What Is a CRM? (assume nobody knows)",
    "It tracks WHO you are selling to, and WHAT you promised to do next.");

  const items = [
    { t: "LEAD", d: "A stranger who might buy. Not qualified yet.", icon: "✦", c: C.purple },
    { t: "ACCOUNT", d: "A company that is now a real prospect or customer.", icon: "▦", c: C.purpleDeep },
    { t: "CONTACT", d: "A person who works at that company.", icon: "☺", c: C.purple },
    { t: "DEAL", d: "One opportunity. Has a value and a stage.", icon: "◈", c: C.yellowDeep },
    { t: "TASK", d: "Something you must do, by a date.", icon: "✓", c: C.greenDeep },
    { t: "ACTIVITY", d: "Something that already happened. Call, email, meeting.", icon: "◷", c: C.inkSoft },
  ];

  const cw = 4.0, ch = 1.75, gapx = 0.18, gapy = 0.2;
  items.forEach((it, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.5 + col * (cw + gapx);
    const y = 2.3 + row * (ch + gapy);
    addCard(s, x, y, cw, ch, { line: it.c, lineWidth: 1.5 });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.18, y: y + 0.22, w: 0.6, h: 0.6,
      fill: { color: C.purpleSoft }, line: { color: it.c, width: 1 },
    });
    s.addText(it.icon, {
      x: x + 0.18, y: y + 0.22, w: 0.6, h: 0.6,
      fontSize: 20, color: it.c, align: "center", valign: "middle", margin: 0,
    });
    s.addText(it.t, {
      x: x + 0.9, y: y + 0.25, w: cw - 1.1, h: 0.35,
      fontSize: 15, fontFace: FONT_HEAD, color: C.ink, bold: true, margin: 0,
    });
    s.addText(it.d, {
      x: x + 0.9, y: y + 0.62, w: cw - 1.1, h: 0.95,
      fontSize: 11, fontFace: FONT_BODY, color: C.inkSoft, margin: 0,
    });
  });

  addCallout(s, 0.5, 6.35, 12.3, 0.45,
    "Priya gets a card at a conference → LEAD. Call goes well → convert it → ACCOUNT + CONTACT + DEAL. " +
    "Logs the call → ACTIVITY. Sends pricing Friday → TASK.",
    { fontSize: 12 });
  addFooter(s);

  s.addNotes(
    "Do NOT assume they know this. Half the room has never opened Salesforce or Zoho, and CRM vocabulary is the biggest silent blocker in this session.\n\n" +
    "Tell the Priya story out loud, exactly as written in the callout, pointing at each card as you name it. Then reuse Priya for the rest of the day — same character, same deal, every example.\n\n" +
    "The distinction people find hardest: TASK is in the future, ACTIVITY is in the past. Say that explicitly.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 8 — The pipeline
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART B · THE ONE BIG RULE");
  addTitle(s, "The Pipeline: Six Stages, One Rule",
    "Every deal sits in exactly one stage. The stage sets the probability.");

  const stages = [
    { n: "qualification", p: "10%", c: C.purple },
    { n: "needs_analysis", p: "25%", c: C.purple },
    { n: "proposal", p: "50%", c: C.yellowDeep },
    { n: "negotiation", p: "75%", c: C.yellowDeep },
    { n: "closed_won", p: "100%", c: C.greenDeep },
    { n: "closed_lost", p: "0%", c: C.red },
  ];
  const cw = 1.95, gap = 0.11;
  stages.forEach((st, i) => {
    const x = 0.5 + i * (cw + gap);
    addCard(s, x, 2.45, cw, 1.5, {
      line: st.c, lineWidth: 1.6,
      fill: i === 4 ? C.greenSoft : i === 5 ? C.redSoft : C.bg,
    });
    s.addText(st.n, {
      x: x + 0.08, y: 2.62, w: cw - 0.16, h: 0.6,
      fontSize: 11, fontFace: FONT_MONO, color: C.ink, bold: true,
      align: "center", margin: 0,
    });
    s.addText(st.p, {
      x, y: 3.25, w: cw, h: 0.5,
      fontSize: 21, fontFace: FONT_HEAD, color: st.c, bold: true,
      align: "center", margin: 0,
    });
    if (i < 4) {
      s.addText("→", {
        x: x + cw - 0.02, y: 2.95, w: 0.15, h: 0.4,
        fontSize: 15, color: C.purpleLine, align: "center", valign: "middle", margin: 0,
      });
    }
  });

  addCard(s, 0.5, 4.2, 6.05, 2.0, { line: C.purpleDeep, lineWidth: 1.5 });
  label(s, 0.7, 4.4, 5.65, "WHY THIS MATTERS");
  bullets(s, 0.85, 4.75, 5.5, 1.35, [
    "The kanban board is literally these six columns",
    "The forecast is amount × probability",
    "Every report groups by this field",
  ], { fontSize: 11.5 });

  addCard(s, 6.75, 4.2, 6.05, 2.0, { line: C.red, lineWidth: 2, fill: C.redSoft });
  label(s, 6.95, 4.4, 5.65, "AND ONE EXTRA RULE", C.red);
  s.addText("Moving a deal to closed_lost requires a reason.\n\nHold on to that rule. You will see it enforced in three different places today — and written exactly once.", {
    x: 6.95, y: 4.75, w: 5.65, h: 1.35,
    fontSize: 12, fontFace: FONT_BODY, color: C.ink, margin: 0,
  });

  addFooter(s);

  s.addNotes(
    "This is the single most important business rule in the application. Everything downstream depends on it: the board, the forecast, every report.\n\n" +
    "The closed_lost rule is your running thread for the whole day. Flag it here, enforce it on slide 16 in the terminal, then drag a card into Closed Lost in the browser and watch it demand a reason there too. Then reveal it is one if-statement in core/deals.py.\n\n" +
    "If someone asks why probability is fixed per stage rather than per deal: real CRMs allow both. We fixed it to keep the example small.\n\n" +
    "TIMING: 3 min",
  );
}

// ==========================================================================
// SLIDE 9 — Data model
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART B · DATA MODEL");
  addTitle(s, "Seven Tables. That Is the Whole Database.",
    "Small on purpose — the lesson is the architecture, not the schema.");

  addCodeBlock(s, 0.5, 2.3, 7.5, 3.5,
    "users\n" +
    "  |\n" +
    "accounts ------< contacts\n" +
    "  |                 |\n" +
    "  +------< deals >--+\n" +
    "\n" +
    "leads  --(convert)-->  account + contact + deal\n" +
    "\n" +
    "tasks       ->  can attach to any of the four\n" +
    "activities  ->  can attach to any of the four", 13);

  addCard(s, 8.2, 2.3, 4.6, 3.5, { line: C.yellowDeep, lineWidth: 2, fill: C.yellowSoft });
  label(s, 8.4, 2.5, 4.2, "WATCH THIS ARROW", C.yellowDeep);
  s.addText("leads --(convert)-->", {
    x: 8.4, y: 2.9, w: 4.2, h: 0.35,
    fontSize: 14, fontFace: FONT_MONO, color: C.purpleDeep, bold: true, margin: 0,
  });
  s.addText(
    "One click that creates three records and updates a fourth.\n\n" +
    "It is the most interesting function in the codebase.\n\n" +
    "We come back to it twice today — and again in Session 3, when an AI agent triggers it with one sentence.",
    {
      x: 8.4, y: 3.35, w: 4.2, h: 2.3,
      fontSize: 12, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });

  addCallout(s, 0.5, 6.05, 12.3, 0.45,
    "Tasks and activities point at ANY record type. That is why they carry a related_type plus a related_id.",
    { fontSize: 12.5 });
  addFooter(s);

  s.addNotes(
    "Keep this fast. They do not need to memorise the schema — they need to know it is small.\n\n" +
    "Point at the convert arrow and say: \"Hold on to that one.\" Setting up a callback you pay off on slide 17 is worth more than explaining it now.\n\n" +
    "If someone asks about related_type/related_id: yes, in a large system you would model this differently. We chose the simple version so the whole schema fits on one slide.\n\n" +
    "TIMING: 3 min",
  );
}

// ==========================================================================
// SLIDE 10 — Folder tour
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART B · CODE TOUR");
  addTitle(s, "Open the Folder. Look at the Sizes.",
    "The biggest folder is core/. The API is surprisingly small.");

  addCodeBlock(s, 0.5, 2.3, 7.5, 4.0,
    "minicrm/\n" +
    "├── core/          <- ALL the business logic. One copy.\n" +
    "│   ├── models.py      the contract: what a valid record is\n" +
    "│   ├── db.py          SQLite tables\n" +
    "│   ├── errors.py      structured errors\n" +
    "│   ├── accounts.py  contacts.py  leads.py\n" +
    "│   ├── deals.py     tasks.py     activities.py\n" +
    "│   └── analytics.py   dashboard numbers\n" +
    "│\n" +
    "├── web/           <- ADAPTER 1: REST API + browser UI\n" +
    "├── cli.py         <- ADAPTER 2: terminal\n" +
    "└── seed.py           demo data", 12);

  addCard(s, 8.2, 2.3, 4.6, 4.0, { line: C.purpleDeep, lineWidth: 1.75 });
  label(s, 8.4, 2.5, 4.2, "ASK THE ROOM");
  s.addText("\"If I delete the web/ folder,\ndoes the CRM still work?\"", {
    x: 8.4, y: 2.9, w: 4.2, h: 0.9,
    fontSize: 15, fontFace: FONT_HEAD, color: C.ink, bold: true, margin: 0,
  });
  s.addText("Let them argue for 30 seconds.", {
    x: 8.4, y: 3.8, w: 4.2, h: 0.3,
    fontSize: 11, fontFace: FONT_BODY, color: C.inkLight, italic: true, margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 8.4, y: 4.2, w: 1.5, h: 0.4,
    fill: { color: C.greenSoft }, line: { color: C.greenDeep, width: 1.5 }, rectRadius: 0.12,
  });
  s.addText("✓  YES", {
    x: 8.4, y: 4.2, w: 1.5, h: 0.4,
    fontSize: 12, fontFace: FONT_HEAD, color: C.greenDeep, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText("The capability survives.\nOnly one door closes.\n\nThat is the whole test of whether your architecture is right.", {
    x: 8.4, y: 4.75, w: 4.2, h: 1.4,
    fontSize: 12, fontFace: FONT_BODY, color: C.ink, margin: 0,
  });

  addFooter(s);

  s.addNotes(
    "Open the actual folder in your editor while you talk. Seeing real file sizes beats a slide.\n\n" +
    "Open web/app.py and scroll it fast — 40 routes, under 300 lines. Then open core/deals.py and let them see the density difference.\n\n" +
    "Ask the delete-the-web-folder question and genuinely wait. Someone will say \"no, the website IS the app\" — that is the misconception you are here to fix.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 11 — Adapter rule
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART B · THE RULE");
  addTitle(s, "What an Adapter Is Allowed to Do",
    "Recite this tomorrow morning. It is the whole course in three lines.");

  const steps = [
    { n: "1", t: "READ", d: "Take what the user sent.\nA form post, a CLI flag,\na tool call from an agent." },
    { n: "2", t: "CALL", d: "Call exactly ONE function\nin core/.\nNot two. Not a chain." },
    { n: "3", t: "RETURN", d: "Print it, render it,\nor hand it back as JSON.\nNo decisions here." },
  ];
  const cw = 4.05, gap = 0.18;
  steps.forEach((st, i) => {
    const x = 0.5 + i * (cw + gap);
    addCard(s, x, 2.35, cw, 2.4, { line: C.purpleDeep, lineWidth: 1.75 });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.25, y: 2.55, w: 0.55, h: 0.55,
      fill: { color: C.yellow }, line: { color: C.yellowDeep, width: 1 },
    });
    s.addText(st.n, {
      x: x + 0.25, y: 2.55, w: 0.55, h: 0.55,
      fontSize: 20, fontFace: FONT_HEAD, color: C.ink, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st.t, {
      x: x + 0.95, y: 2.6, w: cw - 1.2, h: 0.45,
      fontSize: 19, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
      valign: "middle", margin: 0, charSpacing: 1,
    });
    s.addText(st.d, {
      x: x + 0.3, y: 3.25, w: cw - 0.6, h: 1.35,
      fontSize: 12.5, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });
  });

  addCard(s, 0.5, 5.0, 12.3, 1.55, { line: C.red, lineWidth: 2, fill: C.redSoft });
  label(s, 0.7, 5.15, 11.9, "THE COUNTER-EXAMPLE — SAY THIS OUT LOUD", C.red);
  s.addText(
    "If you catch yourself writing  if stage == \"closed_lost\": require a reason  inside a web route — stop.\n" +
    "That rule belongs in the core, because the CLI needs it too, and next week the MCP server will need it as well.",
    {
      x: 0.7, y: 5.5, w: 11.9, h: 0.9,
      fontSize: 13, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });

  addFooter(s);

  s.addNotes(
    "This is the rule they must be able to recite without notes. Say it three times during the day.\n\n" +
    "The counter-example matters more than the rule. Abstract rules do not stick; \"do not put the closed_lost check in your web route\" sticks.\n\n" +
    "If a learner asks \"what if I need two core calls?\" — good question. Answer: then the operation you actually want is a single core function that does both. That is exactly what convert_lead() is. Slide 17.\n\n" +
    "TIMING: 3 min",
  );
}

// ==========================================================================
// SLIDE 12 — Proof: one route
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART B · PROOF");
  addTitle(s, "Proof: Look at One Route",
    "This is the entire API endpoint for moving a deal.");

  label(s, 0.5, 2.25, 12.3, "web/app.py  —  THE ADAPTER");
  addCodeBlock(s, 0.5, 2.6, 12.3, 1.35,
    "@app.post(\"/api/deals/{deal_id}/stage\")\n" +
    "def move_deal_stage(deal_id: str, body: dict = Body(...)):\n" +
    "    return deals.move_stage(deal_id, body[\"stage\"], body.get(\"lost_reason\"))", 13);

  label(s, 0.5, 4.1, 12.3, "core/deals.py  —  WHERE THE THINKING LIVES");
  addCodeBlock(s, 0.5, 4.45, 12.3, 2.05,
    "def move_stage(deal_id, stage, lost_reason=None):\n" +
    "    must_get(\"deals\", deal_id, \"Deal\")                # does it exist?\n" +
    "    target = DealStage(stage)                          # is the stage real?\n" +
    "    if target is DealStage.closed_lost and not lost_reason:\n" +
    "        raise ValidationFailed(\"lost_reason is required ...\", field=\"lost_reason\")\n" +
    "    patch(\"deals\", deal_id, {\"stage\": target.value,\n" +
    "                             \"probability\": STAGE_PROBABILITY[target], ...})", 11.5);

  addFooter(s);

  s.addNotes(
    "Open web/app.py live and scroll through it. Let them see that EVERY route looks like the top block. One line of real work.\n\n" +
    "Then open core/deals.py at move_stage() and read it slowly. Point at each guard: exists, valid stage, lost_reason rule, probability lookup.\n\n" +
    "Land this line: \"That is where the thinking lives. The route is a doorway.\"\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 13 — Schemas
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART C · THE CORE");
  addTitle(s, "A Schema Is a Contract, Not Paperwork",
    "A written description of what a valid record looks like — checked automatically.");

  addCodeBlock(s, 0.5, 2.3, 7.5, 2.9,
    "class DealIn(BaseModel):\n" +
    "    name:        str   = Field(min_length=1)\n" +
    "    account_id:  str\n" +
    "    amount:      float = Field(default=0, ge=0)\n" +
    "    stage:       DealStage = DealStage.qualification\n" +
    "    probability: int | None = Field(default=None, ge=0, le=100)\n" +
    "    close_date:  date | None = None", 13);

  addCard(s, 8.2, 2.3, 4.6, 2.9, { line: C.purpleDeep, lineWidth: 1.75 });
  label(s, 8.4, 2.5, 4.2, "READ IT OUT LOUD");
  s.addText([
    { text: "min_length=1", options: { fontFace: FONT_MONO, bold: true, color: C.purpleDeep, breakLine: true } },
    { text: "a deal must have a name\n", options: { breakLine: true } },
    { text: "ge=0", options: { fontFace: FONT_MONO, bold: true, color: C.purpleDeep, breakLine: true } },
    { text: "amount cannot be negative\n", options: { breakLine: true } },
    { text: "le=100", options: { fontFace: FONT_MONO, bold: true, color: C.purpleDeep, breakLine: true } },
    { text: "probability cannot be 150%", options: {} },
  ], {
    x: 8.4, y: 2.85, w: 4.2, h: 2.2,
    fontSize: 12, fontFace: FONT_BODY, color: C.ink, margin: 0,
  });

  addCard(s, 0.5, 5.4, 12.3, 1.15, { line: C.greenDeep, lineWidth: 1.75, fill: C.greenSoft });
  s.addText([
    { text: "Nobody has to remember these rules.  ", options: { bold: true, color: C.greenDeep } },
    { text: "The code refuses bad data on its own — in the browser form, in the CLI, and later in an agent's tool call. One definition, three enforcement points.", options: {} },
  ], {
    x: 0.75, y: 5.55, w: 11.8, h: 0.85,
    fontSize: 13.5, fontFace: FONT_BODY, color: C.ink, valign: "middle", margin: 0,
  });

  addFooter(s);

  s.addNotes(
    "Define the word for beginners: a schema is a written description of what a valid record looks like. Pydantic turns that description into a check that runs by itself.\n\n" +
    "Walk each constraint. Do not skip ge=0 — \"negative deal amount\" gets a laugh and makes the point stick.\n\n" +
    "If someone knows TypeScript, tell them Zod is the same idea in the JavaScript world. Do not go deeper than that.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 14 — Enums
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART C · THE CORE");
  addYellowUnderline(s, 0.5, 1.0, 8.4);
  addTitle(s, "Enums — The Most Underrated Line of Code",
    "A written list of the only values allowed. Six lines that carry the whole course.");

  addCodeBlock(s, 0.5, 2.3, 6.05, 2.5,
    "class DealStage(str, Enum):\n" +
    "    qualification  = \"qualification\"\n" +
    "    needs_analysis = \"needs_analysis\"\n" +
    "    proposal       = \"proposal\"\n" +
    "    negotiation    = \"negotiation\"\n" +
    "    closed_won     = \"closed_won\"\n" +
    "    closed_lost    = \"closed_lost\"", 12);

  addCard(s, 6.75, 2.3, 6.05, 2.5, { line: C.red, lineWidth: 1.75, fill: C.redSoft });
  label(s, 6.95, 2.5, 5.65, "WITHOUT IT", C.red);
  bullets(s, 7.1, 2.9, 5.5, 1.75, [
    'Someone types "Proposal " with a capital P and a space',
    "Your pipeline report silently splits into two columns",
    "Nobody notices for a month",
  ], { code: "2715", fontSize: 11.5 });

  addCard(s, 0.5, 5.0, 12.3, 1.55, { line: C.purpleDeep, lineWidth: 2.5, fill: C.purpleSoft });
  s.addText("TODAY  this enum fills a dropdown in a form.", {
    x: 0.75, y: 5.15, w: 11.8, h: 0.4,
    fontSize: 15, fontFace: FONT_BODY, color: C.ink, valign: "middle", margin: 0,
  });
  s.addText("IN SESSION 4  the same enum stops an AI model from inventing a stage called \"almost_won\".", {
    x: 0.75, y: 5.6, w: 11.8, h: 0.4,
    fontSize: 15, fontFace: FONT_BODY, color: C.purpleDeep, bold: true, valign: "middle", margin: 0,
  });
  s.addText("Same guardrail. Two very different users. Written once.", {
    x: 0.75, y: 6.05, w: 11.8, h: 0.35,
    fontSize: 13, fontFace: FONT_BODY, color: C.inkSoft, italic: true, valign: "middle", margin: 0,
  });

  addFooter(s);

  s.addNotes(
    "Everyone who has touched real data will nod at the \"Proposal \" example. Let that land before moving on.\n\n" +
    "Then deliver the bottom card slowly. This is the thesis of the entire course compressed into two sentences: the discipline that protects a human form is the same discipline that protects an agent tool call.\n\n" +
    "If you only have time to make ONE point land in Part C, make it this one.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 15 — Errors
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART C · THE CORE");
  addTitle(s, "Your Error Messages Are Part of Your Interface",
    "Ask: which of these can someone fix without asking a colleague?");

  addCard(s, 0.5, 2.3, 6.05, 3.6, { line: C.red, lineWidth: 1.75, fill: C.redSoft });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: 2.45, w: 1.55, h: 0.35,
    fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.15,
  });
  s.addText("BAD ERROR", {
    x: 0.7, y: 2.45, w: 1.55, h: 0.35,
    fontSize: 10, fontFace: FONT_HEAD, color: C.bg, bold: true,
    align: "center", valign: "middle", margin: 0, charSpacing: 1.2,
  });
  addCodeBlock(s, 0.7, 2.95, 5.65, 0.65, "Error: invalid input", 13);
  bullets(s, 0.85, 3.8, 5.5, 1.9, [
    "Which field?",
    "What would have been valid?",
    "A human asks a colleague. An agent guesses.",
    "Guessing is where hallucinated tool calls come from.",
  ], { code: "2715", fontSize: 11.5 });

  addCard(s, 6.75, 2.3, 6.05, 3.6, { line: C.greenDeep, lineWidth: 1.75, fill: C.greenSoft });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.95, y: 2.45, w: 1.7, h: 0.35,
    fill: { color: C.greenDeep }, line: { color: C.greenDeep }, rectRadius: 0.15,
  });
  s.addText("GOOD ERROR", {
    x: 6.95, y: 2.45, w: 1.7, h: 0.35,
    fontSize: 10, fontFace: FONT_HEAD, color: C.bg, bold: true,
    align: "center", valign: "middle", margin: 0, charSpacing: 1.2,
  });
  addCodeBlock(s, 6.95, 2.95, 5.65, 2.15,
    "{ \"code\": \"validation_failed\",\n" +
    "  \"message\": \"'almost_won' is not a\n" +
    "               valid deal stage.\",\n" +
    "  \"details\": {\n" +
    "    \"field\": \"stage\",\n" +
    "    \"allowed\": [\"qualification\",\n" +
    "       \"needs_analysis\", \"proposal\",\n" +
    "       \"negotiation\", \"closed_won\",\n" +
    "       \"closed_lost\"] } }", 9.5);
  bullets(s, 7.1, 5.2, 5.5, 0.55, [
    "Names the field. Lists every valid value.",
  ], { code: "2713", fontSize: 11.5, color: C.greenDeep });

  addCallout(s, 0.5, 6.1, 12.3, 0.55,
    "In the age of agents, error messages are not error messages.\n" +
    "They are documentation delivered at exactly the moment it is needed.",
    { fontSize: 13, bold: true });
  addFooter(s);

  s.addNotes(
    "Ask the question on the subtitle and wait. The answer is obvious, which is the point — nobody defends the bad error once they see them side by side.\n\n" +
    "Then make the agent point: a model reads the good error and CORRECTS ITSELF on the next attempt. It reads the bad one and guesses again. Every hallucinated tool call you have seen started with an error message that taught the model nothing.\n\n" +
    "Deliver the callout as the closing line, then go straight to the live demo on the next slide. Do not add commentary in between.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 16 — Live: break it on purpose
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART C · LIVE DEMO");
  addYellowUnderline(s, 0.5, 1.0, 7.9);
  addTitle(s, "🔥 Live Demo — Break It On Purpose",
    "Three commands that fail, and one drag in the browser that fails the same way.");

  label(s, 0.5, 2.2, 12.3, "RUN THESE IN THE TERMINAL, ONE AT A TIME");
  addCodeBlock(s, 0.5, 2.55, 12.3, 1.35,
    "python cli.py deals move dea_xxxx --stage almost_won      # invalid stage\n" +
    "python cli.py deals move dea_xxxx --stage closed_lost     # missing reason\n" +
    "python cli.py accounts show acc_nope                      # missing record", 12.5);

  addCard(s, 0.5, 4.1, 6.05, 2.4, { line: C.purpleDeep, lineWidth: 1.75 });
  label(s, 0.7, 4.3, 5.65, "WHAT THEY SHOULD NOTICE");
  bullets(s, 0.85, 4.7, 5.5, 1.65, [
    "Each error names the field",
    "Invalid stage prints all six valid values",
    "Missing record suggests how to find a real id",
  ], { code: "2713", fontSize: 11.5 });

  addCard(s, 6.75, 4.1, 6.05, 2.4, { line: C.yellowDeep, lineWidth: 2, fill: C.yellowSoft });
  label(s, 6.95, 4.3, 5.65, "THEN SWITCH TO THE BROWSER", C.yellowDeep);
  s.addText(
    "Drag a deal card into Closed Lost.\nIt asks for a reason there too.\n\n" +
    "Ask: \"How many places is that rule written?\"\n" +
    "Then show them: core/deals.py, one if-statement.",
    {
      x: 6.95, y: 4.7, w: 5.65, h: 1.65,
      fontSize: 12.5, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });

  addFooter(s);

  s.addNotes(
    "DO THIS LIVE. It is the highest-value three minutes in Part C.\n\n" +
    "Get a real deal id first: python cli.py deals list --limit 3\n\n" +
    "Run each failing command and let them READ the output on the projector before you say anything. Silence works here.\n\n" +
    "Then the browser drag. Then the question. Wait for someone to say \"one place.\" Then open core/deals.py and show the single if-statement — around line 100.\n\n" +
    "If a command unexpectedly succeeds, you probably used a valid stage name. Check the spelling of almost_won.\n\n" +
    "TIMING: 5 min",
  );
}

// ==========================================================================
// SLIDE 17 — convert_lead
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART C · THE PAYOFF");
  addTitle(s, "convert_lead() — One Operation, Many Callers",
    "Five things that must happen together, in order, with a duplicate check in the middle.");

  addCodeBlock(s, 0.5, 2.3, 7.5, 2.75,
    "def convert_lead(lead_id, deal_name=None, deal_amount=0):\n" +
    "    lead    = must_get(\"leads\", lead_id, \"Lead\")\n" +
    "    account = accounts.create_account(...)   # reuse if it exists\n" +
    "    contact = contacts.create_contact(...)\n" +
    "    deal    = deals.create_deal(...)         # optional\n" +
    "    patch(\"leads\", lead_id, {\"status\": \"converted\", ...})\n" +
    "    return {\"lead\":…, \"account\":…, \"contact\":…, \"deal\":…}", 12);

  addCard(s, 8.2, 2.3, 4.6, 2.75, { line: C.purpleDeep, lineWidth: 1.75 });
  label(s, 8.4, 2.5, 4.2, "WHO CALLS IT");
  bullets(s, 8.55, 2.9, 4.1, 2.0, [
    "The browser — Convert button",
    "The CLI — leads convert",
    "Session 3 — an MCP tool",
    "Session 5 — a Skill, via the CLI",
  ], { code: "2713", fontSize: 12 });

  addCard(s, 0.5, 5.25, 12.3, 1.3, { line: C.yellowDeep, lineWidth: 2, fill: C.yellowSoft });
  s.addText("Say this out loud:", {
    x: 0.75, y: 5.4, w: 11.8, h: 0.3,
    fontSize: 11, fontFace: FONT_HEAD, color: C.yellowDeep, bold: true, charSpacing: 1.2, margin: 0,
  });
  s.addText("\"If this logic lived in the web route, we would be re-implementing it three more times before this course ends.\"", {
    x: 0.75, y: 5.75, w: 11.8, h: 0.6,
    fontSize: 15, fontFace: FONT_BODY, color: C.ink, italic: true, margin: 0,
  });

  addFooter(s);

  s.addNotes(
    "This is the payoff for the arrow you flagged on slide 9.\n\n" +
    "Name the concept: a MULTI-STEP BUSINESS OPERATION. Not a CRUD call — a sequence with rules inside it (reuse the account if the company already exists; refuse if the lead was already converted).\n\n" +
    "In Session 3, an agent will trigger this entire chain from the sentence \"convert that lead and open a deal for eight lakhs.\" Say that now — it builds anticipation for the next session.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 18 — Session 1 scoreboard
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART C · WRAP");
  addTitle(s, "End of Session 1 — What We Have",
    "And, more importantly, what we deliberately have not done.");

  addCard(s, 0.5, 2.35, 7.5, 3.3, { line: C.greenDeep, lineWidth: 1.75, fill: C.greenSoft });
  label(s, 0.75, 2.55, 7.0, "WHAT WE HAVE", C.greenDeep);
  bullets(s, 0.9, 2.95, 6.9, 2.5, [
    "A working CRM — 9 screens, 7 tables, ~40 API routes",
    "All logic in core/ — one copy, no duplication",
    "Schemas with enums guarding every write",
    "Structured errors that name the field and list valid values",
    "A multi-step operation (convert_lead) written exactly once",
  ], { code: "2713", fontSize: 12.5, gap: 6 });

  addCard(s, 8.2, 2.35, 4.6, 3.3, { line: C.yellowDeep, lineWidth: 2.5, fill: C.yellowSoft });
  label(s, 8.4, 2.55, 4.2, "WHAT WE HAVE NOT DONE", C.yellowDeep);
  s.addText("Anything AI-related.", {
    x: 8.4, y: 3.0, w: 4.2, h: 0.5,
    fontSize: 22, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true, margin: 0,
  });
  s.addText("Not one line.", {
    x: 8.4, y: 3.5, w: 4.2, h: 0.4,
    fontSize: 22, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true, margin: 0,
  });
  s.addText(
    "Everything today was ordinary software engineering.\n\n" +
    "That ordinary work is about 80% of what makes an application agent-ready.\n\n" +
    "Most people skip it, then wonder why their MCP server is unreliable.",
    {
      x: 8.4, y: 4.1, w: 4.2, h: 1.4,
      fontSize: 12, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });

  addCallout(s, 0.5, 5.9, 12.3, 0.5,
    "Break here. Session 2 starts with a question: can we add a second interface without touching core/ at all?",
    { fontSize: 13, bold: true });
  addFooter(s);

  s.addNotes(
    "Close Session 1 on the yellow card. Say the last bullet slowly — it is the most contrarian claim in the whole course, and it is true.\n\n" +
    "Expect pushback: \"so when do we get to the AI part?\" Answer: next session we add the third interface, and the user is not a person. But if the core is wrong, the AI part fails in ways that are very hard to debug.\n\n" +
    "Take a 10-minute break here.\n\n" +
    "TIMING: 5 min",
  );
}

// ==========================================================================
// SLIDE 19 — Why CLI before MCP
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART D · SESSION 2");
  addTitle(s, "Why Build a CLI Before MCP?",
    "Because a CLI tests our claim using zero new concepts.");

  addCard(s, 0.5, 2.4, 12.3, 1.5, { line: C.purpleDeep, lineWidth: 2.5, fill: C.purpleSoft });
  s.addText("We claimed:  \"Adding a new interface should be cheap.\"", {
    x: 0.75, y: 2.6, w: 11.8, h: 0.45,
    fontSize: 17, fontFace: FONT_BODY, color: C.ink, valign: "middle", margin: 0,
  });
  s.addText("So let us add one — and see whether we have to touch core/ even once.", {
    x: 0.75, y: 3.1, w: 11.8, h: 0.45,
    fontSize: 17, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true, valign: "middle", margin: 0,
  });

  addCard(s, 0.5, 4.15, 6.05, 2.35, { line: C.red, lineWidth: 1.75, fill: C.redSoft });
  label(s, 0.7, 4.35, 5.65, "IF WE JUMPED STRAIGHT TO MCP", C.red);
  bullets(s, 0.85, 4.75, 5.5, 1.55, [
    "New protocol, new SDK, new client setup",
    "Something breaks — was it the architecture, or the protocol?",
    "You cannot tell. So you learn nothing.",
  ], { code: "2715", fontSize: 11.5 });

  addCard(s, 6.75, 4.15, 6.05, 2.35, { line: C.greenDeep, lineWidth: 1.75, fill: C.greenSoft });
  label(s, 6.95, 4.35, 5.65, "WITH A CLI FIRST", C.greenDeep);
  bullets(s, 7.1, 4.75, 5.5, 1.55, [
    "Boring, well-understood interface",
    "If the architecture holds here, it holds for MCP",
    "You test one variable at a time",
  ], { code: "2713", fontSize: 11.5 });

  addFooter(s);

  s.addNotes(
    "This slide answers the impatient learner who wants MCP in the first hour.\n\n" +
    "The framing that works: we are running an experiment, and good experiments change one variable at a time. The CLI changes the interface while holding the protocol boring.\n\n" +
    "Optional aside for the experienced people in the room: this is also why you build a CLI first in real work — it is the cheapest way to find out that your service layer has the wrong shape.\n\n" +
    "TIMING: 3 min",
  );
}

// ==========================================================================
// SLIDE 20 — Live: same numbers
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART D · LIVE DEMO");
  addYellowUnderline(s, 0.5, 1.0, 7.4);
  addTitle(s, "🔥 Live Demo — Same Numbers, Two Doors",
    "Browser on one half of the screen. Terminal on the other.");

  addCodeBlock(s, 0.5, 2.3, 12.3, 0.7, "python cli.py dashboard", 15);

  addCard(s, 0.5, 3.2, 6.05, 2.4, { line: C.purpleDeep, lineWidth: 1.75 });
  label(s, 0.7, 3.4, 5.65, "WHAT TO DO");
  bullets(s, 0.85, 3.8, 5.5, 1.6, [
    "Put the browser dashboard and the terminal side by side",
    "Read one number off each",
    "They match",
  ], { fontSize: 12 });

  addCard(s, 6.75, 3.2, 6.05, 2.4, { line: C.greenDeep, lineWidth: 1.75, fill: C.greenSoft });
  label(s, 6.95, 3.4, 5.65, "WHY THEY MATCH", C.greenDeep);
  s.addText(
    "They are the same number.\n\n" +
    "One function — analytics.dashboard() —\ncalled from two places.\n\n" +
    "The CLI does not call the web API. They are peers over one core.",
    {
      x: 6.95, y: 3.8, w: 5.65, h: 1.6,
      fontSize: 12.5, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });

  addCallout(s, 0.5, 5.85, 12.3, 0.6,
    "Nobody wrote sync code. There is nothing to keep in sync — there is only one copy of the calculation.",
    { fontSize: 13.5, bold: true });
  addFooter(s);

  s.addNotes(
    "DO THIS LIVE, side by side. The visual of two very different-looking screens showing the same rupee figure does more than any explanation.\n\n" +
    "Pre-check before the session: run python cli.py dashboard once so the first run is not slowed by imports.\n\n" +
    "Common question: \"does the CLI call the API?\" No. Answer clearly — they are siblings, not parent and child. Both import core/ directly. Draw two arrows into one box if it helps.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 21 — Live: real work in the terminal
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART D · HANDS-ON");
  addYellowUnderline(s, 0.5, 1.0, 7.6);
  addTitle(s, "🛠️ Hands-On — Do Real Work in the Terminal",
    "12 minutes · then refresh the browser and watch your work appear.");

  addTimePill(s, 0.5, 2.1, 3.0, "⏱  TIME: 12 MINUTES");

  const steps = [
    { n: "1", title: "Create an account", time: "2 min",
      code: "python cli.py accounts create \\\n  --name \"Orbit Foods\" \\\n  --industry Retail", codeFontSize: 9 },
    { n: "2", title: "Copy the acc_ id", time: "1 min",
      code: "# the command printed:\n# id: acc_xxxxxxxx", codeFontSize: 9 },
    { n: "3", title: "Create a deal", time: "3 min",
      code: "python cli.py deals create \\\n  --name \"Orbit - pilot\" \\\n  --account acc_xxxx --amount 800000", codeFontSize: 8.5 },
    { n: "4", title: "Move its stage", time: "2 min",
      code: "python cli.py deals move \\\n  dea_xxxx --stage proposal", codeFontSize: 9 },
    { n: "5", title: "Add a follow-up", time: "2 min",
      code: "python cli.py tasks create \\\n  --subject \"Send pricing\" \\\n  --due 2026-09-30", codeFontSize: 8.5 },
    { n: "6", title: "Refresh the browser", time: "2 min",
      code: "# localhost:8000/#/pipeline\n# your deal is in Proposal", codeFontSize: 9 },
  ];
  steps.forEach((step, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    addNumberedStep(s, 0.5 + col * 4.18, 2.65 + row * 1.95, 4.0, 1.8, step);
  });

  addCard(s, 0.5, 6.4, 12.3, 0.55, { line: C.greenDeep, lineWidth: 1.5, fill: C.greenSoft });
  s.addText([
    { text: "CHECKPOINT  ", options: { bold: true, color: C.greenDeep, fontSize: 10.5, charSpacing: 1.2 } },
    { text: "✓ Account created  ·  ✓ Deal created  ·  ✓ Stage moved  ·  ✓ Task added  ·  ", options: { fontSize: 11 } },
    { text: "✓ All of it visible in the browser", options: { fontSize: 11, bold: true, color: C.greenDeep } },
  ], {
    x: 0.5, y: 6.4, w: 12.3, h: 0.55,
    fontFace: FONT_BODY, color: C.ink, align: "center", valign: "middle", margin: 0,
  });

  addFooter(s);

  s.addNotes(
    "Demo steps 1-4 yourself first, slowly, copying each printed id into the next command. Then let them do all six.\n\n" +
    "THE MOMENT: after step 6, pause. Let the room see their terminal work sitting in the browser kanban. Then ask: \"How much integration code did I write to make the terminal and the browser agree?\"\n\n" +
    "Answer: none. They are not integrated. They share a core.\n\n" +
    "Walk the room during this. The usual failure is pasting the acc_ id where a dea_ id belongs — the error message tells them exactly that, which is itself a teaching moment worth pointing out loudly.\n\n" +
    "TIMING: 12 min hands-on (slide budget 6 min of talking)",
  );
}

// ==========================================================================
// SLIDE 22 — Anatomy of one command
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART D · CODE");
  addTitle(s, "Anatomy of One Command",
    "Put this next to the web route from slide 12. Same shape, different clothes.");

  label(s, 0.5, 2.25, 12.3, "cli.py  —  ADAPTER 2");
  addCodeBlock(s, 0.5, 2.6, 12.3, 1.85,
    "@deals_app.command(\"move\")\n" +
    "def deals_move(deal_id: str, stage: str = ..., reason: str = None):\n" +
    "    \"\"\"Move a deal to another pipeline stage.\"\"\"\n" +
    "    rec = run(deals.move_stage, deal_id, stage, reason)      # <- the only work\n" +
    "    ok(f\"'{rec['name']}' moved to {rec['stage']} ({rec['probability']}%).\")", 13);

  const q = [
    { q: "Where does the CLI learn that proposal means 50%?", a: "It does not. It prints what the core hands back." },
    { q: "Where is the closed_lost rule?", a: "core/deals.py. The CLI never mentions it." },
    { q: "How many core functions does this call?", a: "Exactly one. That is the rule from slide 11." },
  ];
  q.forEach((item, i) => {
    const y = 4.65 + i * 0.66;
    addCard(s, 0.5, y, 12.3, 0.56, { line: C.cardLine, lineWidth: 1 });
    s.addText([
      { text: item.q + "   ", options: { bold: true, color: C.purpleDeep, fontSize: 12.5 } },
      { text: item.a, options: { color: C.ink, fontSize: 12.5, italic: true } },
    ], { x: 0.75, y, w: 11.8, h: 0.56, valign: "middle", margin: 0, fontFace: FONT_BODY });
  });

  addFooter(s);

  s.addNotes(
    "If your projector allows, put slide 12 and this slide side by side — or flip back and forth twice. The shape is identical: read, call one core function, print.\n\n" +
    "Ask the three questions on the cards BEFORE revealing the answers. Cover them with a black box in presenter mode if you can.\n\n" +
    "The run() wrapper is worth one sentence: it catches core errors and turns them into shell behaviour — printed details plus an exit code. It is plumbing, not logic.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 23 — --json
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART D · THE BRIDGE");
  addYellowUnderline(s, 0.5, 1.0, 7.2);
  addTitle(s, "--json : The Bridge to Agents",
    "One flag today. It is what makes this CLI agent-ready in Session 5.");

  addCard(s, 0.5, 2.3, 6.05, 2.0, { line: C.purpleDeep, lineWidth: 1.75 });
  label(s, 0.7, 2.5, 5.65, "FOR A HUMAN");
  addCodeBlock(s, 0.7, 2.85, 5.65, 0.6, "python cli.py deals list", 11.5);
  s.addText("A pretty table with borders and colours.", {
    x: 0.7, y: 3.55, w: 5.65, h: 0.6,
    fontSize: 12, fontFace: FONT_BODY, color: C.inkSoft, italic: true, margin: 0,
  });

  addCard(s, 6.75, 2.3, 6.05, 2.0, { line: C.greenDeep, lineWidth: 2, fill: C.greenSoft });
  label(s, 6.95, 2.5, 5.65, "FOR A MACHINE", C.greenDeep);
  addCodeBlock(s, 6.95, 2.85, 5.65, 0.6, "python cli.py --json deals list", 11.5);
  s.addText("Clean JSON. Nothing to parse around.", {
    x: 6.95, y: 3.55, w: 5.65, h: 0.6,
    fontSize: 12, fontFace: FONT_BODY, color: C.inkSoft, italic: true, margin: 0,
  });

  addCard(s, 0.5, 4.5, 12.3, 1.95, { line: C.yellowDeep, lineWidth: 2.5, fill: C.yellowSoft });
  label(s, 0.75, 4.65, 11.8, "WHY IT IS REALLY THERE", C.yellowDeep);
  s.addText(
    "In Session 5 we hand an agent a Skill — a short instruction file — that says:\n" +
    "\"to read the CRM, run  python cli.py --json ...\"\n\n" +
    "The agent runs it, reads the JSON, and acts. We will not write one line of agent-specific code to make that work.",
    {
      x: 0.75, y: 5.0, w: 11.8, h: 1.3,
      fontSize: 13.5, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });

  addCallout(s, 0.5, 6.55, 12.3, 0.4,
    "Rule: every tool you build for humans should have a machine-readable mode.",
    { fontSize: 13, bold: true });
  addFooter(s);

  s.addNotes(
    "DO THIS LIVE. Run both commands back to back. The visual difference does the teaching — you barely need to speak over it.\n\n" +
    "Then explain what it is really for. This is the moment the course's promise becomes concrete: they can see the path from \"CLI I built today\" to \"AI agent using it in three sessions.\"\n\n" +
    "Also run the error case: python cli.py --json accounts show acc_nope — structured JSON on stderr, exit code 1. Ties slide 15 and slide 24 together.\n\n" +
    "TIMING: 5 min",
  );
}

// ==========================================================================
// SLIDE 24 — Exit codes
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART D · PLUMBING");
  addTitle(s, "Exit Codes — How Programs Talk to Programs",
    "Every command-line program returns a number when it finishes. Zero means success.");

  const codes = [
    { c: "0", t: "It worked", d: "The operation completed.\nCarry on.", color: C.greenDeep, fill: C.greenSoft },
    { c: "1", t: "A business rule said no", d: "Not found, duplicate, invalid\nstage, missing lost_reason.", color: C.amber, fill: C.amberSoft },
    { c: "2", t: "The input was the wrong shape", d: "A field failed validation\nbefore the core was reached.", color: C.red, fill: C.redSoft },
  ];
  const cw = 4.05, gap = 0.18;
  codes.forEach((it, i) => {
    const x = 0.5 + i * (cw + gap);
    addCard(s, x, 2.4, cw, 2.3, { line: it.color, lineWidth: 2, fill: it.fill });
    s.addText(it.c, {
      x, y: 2.6, w: cw, h: 0.8,
      fontSize: 48, fontFace: FONT_HEAD, color: it.color, bold: true,
      align: "center", margin: 0,
    });
    s.addText(it.t, {
      x: x + 0.2, y: 3.45, w: cw - 0.4, h: 0.5,
      fontSize: 14, fontFace: FONT_HEAD, color: C.ink, bold: true,
      align: "center", margin: 0,
    });
    s.addText(it.d, {
      x: x + 0.2, y: 3.95, w: cw - 0.4, h: 0.65,
      fontSize: 11.5, fontFace: FONT_BODY, color: C.inkSoft,
      align: "center", margin: 0,
    });
  });

  label(s, 0.5, 4.95, 12.3, "SEE IT YOURSELF");
  addCodeBlock(s, 0.5, 5.3, 12.3, 1.15,
    "python cli.py deals move dea_xxxx --stage almost_won\n" +
    "echo $LASTEXITCODE        # PowerShell\n" +
    "echo $?                   # bash / zsh", 12.5);

  addFooter(s);

  s.addNotes(
    "For beginners, this is genuinely new information. Say it plainly: every command-line program returns a number when it finishes. Zero means success. Anything else means something went wrong. Scripts and agents branch on that number.\n\n" +
    "Demo it if your shell cooperates. On PowerShell use $LASTEXITCODE; on bash use $?.\n\n" +
    "Connect it forward: an agent running your CLI checks the exit code first, then reads the JSON. Both halves matter.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 25 — Exercise
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART D · EXERCISE");
  addYellowUnderline(s, 0.5, 1.0, 5.4);
  addTitle(s, "🛠️ Your Turn — 15 Minutes",
    "Three tasks. The first one is timed on purpose.");

  addTimePill(s, 0.5, 2.1, 3.0, "⏱  TIME: 15 MINUTES");

  const ex = [
    { n: "1", t: "Add a contacts update command", d: "Time yourself.\n\nUnder 5 minutes? Good — the architecture is doing its job.\n\nLonger? Some logic has leaked out of the core." },
    { n: "2", t: "Find business logic hiding in cli.py", d: "Hint: how is --reason handled\nfor closed_lost?\n\nCheck core/deals.py before you\nconclude anything." },
    { n: "3", t: "Answer without opening a file", d: "If we delete cli.py entirely,\ndoes the web app still work?\n\nWhy?" },
  ];
  const cw = 4.05, gap = 0.18;
  ex.forEach((it, i) => {
    const x = 0.5 + i * (cw + gap);
    addCard(s, x, 2.65, cw, 3.35, { line: C.purpleDeep, lineWidth: 1.75 });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.2, y: 2.85, w: 0.5, h: 0.5,
      fill: { color: C.yellow }, line: { color: C.yellowDeep, width: 1 },
    });
    s.addText(it.n, {
      x: x + 0.2, y: 2.85, w: 0.5, h: 0.5,
      fontSize: 18, fontFace: FONT_HEAD, color: C.ink, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(it.t, {
      x: x + 0.85, y: 2.85, w: cw - 1.05, h: 0.75,
      fontSize: 13.5, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true, margin: 0,
    });
    s.addText(it.d, {
      x: x + 0.25, y: 3.75, w: cw - 0.5, h: 2.1,
      fontSize: 12, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });
  });

  addCallout(s, 0.5, 6.2, 12.3, 0.45,
    "Exercise 2 is a trick — the rule is already in the core and cli.py is clean. Finding nothing is the correct answer.",
    { fontSize: 12.5, bold: true });
  addFooter(s);

  s.addNotes(
    "Give 15 minutes and walk the room. Do not sit down.\n\n" +
    "Exercise 1 is the real assessment. Anyone finishing in three minutes has understood the architecture — ask THEM to explain it to their neighbour rather than starting exercise 2. Peer explanation is worth more than another exercise.\n\n" +
    "Exercise 2 is deliberately a trick. Learners who go looking and find nothing have learned to verify a claim instead of trusting a slide. Say that out loud when you debrief.\n\n" +
    "Exercise 3 answer: yes, because cli.py imports core, not the other way round. Dependencies point inward.\n\n" +
    "TIMING: 15 min",
  );
}

// ==========================================================================
// SLIDE 26 — What we proved
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART E · WRAP");
  addTitle(s, "What We Actually Proved Today",
    "Ask the room to supply the evidence column before you reveal it.");

  const rows = [
    ["Logic lives in one place", "Two interfaces, one core/, zero duplication", C.purpleDeep],
    ["Adding an interface is cheap", "The CLI took one file and no core changes", C.purpleDeep],
    ["Rules are enforced everywhere", "closed_lost needs a reason in the browser AND the terminal", C.greenDeep],
    ["Errors can teach the caller", "Field name plus allowed values, every single time", C.greenDeep],
    ["Human tools can be agent-ready", "One --json flag. That is the entire cost.", C.yellowDeep],
  ];

  label(s, 0.5, 2.35, 5.0, "THE CLAIM");
  label(s, 5.7, 2.35, 7.1, "THE EVIDENCE");

  rows.forEach((r, i) => {
    const y = 2.75 + i * 0.78;
    addCard(s, 0.5, y, 12.3, 0.66, { line: r[2], lineWidth: 1.4 });
    s.addText(r[0], {
      x: 0.75, y, w: 4.9, h: 0.66,
      fontSize: 13.5, fontFace: FONT_HEAD, color: r[2], bold: true,
      valign: "middle", margin: 0,
    });
    s.addText(r[1], {
      x: 5.7, y, w: 6.9, h: 0.66,
      fontSize: 13, fontFace: FONT_BODY, color: C.ink,
      valign: "middle", margin: 0,
    });
  });

  addFooter(s);

  s.addNotes(
    "Cover the right column if your presenter tool allows, and ask the room to fill it in from memory. Recall beats re-reading for retention.\n\n" +
    "The last row is the transition into the rest of the course. One flag was the entire cost of being agent-ready. Everything else was ordinary good engineering.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 27 — What comes next
// ==========================================================================
{
  const s = newSlide();
  addSectionBadge(s, "PART E · ROADMAP");
  addTitle(s, "What Comes Next",
    "Same core. Untouched again. But the user stops being a person.");

  const rows = [
    ["1", "Web UI + REST", "humans, browser", "DONE", C.greenDeep, C.greenSoft],
    ["2", "CLI", "humans, terminal", "DONE", C.greenDeep, C.greenSoft],
    ["3", "Local MCP server", "coding agents — Claude Code, Codex", "NEXT", C.purpleDeep, C.purpleSoft],
    ["4", "Remote MCP server", "ChatGPT, Claude on the web", "", C.purple, C.bg],
    ["5", "Skill", "any agent, through the CLI", "", C.yellowDeep, C.bg],
    ["6", "Capstone — the CRM Agent", "\"Prepare my follow-ups for tomorrow.\"", "", C.ink, C.bg],
  ];

  rows.forEach((r, i) => {
    const y = 2.3 + i * 0.70;
    addCard(s, 0.5, y, 12.3, 0.62, {
      line: r[4], lineWidth: r[3] ? 2 : 1.2, fill: r[5],
    });
    s.addShape(pres.shapes.OVAL, {
      x: 0.7, y: y + 0.11, w: 0.4, h: 0.4,
      fill: { color: r[4] }, line: { color: r[4] },
    });
    s.addText(r[0], {
      x: 0.7, y: y + 0.11, w: 0.4, h: 0.4,
      fontSize: 13, fontFace: FONT_HEAD, color: C.bg, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(r[1], {
      x: 1.3, y, w: 4.3, h: 0.62,
      fontSize: 14, fontFace: FONT_HEAD, color: C.ink, bold: true,
      valign: "middle", margin: 0,
    });
    s.addText(r[2], {
      x: 5.7, y, w: 5.6, h: 0.62,
      fontSize: 12.5, fontFace: FONT_BODY, color: C.inkSoft,
      italic: true, valign: "middle", margin: 0,
    });
    if (r[3]) {
      s.addText(r[3], {
        x: 11.3, y, w: 1.3, h: 0.62,
        fontSize: 11, fontFace: FONT_HEAD, color: r[4], bold: true,
        align: "right", valign: "middle", margin: 0, charSpacing: 1,
      });
    }
  });

  addCallout(s, 0.5, 6.55, 12.3, 0.4,
    "Next time: the agent picks which function to call, by itself.",
    { fontSize: 13, bold: true });
  addFooter(s);

  s.addNotes(
    "Set up Session 3 with the exact promise: \"Next time we add a third interface. Same core, untouched again. But the user is not a person — it is an AI agent, and it decides which function to call by itself.\"\n\n" +
    "Then preview the capstone in one breath: \"Prepare my sales follow-up for tomorrow\" → the agent searches accounts, checks last activity, spots the gaps, creates tasks, assigns them, reports back. Every one of those steps is a function we already wrote today.\n\n" +
    "That last sentence is the one that makes people come back for Session 3.\n\n" +
    "TIMING: 4 min",
  );
}

// ==========================================================================
// SLIDE 28 — Closing line
// ==========================================================================
{
  const s = newSlide();

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.3, h: 7.5,
    fill: { color: C.purpleSoft }, line: { color: C.purpleSoft, width: 0 },
  });
  [[0.7, 0.8], [12.4, 1.1], [0.9, 6.5], [12.2, 6.3], [6.6, 0.6]].forEach(([sx, sy]) => {
    s.addShape(pres.shapes.OVAL, {
      x: sx, y: sy, w: 0.18, h: 0.18,
      fill: { color: C.purpleDeep }, line: { color: C.purpleDeep },
    });
  });

  addCard(s, 1.1, 2.15, 11.1, 3.2, { line: C.purpleDeep, lineWidth: 2.5 });

  s.addText("MCP does not make your application intelligent.", {
    x: 1.5, y: 2.65, w: 10.3, h: 0.8,
    fontSize: 30, fontFace: FONT_HEAD, color: C.ink, bold: true,
    align: "center", margin: 0,
  });
  s.addText("MCP makes your application's capabilities", {
    x: 1.5, y: 3.55, w: 10.3, h: 0.6,
    fontSize: 30, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
    align: "center", margin: 0,
  });
  s.addText("available to intelligence.", {
    x: 1.5, y: 4.15, w: 10.3, h: 0.6,
    fontSize: 30, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
    align: "center", margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.3, y: 4.78, w: 4.7, h: 0.14,
    fill: { color: C.yellow, transparency: 20 },
    line: { color: C.yellow, transparency: 100 }, rectRadius: 0.06,
  });

  s.addText("So where should you spend your effort — on the MCP server, or on the core?", {
    x: 1.1, y: 5.7, w: 11.1, h: 0.45,
    fontSize: 16, fontFace: FONT_BODY, color: C.inkSoft, italic: true,
    align: "center", margin: 0,
  });

  s.addText("Sessions 1 & 2  ·  MCP Workshop  ·  Skillopedia × Claude Code", {
    x: 1.1, y: 6.55, w: 11.1, h: 0.35,
    fontSize: 11, fontFace: FONT_BODY, color: C.inkLight,
    align: "center", margin: 0,
  });

  s.addNotes(
    "End here. Do not add a slide after this one.\n\n" +
    "Ask the closing question and wait for the room to answer \"the core.\" If they say it out loud, they own it.\n\n" +
    "Then stop talking. Let the sentence be the last thing on screen while people pack up.\n\n" +
    "TIMING: 2 min",
  );
}

// ==========================================================================
finalize(path.join(__dirname, "..", "MCP-Workshop-Sessions-1-2.pptx"))
  .then((f) => console.log("Wrote:", f))
  .catch((e) => { console.error(e); process.exit(1); });
