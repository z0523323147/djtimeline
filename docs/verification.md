# Verification — 2026-10-11

E9-S1–S5 are implemented in the shared Astro/Svelte app. One proportional time overview sits above a chronological genre sequence and the track workspace. Both outputs use the same components and styles.

## Local checks

- Windows, Node 24.14.1, pinned dependencies and lockfile. No new dependency.
- Astro and Svelte: zero errors/warnings; three informational clipboard deprecation hints.
- Website build and self-contained offline build pass.
- 16 Node model/packaging tests pass. The example retains 126 tracks, 25 blocks, 26 sections, 42 downloads, 25 peaks, and 2 ideas.
- 54 Chromium workflow tests pass: hosted and direct-file outputs at 1280×900, 390×844, and 1280×600.
- Checks cover all 26 ordered genre controls, full label fit, all 11 hip-hop changes, both ruler endpoints, non-overlapping annotations, header alignment, no timeline overflow, keyboard selection, and coordinated overview highlighting.
- Import/cancel, corrections/reload, encoded Google search, combined filters, corrected copy, clipboard fallback/failure, storage denial, hostile text, repeated markers, and exact-source jumps remain covered. The desktop source-time jump regression was fixed by revealing the track workspace for explicit track jumps.
- Enlarged-layout checks use half-width/half-height CSS viewports, equivalent to the reflow space at 200% browser zoom. They check full labels, page overflow, keyboard navigation, and long imported genres. This is a reflow simulation, not a native browser-zoom or screen-reader audit.
- Offline contexts disable networking and audit requests across all workflows. No network/sibling assets or page errors were observed. Google links are checked without navigating away.
- Repeated offline builds produce identical 78,028-byte files. SHA-256: ca360b912ba113b4bb3b8cdd75b50d644c7879c187f2bdce9dddb76225eb24cc.

## Representation spike and measurements

Run `node --experimental-strip-types scripts/measure-timeline.mjs` with the built website served on port 4180. It measures actual system-font widths, renders disposable alternatives, removes them, and records the production geometry in [timeline-layout-metrics.json](timeline-layout-metrics.json). These prototypes are a bounded layout comparison, not three maintained applications.

- At 1280×900 and 1280×600: the proportional full-name/time prototype requires seven duration rows plus an open-ended final cap row. Staggered genre labels require five lanes. The selected wrapping sequence uses three rows, matching the area lower bound calculated from its rendered control widths. All 26 controls remain present.
- At 390×844: proportional labels require fourteen duration rows plus the final cap row; staggered genre labels require nine lanes. Wrapping uses seven rows, matching the measured control-area lower bound. The older nine-row phone chart used an artificial 1016px width; this comparison uses the available 332px and needs no panning.
- Minimum controls: desktop 64×44px; phone 79.25×48px. Label width comes from text space, not elapsed duration. Small mobile ordinals sit in button corners so they do not force Hip-hop onto another line.
- Hip-hop annotations use three desktop lanes and five phone lanes, packed with actual 12px system-font measurements. No label overlap was detected in the browser checks.
- Timeline overflow: none in either axis at all three normal-size viewports. Title and legend share a row at desktop and 390px. The first track and its actions are visible initially at 1280×900. Phone/short users reach tracks through normal page scrolling; selecting a section brings the workspace into view.
- The original 240–300px desktop panel-height goal was not achieved: the complete region measures approximately 436px on desktop and 704px on phones. Keeping all labels, switch times, and large controls takes precedence over a fixed panel height. The initial genre-row goals were achieved. Larger imported sets extend normal page flow.

## Library decision

The bounded API comparison used the requirements and primary documentation linked in plan.md. D3's `scaleLinear().domain([start,end]).range([0,width]).clamp(true)` supplies the same two-endpoint numeric mapping as the small `position` helper. The model test verifies midpoint and endpoint proportionality through the 12-hour rollover. D3 tick generation would still need the app's source-aware tick suppression, explicit endpoints, and 30/60-minute labels. It would not remove measured annotation packing or native button layout. Retain the existing helper; no D3 package was installed or benchmarked.

LayerCake's composition, vis-timeline's scheduler/panning, and ECharts' custom series do not eliminate the custom labels, focus, source uncertainty, or control wrapping required here. Their documented capabilities remain candidates for future scheduling/analytics features. No runtime or package-size comparison against those libraries is claimed.

The final offline file is 1,696 bytes smaller than the previous 79,724-byte build under the same packaging settings. This is a measured whole-app difference after markup/CSS changes, not an attributed library performance advantage.

## Timing and visual evidence

The overview retains proportional diagram positions; source evidence supplies the switch text. Six hip-hop entries and five exits are visible. Entries inside 2:07–2:15 and 2:40–2:50 retain those ranges and dashed interval markers. Exact changes use crisp markers. The final entry is 4:00, with an arrow and no inferred exit or duration. Both screen-reader description and button names expose timing and direction.

Selecting a genre illuminates its button and its estimated overview interval, then focuses the correct track heading. Full source time/range remains in the track heading and each button's accessible name/title. English, Hebrew, and Russian track titles retain natural direction with a shared left alignment.

Refreshed and visually reviewed: party-map-preview.png, party-map-mobile.png, party-map-genre-details.png, and party-map-language-alignment.png. The latter shows the selected hip-hop tracks in the complete page.

Other browsers may restrict file-origin storage/clipboard differently; the app reports session-only saves or copy failure. Native screen-reader review, quota-specific testing, import preview/restore, portable export, and shortcuts remain in the backlog. GitHub Actions is configured; local results do not imply remote CI passed. No hosting deployment is configured.

All tracks follow-up: six additional workflow checks verify 126 tracks in source order, time/genre tags, filters and Reset preserving all-track scope, corrected copy/search, return to a selected section, and import resetting the scope. A plain dotted-outline explanation appears only when the existing timing area is expanded. Desktop proof: party-map-all-tracks.png.
