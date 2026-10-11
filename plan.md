# Project plan

Updated: 2026-10-11. Build a browser-local DJ planner with Astro and Svelte, producing a static website and self-contained offline HTML.

## Product direction

Show the whole party first, then let the DJ inspect a genre section. Keep hip-hop switches immediately recognizable, distinguish recorded times from uncertain ranges, and make copy/edit/Google search easy. Preserve the accepted desktop split and dedicated mobile Party/Tracks views.

## Implemented foundation

E7-S1–S4, E1-S1–S2, and E5-S1 are implemented and locally verified. The application source is now `src/`; the old standalone HTML files are preserved baselines. Both outputs use the same Svelte root, parser, data, styles, state, and browser adapters.

Validation: 14 Node tests, 42 Chromium workflow tests, Astro/Svelte checks, both builds, direct-file operation with networking disabled, and identical bytes from two offline builds. See [docs/verification.md](docs/verification.md). GitHub Actions is configured; local passing checks do not imply remote CI has already run.

## Architecture — Astro routes, Svelte views

- `src/pages/index.astro` owns `/`, metadata, static rendering, and the shared Svelte root with `client:load`.
- `src/components/PartyApp.svelte` owns notes, selection, filters, import state, view switching, and feedback.
- `src/views/PartyPage.svelte` and `TracksPage.svelte` compose desktop panes and mobile views. There is no separate SvelteKit router.
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
- Keep large Party/Tracks mobile views and a generous desktop track pane.
- Keep row actions directly accessible on touch devices, with predictable keyboard focus.
- Use plain copy for uncertain times, local saving, and import replacement.
- Honor reduced motion and validate enlarged text and short viewports.

The foundation preserves the accepted palette/layout and extracts color tokens. E8-S1 remains Todo because the full visual token/refinement and enlarged-text review are not yet complete.

## Data decisions

Time and genre persist until replaced. Only a whole-line genre declaration changes genre; embedded parentheses stay in names. Standalone peak state persists until the next genre, while inline peak markers tag one track. Download/idea markers are stripped from displayed names. Sequential rollover does not assign AM/PM.

No chart estimate becomes an exact source timestamp. Final sections use an explicit end marker without invented duration; untimed and repeated markers remain browsable. Every brief section also has a full-size button alternative without overlapping chart targets or stretching durations.

The clickable timeline is the main navigation. The redundant time/genre dropdown and selected-section card are removed; **Browse all sections** is a collapsed fallback for short sections. Continuous teal/pink overview runs and amber peak runs render without internal divider seams. Detailed genres retain their individual click/keyboard targets and labels; selected sections use an underline, with an outline on hover/focus.

Imports and corrections are untrusted text. Keep copy and Google search tied to the current title. Storage is scoped to the browser/origin, with session-only feedback when unavailable; legacy data remains compatible on the same origin.

## Milestones

- M0: Documentation and baseline — complete.
- M1: Shared Astro/Svelte source, website/offline builds, reproducibility, and behavior parity — locally complete; remote CI result awaits the push.
- M2: Terminal/brief-section navigation and regression checks — complete. Linear refinements, accessibility review, and shortcuts — remaining.
- M3: Corrected-note export, import preview, restore example, and expanded persistence coverage — remaining.
- M4: Multiple named sets — optional, validate demand before implementation.

Next execution order: E8-S1 → E2-S1 → E3-S1 → E3-S2 → E4-S2 → E4-S1 → E8-S2 → E2-S2 → E5-S2 → E6-S1. Finish and verify each story's acceptance criteria before marking it Done.
