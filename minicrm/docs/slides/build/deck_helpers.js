// Skillopedia × Excelacom × Claude Code — Deck Helpers
// Single source of truth for the workshop deck visual language.
// Usage:
//   const helpers = require("/path/to/scripts/deck_helpers.js");
//   const { pres, C, addTitle, addCard, ..., newSlide, finalize } = helpers.init({
//     title: "Chapter X — Topic",
//     chapter: "Chapter X",
//     totalSlides: 25,
//   });

const pptxgen = require("pptxgenjs");

// ========== BRAND PALETTE ==========
const C = {
  bg: "FFFFFF",
  ink: "2D2D2D",
  inkSoft: "5A5A5A",
  inkLight: "8A8A8A",
  purple: "9B7FBE",
  purpleDeep: "6B4E96",
  purpleSoft: "EDE5F7",
  purpleLine: "C5B3DC",
  yellow: "FFD93D",
  yellowSoft: "FFF4B8",
  yellowDeep: "E5BA1F",
  green: "7CB87C",
  greenDeep: "5A9C5A",
  greenSoft: "F0F8F0",
  red: "D67373",
  redSoft: "FBEEEE",
  amber: "E8A547",
  amberSoft: "FEF7E8",
  codeBg: "F6F2FB",
  cardLine: "E4DAEF",
};

const FONT_HEAD = "Calibri";
const FONT_BODY = "Calibri";
const FONT_MONO = "Consolas";

// ========== FACTORY ==========
function init(config = {}) {
  const title = config.title || "Workshop Deck";
  const chapter = config.chapter || "Workshop";
  const totalSlides = config.totalSlides || 1;
  const author = config.author || "Skillopedia × Excelacom × Claude Code";
  const footerText = config.footerText ||
    `${chapter}   |   Skillopedia × Excelacom × Claude Code`;

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 × 7.5
  pres.title = title;
  pres.author = author;

  let slideNum = 0;

  // ---------- newSlide ----------
  function newSlide() {
    slideNum++;
    const s = pres.addSlide();
    s.background = { color: C.bg };
    return s;
  }

  // ---------- addFooter ----------
  function addFooter(slide) {
    slide.addText(footerText, {
      x: 0.5, y: 7.05, w: 9, h: 0.3,
      fontSize: 9, fontFace: FONT_BODY, color: C.inkLight,
      align: "left", margin: 0,
    });
    slide.addText(`${slideNum} / ${totalSlides}`, {
      x: 12.0, y: 7.05, w: 0.8, h: 0.3,
      fontSize: 9, fontFace: FONT_BODY, color: C.inkLight,
      align: "right", margin: 0, bold: true,
    });
  }

  // ---------- addTitle ----------
  // Standard slide title with two-dot logo on top-left.
  // Place at top of every content slide.
  function addTitle(slide, titleText, subtitle) {
    // Two-dot logo
    slide.addShape(pres.shapes.OVAL, {
      x: 0.5, y: 0.55, w: 0.18, h: 0.18,
      fill: { color: C.yellow }, line: { color: C.yellow },
    });
    slide.addShape(pres.shapes.OVAL, {
      x: 0.72, y: 0.55, w: 0.18, h: 0.18,
      fill: { color: C.purple }, line: { color: C.purple },
    });
    // Title
    slide.addText(titleText, {
      x: 0.5, y: 0.85, w: 12.3, h: 0.7,
      fontSize: 28, fontFace: FONT_HEAD, color: C.ink, bold: true,
      margin: 0,
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.5, y: 1.55, w: 12.3, h: 0.4,
        fontSize: 14, fontFace: FONT_BODY, color: C.purpleDeep,
        italic: true, margin: 0,
      });
    }
  }

  // ---------- addSectionBadge ----------
  // Top-right pill showing the section name. Skip on title slides.
  function addSectionBadge(slide, label) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 10.4, y: 0.45, w: 2.4, h: 0.4,
      fill: { color: C.purpleSoft },
      line: { color: C.purple, width: 0.75 },
      rectRadius: 0.18,
    });
    slide.addText(label, {
      x: 10.4, y: 0.45, w: 2.4, h: 0.4,
      fontSize: 10, fontFace: FONT_BODY, color: C.purpleDeep, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ---------- addCard ----------
  // Rounded white card with soft purple shadow. The workhorse container.
  // opts: { fill, line, lineWidth }
  function addCard(slide, x, y, w, h, opts = {}) {
    const fill = opts.fill || C.bg;
    const line = opts.line || C.cardLine;
    const lineWidth = opts.lineWidth || 1.25;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      fill: { color: fill },
      line: { color: line, width: lineWidth },
      rectRadius: 0.12,
      shadow: { type: "outer", color: "C4B5DC", blur: 8, offset: 2, angle: 90, opacity: 0.18 },
    });
  }

  // ---------- addYellowUnderline ----------
  // Thin yellow highlighter underline beneath title text.
  // Use on hands-on, demo, and quiz slides for visual emphasis.
  // Pass the title's (x, y, w) — underline is auto-positioned at y+0.50.
  function addYellowUnderline(slide, x, y, w) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: y + 0.50, w, h: 0.10,
      fill: { color: C.yellow, transparency: 30 },
      line: { color: C.yellow, transparency: 100 },
      rectRadius: 0.05,
    });
  }

  // ---------- addCallout ----------
  // Yellow banner for emphasis text. Position carefully — must end by y=6.7
  // to avoid colliding with the footer at y=7.05.
  // opts: { bg, border, fontSize, color, italic, align, bold }
  function addCallout(slide, x, y, w, h, text, opts = {}) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      fill: { color: opts.bg || C.yellowSoft },
      line: { color: opts.border || C.yellowDeep, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(text, {
      x: x + 0.2, y, w: w - 0.4, h,
      fontSize: opts.fontSize || 14, fontFace: FONT_BODY,
      color: opts.color || C.ink,
      italic: opts.italic !== false,
      align: opts.align || "center",
      valign: "middle",
      bold: opts.bold || false,
    });
  }

  // ---------- addCodeBlock ----------
  // Monospace block on light purple background. Used for prompts, commands,
  // file structures, and any verbatim code.
  function addCodeBlock(slide, x, y, w, h, code, fontSize = 11) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      fill: { color: C.codeBg },
      line: { color: C.purpleLine, width: 0.75 },
      rectRadius: 0.08,
    });
    slide.addText(code, {
      x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24,
      fontSize, fontFace: FONT_MONO, color: C.ink,
      align: "left", valign: "top", margin: 0,
    });
  }

  // ---------- addTimePill ----------
  // Small purple-soft pill for "⏱ TIME: N MINUTES". Use on hands-on slides.
  function addTimePill(slide, x, y, w, label) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h: 0.4,
      fill: { color: C.purpleSoft },
      line: { color: C.purple, width: 1 },
      rectRadius: 0.2,
    });
    slide.addText(label, {
      x, y, w, h: 0.4,
      fontSize: 11, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
      align: "center", valign: "middle", margin: 0, charSpacing: 1,
    });
  }

  // ---------- addNumberedStep ----------
  // A numbered step card for hands-on slides. Yellow circle with number,
  // bold step title, optional time pill, optional code block.
  // step: { n, title, time, code, codeFontSize }
  function addNumberedStep(slide, x, y, w, h, step) {
    addCard(slide, x, y, w, h, { line: C.purpleDeep, lineWidth: 1.25 });
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.2, y: y + 0.15, w: 0.45, h: 0.45,
      fill: { color: C.yellow }, line: { color: C.yellowDeep, width: 1 },
    });
    slide.addText(step.n, {
      x: x + 0.2, y: y + 0.15, w: 0.45, h: 0.45,
      fontSize: 14, fontFace: FONT_HEAD, color: C.ink, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
    slide.addText(step.title, {
      x: x + 0.75, y: y + 0.15, w: w - 0.9, h: 0.28,
      fontSize: 12.5, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
      margin: 0,
    });
    if (step.time) {
      slide.addText("⏱ " + step.time, {
        x: x + 0.75, y: y + 0.42, w: w - 0.9, h: 0.22,
        fontSize: 9, fontFace: FONT_BODY, color: C.inkLight, italic: true,
        margin: 0,
      });
    }
    if (step.code) {
      addCodeBlock(slide, x + 0.2, y + 0.7, w - 0.4, h - 0.85,
        step.code, step.codeFontSize || 9);
    }
  }

  // ---------- addMCQ ----------
  // Builds a complete MCQ slide. Pre-highlights the correct answer in green.
  //   qNum: question number (1, 2, 3...)
  //   questionText: the question
  //   options: array of 4 strings (A, B, C, D)
  //   answer: "A" | "B" | "C" | "D"
  //   explanation: text for the WHY strip
  //   sectionLabel: e.g. "QUESTION 1" (defaults to "QUESTION ${qNum}")
  function addMCQ(slide, qNum, questionText, options, answer, explanation, sectionLabel) {
    addSectionBadge(slide, "⚡ " + (sectionLabel || `QUESTION ${qNum}`));
    addYellowUnderline(slide, 0.5, 1.0, 5.5);
    addTitle(slide, `⚡ Quiz Time — Question ${qNum} of 5`, "");

    // Question card
    addCard(slide, 0.5, 1.85, 12.3, 1.05, { line: C.purpleDeep, lineWidth: 1.5 });
    slide.addText("THE QUESTION", {
      x: 0.7, y: 1.95, w: 11.9, h: 0.25,
      fontSize: 9.5, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
      charSpacing: 1.5, margin: 0,
    });
    slide.addText(questionText, {
      x: 0.7, y: 2.2, w: 11.9, h: 0.65,
      fontSize: 13, fontFace: FONT_BODY, color: C.ink, margin: 0,
    });

    // Options grid 2x2
    const labels = ["A", "B", "C", "D"];
    options.forEach((opt, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.25;
      const y = 3.05 + row * 1.4;
      const isAnswer = labels[i] === answer;
      addCard(slide, x, y, 6.05, 1.25, {
        line: isAnswer ? C.greenDeep : C.cardLine,
        lineWidth: isAnswer ? 2 : 1,
        fill: isAnswer ? C.greenSoft : C.bg,
      });
      slide.addShape(pres.shapes.OVAL, {
        x: x + 0.2, y: y + 0.35, w: 0.55, h: 0.55,
        fill: { color: isAnswer ? C.greenDeep : C.purpleSoft },
        line: { color: isAnswer ? C.greenDeep : C.purple, width: 1 },
      });
      slide.addText(labels[i], {
        x: x + 0.2, y: y + 0.35, w: 0.55, h: 0.55,
        fontSize: 18, fontFace: FONT_HEAD,
        color: isAnswer ? C.bg : C.purpleDeep, bold: true,
        align: "center", valign: "middle", margin: 0,
      });
      slide.addText(opt, {
        x: x + 0.85, y: y + 0.1, w: 5.05, h: 1.05,
        fontSize: 11.5, fontFace: FONT_BODY, color: C.ink,
        valign: "middle", margin: 0,
      });
      if (isAnswer) {
        slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
          x: x + 5.0, y: y + 0.05, w: 0.95, h: 0.32,
          fill: { color: C.greenDeep }, line: { color: C.greenDeep },
          rectRadius: 0.12,
        });
        slide.addText("✓ ANSWER", {
          x: x + 5.0, y: y + 0.05, w: 0.95, h: 0.32,
          fontSize: 9, fontFace: FONT_HEAD, color: C.bg, bold: true,
          align: "center", valign: "middle", margin: 0, charSpacing: 0.5,
        });
      }
    });

    // Explanation strip
    addCard(slide, 0.5, 5.95, 12.3, 1.05,
      { line: C.yellowDeep, lineWidth: 1.5, fill: C.yellowSoft });
    slide.addText("WHY", {
      x: 0.7, y: 6.05, w: 11.9, h: 0.25,
      fontSize: 9.5, fontFace: FONT_HEAD, color: C.purpleDeep, bold: true,
      charSpacing: 1.5, margin: 0,
    });
    slide.addText(explanation, {
      x: 0.7, y: 6.3, w: 11.9, h: 0.65,
      fontSize: 11.5, fontFace: FONT_BODY, color: C.ink, italic: true, margin: 0,
    });

    addFooter(slide);
  }

  // ---------- addScoreCard ----------
  // One quadrant of a quiz scoreboard.
  // tier: { score, title, icon, desc, color, fill }
  function addScoreCard(slide, x, y, w, h, tier) {
    addCard(slide, x, y, w, h, {
      line: tier.color, lineWidth: 1.75,
      fill: tier.fill || C.bg,
    });
    slide.addText(tier.icon, {
      x: x + 0.2, y: y + 0.2, w: 1.0, h: 1.0,
      fontSize: 38, align: "center", valign: "middle", margin: 0,
    });
    slide.addText(tier.score, {
      x: x + 1.3, y: y + 0.1, w: w - 1.5, h: 0.5,
      fontSize: 22, fontFace: FONT_HEAD, color: tier.color, bold: true,
      margin: 0,
    });
    slide.addText(tier.title, {
      x: x + 1.3, y: y + 0.55, w: w - 1.5, h: 0.35,
      fontSize: 14, fontFace: FONT_HEAD, color: C.ink, bold: true, margin: 0,
    });
    slide.addText(tier.desc, {
      x: x + 1.3, y: y + 0.9, w: w - 1.5, h: 0.45,
      fontSize: 11, fontFace: FONT_BODY, color: C.inkSoft, italic: true,
      margin: 0,
    });
  }

  // ---------- finalize ----------
  // Write the deck. Returns the promise.
  function finalize(outputPath) {
    return pres.writeFile({ fileName: outputPath })
      .then((f) => { console.log(`✓ Wrote: ${f}`); return f; })
      .catch((e) => { console.error("Write failed:", e); throw e; });
  }

  // ---------- exports ----------
  return {
    pres,
    C, FONT_HEAD, FONT_BODY, FONT_MONO,
    newSlide,
    addFooter,
    addTitle,
    addSectionBadge,
    addCard,
    addYellowUnderline,
    addCallout,
    addCodeBlock,
    addTimePill,
    addNumberedStep,
    addMCQ,
    addScoreCard,
    finalize,
    getSlideNum: () => slideNum,
  };
}

module.exports = { init, C, FONT_HEAD, FONT_BODY, FONT_MONO };
