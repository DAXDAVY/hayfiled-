# Titan 2 Project — Working Notes for Claude

## Daily Construction Coordinator Report

The user turns in a daily report for the Titan 2 project. When asked for the
daily report (or given a day's notes with no other instruction), ALWAYS use the
template at `templates/daily-coordinator-report-template.html`. A completed
example is at `templates/daily-coordinator-report-2026-08-08-example.html`.

Rules:

1. Keep the template's structure, CSS, and visual style exactly as-is; fill in
   the `{{PLACEHOLDERS}}`. Report number is `DR-YYYY-MM-DD`.
2. Section order is fixed: masthead, Summary of the Day, Work Performed /
   Progress Today, Inspections & Tests, Issues / Delays, Open Action Items,
   Plan for Next Work Day, footer.
3. Carry the full Open Action Items register forward from the previous day's
   report. Show newly completed items as Done (`ok` chip) for one report, then
   drop them. Add new items at the bottom with the next number — never renumber.
4. Fill Weather and Crews On Site from the notes; write "Not recorded" if the
   notes don't say.
5. Deliverables: publish as an artifact page AND generate a PDF named
   `Titan2_Daily_Report_<YYYY-MM-DD>.pdf` (same headless-Chromium print recipe
   as the weekly report below), then send it to the user.

## Weekly Construction Coordinator Report

When asked to produce the weekly construction coordinator report (from meeting
notes, task reviews, or similar source documents), ALWAYS use the template at
`templates/weekly-coordinator-report-template.html`. A completed example is at
`templates/weekly-coordinator-report-2026-08-08-example.html`.

Rules:

1. Keep the template's structure, CSS, and visual style exactly as-is. Fill in
   the `{{PLACEHOLDERS}}`; add one numbered section per active work area.
2. Section order is fixed: masthead, Executive Summary, numbered work-area
   sections, Action Item Register, Look Ahead, footer.
3. Consolidate ALL to-do/action items from every source document into the
   single Action Item Register table. Carry forward unresolved items from the
   previous week's report when available. Owners not named in the sources are
   marked TBD.
4. Status chips: `ok` = on track/complete, `warn` = open/awaiting, `block` =
   blocked. Use `block` only when work genuinely cannot proceed.
5. Keep drawing numbers, item numbers, P.O. numbers, and dates in
   `<span class="mono">`.
6. Deliverables: publish as an artifact page AND generate a PDF (headless
   Chromium print: wrap the file with `<!doctype html><html><head>` ... , then
   `/opt/pw-browsers/chromium --headless --no-sandbox --disable-gpu
   --no-pdf-header-footer --print-to-pdf=...`). Name the PDF
   `Titan2_Construction_Coordinator_Report_<YYYY-MM-DD>.pdf` and send it to
   the user.

## Project context

- Site: MPLX Titan Gas Plant, Jal, NM. Owner: Azota Gas Processing, Ltd.
- Key parties: Gallup (contractor), WIC (inspection), M4 (millwright/alignment),
  OPF = Optimized Process Furnaces (hot oil heater vendor, Chanute, KS).
- Hot oil heaters: OPF Item H-49200, dwg J251307, P.O. 24250-133. The Rev 1 GA
  set contains no shell bolt-up torque/sequence; the erection manual must come
  from OPF.
- "Kodiak units" are compressor/generator packages in commissioning prep.

## Titan 1 VRU / Flare — Chief Inspector Reports (Davy Francis)

Separate project from Titan 2: Titan Plant 1 Closed Vent System Modifications —
Flare Construction (flare FL-12100), client MPLX, engineer Tegre, project no.
NWM6010626 (SOW flags NWM6011125 mismatch). Governing scope: MPLX SOW Rev 3
(10/22/26), kept locally at `reports/sources/Titan_1_Closed_Vent_SOW_Rev_3_10.22.26.docx`
(MPLX confidential, git-ignored; never commit). The earlier
`Titan_Plant1_Flare_Scope_of_Work` is superseded; do not use it.
Key SOW Rev 3 points: authorized tie-ins only (sweep gas, enrichment gas, flare
header, flare riser, flare fuel/pilot gas; §3.1 says five, §3.1.3 says four);
Encore commissions the flare, Zeeco the camera, MPLX measurement the flare
meter; contractor does point-to-point only; contractor provides concrete
testing with results to MPLX; MPLX hold points before pours; company
inspection personnel have no contractual change authority; closeout per SOW
Close Out Documentation list.

- Word reports are built with `reports/build_report.js` (blank templates in
  `reports/templates/`). Fill a JSON with the same shape as
  `dailyTemplate()` / `weeklyTemplate()` and run
  `node reports/build_report.js data.json out.docx`.
- Daily: `Titan1_Daily_Chief_Inspector_Report_<YYYY-MM-DD>.docx`, report no.
  `CIR-D-YYYY-MM-DD`. Weekly (Saturdays, covering Sun–Sat): `Titan1_Weekly_Chief_Inspector_Report_<YYYY-MM-DD>.docx`,
  `CIR-W-YYYY-MM-DD`.
- If a daily or weekly JSON for that date already exists in `reports/data/`,
  update it with any new information; never rebuild it from scratch.
- Sources: that day's Plaud recordings (summary + to-do tabs; transcript if
  no summary), Titan 1 emails the user saves to Dropbox (check
  `/Email Attachments`, `/1 Titan 1 Flare/` and
  `/Shared Davy - Ethan/titan 1 flare project/`, incl. an email log CSV from
  `scripts/extract_titan1_flare_emails.py`), and contractor scatter sheets in
  `/Shared Davy - Ethan/titan 1 flare project/Scatter sheets/`.
- Email compilations the user uploads are kept locally in `reports/sources/`
  (git-ignored: they hold third-party contact details; never commit them).
  Contractor is West Tech Energy (Jose Salaises, Director of Operations).
  Include only emails about Titan 1 flare / VRU construction; skip admin
  (orientation certs, address-list housekeeping).
- Summarize each day's sent/received emails in the Correspondence section;
  the weekly report summarizes the week's emails in the Correspondence Log.
- Data JSON in `reports/data/`, finished .docx + .pdf in `reports/output/`.
  Each daily carries the action register from the previous day's JSON.
- Action items follow the same carry-forward rules as the Titan 2 daily report.
- West Tech's "DI" (diameter-inches) means weld inches: report it as weld
  inches and add it to the cumulative weld-inch total.
  Weld inches = welds x nominal pipe size (an 8" weld = 8 in.); partial
  inches reported for welds in progress are not added on top of the total.
- End-of-day Plaud note from Davy is the primary daily source (headcount by
  craft, work done, welds, inspections, problems, tomorrow's plan).
- Running registers in `reports/data/`, inserted automatically by
  build_report.js into every report as of its date:
  - `weld_log.json`: 7 lines / 137 welds from the IFC isometrics Rev 0 (10/7/26). Add one entry
    per day from West Tech's weld log or daily report (date, line or null,
    welds, inches, rtShots, rtRejects, welder, source). Mark a line
    `"hold": true` when it is on hold.
  - `change_orders.json`: running CO log. Add dated events and update `open`
    and `status` as things happen (first person for Davy's own actions).
- RT: MPLX radiographs 100% of welds (SOW Rev 3 sets no NDE percentage).
- West Tech's daily weld log template: `reports/templates/Titan1_Daily_Weld_Log_West_Tech.xlsx`.
- Do not track hours or man-hours (Manpower table has no Hours column).
- Write the narrative (summaries, notes) in first person, as Davy wrote it.
- Write "Not recorded" for anything the sources don't state; never invent
  headcounts, weld counts or test results.
