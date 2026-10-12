# Project plan

Updated: 2026-10-12. User confirms a real private plan was created. The next milestone is full database-backed plan management: list/open existing plans, add/edit songs and sections, and persist their complete content. The first full-content app slice is implemented locally and tested; migration 004 must be applied to activate it in the user's database. Cross-device notifications and the remaining release gates are pending.

## Current milestone: complete plans in Supabase

Success means: sign in → see my existing plans from the database → open one → add a genre/time section and songs → see the timeline update → receive a database save acknowledgement → reload or open another device and see the same content. A plan name alone is not completion. Song data means titles, flags, order, genre context and timing evidence; audio files remain outside this milestone.

Current evidence: the user reported successful real plan creation after the permission repair. AccountArea now opens database documents in CloudPlanWorkspace. The account adapter supports load/save/atomic import/rename, and the canonical source-event model feeds the same timeline and tracks views as the local planner. This confirms the create path only; reload, full contents and A/B isolation still need proof.

### Implementation sequence

1. **Model and adapter — E11-S1.** Define a schema-versioned canonical document with stable UUIDs for sections, songs and timing markers. Store current/original titles, flags, source ordering and exact/range/unknown timing. Derive the existing timeline/filter model from that document, including empty sections. Keep the current local edition using the same derivation adapter.
2. **Upgrade the existing database — E10-S2.** Add club_plan_documents and operation receipts through an additive migration after 003. Backfill each existing club_plans row with an empty version-1 document without renaming/replacing plans or assigning new plan IDs. Enforce owner-only reads and restricted revisioned writes using public.party_map_user_id(); do not reintroduce the custom writer's Auth-schema dependency. Extend legacy create_club_plan to create metadata and an empty document atomically while preserving its arguments and metadata return shape, so previously downloaded clients still create usable plans. New clients use an atomic create-with-document operation for imports. Reads and saves authorize through the parent plan; saves update document revision and metadata counts/updated_at together. Validate content on the server.
3. **Repository and durable saves — E13-S1.** Add loadDocument/createWithDocument/saveDocument/rename to a typed PlanRepository with local and Supabase adapters. Track account ID, plan ID, expected revision and operation ID for every request. Apply committed edits locally, serialize saves, show Saving/Saved to your account/Save failed—Retry, and retain failed drafts. Saved requires a server acknowledgement. Stale revisions show a conflict with a recoverable copy; never silently overwrite.
4. **Open the plan workspace — E11-S2.** Load paged plan metadata from Supabase after login, provide click/tap Open, search and rename, and fetch only the selected plan's document. Create opens the new blank plan. Replace the account/local split for signed-in plan editing with active plan name, My plans and New plan controls above the existing timeline/track workspace. Keep an explicit Local planner entry for guest data. Empty plans offer Add section/Add song and Import notes. Switching waits for an acknowledged save or explicitly retains a recoverable draft; a failed load never shows old tracks under another plan's name.
5. **Edit full content — E12-S1/S2.** Add/edit genre/time sections and songs, choose an explicit section from All tracks, and persist title/flag corrections through the document save flow. Recompute the timeline and hip-hop changes immediately on a committed edit. Existing corrected copy, Google search, filters and multilingual alignment remain intact. Add recoverable song removal under E12-S4.
6. **Import the current set — E11-S3.** Save this set to my account and pasted/.txt import use preview plus an explicit destination. Default to a new plan; replacement requires confirmation and one atomic save. Apply local title corrections before conversion. Keep the original local set until the new database document is acknowledged.
7. **Other sessions and release — E13-S2/E14.** First prove create/open/add/save/reload and two-plan/account isolation. Then add private same-account change notifications and authoritative refetch with revision checks/reconnect recovery. Run the connected Chrome file build and network-free offline build separately. Update the metadata-only message only when the selected cloud plan actually stores its content.

Core model/database/save/open/add-song tasks are P0 for this milestone. Realtime follows the durable single-session path, and remains required for the previously requested live cross-device behavior. Optional club/date fields, archive, reorder and visual refinements do not block the first working full-content slice.

### Release acceptance

- The already-created plan remains visible with its original ID/name and opens as a blank document after upgrade.
- Create two plans, add different songs/sections, edit a title, switch between them, sign out/in and reload: each restores its own complete database content and current copy/search title.
- Open the connected HTML on another browser/device with the same account: the saved songs are available without copying local storage or notes.
- A failed/rejected save preserves a recoverable draft and never reports Saved. Repeated retries produce no duplicate plan/song; simultaneous edits yield a conflict rather than lost content.
- Another account and anonymous clients cannot read/write known plan/document IDs. Owner identity is immutable; direct writes cannot bypass validation or revision checks.
- Imported baseline retains 126 songs, 25 time blocks, 26 sections, corrected multilingual titles, flags, ranges and the unknown final ending. Empty plans/sections are usable without invented times.
- The timeline stays above tracks, every genre section remains clickable, and primary controls remain usable on phones and keyboard. Offline HTML remains network-free.

Database rollout requires the prepared additive SQL to be applied through the dashboard, followed by real database tests. Planning and mocked tests do not establish that content is already stored remotely. Do not reset the current database or ask for account passwords/admin keys in chat.

## Product direction

Show the whole party first, then let the DJ inspect a genre section. Keep hip-hop switches immediately recognizable, distinguish recorded times from uncertain ranges, and make copy/edit/Google search easy. Use one page with a full-width timeline above the tracks on desktop and phones.

## Implemented foundation

E7-S1–S4, E1-S1–S2, and E5-S1 are implemented and locally verified. The application source is now `src/`; the old standalone HTML files are preserved baselines. Both outputs use the same Svelte root, parser, data, styles, state, and browser adapters.

Validation: 16 Node tests, 54 Chromium workflow tests, Astro/Svelte checks, both builds, direct-file operation with networking disabled, and identical bytes from two offline builds. See [docs/verification.md](docs/verification.md). GitHub Actions is configured; local passing checks do not imply remote CI has already run.

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
- Keep a full-width timeline above a generous track list; wrap genre buttons on narrow screens.
- Keep row actions directly accessible on touch devices, with predictable keyboard focus.
- Use plain copy for uncertain times, local saving, and import replacement.
- Honor reduced motion and validate enlarged text and short viewports.

The foundation and E9 preserve the accepted palette/layout and use shared color tokens. E8-S1 remains Todo because the full visual token/refinement and enlarged-text review are not yet complete.

## Data decisions

Time and genre persist until replaced. Only a whole-line genre declaration changes genre; embedded parentheses stay in names. Standalone peak state persists until the next genre, while inline peak markers tag one track. Download/idea markers are stripped from displayed names. Sequential rollover does not assign AM/PM.

No chart estimate becomes an exact source timestamp. Final sections use an explicit end marker without invented duration; untimed and repeated markers remain browsable. Every brief section also has a full-size button alternative without overlapping chart targets or stretching durations.

The clickable timeline is the main navigation. A compact whole-party strip stays above the labeled bars. Every section is a large button; one collapsed recorded-time list provides exact-source jumps. Selection brightens the bar with a luminous outline; the previous black underline is removed.

The timeline has one presentation: no Genre details mode or Party/Tracks tabs. One proportional overview owns the time ruler and all hip-hop switch labels. A chronological genre sequence wraps full-name buttons beneath it. The timeline has no internal scrolling; larger sets extend normal page flow. Genre button widths express label space, while the selected interval remains proportional in the overview. The 4:00 Hip hop marker has no invented ending time.

Imports and corrections are untrusted text. Keep copy and Google search tied to the current title. Storage is scoped to the browser/origin, with session-only feedback when unavailable; legacy data remains compatible on the same origin.

## Milestones

- M0: Documentation and baseline — complete.
- M1: Shared Astro/Svelte source, website/offline builds, reproducibility, and behavior parity — locally complete; remote CI result awaits the push.
- M2: Terminal/brief-section navigation and regression checks — complete. Linear refinements, accessibility review, and shortcuts — remaining.
- M3: Corrected-note export, import preview, restore example, and expanded persistence coverage — remaining.
- M4: Supabase-connected private club plans, authentication and immediate editing — requested, planned; setup inputs pending.
- M5: Conflict-safe same-account live sync and independent cloud/offline release QA — planned.

Completed compact UI iteration: E9-S1–S5. Supabase E10–E14 are now the next milestone, in the dependency order below. The earlier local refinement queue remains: E8-S1 → E2-S1 → E3-S1 → E3-S2 → E4-S2 → E4-S1 → E8-S2 → E2-S2 → E5-S2. E6-S1 is superseded by E11, not a second implementation. Finish and verify each story's acceptance criteria before marking it Done.

Design review: Linear’s homepage and product examples (https://linear.app/) informed the neutral dark surfaces, restrained borders, clear hierarchy, quiet row actions, and selected-state emphasis. This is a local adaptation for DJ preparation.

## Next UI strategy — compact complete party timeline

Status: implemented and locally verified, 2026-10-11. E9-S1–S5 are Done. All tracks browsing preserves filters and track actions. Three desktop genre rows and seven phone rows preserve all 26 sections; every hip-hop change is visible. No dependency was added. See docs/verification.md and docs/timeline-layout-metrics.json for prototype measurements and limits.

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

**E9-S4:** Validate both builds and the no-scroll/complete-label constraints, update screenshots/docs, and push the finished implementation. No dependency is adopted without the recorded spike result. Completed: the implementation and acceptance checks pass; statuses and evidence are updated.

## Supabase club-plan roadmap — 2026-10-12

Status: initial email/account UI and connected build implemented; private metadata migration reported applied by the user. The user confirms real plan creation; reload/session and server privacy validation remain pending. This is the current product milestone. Multiple plans are explicitly requested and are no longer an optional experiment. Existing browser-local behavior and the completed E9 UI remain the baseline. Project URL/public browser key have been supplied. Double-click HTML with no local server is required. After learning Google needs an OAuth client in Google Cloud, the user preferred another method; email/password login is now confirmed. Target browser is Chrome; the user reports the project is empty. Recipients of the file must be able to sign up and keep their own private plans. Real file-origin login/session and database ownership validation remain pending. [the connection checklist](docs/supabase-connection.md) records those decisions.

### Outcome and scope

A DJ signs in, keeps several private club plans, creates a blank plan or imports notes, adds songs and genre/time sections, and sees the timeline update immediately. Opening the same plan in another signed-in tab/device also receives committed changes. Preserve the full-width timeline above tracks, compact genre sequence, All tracks, corrected-title copy/Google search, multilingual names, and honest uncertain times.

Selected delivery: downloadable HTML, double-click with no local server. Confirmed login: email/password, with confirmation off for the selected SMTP-free setup. Public email/password signup is required for recipients of the file. Plans are private per account; collaborative sharing remains separate scope. The public key was received in the conversation and is not copied into planning documents. Shared editing/invitations, roles, presence, audio uploads, streaming integrations, billing, and a global song catalog are separate future scope. A plan stores song names/flags, not audio files.

### Roles and orchestration

The primary orchestrator owns integration, dependencies and final acceptance. Three authorized read-only specialist reviews informed this roadmap:

- Product/UI/UX: dj-product-planner + timeline-ux-engineer — compact navigation, clear empty states, editor interactions and saving language.
- Data/architecture: set-data-engineer + Supabase architecture — stable source identities, migration, account ownership and atomic saves.
- QA/accessibility: browser-qa-release-reviewer + accessibility-reviewer — independent account-isolation, failure, concurrency, keyboard and offline gates.

No specialist changed app files, registered permanent agents, installed packages or contacted Supabase. During implementation, assign isolated ownership: model/repositories to data, Svelte view components/styles to UX, tests to QA; only the orchestrator merges shared-root changes and changes build contracts. [SUBAGENTS.md](SUBAGENTS.md) retains the reusable role prompts.

### Standalone and deployment contract

Keep shared Astro/Svelte source and introduce repository adapters at entry points rather than duplicate the planner.

- Existing website build remains available for development/regression checks. A hosted connected app is a future optional delivery, not part of the selected downloadable-only release. The shared browser client + database RPC design does not need a separate application server.
- Connected single HTML: planned `pnpm build:connected` producing `dist/party-map-connected.html`, with inline JS/CSS/SDK and public configuration. It has no required sibling assets, but login/cloud saving/live sync need internet. The user selected downloadable-only delivery. First gate E10-S0 determines whether email/password login/API/session persistence work from a directly opened file in the target browser. No hosted app, auth bridge or local launcher is approved.
- Existing `pnpm build:offline`: preserve `dist/party-map.html` as a genuinely network-free local edition with no auth requirement or automatic Supabase initialization. Keep no-network file-origin tests and reproducible packaging.
- Opening a connected file directly with `file://` is now the requested delivery assumption, subject to E10-S0. Test email/password sign-in, API requests and session storage; do not promise it works or declare it categorically impossible. If a redirect-based method is chosen later, its destinations need configured allowlists; that does not apply to the proposed in-page password flow. [Redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

Cloud behavior must never be labelled offline. Missing configuration leaves the local planner usable and cloud controls clearly unavailable. Never turn the old offline output into a network-dependent build silently.

### Compact user flow

1. Header adds active plan name/picker, New plan and account control. My plans opens a searchable dialog/list showing name, optional club/date, song count and last edited time; load metadata first, fetch a document only when opened.
2. Sign in opens a labelled dialog with clear sign-in/create-account/error states. Guest local notes remain available; signing in alone does not upload them. Offer an explicit Save this set to my account action.
3. New plan requires a name; club and event date are optional. Start blank or import notes. Empty plans show Add first section and Import notes, without invented timeline times. A committed empty section remains visible/selectable before its first song and between populated sections; zero songs does not make it disappear.
4. Add section edits genre and its timing evidence: recorded time, known range, or time not noted. Add song uses the selected section; All tracks requires an explicit destination. Preserve unknown finish times.
5. Song editor handles title and peak/download/idea flags. Draft preview is separate from committed state; Add/Save updates the list, counts, genre sequence and hip-hop boundaries on the next Svelte render, before server acknowledgement. Cancel changes nothing; network writes do not run on every keystroke.
6. Move up/down supports keyboard/touch within a section. A cross-section move explicitly selects the destination and adopts its context. Stable song identity and undo preserve corrections/flags.
7. Restrained status near the plan title distinguishes Saving, Saved to your account, Kept on this device, Save failed — Retry, and Changed elsewhere. Saved requires a server acknowledgement. If browser storage also fails, report that the draft is only in this session.

### Canonical document and database design

The current parser generates numeric IDs from positions and legacy corrections use raw-text hash + track index. Those are view adapters, not durable cloud identities.

Proposed tables, with final names checked against the existing project before migrations:

- `club_plans`: UUID primary key, immutable owner UUID referencing Auth, name, optional club/date metadata, created/updated timestamps and recoverable archive timestamp. Duplicate names are allowed. Add owner/update indexes; list pages never fetch every JSON document.
- `club_plan_documents`: one row per plan UUID with schema version, revision, canonical JSON document and update timestamp. Access follows the owning plan. Metadata/document creation and document-derived song counts update in one transaction.
- Private operation receipts: scoped by owner/plan/client-operation UUID to make creation/save retries idempotent. Define bounded receipt retention in the migration; an ambiguous response is retried with the same operation ID.

A canonical document contains ordered, typed source events with UUIDs: recorded time markers, genre declarations, peak markers and songs with original/current titles and flags. Explicit range/unknown boundary evidence is stored when authored; a schema/derivation spike must define its interaction with inherited source markers before editor implementation. Preserve UUIDs across edits/reorder; a derived genre section uses its declaring event UUID or a stable first-song fallback. Array order expresses sequence. Raw imported notes are provenance, not a second editable source of truth.

Derive the existing Model, genre sections, timing bounds and overview from this document through a DOM-free adapter. Numeric positions can remain transient renderer IDs while migrating components. Never persist estimated track spacing as a recorded timestamp. Validate document version/shape, event-ID uniqueness, title/genre lengths, bounds/order and a documented payload limit on both client and server. Preserve the existing 500,000-unit import limit, 500 KB file limit and 500-character corrected-title limit; define JSON overhead/event caps explicitly rather than reuse a raw-text byte limit blindly.

For the private personal-plan MVP, a single document allows coherent saves/imports/reorders. Normalized song rows become a future migration if shared simultaneous editing or cross-plan catalog queries require them. Whole-document conflicts are a conscious first-release tradeoff; no claim of collaborative merging.

### Supabase auth and privacy

Use a browser client configured only with `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy anon key acceptable). Public configuration ships with the app; secret/service-role keys must not. Ignore local environment files before storing configuration. [API-key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

Enable RLS on exposed plan/content tables, restrict grants, and require authenticated ownership for reads and supported writes. Ownership is immutable and document/receipt access follows its plan. Validate both existing and proposed rows; a caller cannot set another owner's UUID. UI filtering and channel names are not authorization. [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

Use email/password signup and sign-in with the Email provider and signup enabled, and Confirm email off (already verified). This needs no SMTP or redirect callback for basic login. Email addresses are unverified; email-based recovery remains later work. Verify real file-origin Auth/API/storage behavior. [Password authentication](https://supabase.com/docs/guides/auth/passwords).


Restore/refresh sessions before fetching private data. Sign out here explicitly uses local-session scope; offer global sign-out only if separately designed. Clear visible account data, subscriptions and cached cloud snapshots on logout/account changes; retain recoverable pending work only in an account-scoped draft flow. Cancel or ignore delayed results using account/plan generation guards. [Sign-out scopes](https://supabase.com/docs/reference/javascript/auth-signout).

### Saving, concurrency and live updates

Introduce `PlanRepository` with local and Supabase implementations, plus a separate sync controller. Plan state carries owner/plan UUID, server revision, committed snapshot, editor draft and pending operations.

- Save a validated snapshot through an atomic `save_club_plan(plan_id, expected_revision, document, client_operation_id)` RPC. It authorizes the caller, validates input, checks the revision, increments it server-side and returns the acknowledged snapshot/revision. Disallow direct writes that bypass revision/idempotency checks. Choose the least-privileged function design that can enforce this: if direct table writes are revoked and a SECURITY DEFINER function is necessary, explicitly check auth.uid/ownership, fix search_path, restrict execute grants and test every bypass. Do not assume an invoker RPC can write after its caller's table grants are removed.
- Serialize/coalesce pending committed edits per plan. Each operation retains its own plan/owner/base revision; changing the active plan cannot redirect a delayed write. Retry with the same operation UUID. A stale revision preserves the local draft and offers Use account version or Save my changes as a copy; never silently overwrite.
- Immediate local feedback is independent of Supabase Realtime. A private authorized plan channel broadcasts only plan/revision invalidation metadata after commit, followed by an authorized snapshot refetch. Use a minimal payload, not the full song document. Plan picker refreshes on open/focus and after local saves; active-plan subscription handles its live content.
- Subscribe before authoritative catch-up, reconcile revisions, ignore duplicate/older notifications, and refetch on reconnect/focus to repair missed events. A remote update cannot close an editor, steal focus or discard its draft. Switching plans/accounts tears down the old channel and guards in-flight fetches.
- Prefer private Broadcast with owner-specific channel authorization. The permissive authenticated-user example in the docs is not suitable here. Review existing project Realtime settings before changing global access. [Broadcast guidance](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes), [channel authorization](https://supabase.com/docs/guides/realtime/authorization).
- Archive/restore via authorized updates for the first lifecycle feature; permanent deletion and raw DELETE event handling remain separate scope. Postgres Changes has delete-notification security limitations and must not be treated as automatically private. [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).

### Existing-data migration and recovery

Load legacy notes and apply their existing title corrections before conversion. Assign UUIDs once and keep their import/draft operation ID stable across retries. Verify that the bundled 126 tracks, 25 time blocks, 26 sections and all marker flags retain parity. Preserve multilingual names, inherited peak state, source ranges, rollover and terminal unknown ending.

Offer migration explicitly; keep legacy notes/corrections until the new copy is acknowledged. Never send them simply because a user signs in. Import into an account defaults to Create a new plan; replacing a selected plan requires preview and explicit destination. Cancel/invalid input changes neither destination nor active plan. A device draft is scoped by project/user/plan and cannot be submitted under a different account.

Add portable structured-plan export/recovery in the same milestone, coordinated with E3-S1 corrected-note export. The backup contains metadata, versioned content and timing evidence, but no auth session/key. Cloud failure must not strand the user's draft. Full background offline synchronization is not promised until the retry/conflict and storage-denial cases pass.

### Implementation order and QA gates

1. E10-S0: prove email/password Auth/API/session support for the required double-click downloadable file before committing to cloud delivery. E10-S1: configure confirmed Chrome/file-origin/public-signup requirements and the reported-applied migration workflow; prepare configuration and adapter/build boundaries.
2. E11-S1: canonical model/UUID/legacy conversion spike with parity fixtures; E10-S2: schema, RLS, RPC and operation receipts using that contract.
3. E10-S3: real email/password login. E13-S1: acknowledged save/draft/retry/conflict state machine. Then E11-S2: private plan create/list/open/rename; one named plan survives reload before adding editing features.
4. E11-S3: explicit import and local-to-cloud migration; E12-S1–S2: sections and songs with immediate recomputation.
5. E13-S2: cross-tab/device live sync; E13-S3: portable recovery; E12-S3: reorder/move; E11-S4: archive/restore. P2 refinements can follow the minimum connected release.
6. E14-S1–S3: independent database, staging and UX/release gates throughout implementation, with the final connected single-file/offline packaging gate before release.

Test levels remain distinct: pure model/repository tests; mocked browser errors/races; local Supabase migration/policy tests; real staging tests with two disposable accounts and two sessions. Existing 16 Node and 54 browser checks are local/offline baseline evidence only and do not prove cloud login, RLS, email delivery or live synchronization.

Release gates include user A/B/anonymous direct-access denial, hostile documents, owner reassignment denial, actual email/password login in the required double-click downloadable file, reload/session expiry/logout, slow/failed/ambiguous writes, stale revisions, late responses after switching plans/accounts, reconnect catch-up, and duplicate events. Verify cloud UX at 390×844, 1280×900, 1280×600 and 200% reflow with keyboard and mixed-language names. Keep original offline contexts network-blocked.

Performance targets are measurements to establish, not platform guarantees: committed local edits should render on the next Svelte update (target under 100ms for baseline fixtures); another healthy staging session should converge without reload (target under two seconds). Record environment and measured times, including failures. No cloud story is Done from mocks alone.

Initial implementation now exists: CloudApp/AccountArea, a typed Supabase account adapter, website + connected single HTML, and prepared private metadata SQL. Public Auth settings and real file-origin settings fetch returned HTTP 200 with email/signup enabled. Remaining activation is documented in [docs/supabase-setup.md](docs/supabase-setup.md). The user reports applying SQL and enabling Email; public settings show confirmation off. The agent made no remote configuration changes; real password login has not yet been verified. Tracks and guest notes remain local; canonical documents/save/sync stories are still pending.


## Email/password activation update — 2026-10-12

This update supersedes earlier email-code/template/SMTP requirements for the initial login release. Selected flow: email/password signup and sign-in using Supabase only. Public settings confirm Email/signup enabled and Confirm email off. The user reports running the prepared SQL; do not rerun it automatically. Email addresses remain unverified; mail-based recovery is later scope.

- E10-S1: selected provider/build configuration implemented; no SMTP/template gate for basic password auth.
- E10-S3: password UI/SDK implemented. AC: signup with a session opens My plans; signup without a session does not claim login; wrong credentials show a useful error; passwords are cleared and never persisted by app code; reload/logout/account-switch behavior passes. Real Chrome file-origin signup remains a user verification gate.
- E10-S2/E14-S1: SQL reported applied; actual A/B/anonymous direct-access policy tests remain pending.
- E11-S2: create/list plan names implemented; opening/renaming full cloud plans remains pending. E11/E12/E13 song documents/editing/save/live sync are not complete.

Cloud stories remain In progress until their full acceptance criteria have real evidence. Earlier instructions requiring SMTP for the initial auth gate are superseded, not a blocker for this selected flow.

## Full-content slice implementation — 2026-10-12

Implemented: stable event UUIDs/shared derivation with empty sections; prepared additive migration 004; backfill and legacy-create trigger; owner-scoped document reads and revisioned/idempotent saves; plan opening/restoration/switching; add sections/songs; title/flag edits; removal/undo; rename; explicit Save; failed-draft recovery/export/conflict copies; atomic note import and corrected local-set migration. No backend reset or remote migration occurred.

Local PostgreSQL tests pass for ownership/raw-write denial, missing writer Auth schema access, backfill, retries/conflicts, validation and import rollback. Browser checks are intercepted fixtures, including connected file-origin tests. Hosted application and a real add/save/reload journey remain the next user gate. E13 live notifications, plan-list search/count refinements, authored range editing, reorder/archive and full structured backup restore remain pending.

## Authentication hardening update — 2026-10-12

Retain managed Supabase email/password accounts; custom JWT issuance/static API-key examples are not adopted. Implemented client session-storage/configuration hardening and a 12-character new-password rule. Server password policy, verified public email ownership/recovery, rate-limit review, hosted HTTPS/CSP and real staging account isolation are explicit public-release gates in E15. The current confirmation-off standalone setup remains unchanged; no admin setting, signing key or credential was altered. See docs/supabase-setup.md for required dashboard actions.
