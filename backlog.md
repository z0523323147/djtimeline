# Product backlog

Updated: 2026-10-11. Seven stories are **Done**: E7-S1–S4, E1-S1–S2, and E5-S1. Remaining stories are **Todo**. Existing implemented features are documented in [plan.md](plan.md); this is future work, not a claim that those features are missing.

Priorities: **P0** = release-blocking correctness or coverage; **P1** = core usability/reliability; **P2** = release polish; **P3** = optional extension. AC = acceptance criteria. Subtasks inherit their story priority unless explicitly stated.

Shared-source foundation completed: Astro/Svelte/pnpm, both outputs, terminal and brief-section navigation, 15 Node tests, 42 browser workflow tests, and reproducibility checks. Evidence: [docs/verification.md](docs/verification.md). Remote CI is configured; local checks are recorded separately.

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
- Mobile controls remain large and the track area retains its dedicated view.

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

## E6 — Optional set management · P3

### E6-S1 — Keep multiple named sets · P3 · Todo

As a DJ, I may want to switch between event sets without repeatedly replacing one active set.

Subtasks:

- [ ] E6-S1-T1 · P3: Validate demand and define the smallest named-set workflow.
- [ ] E6-S1-T2 · P3: Scope notes, corrections, and export to stable set identities.
- [ ] E6-S1-T3 · P3: Design backup, restore, and deletion behavior before implementation.

AC:

- Switching sets preserves each set's own notes and corrected titles.
- Names are editable and duplicate names do not confuse identity.
- Export/restore works per set.
- The party overview remains the primary experience; set management does not become the main dashboard.

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
- Desktop retains overview beside a generous track pane; phones retain separate Party/Tracks views.
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

Completed UX correction (2026-10-11): removed the redundant time/genre selector and selected-section card, kept a collapsed **Browse all sections** fallback, and rendered continuous overview/peak bands without internal dividers. Detailed genre selection and hip-hop boundaries remain intact. E8 stories below still track the broader refinement work.

Additional correction: **Genre details** uses tighter time scopes to put full names inside the bars, including House/EDM in the 1:30 block. Inter-row genre notes are removed. The final 4:00 Hip hop track is selectable inside the last bar with an open-ended arrow. Genre details is optional, with a compact macro overview above it when enabled; both modes are verified in hosted/offline phone, desktop, and short-height tests.

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

E7-S1 → E7-S2 with E5-S1 → E7-S3 → E1-S1 → E1-S2 → E7-S4 → E8-S1 → E2-S1 → E3-S1 → E3-S2 → E4-S2 → E4-S1 → E8-S2 → E2-S2 → E5-S2 → E6-S1.

A story is Done only after its AC pass and the relevant validation evidence is recorded. Priority belongs to the work, not to the order in which its section appears here.

UX follow-up completed: genre/time labels in every detailed bar when enabled, compact whole-party preview, and consistent Hebrew/English track alignment. Existing regression workflows verify labels and RTL alignment in both builds at all three viewport sizes.
