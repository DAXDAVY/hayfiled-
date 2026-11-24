// Titan 1 VRU / Flare — Chief Inspector report builder (Word .docx)
//
// Usage:
//   node build_report.js daily-template  <out.docx>   blank daily template
//   node build_report.js weekly-template <out.docx>   blank weekly template
//   node build_report.js <report.json>   <out.docx>   filled report from data
//
// report.json shape: see dailyTemplate() / weeklyTemplate() below. Every
// section is { heading, paragraphs?, bullets?, table?: { columns:[[title,widthPct]], rows:[[cell...]] } }.
// A table cell may be a string or { chip: "ok"|"open"|"block", text }.

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, PageNumber,
  VerticalAlign, TabStopType,
} = require("docx");

// ---------- Brand ----------
const AUTHOR = { name: "Davy Francis", title: "Chief Inspector" };
const PROJECT = {
  name: "Titan Plant 1 Flare Addition — VRU / Flare FL-12100",
  client: "MPLX", engineer: "Tegre", number: "NWM6010626",
  site: "Titan Plant 1 Gas Plant", vendor: "Encore Thermo Engineering",
};
const NAVY = "1F3A5F", AMBER = "C9831A", INK = "222222", GREY = "6B7280",
  RULE = "D5DAE1", BAND = "EEF2F6", FONT = "Calibri";
const W = 10080; // content width (Letter, 0.75" margins) in DXA
const CHIP = {
  ok: { fill: "DCEFE1", color: "1E6B3A" },
  open: { fill: "FDF0D5", color: "8A5A00" },
  block: { fill: "F8DADA", color: "9B1C1C" },
};

// ---------- Helpers ----------
const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 20, bold: o.bold,
  italics: o.italics, color: o.color || INK, allCaps: o.caps, characterSpacing: o.spacing });
const isGuide = (t) => typeof t === "string" && t.startsWith("[") && t.endsWith("]");
const para = (text, o = {}) => new Paragraph({
  spacing: { before: 0, after: o.after ?? 80, line: 276 }, alignment: o.align,
  children: [run(text, { ...o, italics: o.italics || isGuide(text), color: isGuide(text) ? GREY : o.color })],
});
const border = (color = RULE, size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allBorders = (b) => ({ top: b, bottom: b, left: b, right: b });

function cell(content, width, o = {}) {
  let children, fill = o.fill;
  if (content && typeof content === "object" && content.chip) {
    const c = CHIP[content.chip] || CHIP.open;
    fill = c.fill;
    children = [para(content.text, { bold: true, color: c.color, size: 17, after: 0, align: AlignmentType.CENTER })];
  } else {
    const lines = String(content ?? "").split("\n");
    children = lines.map((l) => para(l, { size: o.size || 18, bold: o.bold, color: o.color, after: 0, align: o.align }));
  }
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    shading: fill ? { fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    borders: o.borders || allBorders(border()), children,
  });
}

function table(columns, rows) {
  const widths = columns.map(([, pct]) => Math.round((W * pct) / 100));
  widths[widths.length - 1] += W - widths.reduce((a, b) => a + b, 0);
  const head = new TableRow({ tableHeader: true, cantSplit: true, children: columns.map(([t], i) =>
    cell(t, widths[i], { fill: NAVY, color: "FFFFFF", bold: true, size: 17 })) });
  const body = rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) =>
    cell(c, widths[i], { fill: ri % 2 ? "F7F9FB" : undefined })) }));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: [head, ...body] });
}

function sectionHeading(n, text) {
  return new Paragraph({
    keepNext: true, spacing: { before: 280, after: 120 },
    border: { bottom: border(AMBER, 12) },
    children: [run(String(n).padStart(2, "0") + "   ", { bold: true, color: AMBER, size: 24 }),
      run(text, { bold: true, color: NAVY, size: 24, caps: true, spacing: 20 })],
  });
}

function masthead(r) {
  const half = W / 2;
  const top = new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [half, half],
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: half, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
        borders: allBorders(noBorder), margins: { top: 220, bottom: 220, left: 240, right: 120 }, verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({ spacing: { after: 40 }, children: [run(AUTHOR.name.toUpperCase(), { bold: true, color: "FFFFFF", size: 30, spacing: 30 })] }),
          new Paragraph({ spacing: { after: 0 }, children: [run(AUTHOR.title, { color: "F2C879", size: 20 }),
            run("   |   " + PROJECT.client + " — " + PROJECT.site, { color: "C9D3E0", size: 18 })] }),
        ] }),
      new TableCell({ width: { size: half, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
        borders: allBorders(noBorder), margins: { top: 220, bottom: 220, left: 120, right: 240 }, verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, children: [run(r.title, { bold: true, color: "FFFFFF", size: 26, caps: true, spacing: 20 })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [run(r.reportNo, { color: "F2C879", size: 20, bold: true })] }),
        ] }),
    ] })],
  });
  const q = W / 4;
  const info = (pairs) => new TableRow({ children: pairs.flatMap(([k, v]) => [
    cell(k, q, { fill: BAND, bold: true, size: 16, color: NAVY, borders: allBorders(border("FFFFFF", 8)) }),
    cell(v, q, { size: 18, borders: allBorders(border("FFFFFF", 8)) })]) });
  const grid = new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [q, q, q, q],
    rows: [
      info([["PROJECT", PROJECT.name], ["REPORT DATE", r.date]]),
      info([["CLIENT / ENGINEER", `${PROJECT.client} / ${PROJECT.engineer}`], [r.type === "weekly" ? "PERIOD" : "WEATHER", r.type === "weekly" ? r.period : r.weather]]),
      info([["PROJECT NO.", PROJECT.number], [r.type === "weekly" ? "WEEK NO." : "SHIFT / HOURS", r.type === "weekly" ? r.weekNo : r.shift]]),
      info([["CONTRACTOR", r.contractor], ["PREPARED BY", `${AUTHOR.name}, ${AUTHOR.title}`]]),
    ],
  });
  return [top, new Paragraph({ spacing: { after: 60 }, children: [] }), grid];
}

function signOff(r) {
  const half = W / 2;
  const line = (label, name) => new TableCell({
    width: { size: half, type: WidthType.DXA }, borders: allBorders(noBorder), margins: { top: 0, bottom: 0, left: 0, right: 360 },
    children: [
      new Paragraph({ spacing: { before: 480, after: 40 }, border: { bottom: border(INK, 6) }, children: [] }),
      para(label, { size: 16, color: GREY, caps: true, after: 0 }),
      para(name, { size: 18, bold: true, after: 0 }),
    ] });
  return [
    new Paragraph({ keepNext: true, spacing: { before: 360, after: 0 }, children: [] }),
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [half, half], rows: [new TableRow({ cantSplit: true, children: [
      line("Prepared by — signature / date", `${AUTHOR.name}, ${AUTHOR.title}`),
      line("Received by — signature / date", r.receivedBy || "MPLX Project Representative"),
    ] })] }),
  ];
}

function build(r) {
  const body = [...masthead(r)];
  r.sections.forEach((s, i) => {
    body.push(sectionHeading(i + 1, s.heading));
    (s.paragraphs || []).forEach((p) => body.push(para(p)));
    (s.bullets || []).forEach((b) => body.push(new Paragraph({ numbering: { reference: "bul", level: 0 },
      spacing: { after: 60, line: 264 }, children: [run(b, { italics: isGuide(b), color: isGuide(b) ? GREY : INK })] })));
    if (s.table) body.push(table(s.table.columns, s.table.rows));
    if (s.note) body.push(para(s.note, { size: 16, color: GREY, italics: true, after: 0 }));
  });
  body.push(...signOff(r));

  const header = new Header({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: W }], border: { bottom: border(RULE, 4) }, spacing: { after: 120 },
    children: [run(`${PROJECT.name}`, { size: 16, color: GREY }), run(`\t${r.title}  ·  ${r.reportNo}`, { size: 16, color: NAVY, bold: true })],
  })] });
  const footer = new Footer({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: W }], border: { top: border(RULE, 4) }, spacing: { before: 80 },
    children: [run(`${AUTHOR.name}  |  ${AUTHOR.title}  |  ${PROJECT.client} ${PROJECT.site}`, { size: 16, color: GREY }),
      new TextRun({ font: FONT, size: 16, color: GREY, children: ["\tPage ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES] })],
  })] });

  return new Document({
    creator: AUTHOR.name, title: `${r.title} ${r.reportNo}`,
    styles: { default: { document: { run: { font: FONT, size: 20, color: INK } } } },
    numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "▪",
      alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } }, run: { color: AMBER } } }] }] },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 },
      margin: { top: 1080, bottom: 1080, left: 1080, right: 1080, header: 500, footer: 500 } } },
      headers: { default: header }, footers: { default: footer }, children: body }],
  });
}

// ---------- Templates ----------
const G = (t) => `[${t}]`;
function dailyTemplate() {
  return {
    type: "daily", title: "Daily Chief Inspector Report", reportNo: "CIR-D-YYYY-MM-DD",
    date: "[Day, Month DD, YYYY]", weather: "[Conditions, temp °F, wind direction]", shift: "[07:00–17:30 CT]",
    contractor: "[Contractor name — Superintendent]",
    sections: [
      { heading: "Summary of the Day", paragraphs: [G("Three to five sentences: what was accomplished, what is holding work up, and what the client needs to know today.")] },
      { heading: "Safety & H₂S", table: { columns: [["Item", 30], ["Status", 14], ["Details", 56]], rows: [
        ["JSA / muster point & wind direction reviewed", { chip: "ok", text: "YES" }, G("Time, who led it")],
        ["H₂S alarms (area or personal)", { chip: "ok", text: "NONE" }, G("Time, location, stop-work duration, MPLX all-clear")],
        ["Incidents / near misses / first aid", { chip: "ok", text: "NONE" }, G("Describe")],
        ["Site orientations (08:30 / 12:30 CT)", { chip: "open", text: "—" }, G("Number of new workers oriented")],
        ["Permits / LOTO / gas-free tests", { chip: "open", text: "—" }, G("Permit numbers, tie-in isolations")],
      ] } },
      { heading: "Manpower & Equipment", table: { columns: [["Company / Craft", 34], ["Count", 12], ["Assigned Task", 54]], rows: [
        [G("Contractor — Supervision"), "", ""], [G("Welders"), "", ""], [G("Fitters / Helpers"), "", ""],
        [G("Civil / Concrete"), "", ""], [G("Electricians"), "", ""], [G("Safety Representative"), "", ""],
        [{ chip: "ok", text: "TOTAL HEADCOUNT" }, "", G("Major equipment on site: cranes, welding rigs, air trailer")],
      ] } },
      { heading: "Work Performed by Area", table: { columns: [["Area", 20], ["Work Performed Today", 60], ["Status", 20]], rows: [
        ["Civil / Foundations", G("Flare foundation, guy wire foundations, PS-101–105 piers, camera pier, pads"), { chip: "open", text: "IN PROGRESS" }],
        ["Structural Steel", G("Platform A, valve access platform B, pipe supports"), { chip: "open", text: "—" }],
        ["Piping", G("Line numbers, spools fabricated / erected, tie-ins"), { chip: "open", text: "—" }],
        ["Flare Erection", G("Assembly, lift plan, guywires, verticality"), { chip: "open", text: "—" }],
        ["Electrical & Controls", G("Ignition panel, Type-K, 120 VAC, camera, blower"), { chip: "open", text: "—" }],
      ] } },
      { heading: "Weld Production & NDE", table: { columns: [["Line / Iso", 22], ["Welders", 10], ["Welds", 10], ["Weld Inches", 13], ["RT Shots", 11], ["Rejects", 10], ["Stencils / Remarks", 24]], rows: [
        [G("8\"-FL-12100-151S"), "", "", "", "", "", ""], ["", "", "", "", "", "", ""],
        [{ chip: "ok", text: "DAY TOTAL" }, "", "", "", "", "", G("Cumulative: __ of 137 welds")],
      ] }, note: "RT requirement: 20% per line. Reader sheets to be attached to the daily package." },
      { heading: "Inspections, Tests & Hold Points", table: { columns: [["Inspection / Test", 36], ["Result", 14], ["Witness / Reference", 50]], rows: [
        [G("e.g., Rebar & anchor bolt inspection — flare foundation"), { chip: "ok", text: "ACCEPT" }, G("Inspector, drawing TTN1-FDN-0012-VRU")],
        [G("e.g., Concrete placement — slump / air / cylinders"), { chip: "open", text: "PENDING" }, G("Test lab, CY placed, cylinder set no.")],
      ] } },
      { heading: "Materials & Deliveries", bullets: [G("Material received, MTR / NACE MR0175 check for 151S, damage, BOM cross-reference"), G("Theft / security observations")] },
      { heading: "Issues, Delays, RFIs & Change Orders", table: { columns: [["Ref.", 10], ["Issue", 50], ["Impact", 20], ["Status", 20]], rows: [
        [G("RFI-01"), G("Description, documents referenced"), G("Hours / scope"), { chip: "open", text: "OPEN" }],
        [G("Standby"), G("Plant / system down — start and finish times"), "", { chip: "block", text: "STANDBY" }],
      ] } },
      { heading: "Correspondence", table: { columns: [["Time", 12], ["Sent / Received", 14], ["From → To", 26], ["Subject / Key Point", 48]], rows: [
        [G("hh:mm"), G("Received"), G("Name → Name"), G("Subject and decision / request")],
      ] } },
      { heading: "Open Action Items", table: { columns: [["#", 6], ["Action", 50], ["Owner", 16], ["Due", 14], ["Status", 14]], rows: [
        ["1", G("Action item carried forward or new"), G("Owner"), G("MM/DD"), { chip: "open", text: "OPEN" }],
      ] }, note: "Items carry forward daily; completed items show DONE for one report, then drop. Numbers are never reused." },
      { heading: "Plan for Next Work Day", bullets: [G("Planned work by area, expected headcount, inspections requested, deliveries")] },
    ],
  };
}

function weeklyTemplate() {
  return {
    type: "weekly", title: "Weekly Chief Inspector Report", reportNo: "CIR-W-YYYY-MM-DD",
    date: "[Week ending Month DD, YYYY]", period: "[Sat MM/DD – Fri MM/DD]", weekNo: "[Week # of project]",
    contractor: "[Contractor name — Superintendent]",
    sections: [
      { heading: "Executive Summary", paragraphs: [G("One paragraph for management: overall progress, schedule outlook against the target completion, top risks, and decisions needed from MPLX.")] },
      { heading: "Key Metrics", table: { columns: [["Metric", 40], ["This Week", 20], ["To Date", 20], ["Trend", 20]], rows: [
        ["Average daily headcount", "", "", ""], ["Welds completed (of 137)", "", "", ""],
        ["Weld inches", "", "", ""], ["RT shots / reject rate", "", "", ""], ["Safety: incidents / H₂S alarms", "", "", { chip: "ok", text: "ON TARGET" }],
      ] } },
      { heading: "Progress by Area", table: { columns: [["Area", 20], ["Accomplished This Week", 50], ["% Complete", 12], ["Status", 18]], rows: [
        ["Civil / Foundations", "", "", { chip: "open", text: "—" }], ["Structural Steel", "", "", { chip: "open", text: "—" }],
        ["Piping", "", "", { chip: "open", text: "—" }], ["Flare Erection", "", "", { chip: "open", text: "—" }],
        ["Electrical & Controls", "", "", { chip: "open", text: "—" }], ["Testing & Turnover", "", "", { chip: "open", text: "—" }],
      ] } },
      { heading: "Safety & H₂S Summary", bullets: [G("Alarms, stop-work events, orientations, fit testing, air trailer inspection, observations")] },
      { heading: "Quality, NDE & Hydrotest", bullets: [G("RT results by line, hydrotest packages submitted (24 hr before test), bolt-up / torque records, NACE MTRs, open NCRs")] },
      { heading: "RFIs & Discrepancies", table: { columns: [["Ref.", 10], ["Subject", 50], ["Responsible", 18], ["Status", 22]], rows: [
        [G("RFI-01"), G("Flare model / height EDX vs ENV — confirm with Encore"), G("Tegre / Encore"), { chip: "open", text: "OPEN" }],
      ] } },
      { heading: "Change Orders", table: { columns: [["CO / FCO No.", 13], ["Description / Reason", 37], ["Requested By", 14], ["Est. Hours / Cost", 14], ["Date", 10], ["Status", 12]], rows: [
        [G("CO-01"), G("Out-of-scope work, cause, drawing / RFI reference"), G("Name"), G("hrs / $"), G("MM/DD"), { chip: "open", text: "PENDING" }],
        [{ chip: "ok", text: "WEEK TOTAL" }, G("Approved __ · Pending __ · Rejected __"), "", "", "", ""],
      ] }, note: "No out-of-scope work proceeds until the change is discussed and approved by MPLX. Write \"No change orders this week\" if none." },
      { heading: "Standby Time", table: { columns: [["Date", 10], ["Start", 9], ["Finish", 9], ["Hours", 9], ["Crew Size", 10], ["Man-Hours", 11], ["Cause (plant / system down, weather, permit)", 30], ["Verified By", 12]], rows: [
        [G("MM/DD"), G("hh:mm"), G("hh:mm"), "", "", "", G("Cause and who called the standby"), G("Name")],
        [{ chip: "block", text: "WEEK TOTAL" }, "", "", "", "", "", G("Total standby hours and man-hours this week"), ""],
      ] }, note: "Start and finish times are recorded as reported by the contractor and confirmed with site representatives. Write \"No standby time this week\" if none." },
      { heading: "Correspondence Log", table: { columns: [["Date", 12], ["Sent / Received", 14], ["From → To", 26], ["Subject / Outcome", 48]], rows: [
        [G("MM/DD"), "", "", ""],
      ] } },
      { heading: "Action Item Register", table: { columns: [["#", 6], ["Action", 50], ["Owner", 16], ["Due", 14], ["Status", 14]], rows: [
        ["1", G("Consolidated from daily reports, meetings and emails"), G("Owner / TBD"), G("MM/DD"), { chip: "open", text: "OPEN" }],
      ] } },
      { heading: "Two-Week Look Ahead", table: { columns: [["Week", 16], ["Planned Work", 54], ["Manpower", 12], ["Constraints", 18]], rows: [
        [G("Next week"), "", "", ""], [G("Following week"), "", "", ""],
      ] } },
    ],
  };
}

// ---------- CLI ----------
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error("usage: node build_report.js <daily-template|weekly-template|data.json> <out.docx>"); process.exit(1); }
const data = src === "daily-template" ? dailyTemplate() : src === "weekly-template" ? weeklyTemplate()
  : JSON.parse(fs.readFileSync(src, "utf8"));
Packer.toBuffer(build(data)).then((buf) => { fs.writeFileSync(out, buf); console.log("wrote " + out); });
