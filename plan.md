# Project plan

Updated: 2026-10-11. Scope: a browser-local DJ planner developed with Astro and Svelte, with both a static website and a self-contained offline HTML release.

## Outcome

A DJ can understand the party's genre flow, locate hip-hop switches, open a section, correct or copy a title, and search for a download without working through a long list. They can replace the supplied notes with their own text.

## Current baseline

The working application is `dj-set-timeline-v2.html`, with a v3.0 internal comment. It contains its own CSS, JavaScript, and example notes. The other HTML files are earlier iterations.

Implemented and checked during development:

- Three-band party overview and clickable genre sections, including keyboard activation.
- Desktop overview/track split and mobile Party/Tracks navigation.
- Genre selector, hip-hop change list, source time navigation, and peak markings.
- Search and combined peak/download/idea filters across the set.
- Track copy, editing, browser-local corrections, and Google search using corrected titles.
- Pasted notes and `.txt` imports with browser-local persistence and size limits.

The bundled notes parse to 126 tracks, 25 time blocks, and 26 genre sections. Browser checks included 390×844 and 1280×900. The latest layout provided approximately 449px and 529px of track-list height at those sizes. These are observed measurements, not fixed layout requirements.

The workspace now includes `package.json`, an offline packaging script, a structural validator, and six Node tests for that packaging boundary. `npm run build:offline`, `npm test`, and `npm run check:offline` passed. pnpm is not installed on the inspected machine; the same package scripts are intended to run with pnpm. Git has been initialized for [z0523323147/djtimeline](https://github.com/z0523323147/djtimeline). Parser/browser regression automation, CI, framework dependencies, and hosting configuration remain to be added. The application itself has not yet been migrated to Astro/Svelte.

## Architecture — Astro routes, Svelte pages

Astro will own static routing, document metadata, and the outer layout. Interactive page views will be Svelte components, loaded within one root planner island. The official integration supports Svelte rendering and hydration; the planner route will load its interactive root immediately. [Astro Svelte integration](https://docs.astro.build/en/guides/integrations-guide/svelte/).

- `src/pages/index.astro`: the real `/` route; renders the shared layout and `PartyApp.svelte` using `client:load`.
- `src/views/PartyPage.svelte` and `TracksPage.svelte`: the interactive page views. On desktop they compose a split layout; on mobile they switch inside the app. They do not require separate URL routes or SvelteKit.
- `src/components/PartyApp.svelte`: owns selection, filters, current notes, import state, and view switching. Smaller components render the map, section picker, track list, filters, title editor, and import dialog.
- `src/lib/parser.ts`, `timeline.ts`, `storage.ts`, and `search.ts`: DOM-independent parsing/model helpers and browser adapters. Preserve the current grammar and storage compatibility, or explicitly migrate stored data.
- `src/data/example-notes.txt`: a single example-data source imported at build time into both outputs. Runtime import continues to read user text locally.
- `src/styles/tokens.css` and `app.css`: shared design tokens and layout; no remote fonts, icon libraries fetched at runtime, or duplicate offline stylesheet.
- Browser-only APIs run after mounting or through guarded adapters; server rendering must not access `window`, clipboard, or local storage.

Target dependencies are Astro, the official Astro Svelte integration, Svelte, TypeScript, Vite, and the official Vite Svelte plugin for the offline entry. Resolve a compatible version set together, pin pnpm through `packageManager`, and commit `pnpm-lock.yaml` during E7-S1. Do not select unrelated latest versions independently.

The target structure above is a migration design; those source files and dependencies are not created by this planning/build-script task.

## Two builds from the same Svelte app

**Website:** `astro build` pre-renders the Astro route into `dist/site/`, with the normal bundled assets and Svelte hydration. No server adapter is needed for this browser-local app.

**Offline HTML:** build `src/offline/main.ts` with Vite and the Svelte plugin, then embed its JavaScript and CSS in a standalone document at `dist/party-map.html`. The offline entry mounts the same `PartyApp.svelte` through Svelte's `mount` API; it must not maintain a separate planner implementation. [Svelte mounting API](https://svelte.dev/docs/svelte/imperative-component-api), [Vite production builds](https://vite.dev/guide/build.html).

Offline bundling contract:

1. Emit one classic IIFE bundle, with all dynamic imports folded into it and no externalized packages.
2. Collect the compiled CSS into embedded styles. Embed any approved local font/image assets as data URLs; use inline SVG for icons.
3. Include example notes in the bundle. Do not require fetch, a service worker, an API, or sibling files to initialize the planner.
4. Escape closing script/style tags and HTML-significant embedded data while assembling the document.
5. Fail packaging if an external script, linked stylesheet, module chunk, unresolved asset, or runtime asset fetch remains. The current structural validator is a starting guard, not a full HTML/CSS parser or runtime network audit; strengthen it during E7-S3/E7-S4.
6. Open the artifact directly through `file://` with networking unavailable and test the actual workflows. Google Download search is an intentional outbound link and is excluded from offline operation.

This avoids trying to concatenate Astro's generated island loaders: those loaders and component URLs can still refer to separate assets. Both outputs share components and business logic; only their bootstrapping differs.

### pnpm scripts available now

```sh
pnpm build:offline
pnpm check:offline
pnpm test
```

`build:offline` currently validates and packages the already self-contained `dj-set-timeline-v2.html` as `dist/party-map.html`. It does not pretend to compile an Astro/Svelte app before that migration exists. `build` currently aliases this offline build. No dependencies are needed for these scripts beyond Node.js 22+ and an installed pnpm command.

### Script contract after E7 migration

Replace the current `build` alias and add the following only when the corresponding source/configuration exists:

```json
{
  "dev": "astro dev",
  "build": "pnpm build:site && pnpm build:offline",
  "build:site": "astro build",
  "build:offline": "node scripts/build-offline.mjs",
  "preview": "astro preview",
  "check": "astro check && svelte-check",
  "check:offline": "node scripts/check-offline.mjs dist/party-map.html",
  "test": "node --test",
  "test:e2e": "playwright test"
}
```

At that stage `build-offline.mjs` orchestrates the Vite/Svelte compilation before validation/packaging. Configure Astro to write `dist/site/`; do not allow either build to erase the other output. Add the declared checking/browser-test dependencies alongside their scripts, and use a frozen lockfile in CI.

## Linear-inspired UI direction

Use Linear's emphasis on aligned panels, a clear hierarchy, restrained chrome, and fewer visual distractions as design inspiration. This is an adaptation for DJ preparation. [Linear's UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui).

- **App shell:** one quiet header, predictable navigation, aligned pane headers, and a clear content area. Keep the overview beside the roomy track pane on desktop and the accepted two-view pattern on phones.
- **Surfaces and type:** neutral charcoal surfaces, subtle separators, consistent spacing, 16px track names, and readable secondary timing text. Avoid shrinking controls to imitate the density of an issue tracker.
- **Color semantics:** keep hip-hop, peaks, and selection distinguishable. Use accent color to communicate state, not to decorate every control. Confirm contrast and readable focus states.
- **Track rows:** consistent title/action alignment; readable Copy, Edit, and Download actions on touch devices. Do not rely on hover-only controls.
- **Interaction:** smooth, short transitions that honor reduced motion, stable focus, immediate selection feedback, and simple empty/error states. Optional search/navigation shortcuts must not intercept typing in inputs or dialogs.
- **Plain copy:** explain unknown time boundaries in DJ language. Keep import, storage, and download-search behavior understandable without technical notes.

Adopt design tokens first, then apply them to the shared Svelte components. Use small before/after changes and viewport checks rather than a wholesale redesign. E8 contains the design and interaction stories.

## Decisions to preserve

- Develop maintainable Astro/Svelte source while still delivering one standalone HTML file; retain offline operation except outbound Google search.
- Keep precise source times separate from approximate diagram placement.
- Keep the party map visually quiet; detailed genres and tracks remain available through drill-down.
- Give tracks most of the working area. On phones, switch views instead of shrinking everything.
- Use local storage as convenience persistence; it is scoped to browser/origin, not an account database.
- Preserve multilingual names and edit/search/copy consistency.

## Milestones

### M0 — Documentation and baseline: complete

Deliver the README, project instructions, this plan, a structured backlog, and skill/subagent recommendations. Record actual behavior and known limitations. No application changes belong to this milestone.

### M1 — Shared source and reliable offline builds: next

Complete E7-S1 through E7-S4 incrementally. Establish Astro/Svelte/pnpm, extract existing logic, port the accepted UI, and make both builds use the shared components. Do not remove the existing working HTML until parity passes. Carry the existing E1/E5 defects and coverage into the shared implementation rather than creating a second legacy feature branch.

Exit criteria: hosted static output and directly opened offline output preserve all accepted workflows; the same parser, components, and example notes power both; builds are reproducible from a lockfile.

### M2 — Reliable timeline, Linear-inspired UI, and repeatable checks

Complete E1-S1, E1-S2, E5-S1, E8-S1, and E8-S2 from [backlog.md](backlog.md). Address the omitted terminal section and narrow hit targets; add repeatable parser/interaction checks and apply the restrained Linear-inspired design tokens. Preserve the accepted DJ workflows.

Exit criteria: every section has a reachable timeline representation or explicit end marker, mobile activation cannot accidentally choose a neighbor, and checked-in checks catch parser/state regressions.

### M3 — Honest timing and recoverable data

Complete E2-S1, E3-S1, E3-S2, and E4-S2. Clarify missing times and single-marker imports, add corrected-set export and restoration, and make storage failures understandable.

Exit criteria: a user can recover or transfer corrected notes, know whether changes are durable, and distinguish known timestamps from unknown boundaries.

### M4 — Accessibility and release packaging

Complete E2-S2, E4-S1, and E5-S2. Review multilingual/keyboard behavior, consolidate the release entry point, and prepare repeatable static-host checks.

Exit criteria: agreed browser and viewport checks pass, current screenshots and docs match the release, and a portable release file is ready. Actual GitHub publishing or deployment is a separate requested action.

### M5 — Later enhancements

Consider E6-S1 only after the core release is stable. Multiple saved sets should follow a clear DJ workflow, rather than adding an unnecessary dashboard.

## Working cycle

1. Select one backlog story and its acceptance criteria.
2. Inspect the relevant functions and reproduce the current behavior.
3. Implement the smallest complete change, keeping data logic separate from UI.
4. Run relevant repeatable checks and browser checks.
5. Update status, evidence, README, and screenshots when behavior changes.

Stories do not move to Done based on code review alone. Record the tested build and any unverified browser limitations.

## Open product decisions

- Whether manual transition times should be editable, and how to retain original notes as provenance.
- Whether corrected-set export should use plain text, JSON, or both; plain text is the first backlog proposal.
- Website output will use `dist/site/index.html`; the portable release will use `dist/party-map.html`. Historical standalone copies stay intact until parity is verified.
- Which browsers should be included in a formal release matrix; current checks used the in-app browser.
- Repository identity, distribution license, and optional GitHub Pages hosting remain unspecified.

## Team support

Use [SKILLS.md](SKILLS.md) for the five recommended reusable workflows and [SUBAGENTS.md](SUBAGENTS.md) for five optional specialist roles. The primary agent remains responsible for integrating changes and reporting validation.
