# Product backlog

Updated: 2026-10-12. Thirteen stories are **Done**: E7-S1–S4, E1-S1–S2, E5-S1, E8-S3, and E9-S1–S5. Cloud stories are **Todo** or **In progress** as marked; remaining refinements are **Todo**. E6-S1 is **Superseded**, not Done. Existing implemented features are documented in [plan.md](plan.md); this is future work, not a claim that those features are missing.

Priorities: **P0** = release-blocking correctness or coverage; **P1** = core usability/reliability; **P2** = release polish; **P3** = optional extension. AC = acceptance criteria. Subtasks inherit their story priority unless explicitly stated.

Shared-source foundation completed: Astro/Svelte/pnpm, both outputs, terminal and brief-section navigation, 16 Node tests, 54 browser workflow tests, and reproducibility checks. Evidence: [docs/verification.md](docs/verification.md). Remote CI is configured; local checks are recorded separately.

## E1 — Complete, usable party navigation · P0

### E1-S1 — Represent the final section in the timeline · P0 · Done

As a DJ, I want the final genre section to be reachable from the map, even when the notes do not give its ending time.

Historical evidence (fixed in shared source): `renderMap()` excludes sections whose start equals a row's end. The bundled Hip hop section at 4:00 has zero inferred duration and is available in the selector, but has no clickable chart segment.

Subtasks:

- [x] E1-S1-T1 · P0: Add an explicit terminal section/end-marker representation.
- [x] E1-S1-T2 · P0: Connect it to the existing section selection and mobile drill-down.
- [x] E1-S1-T3 · P0: Add coverage for a final section, a single time marker, and repeated timestamps.

AC:

- The supplied 4:00 Hip hop section opens `Me pregunto` directly from the timeline.
- The end marker does not invent a duration or ending time.
- Click, tap, Enter, and Space work; the selected section and focus agree.

### E1-S2 — Make short sections easy to select · P1 · Done

As a DJ using a phone, I want to choose brief genre sections without accidentally opening an adjacent section.

Historical evidence (fixed through full-size button alternatives): baseline hit areas are 44px tall, but their width follows section duration and may be only a few pixels.

Subtasks:

- [x] E1-S2-T1 · P1: Choose a non-overlapping selection approach for adjacent short sections.
- [x] E1-S2-T2 · P1: Preserve true diagram proportions and the expandable section-list alternative.
- [x] E1-S2-T3 · P1: Test rapid switches at 2:07–2:15 and 3:49–3:56 on a phone.

AC:

- Every short section has a clearly discoverable primary or adjacent control at least 44×44px.
- Hit areas cannot silently route a tap to a neighboring genre.
- Keyboard selection and the expandable section list remain usable.
- The diagram does not stretch durations merely to make buttons larger.

## E2 — Timing users can trust · P1

### E2-S1 — Explain uncertain boundaries and sparse imports · P1 · Todo

As a DJ, I want to know whether a genre switch has a recorded time or only a known time range.

Subtasks:

- [ ] E2-S1-T1 · P1: Define concise exact/range/unknown boundary labels and provenance.
- [ ] E2-S1-T2 · P1: Handle no-time and one-time imports with an honest alternate view.
- [ ] E2-S1-T3 · P1: Normalize non-divisible row bounds so displayed clock rounding is consistent.

AC:

- The 1:50 hip-hop entry and 1:57 exit remain recorded timestamps.
- The entry after tracks in the 2:07 block shows the 2:07–2:15 range, not an invented exact minute.
- A genre declaration followed by a new time marker and then its first track is described consistently with the parser's first-track boundary rule.
- One-marker or untimed notes retain all tracks and do not show invented durations.
- User copy avoids internal terms such as interpolation and equal track spacing.

### E2-S2 — Make hip-hop timing easy to inspect · P2 · Todo

As a DJ, I want a compact view of each hip-hop window and its neighboring genres.

Subtasks:

- [ ] E2-S2-T1 · P2: Pair entries with exits without losing final open-ended windows.
- [ ] E2-S2-T2 · P2: Add concise labels for adjacent genres and uncertain boundaries.
- [ ] E2-S2-T3 · P2: Verify the view remains readable without recreating the earlier dense dashboard.

AC:

- All 11 hip-hop boundary changes in the bundled set are retained.
- Each window exposes start, end or unknown end, and adjacent genre context.
- Opening a window selects its corresponding tracks.
- Mobile controls remain large and the track area stays below the timeline on the shared page.

## E3 — Recoverable imported and corrected sets · P1

### E3-S1 — Export corrected notes · P1 · Todo

As a DJ, I want to download my corrected set as text so browser storage is not my only copy.

Subtasks:

- [ ] E3-S1-T1 · P1: Design serialization that retains times, genres, order, and marker meaning.
- [ ] E3-S1-T2 · P1: Implement a local text export using current corrected titles.
- [ ] E3-S1-T3 · P1: Add export/re-import round-trip checks for mixed languages.

AC:

- The exported file includes corrected titles, not stale original names.
- Re-import retains track order, genre/time state, peak flags, download flags, and idea flags.
- Untimed boundaries remain untimed; no diagram estimate becomes source data.
- Hebrew, Russian, and English survive the round trip.

### E3-S2 — Replace and restore a set clearly · P1 · Todo

As a DJ, I want to understand what importing replaces and be able to restore the bundled set.

Subtasks:

- [ ] E3-S2-T1 · P1: Show parsed counts and a brief preview before replacing the active set.
- [ ] E3-S2-T2 · P1: Add a clear restore-example action and an export opportunity.
- [ ] E3-S2-T3 · P1: Cover cancel, invalid import, and storage failure without losing the current set.

AC:

- Cancel and invalid input leave the current notes and corrections intact.
- The dialog states that importing replaces the active set on this browser.
- Restoring the example recovers the bundled 126-track set.
- A successful import shows counts and correctly resets filters/selection.
- Replacement and restoration do not silently claim cross-device synchronization.

## E4 — Accessible, durable track workflows · P1

### E4-S1 — Verify multilingual and keyboard interactions · P1 · Todo

As a DJ, I want to read and operate the app with mixed-language titles and keyboard navigation.

Subtasks:

- [ ] E4-S1-T1 · P1: Review focus order, dialog focus restoration, and selection announcements.
- [ ] E4-S1-T2 · P1: Check Hebrew/Russian/English names, punctuation, numbers, and long titles.
- [ ] E4-S1-T3 · P1: Review color-independent meaning and controls at enlarged text sizes.

AC:

- Enter/Space activate timeline sections; focus reaches a meaningful detail heading.
- Escape cancels editing and closes the import dialog without losing the current set.
- Time strings keep LTR order while titles choose a suitable text direction.
- At 200% browser zoom, primary controls remain reachable and names do not obscure actions.
- Color is accompanied by textual labels or accessible names for hip-hop, peaks, and selection.

### E4-S2 — Make persistence failures and portability explicit · P1 · Todo

As a DJ, I want an honest saved/session-only status and corrections that never leak into another set.

Subtasks:

- [ ] E4-S2-T1 · P1: Exercise missing, corrupt, blocked, and full local storage.
- [ ] E4-S2-T2 · P1: Validate stored record shapes and scope corrections to the correct imported notes.
- [ ] E4-S2-T3 · P1: Document browser/origin limits and test a directly opened HTML file.

AC:

- Failed persistence leaves the app usable and reports session-only changes consistently.
- Corrupt stored data cannot prevent loading the bundled set.
- Corrections from set A are not applied to unrelated set B.
- Copy and Download use the current title even when durable saving fails.
- Direct-file behavior is verified separately from localhost; any browser-specific limits are documented.

## E5 — Maintainable, reproducible release · P0

### E5-S1 — Add repeatable behavior checks · P0 · Done

As a maintainer, I want checked-in tests that detect parser and workflow regressions.

Subtasks:

- [x] E5-S1-T1 · P0: Add a documented Node test runner and compact parser fixtures.
- [x] E5-S1-T2 · P0: Cover import, editing, filter combinations, copy, and encoded search links.
- [x] E5-S1-T3 · P0: Establish a repeatable browser checklist with viewport evidence.

AC:

- A documented command runs the checks from a fresh checkout with declared prerequisites.
- Tests cover inheritance, embedded parentheses, both hyphen markers, idea/peak state, rollover, empty input, and final sections.
- Tests verify outcomes instead of duplicating the parser's implementation.
- The bundled-data baseline is 126 tracks, 25 blocks, 26 sections, 42 downloads, 25 peaks, and 2 ideas.
- Browser checks include 390×844, 1280×900, and a short-height viewport, with no hidden primary controls.

### E5-S2 — Prepare one clearly identified release artifact · P2 · Todo

As a contributor, I want to know which file to modify, test, and share.

Subtasks:

- [ ] E5-S2-T1 · P2: Format the active HTML's CSS/JS for maintainability without changing behavior.
- [ ] E5-S2-T2 · P2: Decide the canonical release filename and organize historical iterations.
- [ ] E5-S2-T3 · P2: Refresh screenshots/docs and add CI/static-host checks once repository tooling exists.

AC:

- README names one active entry point and identifies historical files.
- The release still works as one standalone HTML document with no required network assets.
- Format/refactor changes pass the behavior checks.
- Screenshots match the released behavior and contain no test notes.
- Hosting preparation does not publish or alter sharing unless requested.

## E6 — Original named-set proposal · Superseded

### E6-S1 — Keep multiple named sets · P1 · Superseded by E11

The user explicitly requested multiple club plans with Supabase on 2026-10-12. Demand validation is complete as a planning decision; implementation is not Done. E11 owns stable plan identity, create/list/open/rename, import/migration and recoverable archive. E13-S3/E3-S1 own backup/export. Do not implement a second unrelated browser-only set manager from this older proposal.

## E7 — Astro/Svelte source with website and offline outputs · P0

### E7-S1 — Establish the Astro/Svelte/pnpm project · P0 · Done

As a maintainer, I want a reproducible framework project while retaining the working standalone baseline.

Subtasks:

- [x] E7-S1-T1 · P0: Resolve compatible Astro, official Svelte integration, Svelte, Vite/plugin, checking tools, and TypeScript versions against the supported Node version; pin pnpm and commit its lockfile.
- [x] E7-S1-T2 · P0: Add static Astro configuration, the root route/layout, and a Svelte root using `client:load`; guard browser-only APIs from server rendering.
- [x] E7-S1-T3 · P0: Add working dev/site/check scripts, isolate `dist/site/`, and document clean-checkout setup.

AC:

- A clean checkout installs with `pnpm install --frozen-lockfile` using the declared Node/pnpm versions.
- `pnpm dev`, `pnpm build:site`, and `pnpm check` run with declared dependencies.
- Astro owns `/`; Party/Tracks are Svelte views inside the planner rather than a separate SvelteKit router.
- Server rendering/building does not read browser storage, clipboard, or `window`.
- The existing standalone HTML remains available until migrated parity passes.

### E7-S2 — Port behavior into shared Svelte components and pure helpers · P0 · Done

As a DJ, I want the new implementation to preserve the features and layout I already accepted.

Subtasks:

- [x] E7-S2-T1 · P0: Extract parser/model/filter helpers and shared example notes; add typed state and browser adapters.
- [x] E7-S2-T2 · P0: Implement Party/Tracks views, map selection, editing, import dialog, search, and Google search links in shared Svelte components.
- [x] E7-S2-T3 · P0: Migrate or preserve storage keys/corrections and run a baseline-versus-port parity checklist.

AC:

- Bundled data retains 126 tracks, 25 blocks, 26 sections, and marker counts defined in E5-S1.
- Import, edit, reload, copy, encoded Download search, and combined filters behave equivalently in the port.
- Click/tap/keyboard selection opens the corresponding tracks and preserves focus and selected state.
- Website and offline build share the same timeline and track components. The current layout stacks timeline above tracks on all screen sizes.
- Both builds consume the same parser, state logic, components, CSS tokens, and example data.
- E1 terminal-section and narrow-target defects are fixed through their own AC; parity does not require perpetuating those defects.

### E7-S3 — Compile the shared Svelte app into one offline HTML file · P0 · Done

As a DJ, I want to open the full app without a server, network, or accompanying files.

Subtasks:

- [x] E7-S3-T1 · P0: Add the offline entry that mounts the shared Svelte root; configure Vite/Svelte to emit one IIFE with no external packages or split imports.
- [x] E7-S3-T2 · P0: Extend `build-offline.mjs` to compile and embed JavaScript/CSS/data assets safely, escaping closing tags and rejecting unresolved asset references.
- [x] E7-S3-T3 · P0: Strengthen the structural validator, prevent website/offline output deletion, and switch `build` to build both artifacts.

AC:

- `pnpm build:offline` compiles shared Svelte source and creates `dist/party-map.html`; it no longer copies the legacy implementation.
- The HTML embeds all required scripts, styles, example notes, fonts/images if used, and icons.
- No relative module resolution, hydration chunk URLs, runtime asset fetches, service worker, or CDN is required under `file://`.
- Closing-tag payloads in embedded data cannot escape into executable HTML.
- `pnpm build` produces both `dist/site/index.html` and the standalone artifact; rebuilding either target preserves the other.
- Packaging fails with an actionable error if an unresolved dependency or runtime resource remains.

### E7-S4 — Prove hosted/offline parity and build reproducibility · P0 · Done

As a maintainer, I want evidence that both outputs work, rather than assuming inlining makes them equivalent.

Subtasks:

- [x] E7-S4-T1 · P0: Add browser projects for static-host and directly opened `file://` artifacts, including blocked networking and runtime request observation.
- [x] E7-S4-T2 · P0: Exercise imports, mixed-language names, edits, selection, filters, storage failures, clipboard fallback, and encoded Google links at desktop/phone/short-height sizes.
- [x] E7-S4-T3 · P0: Add frozen-lockfile CI/build checks and a reproducibility report without machine paths or generated timestamps in the artifact.

AC:

- Required workflows pass in both outputs, with identical parser/model results.
- The offline artifact initializes and runs with networking unavailable and no local server.
- Runtime request observation shows no required network or sibling-asset requests before intentional Google navigation.
- Storage and clipboard limitations under `file://` are reported clearly rather than treated as success.
- Two builds from unchanged source, configuration, lockfile, and tool versions produce identical offline bytes, or any proven unavoidable variation is explicitly resolved before release.
- CI runs declared checks; validation is not reported as complete based only on six structural tests.

## E8 — Linear-inspired DJ interface · P1

Completed UX correction (2026-10-11): removed the redundant time/genre selector and selected-section card, kept a collapsed **Jump to a section or recorded time** fallback, and rendered continuous overview/peak bands without internal dividers. Detailed genre selection and hip-hop boundaries remain intact. E8 stories below still track the broader refinement work.


### E8-S1 — Introduce coherent tokens and calm layout hierarchy · P1 · Todo

As a DJ, I want a polished, aligned interface that stays readable and makes the music flow easy to scan.

Subtasks:

- [ ] E8-S1-T1 · P1: Define shared neutral surfaces, text/accent colors, spacing, radii, type, and focus tokens inspired by Linear's restrained interface.
- [ ] E8-S1-T2 · P1: Apply tokens to the app shell, pane headers, time labels, track rows, filters, and dialogs without changing their semantics.
- [ ] E8-S1-T3 · P1: Compare the accepted baseline and migrated design at phone, desktop, short-height, enlarged-text, and reduced-motion settings.

AC:

- Pane titles, controls, and row actions align consistently; decorative borders/colors do not compete with track titles.
- Track names remain at least 16px in the normal view and primary controls at least 44px tall.
- Hip-hop, peaks, and selection retain clear textual/accessibility meaning alongside color.
- Track space remains generous; the overview does not force the previous compressed desktop layout.
- Mobile offers full-size views rather than scaling desktop controls down.
- The design uses locally available/system fonts and embedded assets so offline output matches the site.

### E8-S2 — Refine direct actions, feedback, and keyboard navigation · P2 · Todo

As a DJ, I want fast, predictable actions without extra visual clutter or controls that disappear on touch devices.

Subtasks:

- [ ] E8-S2-T1 · P2: Standardize selected/hover/focus states, stable row actions, and non-disruptive copy/save/import feedback.
- [ ] E8-S2-T2 · P2: Add a small discoverable shortcut set for search and section navigation, with input/dialog guards and an accessible help surface.
- [ ] E8-S2-T3 · P2: Refine empty/error states and brief transitions while preserving reduced motion and keyboard focus.

AC:

- Copy, Edit, and Download remain directly accessible on phones and with keyboard focus; no hover-only action is required.
- Clicking a timeline section produces immediate selected feedback and opens the correct tracks.
- Shortcuts do not interfere with typing, browser shortcuts, or the import/editor dialog.
- Feedback states distinguish copying, saved corrections, session-only edits, and import success/failure in plain language.
- Motion honors reduced-motion preferences and never delays access to the track list.

## Recommended execution order

Next milestone: E10-S0 → E10-S1 → E11-S1 → E10-S2 → E10-S3 → E13-S1 → E11-S2 → E11-S3 → E12-S1 → E12-S2 → E13-S2 → E13-S3, with E14 QA running throughout and final E14-S3 release gates. E12-S3/E11-S4 are P2 refinements.

Earlier local refinements remain Todo and should be coordinated with the new cloud stories: E8-S1, E2-S1, E3-S1–S2, E4-S1–S2, E8-S2, E2-S2 and E5-S2. E9 is complete; E6 is superseded.

A story is Done only after its AC pass and the relevant validation evidence is recorded. Priority belongs to the work, not to the order in which its section appears here.


### E8-S3 — Timeline above tracks with readable genre bars · P1 · Done

As a DJ, I want one page with the party timeline above my tracks, clear time rulers, and an obvious selected bar.

Subtasks:

- [x] Replace desktop split and mobile tabs with a shared stacked page.
- [x] Remove the Genre details mode and inter-row genre notes.
- [x] Place genre names and recorded change times/ranges inside every bar.
- [x] Add complete estimated rulers and an open-ended final section.
- [x] Replace black selection underline with bright fill, outline, and glow.
- [x] Adapt keyboard, mobile, offline, and navigation regression checks.

AC:

- The timeline is above tracks at desktop, phone, and short viewport sizes.
- No Party/Tracks tabs or Genre details toggle appear.
- All bundled genre bars contain readable names and change times/ranges; scale endpoints cover 12:30 through 4:00.
- Selecting a bar illuminates it and opens the correct tracks below.
- Phone users can pan the timeline without page overflow; full-size navigation alternatives remain.
- Existing import/edit/copy/search and direct-file offline workflows pass.

Evidence: docs/verification.md. Wider import-preview, shortcuts, and enlarged-text work remain under the existing Todo stories.

## E9 — Complete compact timeline without internal scrolling · P1 · Done

The 2026-10-11 research strategy in plan.md supersedes E8-S3's bounded-scroll layout. That story remains Done as a historical implemented iteration. E9-S1–S4 are implemented and verified. Evidence, measured layout tradeoffs, and library decision are recorded in docs/verification.md.

### E9-S1 — Prove the compact representation and library choice · P1 · Done

As a DJ, I want to see the whole party and every genre without a crowded chart or hidden sections.

Subtasks:

- [x] E9-S1-T1 · P1: Prototype proportional bars, staggered-label bars, and the recommended proportional overview plus chronological genre sequence with the actual 26 sections.
- [x] E9-S1-T2 · P1: Measure full-name fit, row counts, annotation collisions, and 44px hit areas at desktop, phone, and short viewport sizes.
- [x] E9-S1-T3 · P1: Compare existing numeric mapping with d3-scale; assess LayerCake, vis-timeline, and ECharts against the documented scope before adding dependencies.
- [x] E9-S1-T4 · P1: Record chosen representation, rendered evidence, offline HTML byte count, and the reason for any dependency in docs/verification.md.

AC:

- The prototype retains all 26 sections and their original order, including repeated genres and the final 4:00 track.
- Two/three desktop rows and six/eight phone rows are evaluated as goals with actual font measurements; full names and readable controls take precedence over hiding content to meet a row count.
- The overview stays proportional to elapsed minutes. Genre sequence widths are text-sized and have no attached duration ruler.
- No performance or bundle-size advantage is claimed without measured evidence. No candidate is adopted solely because it can draw a timeline.

### E9-S2 — Remove chrome and render every genre without scrolling · P1 · Done

As a DJ, I want the useful timeline content to take the space currently occupied by instructions, repeated rulers, and scrolling controls.

Dependencies: E9-S1.

Subtasks:

- [x] E9-S2-T1 · P1: Remove the instruction sentence and estimated-scale/swipe footer; align title and legend in one compact normal-size header row.
- [x] E9-S2-T2 · P1: Build source-ordered genre buttons with full in-bar names, small ordinals, intrinsic wrapping, and shared selection IDs.
- [x] E9-S2-T3 · P1: Remove the 1016px chart minimum, 240px viewport limit, internal overflow, repeated detailed rulers, and obsolete styles.
- [x] E9-S2-T4 · P1: Preserve bright selection, keyboard focus, mixed-language labels, track layout, and direct actions.

AC:

- The two rejected text blocks are absent.
- Title and all three legend items share a row at 1280px and 390px normal text size; enlarged text can wrap safely.
- All 26 full genre names remain visible, clickable, and in source order without horizontal or vertical timeline scrolling.
- No Party/Tracks tabs, Genre details toggle, or black selection underline returns.
- Narrow sections have distinct controls at least 44px tall and large enough to select; no overlapping hit targets.
- The timeline does not obscure track names/actions or stretch durations under a time ruler.
- Long imported genre names wrap; larger imports can extend normal page flow.

### E9-S3 — Show every hip-hop entry/exit time in the overview · P0 · Done

As a DJ, I want to recognize immediately when hip-hop starts and finishes while viewing the complete party.

Dependencies: E9-S1; integrate selection with E9-S2. Coordinates and labels must share the parser's existing timing rules.

Subtasks:

- [x] E9-S3-T1 · P0: Derive six hip-hop windows and all eleven boundary changes from source sections, preserving final unknown end.
- [x] E9-S3-T2 · P0: Add a complete overview ruler with responsive major/minor ticks and both endpoints.
- [x] E9-S3-T3 · P0: Pack visible entry/exit labels into the minimum non-overlapping annotation lanes using measured widths.
- [x] E9-S3-T4 · P0: Render exact markers, uncertain interval markers, shared selection highlighting, and the open-ended 4:00 cap.

AC:

- All eleven hip-hop changes are visible in the top overview on desktop and phones; essential timestamps are not hover-only.
- Recorded entry/exit pairs include 1:50/1:57, 2:24/2:30, and 3:17/3:31.
- Entries within 2:07–2:15 and 2:40–2:50 show those ranges, rather than invented exact minutes; exits remain 2:15 and 3:00.
- The final entry is 4:00 with no invented exit time or duration.
- The ruler covers 12:30 through 4:00 and preserves proportional elapsed-time geometry, including rollover.
- Entry/exit direction has accessible textual meaning alongside color/glyphs.
- Labels do not overlap one another or the endpoint labels. Selecting a genre highlights its corresponding overview interval and opens the right tracks.

### E9-S4 — Verify the complete no-scroll layout in both builds · P0 · Done

As a DJ, I want the cleaner site and offline file to preserve every preparation workflow.

Dependencies: E9-S2 and E9-S3.

Subtasks:

- [x] E9-S4-T1 · P0: Add row/label completeness, ordering, overflow, annotation collision, and shared-selection regression checks.
- [x] E9-S4-T2 · P0: Run hosted/offline desktop, phone, and short-viewport workflows; verify text enlargement and keyboard access.
- [x] E9-S4-T3 · P0: Run parser/packaging tests, both builds, checks, direct-file request audit, and reproducibility.
- [x] E9-S4-T4 · P1: Refresh screenshots, README, plan status, and verification evidence; push the completed source.

AC:

- The rendered timeline has no internal scrollbar in either axis at supported normal-size viewports; its scroll dimensions match client dimensions within rounding tolerance.
- All 26 bundled section controls and all eleven overview switch labels render fully without overlap or clipping.
- At 200% zoom, controls and full labels remain accessible in normal page flow.
- Existing import/cancel, edit/save/reload, corrected copy/search, combined filters, Hebrew alignment, storage/clipboard failure, hostile text, and final-track navigation remain working.
- The offline edition requests no network or sibling assets and remains one HTML file; repeated builds are identical.
- Record achieved desktop/mobile row counts and first-track visibility instead of declaring success from code inspection alone.

### E9-S5 — Browse all tracks and explain uncertain switches · P1 · Done

- [x] Add All tracks alongside track filters, preserving original order and time/genre context.
- [x] Preserve filtering, Reset, copy/edit/search, section return, and import behavior in both builds.
- [x] Explain dotted uncertainty markers in the existing expandable timing area.

AC: All tracks reveals the full active set; the example contains 126 tracks. Filtering and Reset retain all-track scope. Clicking a timeline section restores its tracks and selection. Import starts with its first section. No selected interval is implied while browsing all tracks. Uncertain changes remain source ranges.

Evidence: 54 browser workflow checks, 16 model/packaging tests, both builds, reproducibility, and docs/verification.md.

## E10 — Supabase connection, private storage and login · P0 · Todo

Scope: authenticated cloud plans, preserving the standalone offline output. Assumptions and architecture: plan.md, Supabase club-plan roadmap. No Supabase changes have been made.

### E10-S0 — Prove email/password login for a double-click HTML file · P0 · In progress

User choices: double-click HTML with no local server; avoid Google Cloud OAuth resources. Confirmed method: email verification code. Project base URL/public key have been supplied; no session/provider is configured by this planning change.

- [ ] E10-S0-T1 · P0: Target Google Chrome with a double-click file; verify Email/signup enabled and confirmation disabled for password signup; no local server is allowed.
- [ ] E10-S0-T2 · P0: Prototype in-page email/password request/verify, file-origin Auth/API fetch, session storage/reload/refresh, invalid/expired code and denied storage/network.
- [ ] E10-S0-T3 · P0: Record supported/unsupported results and smallest alternative if needed; get the user's agreement before changing the no-server delivery or adopting a different login method.

AC: Real email/password auth produces a valid owner session in the double-click downloaded-page workflow, and subsequent authenticated Supabase fetch/reload/logout succeeds in supported browsers. No token copy/paste, embedded secret or disabled browser protection is used; entering the user's email/password is the intended flow. If safe direct-file login cannot be demonstrated, record the blocker and present concrete alternatives rather than mark the flow Done or silently introduce hosted delivery. No OAuth callback or hosted bridge is required by the proposed email/password flow; verify real signup/session behavior; mail-based verification/recovery remains later scope. The offline app remains usable throughout.

### E10-S1 — Confirm setup and separate connected/offline adapters · P0 · In progress

As a DJ, I want the downloadable connected page to use my Supabase project while retaining a usable offline edition.

Dependencies: E10-S0 for finalized auth delivery; adapter/model fixture work can proceed provisionally.

- [ ] E10-S1-T1 · P0: Use the supplied URL/public key, Chrome, reported empty database, public email/password signup and double-click/no-server delivery. Check reported SQL application and owner-isolation evidence using docs/supabase-connection.md.
- [ ] E10-S1-T2 · P0: Add ignored local environment configuration, documented public env example, pinned browser SDK and injected repository interfaces.
- [ ] E10-S1-T3 · P0: Define website, connected-single-HTML and network-free offline entry points; prepare the connected packager without duplicating planner logic.

AC: No secret/service-role key is requested or shipped. Missing cloud configuration leaves local use possible. Offline initialization makes no Supabase requests. Connected HTML bundles its assets and honestly requires internet for cloud features. Direct file email/password auth support is determined by E10-S0; any different delivery needs the user's agreement. Existing tables/providers remain untouched until their migration is reviewed.

### E10-S2 — Enforce private ownership and atomic versioned saves · P0 · In progress

Dependencies: E10-S1, E11-S1.

- [ ] E10-S2-T1 · P0: Create versioned migrations for plan metadata, document snapshots, indexes, constraints and idempotent operation receipts.
- [ ] E10-S2-T2 · P0: Configure RLS/grants and immutable ownership on every exposed resource; implement least-privileged create/save/rename operations.
- [ ] E10-S2-T3 · P0: Validate document shape/limits/UUIDs server-side, compare expected revision, and deny direct-write bypasses.

AC: A owns its plans; B and anonymous requests cannot read or mutate them using known IDs or forged owner fields. Metadata/document creation is atomic. Concurrent saves of the same revision give one success and one retained-draft conflict. Retrying the same operation yields one logical result without duplicate plans/songs. Malformed/oversized documents are rejected without partial writes. Restrict RPC execute privileges and verify any definer ownership/search_path protections with database tests.

### E10-S3 — Sign in, restore sessions and sign out safely · P0 · In progress

Dependencies: E10-S1, E10-S2.

- [ ] E10-S3-T1 · P0: Implement email/password signup/sign-in and public app-user signup with confirmation off; handle signup without a session honestly.
- [ ] E10-S3-T2 · P0: Restore/refresh sessions, handle code/callback errors and implement explicit local-session sign-out.
- [ ] E10-S3-T3 · P0: Isolate guest/account drafts and clear private UI, caches, channels and delayed results on account transitions.

AC: Real email/password signup/login/reload/logout works in Chrome from the downloaded HTML, including an ordinary recipient outside the Supabase project team. Invalid/expired login and delivery/network failures preserve local notes. Signing in alone uploads nothing. Switching to B never displays A's plans, drafts or late request/event results. Storage denial does not imply durable login/save. Login dialog supports labelled fields, keyboard, cancel/focus restoration and 44px controls. Offline HTML remains login-free.

## E11 — Multiple private club plans · P1 · Todo

This replaces the optional E6-S1 named-set proposal; demand is now explicit. Names are metadata, UUIDs are identity.

### E11-S1 — Establish stable editable documents and legacy parity · P0 · Todo

Dependencies: E10-S1's adapter contract; can proceed with fixtures while connection details are pending.

- [ ] E11-S1-T1 · P0: Define typed versioned source-event documents with stable plan/song/marker IDs and explicit timing provenance.
- [ ] E11-S1-T2 · P0: Implement DOM-free derivation into the existing timeline model; define authored exact/range/unknown boundaries and inheritance.
- [ ] E11-S1-T3 · P0: Convert legacy notes after applying title corrections, with stable retry identities and validation fixtures.

AC: Insert/rename/reorder never changes surviving song UUIDs. Conversion preserves 126 tracks/25 blocks/26 sections, flags and corrected multilingual titles. Known ranges, rollover and unknown endings stay intact; estimates never become evidence. Repeated same-genre parts do not create unexplained dividers. Empty documents are valid blank plans. Empty committed sections remain visible/selectable with stable IDs rather than being discarded by the legacy track-derived renderer. A single canonical document owns editable data; raw notes remain provenance.

### E11-S2 — Create, list, open and rename club plans · P1 · In progress

Dependencies: E10-S3, E11-S1, E13-S1.

- [ ] E11-S2-T1 · P1: Add a compact plan picker/account header and My plans dialog with metadata-only paging/search.
- [ ] E11-S2-T2 · P1: Create blank plans with required name and optional club/date; implement open/rename.
- [ ] E11-S2-T3 · P1: Scope selection/filters/loading state by stable plan identity and handle switching during pending saves.

AC: Two same-named plans keep independent songs, metadata and corrections after reload. Blank plan has Add first section/Import notes actions and no fabricated timeline. Failed loading leaves the current plan intact. Previous tracks are never shown under the next plan's name. Switching preserves or resolves pending work instead of redirecting its writes. Many plans use a paged metadata list; opening one fetches its content rather than all documents. The timeline remains the workspace rather than a new dashboard.

### E11-S3 — Import notes and migrate the current local set explicitly · P1 · Todo

Dependencies: E11-S2, E13-S1. Coordinate with E3-S2 import preview and E3-S1 export.

- [ ] E11-S3-T1 · P1: Add a parsed preview with destination/name/song/section counts and representative corrected titles.
- [ ] E11-S3-T2 · P1: Default to creating a new plan; make replacing a selected plan an explicit action.
- [ ] E11-S3-T3 · P1: Offer Save this set to my account, preserving legacy data until the server acknowledges the migrated copy.

AC: Sign-in does not silently migrate/upload. Cancel/invalid input changes nothing. Corrected copy/search titles and timing evidence survive migration. Ambiguous save retries do not duplicate imported plans. Failed import retains its recoverable draft and original destination. Replacement commits atomically; other devices cannot see half an imported plan.

### E11-S4 — Recoverably archive and restore plans · P2 · Todo

Dependencies: E11-S2, E13-S2.

- [ ] E11-S4-T1 · P2: Add named archive confirmation, archived list and restore action.
- [ ] E11-S4-T2 · P2: Synchronize archive/restore updates without exposing another account's metadata.

AC: Archiving preserves all content and can be restored. Failure leaves the active plan intact. Remote archive makes an open plan unavailable for further saves while preserving any local draft. No permanent delete is introduced in this story; direct hard-delete permissions/event handling remain separate reviewed scope.

## E12 — Create songs/sections and update the timeline immediately · P1 · Todo

### E12-S1 — Add/edit genre sections and timing evidence · P1 · Todo

Dependencies: E11-S1, E11-S2, E13-S1.

- [ ] E12-S1-T1 · P1: Build a section editor for full genre names and recorded time, known range or time not noted.
- [ ] E12-S1-T2 · P1: Validate order/bounds, preview and commit/cancel semantics; handle first section and final unknown ending.
- [ ] E12-S1-T3 · P1: Recompute macro overview, genre sequence and hip-hop boundaries from committed local state before cloud acknowledgement.

AC: Save changes the timeline on the next render without reload; Cancel changes nothing. Exact/range/unknown source evidence remains distinguishable. Invalid time/order input keeps the draft and focuses the error. Empty plans can acquire their first section without invented dates/AM/PM/end time. Add first section → Add song works, and empty sections between populated sections remain accessible. Genre names remain full, multilingual and selectable without internal timeline scrolling. Title edits do not silently change neighboring genre/timing inheritance.

### E12-S2 — Add and edit songs with live local feedback · P1 · Todo

Dependencies: E12-S1.

- [ ] E12-S2-T1 · P1: Add song to selected section, or explicitly choose a destination from All tracks.
- [ ] E12-S2-T2 · P1: Extend song editing to title and peak/download/idea flags with validation and draft cancellation.
- [ ] E12-S2-T3 · P1: Keep counts, list, selection, peak indicators, copy/search and save status consistent after commit.

AC: A new song is visible immediately before the cloud response; list/count/timeline derive the same document revision. Title/flag changes preserve song UUID and source timing evidence. Empty title is rejected with draft/focus intact. Copy and Google search use the committed current title. Cancel makes no changes. Local rendering does not wait for Realtime. All tracks and combined filters work across newly created content.

### E12-S3 — Reorder and move songs without losing context · P2 · Todo

Dependencies: E12-S2, E13-S1.

- [ ] E12-S3-T1 · P2: Provide keyboard/touch Move up/down within sections and explicit destination selection for cross-section moves.
- [ ] E12-S3-T2 · P2: Add undo and recalculate all derived timing/genre/count views from one coherent edit.

AC: No drag-only control is required. Flags/titles/UUIDs survive reorder. Cross-section moves visibly adopt the destination context and can be undone. No estimated position becomes an exact timestamp. Cloud save is atomic and concurrent moves follow the revision/conflict policy.

## E13 — Durable saves and live same-account synchronization · P0 · Todo

### E13-S1 — Preserve drafts through saves, retries and conflicts · P0 · Todo

Dependencies: E10-S2, E11-S1; required before production plan editing.

- [ ] E13-S1-T1 · P0: Implement committed snapshot/editor draft/pending-operation state with per-plan serialized saves.
- [ ] E13-S1-T2 · P0: Show acknowledged saving/saved/error/device-only states and idempotent retry.
- [ ] E13-S1-T3 · P0: Detect stale revisions and offer account version or local copy, preserving unsaved work on plan/account transitions.

AC: Saved appears only after acknowledgement. Failed/rejected writes keep a recoverable draft; denied local storage is reported as session-only. Two same-revision clients cannot silently overwrite one another. Retries use the same operation UUID and do not duplicate content. Switching plans/accounts cannot submit pending edits to a different owner/destination. Network writes follow committed edits, not every keystroke.

### E13-S2 — Receive committed changes across tabs/devices · P0 · Todo

Dependencies: E13-S1, E10-S3.

- [ ] E13-S2-T1 · P0: Configure private plan channels with owner-specific authorization and minimal revision notifications.
- [ ] E13-S2-T2 · P0: Subscribe/catch up/refetch, ignore older events, reconcile reconnect and tear down obsolete channels.
- [ ] E13-S2-T3 · P0: Preserve open local editors, focus/scroll and drafts when remote content changes.

AC: The same account's second session sees a committed edit without reload. Reconnect refetch repairs missed events; duplicate/out-of-order events cannot regress data. A remote update never discards a draft or steals focus. B cannot receive A's content or plan metadata through private channels/refetch. Subscription names/client filters are not used as security boundaries. Realtime denial does not block local editing or misreport cloud saving. Record convergence latency; the two-second healthy-staging target is not a delivery guarantee.

### E13-S3 — Export and recover pending plan work · P1 · Todo

Dependencies: E11-S1, E13-S1. Coordinate with E3-S1/E4-S2.

- [ ] E13-S3-T1 · P1: Add structured backup/restore with versioned metadata, ordered content and timing evidence.
- [ ] E13-S3-T2 · P1: Implement account-scoped device drafts and explicit recovery after interrupted/failed saves.

AC: Backup includes current titles/flags/unknown timing but no auth session or key. Restore validates shape/limits and creates a new stable plan identity. A's draft cannot be uploaded under B. Failed cloud save can be exported even if browser storage is denied. Legacy local data remains until acknowledged migration. No full background offline-sync guarantee is advertised before conflict/retry validation.

## E14 — Independent cloud QA and release · P0 · Todo

### E14-S1 — Prove database ownership and concurrency · P0 · Todo

Dependencies: E10-S2; run throughout implementation.

- [ ] E14-S1-T1 · P0: Apply migrations reproducibly and test A/B/anonymous allow/deny paths, RPCs, immutable owner and malformed documents.
- [ ] E14-S1-T2 · P0: Test known-ID direct access, direct-write bypass, stale revisions, transaction rollback and duplicate operation IDs.
- [ ] E14-S1-T3 · P0: Verify private channel authorization and no cross-user notifications on staging.

AC: Tests demonstrate expected allowed operations and denied cross-owner/anonymous operations, not just policy text inspection. Concurrent commits yield an explicit conflict. No partial imports/reorders or duplicated retry data. Any definer/Realtime policies have least-privilege evidence; no broad authenticated-user policy is copied from tutorials. Mocks alone cannot close this story.

### E14-S2 — Verify auth, editing, sync and accessibility · P0 · Todo

Dependencies: E10-S3, E11-S2–S3, E12-S1–S2, E13-S1–S3.

- [ ] E14-S2-T1 · P0: Add deterministic mocked model/repository/browser checks for errors, storage denial, races and account transitions.
- [ ] E14-S2-T2 · P0: Use staging and disposable users for real chosen auth flow, reload/logout, isolation, two-session edits, reconnect and conflicts.
- [ ] E14-S2-T3 · P1: Review mobile/desktop/short/200% reflow, keyboard/focus, dialogs/status announcements and multilingual names.

AC: Create/open/rename two plans, edit sections/add songs, filter/copy/search/import and reload restore correct content. New local changes render without reload; measure the under-100ms fixture target separately from staging network convergence. Failed saves/auth keep usable recovery. Remote events don't hijack editors or focus. A's late results never enter B's workspace. Existing 54 website/offline workflows continue passing; cloud tests use separate online contexts. Actual screen-reader/native zoom observations are distinguished from reflow simulations.

### E14-S3 — Release connected single HTML and preserve offline parity · P0 · Todo

Dependencies: E14-S1–S2 plus E10-S1's build contract.

- [ ] E14-S3-T1 · P0: Finalize build:connected script, double-click/file-origin instructions, staging email/password configuration and artifact identity.
- [ ] E14-S3-T2 · P0: Run type/model/package tests, all builds, offline request audit/reproducibility and SDK/public-config scans.
- [ ] E14-S3-T3 · P1: Record staging measurements/screenshots/limitations, update setup/README/backlog and prepare reviewed migrations/deployment.

AC: Connected HTML has no required sibling assets and authenticates/saves/synchronizes against staging in the downloadable workflow established by E10-S0; any required callback/helper infrastructure is explicitly agreed and documented. Offline HTML still opens without login/network and makes no automatic Supabase requests. No secret key/token/private test data enters commits/artifacts/logs/screenshots. Document unsupported file-origin/provider cases rather than claim parity. No existing production schema is reset to make tests pass. All P0 gates have real evidence; production deployment is a separately authorized action.

## Initial email/account implementation evidence — 2026-10-12

Account adapter/UI and connected build are implemented; metadata SQL is reported applied by the user. E10-S0–S3/E11-S2 remain In progress because their server/real-login acceptance criteria are not met. Public settings confirm Email Auth and signup are enabled; a real file:// GET reaches Auth settings with HTTP 200. Cloud account tests use intercepted synthetic responses, not real users or email.

The My plans area currently lists/creates plan names only; it does not open/save cloud track content. Existing local planner data is not uploaded. Model/documents, cloud song editing, concurrency and Realtime remain Todo. Real password login, database/RLS validation and two-user isolation are activation gates in docs/supabase-setup.md.


## Email/password activation update — 2026-10-12

This update supersedes earlier email-code/template/SMTP requirements for the initial login release. Selected flow: email/password signup and sign-in using Supabase only. Public settings confirm Email/signup enabled and Confirm email off. The user reports running the prepared SQL; do not rerun it automatically. Email addresses remain unverified; mail-based recovery is later scope.

- E10-S1: selected provider/build configuration implemented; no SMTP/template gate for basic password auth.
- E10-S3: password UI/SDK implemented. AC: signup with a session opens My plans; signup without a session does not claim login; wrong credentials show a useful error; passwords are cleared and never persisted by app code; reload/logout/account-switch behavior passes. Real Chrome file-origin signup remains a user verification gate.
- E10-S2/E14-S1: SQL reported applied; actual A/B/anonymous direct-access policy tests remain pending.
- E11-S2: create/list plan names implemented; opening/renaming full cloud plans remains pending. E11/E12/E13 song documents/editing/save/live sync are not complete.

Cloud stories remain In progress until their full acceptance criteria have real evidence. Earlier instructions requiring SMTP for the initial auth gate are superseded, not a blocker for this selected flow.
