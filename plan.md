# Project plan

Updated: 2026-10-11. Build a browser-local DJ planner with Astro and Svelte, producing a static website and self-contained offline HTML.

## Product direction

Show the whole party first, then let the DJ inspect a genre section. Keep hip-hop switches immediately recognizable, distinguish recorded times from uncertain ranges, and make copy/edit/Google search easy. Use one page with a full-width timeline above the tracks on desktop and phones.

## Implemented foundation

E7-S1–S4, E1-S1–S2, and E5-S1 are implemented and locally verified. The application source is now `src/`; the old standalone HTML files are preserved baselines. Both outputs use the same Svelte root, parser, data, styles, state, and browser adapters.

Validation: 15 Node tests, 42 Chromium workflow tests, Astro/Svelte checks, both builds, direct-file operation with networking disabled, and identical bytes from two offline builds. See [docs/verification.md](docs/verification.md). GitHub Actions is configured; local passing checks do not imply remote CI has already run.

## Architecture — Astro routes, Svelte views

- `src/pages/index.astro` owns `/`, metadata, static rendering, and the shared Svelte root with `client:load`.
- `src/components/PartyApp.svelte` owns notes, selection, filters, import state, and feedback.
- `src/views/PartyPage.svelte` and `TracksPage.svelte` compose the timeline and track list on the shared page. There is no separate SvelteKit router.
- `src/lib/parser.ts` creates typed tracks, time blocks, and contiguous genre sections without browser APIs.
- `timeline.ts` separates recorded boundaries from diagram positions; `search.ts` combines filters and encodes Google links.
- `storage.ts` preserves legacy keys and validates correction shapes; `clipboard.ts` provides clipboard/fallback behavior.
- `src/data/example-notes.txt` is imported at build time into both outputs.
- `src/styles/tokens.css` and `app.css` are shared. Use system fonts and embedded/local assets.
- Browser storage initialization runs after mount; server rendering does not read browser globals.

Pinned compatible toolchain: Astro 7.3.8, official Svelte integration 9.0.1, Svelte 5.57.2, Vite 8.3.4, official Svelte plugin 7.3.1, TypeScript 6.0.3, and pnpm 12.11.2 with a committed lockfile. Node 22.12+ is supported; development verification used 24.14.1.

## Build contracts

**Website:** `pnpm build:site` pre-renders the Astro route into `dist/site/`, including normal hydration assets. Serve the complete directory.

**Offline:** `pnpm build:offline` builds `src/offline/main.ts`, which mounts the same root. Vite emits a single classic IIFE with all dependencies included. The packager embeds its script, CSS, and notes in `dist/party-map.html`, escapes closing script/style tags, rejects unresolved imports/assets, and validates the resulting document. No runtime fetch, CDN, service worker, or sibling file is needed.

`pnpm build` generates both. Independent rebuilds preserve the other output. Packaging is atomic. The structural checks are complemented by direct `file://` browser tests that disable networking and inspect runtime requests across workflows. Google search is the intentional outbound action.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm build
pnpm check:offline
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
node scripts/check-reproducible.mjs
```

CI repeats these checks and retains the offline HTML as an artifact. Publishing to a hosted site is separate from building and pushing source.

## Linear-inspired UI direction — next

Adapt Linear's aligned panels, quiet surfaces, clear hierarchy, and restrained chrome for DJ preparation. Keep readable controls rather than imitating issue-tracker density.

- Define spacing, type, radii, surface, accent, and focus tokens consistently.
- Align pane headers, filters, and track actions; keep track names at least 16px and controls at least 44px tall.
- Keep pink hip-hop and amber peaks meaningful, with text/accessibility labels alongside color.
- Keep a full-width timeline above a generous track list; use horizontal panning on narrow screens.
- Keep row actions directly accessible on touch devices, with predictable keyboard focus.
- Use plain copy for uncertain times, local saving, and import replacement.
- Honor reduced motion and validate enlarged text and short viewports.

The foundation preserves the accepted palette/layout and extracts color tokens. E8-S1 remains Todo because the full visual token/refinement and enlarged-text review are not yet complete.

## Data decisions

Time and genre persist until replaced. Only a whole-line genre declaration changes genre; embedded parentheses stay in names. Standalone peak state persists until the next genre, while inline peak markers tag one track. Download/idea markers are stripped from displayed names. Sequential rollover does not assign AM/PM.

No chart estimate becomes an exact source timestamp. Final sections use an explicit end marker without invented duration; untimed and repeated markers remain browsable. Every brief section also has a full-size button alternative without overlapping chart targets or stretching durations.

The clickable timeline is the main navigation. A compact whole-party strip stays above the labeled bars. One collapsed section/time jump list provides larger alternatives. Selection brightens the bar with a luminous outline; the previous black underline is removed.

The timeline has one presentation: no Genre details mode or Party/Tracks tabs. Time scopes adapt to fit names and change times inside every bar. Each row includes an estimated ruler with regular five- or ten-minute marks and both endpoints. A bounded scroll region keeps the track area nearby. Phones pan the timeline horizontally rather than shrinking the labels. Diagram placement stays approximate; uncertain changes retain the source range. The 4:00 Hip hop cap has no invented ending time.

Imports and corrections are untrusted text. Keep copy and Google search tied to the current title. Storage is scoped to the browser/origin, with session-only feedback when unavailable; legacy data remains compatible on the same origin.

## Milestones

- M0: Documentation and baseline — complete.
- M1: Shared Astro/Svelte source, website/offline builds, reproducibility, and behavior parity — locally complete; remote CI result awaits the push.
- M2: Terminal/brief-section navigation and regression checks — complete. Linear refinements, accessibility review, and shortcuts — remaining.
- M3: Corrected-note export, import preview, restore example, and expanded persistence coverage — remaining.
- M4: Multiple named sets — optional, validate demand before implementation.

Next execution order: E9-S1 → E9-S2 → E9-S3 → E9-S4 → E8-S1 → E2-S1 → E3-S1 → E3-S2 → E4-S2 → E4-S1 → E8-S2 → E2-S2 → E5-S2 → E6-S1. Finish and verify each story's acceptance criteria before marking it Done.

Design review: Linear’s homepage and product examples (https://linear.app/) informed the neutral dark surfaces, restrained borders, clear hierarchy, quiet row actions, and selected-state emphasis. This is a local adaptation for DJ preparation.

## Next UI strategy — compact complete party timeline

Status: researched proposal, 2026-10-11. This section supersedes the bounded scrolling/panning layout above for the next iteration. No new UI implementation or dependency installation is included in this planning change. Execution is tracked in E9 in backlog.md.

### Outcome

Keep the timeline above tracks and make every section visible without scrolling inside the timeline. Remove the instructional sentence and explanatory footer. Put Party timeline and the three compact legend items in the same header row. Add hip-hop entry/exit times to the top overview. Keep bright selection, large direct actions, and the existing import/edit/copy/search behavior.

### What is causing the current density

The bundled set contains 26 sections and 11 hip-hop changes. Its current width-fitting algorithm creates seven detailed rows at a representative desktop width and nine at the phone minimum chart width. The 1016px minimum chart width then adds horizontal panning; the 240px maximum height adds vertical scrolling. Each row repeats a ruler, genre times, and spacing. Removing those two explanatory sentences helps, but the main height reduction requires a different representation.

A brief duration can occupy fewer pixels than its genre name needs. Increasing its minimum width under a proportional ruler would imply a longer duration. Narrow screens also cannot fit all 26 full names in two readable rows. Use text measurement to establish the actual minimum rows; row targets below are design goals to prove in a prototype, not an excuse to shrink text or hide sections.

### Options reviewed

1. **Proportional bars with full labels in each bar.** This preserves familiar timing, but brief sections force zoomed scopes, extra rows, or clipped text. The current seven/nine-row approach demonstrates this constraint. It remains useful for a selected-range inspection, but should not be the default complete-party view.
2. **One time axis with staggered labels and leader lines.** This uses fewer ruler rows and keeps proportional timing, but creates the notes-between-bars appearance already rejected. Do not use it for genre labels. Small bounded annotation lanes are suitable for the eleven essential hip-hop boundary times only.
3. **Proportional overview plus a compact chronological genre sequence. Recommended.** The top strip owns elapsed time. Below it, text-sized section buttons own genre selection and sequence. Each has its full name inside its colored bar. All sections wrap into the available width; their widths express label space, so they have no time ruler attached. Selecting one illuminates its card, highlights its estimated interval in the top strip, and changes the tracks below. This removes repeated rulers and accommodates narrow sections without altering time data.

### Research and library decision

- **Linear:** its timeline separates high-level projects from granular work and exposes levels of time detail. Adapt the macro/detail hierarchy, restrained header, and emphasis on the current selection. The detail here is the genre sequence and track list rather than another zoomed timeline mode. [Official timeline documentation](https://linear.app/docs/timeline).
- **D3 scale utilities:** linear scales preserve proportional numeric differences and support inverse mappings. They fit the top overview's numeric elapsed-minute domain, including the parser's rollover. Use numeric minutes rather than introducing dates, time zones, or DST. Candidate: import d3-scale alone if its tick/mapping utilities simplify the implementation; Svelte continues to own elements, focus, and state. [Official linear-scale documentation](https://d3js.org/d3-scale/linear).
- **LayerCake:** a Svelte chart composition tool that exposes scales/layout to component layers. It is a credible option if the app grows to several coordinated charts. For one overview strip, its composition layer may add little beyond the existing Svelte components. Require a prototype comparison before adopting it. [Official guide](https://layercake.graphics/guide).
- **vis-timeline:** provides time axes, selection, item stacking, automatic fitting, and zoom/pan options. Its default collision stacking still creates extra lanes; fitting the visible window does not guarantee all full labels fit in a small height. Best candidate if later work needs an editable time scheduler. That is outside the present genre-navigation scope. [Official documentation](https://visjs.github.io/vis-timeline/docs/timeline/).
- **Apache ECharts:** custom range-bar series can render interval charts. It is useful for a future analytics dashboard; this app would still need custom label packing, keyboard controls, and focus behavior. It is not the preferred first implementation for this compact control surface. [Official custom-series documentation](https://echarts.apache.org/handbook/en/how-to/custom-series/).

Recommendation: build the layout in shared Svelte, with CSS wrapping for section buttons and SVG for the proportional overview. Evaluate d3-scale in a bounded spike; retain the existing numeric mapping if it is clearer. Compare the generated offline HTML against the current 79,724-byte baseline using the same build settings. Bundle-size, startup, keyboard, and file-origin compatibility claims require local evidence; no library was benchmarked or installed during this review.

### Proposed page structure

1. **Header:** Party timeline on the left, Other genres / Hip-hop / Peak on the right. Compact dots and text, no instruction paragraph. At 390px, reduce padding and gaps first. If enlarged text makes a single row impossible, allow a natural wrap instead of clipping.
2. **Whole-party time strip:** one continuous proportional overview from 12:30 through 4:00, plus the open-ended final hip-hop marker. Give it a single full ruler with major labels around every 30 minutes on desktop and around every 60 minutes on phones, including both endpoints. Minor ticks can remain without text. Hip-hop switch times are additional visible annotations, not hidden in hover tooltips.
3. **Genre sequence:** all 26 sections in source order, wrapping left-to-right and then top-to-bottom. Full genre names stay inside colored controls. Use a small ordinal to make reading order clear. Avoid repeated rulers and timestamps here; the selected track heading already shows the complete time/range. Retain source times in accessible names and hover/focus details. Names such as Melodic house afro tech can wrap to two lines. Do not merge repeated genres across intervening sections or hide the final track.
4. **Track workspace:** selected genre and full recorded time/range, followed by existing filters and tracks. Remove oversized gaps and redundant status copy before reducing essential text or control sizes. Keep titles 16px and primary controls at least 44px.

The genre sequence uses ordinary buttons, not stretched proportional segments. Its short heading can be Genre sequence; this communicates ordering without adding another explanatory paragraph. Both representations share stable section IDs and the same selected state.

### Hip-hop entry/exit annotation design

Pair each hip-hop section with the next section to derive entry and exit boundaries. The bundled windows are:

- 1:50 → 1:57.
- Entry within 2:07–2:15 → exit at 2:15.
- 2:24 → 2:30.
- Entry within 2:40–2:50 → exit at 3:00.
- 3:17 → 3:31.
- 4:00 → end not recorded.

Keep all eleven boundary changes visible. Use entry/exit direction glyphs with accessible Into hip-hop / Out of hip-hop wording. Exact source boundaries receive a crisp marker. An uncertain entry receives a dashed interval and the source range text, such as ~2:07–2:15. Never replace that range with the evenly spaced diagram estimate. The final end is open-ended; do not invent a sixth exit timestamp.

Place switch labels in compact lanes above/below the overview. Measure rendered widths and pack non-overlapping labels in time order. Avoid repeating an annotation when the same exact boundary is already labeled by a ruler tick. If phone labels collide, add the smallest necessary annotation lane. Keep every switch visible; tooltips supply provenance rather than essential timing. The source range may overlap the diagram estimate, so range markers and proportional section positions remain separate data.

### Responsive packing and acceptance targets

- Remove min-width:1016px, max-height:240px, and internal timeline overflow after the replacement is ready. Ordinary page scrolling remains available; the timeline itself shows all content.
- Prototype text-sized wrapping with real font metrics at 1280×900, 390×844, and 1280×600. Measure genre names, gaps, and minimum hit areas after fonts settle; recompute after resize/import/title-independent genre changes.
- Start with native wrapping, 4–6px gaps, 44–52px section height, and two-line names. A balanced row-packing helper is justified only if natural wrapping leaves substantial wasted width.
- Initial goals for the bundled set: two or three genre rows on desktop, six to eight on phones. Record the achieved row count and lower bound from actual label widths. Keep all 26 full names and readable controls if an extra row is necessary.
- Aim for a desktop timeline region around 240–300px including header, overview annotations, and sequence. The first track and its actions should remain visible at 1280×900. Phone height should follow its content without introducing a timeline scrollbar.
- Do not require arbitrary imported sets with hundreds of sections to fit a fixed height. They remain fully visible in normal page flow; handle unusually long genre names with wrapping and preserved text.
- Selected card and overview interval use the accepted bright fill/outline. No black underline. Respect reduced motion, keyboard activation, automatic text direction for imported genres, and LTR timestamps.

### Delivery order

**E9-S1:** Prototype the three visual options with the bundled notes and measure desktop/mobile row counts, label collisions, control sizes, and offline output. Confirm the recommended hybrid against the targets; retain testable evidence in docs/verification.md. Use temporary prototypes in the existing workspace, not a second production implementation.

**E9-S2:** Replace the scrolling detailed map with the responsive genre sequence, remove both unnecessary text blocks, and align the title/legend. Keep existing tracks, filters, import, persistence, and actions intact. Remove obsolete CSS rather than accumulating another layer of overrides.

**E9-S3:** Add the proportional overview ruler, all eleven hip-hop boundary annotations, uncertainty intervals, terminal marker, and shared selection highlighting.

**E9-S4:** Validate both builds and the no-scroll/complete-label constraints, update screenshots/docs, and push the finished implementation. No dependency is adopted without the recorded spike result. Keep statuses Todo until the implementation and acceptance checks pass.
