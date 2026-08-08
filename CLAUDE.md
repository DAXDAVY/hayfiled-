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

- Site: Northwind Titan Gas Plant, Jal, NM. Owner: Azota Gas Processing, Ltd.
- Key parties: Gallup (contractor), WIC (inspection), M4 (millwright/alignment),
  OPF = Optimized Process Furnaces (hot oil heater vendor, Chanute, KS).
- Hot oil heaters: OPF Item H-49200, dwg J251307, P.O. 24250-133. The Rev 1 GA
  set contains no shell bolt-up torque/sequence; the erection manual must come
  from OPF.
- "Kodiak units" are compressor/generator packages in commissioning prep.
