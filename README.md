# Party Map — DJ Set Timeline

A browser-local DJ planner: see the whole party, open a genre section, and prepare its tracks. Built with Astro and Svelte, with a static website and a single-file offline edition from the same source.

![Party Map desktop preview](party-map-preview.png)

## Develop

Use Node.js 22.12+ (tested with 24.14.1) and pnpm 12.11.2, pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Astro. If pnpm is not installed, run `npm exec --yes --package=pnpm@12.11.2 -- pnpm install --frozen-lockfile`, then use the same prefix for the commands below. Optional: set `ASTRO_TELEMETRY_DISABLED=1` to disable Astro telemetry.

## Build and share

```sh
pnpm build
pnpm preview
```

- `dist/site/` — static website with bundled assets; serve the entire folder.
- `dist/party-map.html` — standalone offline app. Open this file directly, or send it without any accompanying files.

`pnpm build:site` and `pnpm build:offline` rebuild either output independently and preserve the other. The offline build compiles the shared Svelte root into one embedded classic script with embedded CSS and example notes. It requires no server, CDN, fonts, service worker, or sibling assets. Download search intentionally opens Google and requires internet access.

## Features

- Three-band party overview with clickable genre sections, pink hip-hop, and amber peaks.
- **Genre details** zooms into tighter time ranges, with genre names inside the bars and recorded boundaries above them.
- The final section stays inside the last timeline bar; an arrow indicates its ending time is missing.
- Clickable timeline navigation and a collapsed Browse all sections list with full-size buttons for brief switches.
- Desktop overview beside a generous track pane; dedicated Party/Tracks views on phones.
- Recorded time navigation and a hip-hop entry/exit list, with honest labels for uncertain changes.
- Search with combined genre, peak, download, and idea filters.
- Copy a track, edit its name, and search Google using its corrected title.
- Import pasted notes or a `.txt` file. Names support Hebrew, Russian, and English.
- Browser-local notes and corrections, with explicit session-only feedback when saving fails.

## Notes format

```text
12:30
(Afro tech)
First track ---
Second track ///
1:50
(Hip hop) הפגזות
Another track --
Track title (remix)
```

Times and genres persist until replaced. Only a whole parenthesized line declares a genre; parentheses inside names remain intact. `--` or longer marks a download; `///` marks an idea. A standalone `הפגזות` starts a peak section; declaring a genre resets it unless the declaration also has that marker. An inline peak marker affects only that track. Blank and marker-only lines do not create tracks.

Time markers follow source order with sequential 12-hour rollover, without assuming AM/PM. Changes between markers show the known interval rather than an invented exact minute. Diagram positions inside that interval are approximate. A final section has no invented duration. Untimed or one-marker imports remain browsable.

Import replaces the active set only after **Use these notes**. Cancel and invalid input preserve it. Limits: 500,000 bytes per file, 500,000 JavaScript string units for pasted text, and at least one track.

## Local data

Imported notes use the existing `party-map-imported-notes` storage key. Corrections retain the original content-based `party-map-v2-*` keys, so existing saved names remain compatible when migrating on the same origin. Storage is scoped to a browser and origin; changing ports, browsers, hosted URLs, or file contexts can change what is available.

Imports and edits do not rewrite the HTML. Unavailable storage leaves changes usable for the session. The app attempts a clipboard fallback and reports failure honestly. No accounts or cross-device sync are involved. Google receives a track query only when its link is opened.

## Validate

```sh
pnpm check
pnpm build
pnpm check:offline
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
node scripts/check-reproducible.mjs
```

The current suite contains 15 Node tests and 42 Chromium workflow tests across hosted and direct-file builds at 1280×900, 390×844, and 1280×600. Direct-file tests disable networking and observe requests across all workflows. They cover imports/cancel, editing/reload, combined filters, encoded Google links, keyboard selection, rapid switches, hostile text, repeated markers, storage denial, and clipboard fallback/failure.

Two unchanged offline builds must produce identical bytes. GitHub Actions installs with the frozen lockfile, checks types, builds both outputs, runs tests, checks reproducibility, and uploads the offline HTML. The workflow is configured; its first remote result is separate from local verification. See [docs/verification.md](docs/verification.md) for evidence and limits.

The bundled set remains **126 tracks, 25 blocks, 26 sections, 42 download choices, 25 peak tracks, and 2 ideas**.

## Source

- `src/pages/index.astro` — static `/` route and document shell.
- `src/components/PartyApp.svelte` — shared state and app composition.
- `src/views/` — Party and Tracks views.
- `src/lib/` — parser, timeline, filters, storage, and clipboard adapters.
- `src/data/example-notes.txt` — one bundled data source.
- `src/styles/` — shared tokens and styles.
- `src/offline/main.ts` and `scripts/` — standalone compilation and validation.
- `tests/` — model and browser regression checks.
- `dj-set-timeline-v2.html` — preserved pre-migration baseline; other root HTML files are historical iterations.
- [AGENTS.md](AGENTS.md), [plan.md](plan.md), [backlog.md](backlog.md) — instructions, architecture, and prioritized work.
- [SKILLS.md](SKILLS.md), [SUBAGENTS.md](SUBAGENTS.md) — recommended workflows/roles, not installed runtime configuration.

## Remaining work

Linear-inspired visual refinements, portable corrected-note export, import previews and restore-example controls, broader accessibility/storage coverage, shortcuts, and hip-hop window summaries remain tracked in the backlog. Multiple named sets remain an optional extension.

Repository: [z0523323147/djtimeline](https://github.com/z0523323147/djtimeline). No hosted deployment or license is configured.
