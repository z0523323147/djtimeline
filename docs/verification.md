# Verification — current workflow evidence 2026-10-26

## Local workflow adoption — E23–E27

Scope: project documentation, two local skill packages, fixed command wrappers, synthetic tooling tests and additive CI checks. [Implementation task](tasks/workflow-adoption.md) and [real pilot](tasks/pilot-doc-links.md) record all eight pillars. [Current state](current-state.md) and [decisions](decisions.md) supersede obsolete historical manual-section/explicit-save/mail-code/annotation guidance. Older app evidence below remains dated history.

Observed checks on Windows/Node 24.14.1:

- Ten workflow tests pass: paired events, payload exclusion, stdout/stderr suppression, logging/report failures, missing checks, real failing child exit propagation, spawn error/timeout, privacy positives/negatives, bounded retention, skill metadata and recursive local-link coverage.
- Docs/privacy/tooling aggregate gates pass. Pilot PASS report: `a7ea8406-f35e-4751-83b9-c9c5e7942c95-report.json` in ignored local evidence. Required operations each exited 0; reports list other checks as category exclusions, not executed successes.
- Real disposable broken-link probe in docs/tasks returned FAIL/exit 1 through the wrapper (`5c90aac0-9c93-4613-ab07-a82adad1344d-post.json`). Removed the probe and reran the gate successfully. This proves observed command failure propagation in addition to synthetic aggregate tests.
- Supplemental pinned-pnpm test wrapper failed/exit 1 (`91f40409-d6b4-4048-84a4-d9d5324ec0e4-post.json`); `npm exec --offline` confirmed pnpm 12.11.2 absent from cache, while global pnpm is 11.25.0. Changed package-backed wrappers to offline npm exec to avoid implicit download/retry delay; observed prompt nonzero failure again (`bd88385f-9897-404e-831a-67bbda368fd5-post.json`). No package-backed wrapper PASS is claimed here.
- Supported fallback `node --experimental-strip-types --test tests/*.test.ts scripts/offline.test.mjs` passed all 33 existing model/database/auth/packaging checks. This direct execution is outside wrapper coverage and preserves the failed wrapper result honestly.
- Bundled Python skill validator could not run because `python` was unavailable. Focused Node frontmatter/name/description/scaffold validation passed for both packages; this is a limited validator, not host discovery evidence.
- `git diff --check` passed; no diffs in src/, dist/ or historical HTML. Local evidence exclusion verified with `git check-ignore`. Reviewed local documentation links and status/dependency consistency. No new app builds/browser/direct-file run required by this workflow-only scope; no remote CI run claimed.

Corrections: fixed scanner false positive on the Svelte autocomplete ternary and slow timeout cleanup, adding regressions; extended link inventory to nested real task records. Privacy signatures scan selected text plus dist and report rule IDs/paths, not matched values. They cannot prove universal absence of secrets/private prose. Evidence is allowlisted, ignored, bounded and outside shipped assets; direct tool calls are not intercepted.

Evaluative reviewer: primary Codex integrator, **self-review**, no independent reviewer. [PASS] for local workflow adoption with limits: scope, evidence, practical commands, privacy and product/build boundaries satisfy the task. Required docs/tooling checks pass; the failed supplemental package invocation is disclosed with a passing direct-test alternative, not waived as a successful run. E23-S1/S2, E24-S1/S2/S3, E25-S1, E26-S1/S2 and E27-S1 meet their local AC. Runtime host skill discovery is unavailable/unverified; manual reading/application is observed. Independent review, hosted E14/E15/E16/security and native accessibility remain unverified. Fresh-session catalog observation and explicitly prepared pinned-pnpm cache are observable next steps; neither blocks the delivered local fallback workflow.

## Historical application verification — 2026-10-12 and dated updates below

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

## Email/private-area implementation — 2026-10-12

The initial account UI and typed Supabase adapter are implemented in CloudApp, AccountArea and lib/supabase.ts. The website and connected HTML expose Sign in; the separate offline entry initializes only the local planner. Supabase SDK 2.117.3 is pinned. Public config is in ignored .env.local; CI uses a synthetic publishable fixture, never a real session or secret.

- Checks: Astro/Svelte zero errors/warnings (three existing clipboard hints); 16 model/packaging tests pass.
- 66 Chromium checks pass: original 54 planner workflows plus 12 intercepted-account checks across website/connected-file × desktop/phone. Account checks cover code errors, signup/sign-in, focus, plan creation, reload, sign-out, A→B clearing, late A responses, mail setup failure, missing schema, denied storage and return to local planner.
- Account tests synthesize server responses. They establish UI/adaptor behavior, not real email delivery or server RLS. No actual user account/code/session was created or logged.
- Real read-only public settings check: Email Auth enabled, signup enabled, email confirmation required. A real Chrome file-origin fetch of /auth/v1/settings returns HTTP 200 with email/signup enabled. This proves Auth endpoint connectivity from file://, not successful code delivery or end-to-end authentication.
- All three builds pass. Offline HTML: 87,661 bytes, reproducible SHA-256 d6dda588c995e25ed2550afdf49d029fef634f6aadf5597b2828cbde1163dd71. Connected HTML: 304,091 bytes, SDK/CSS/JS embedded, no sibling assets. Offline request audits still find no network/sibling requests.
- Prepared SQL enforces metadata ownership with RLS, immutable identity, a restricted NOLOGIN/NOBYPASSRLS writer and owner-checked RPCs. Expected owner is passed to create to prevent an A request acquiring B's token after an account transition. SQL has not been executed against PostgreSQL/Supabase; actual A/B/anonymous allow/deny tests remain required.
- Private account area stores/lists/creates plan names only after schema setup. It does not upload local notes, persist songs or open a cloud timeline. Existing local planner is explicitly labelled browser-local. Canonical documents and Realtime remain pending.

Activation steps are in [supabase-setup.md](supabase-setup.md): user applies the SQL in the dashboard, changes the email template to {{ .Token }}, and configures custom SMTP for ordinary recipient emails. The public browser key cannot make those admin changes. Stories remain In progress; no cloud story is marked Done from mock evidence. Screenshots party-map-sign-in.png and party-map-sign-in-mobile.png show the real signed-out UI with no test account or credentials.


## Password login update — 2026-10-12

- Astro/Svelte checks pass (0 errors/warnings; three existing clipboard deprecation hints). All builds pass.
- 16 Node tests and 70 browser workflows pass: 54 baseline planner checks and 16 mocked password-account checks across website/connected-file and desktop/phone. Covers wrong credentials, signup with/without a session, confirmation-required responses, reload/logout, plan creation, A/B clearing, delayed results, missing schema and denied storage. Mocks do not prove server isolation.
- Offline HTML: 87,331 bytes; reproducible SHA-256 `30796d728b9b86ff7cd767a2b7f269c7aa48e0c84c67bb684cf0f73c8275b26c`. Connected HTML: 303,738 bytes.
- Read-only Auth settings show Email enabled, signup enabled, confirmation disabled. User reports SQL applied. Real account signup/login and two-user database tests remain pending; no real accounts were created by the agent.
- This supersedes the historical code-template/SMTP activation instructions above. Basic password auth needs no email sending with confirmation off; email ownership is unverified and mail-based recovery is not implemented.
- Live read-only anonymous request to club_plans with select=id and limit=0 returned HTTP 401 / PostgreSQL 42501 (permission denied). No rows were read or changed. This confirms anonymous denial only, not authenticated A/B ownership isolation.

## Auth schema permission repair — 2026-10-12
User reports permission denied for schema auth when creating a plan. Prepared an additive migration granting only auth schema USAGE and auth.uid EXECUTE to authenticated and party_map_plan_writer, and made those caller grants explicit in the initial migration. No table grants, policies or user data changed. SQL reviewed locally; no administrative database connection is available, so application and runtime validation remain pending.

## Persistent permission error investigation — 2026-10-12
Public Auth settings rechecked: Email enabled, signup enabled, confirmation not required for project aemfewsfcrcmtafnypxa. User reports the schema-auth error persists after the grant repair. Prepared read-only catalog diagnostic for function owners/definitions, effective privileges, policies and triggers. No live admin access exists; diagnostic SQL has been reviewed but not executed against PostgreSQL. No additional grants or remote changes made.

## Received database diagnostic — 2026-10-12
Supplied report confirms writer Auth schema usage false, auth.uid execute true, both RPC owners/security-definer modes correct, authenticated read-only and anonymous denial, and expected owner policies/forced RLS. Prepared migration 003 using an invoker claim helper matching the supplied auth.uid expression; no Auth grant workaround or elevated writer. Includes transactional synthetic writer-role assertions. Local SQL review only; user application/real create and cross-account runtime evidence remain pending.

## User-confirmed plan creation — 2026-10-12

The user reports that a real plan was created successfully. This establishes success for the tested metadata-create path after the permission investigation. It does not establish full song/document storage, reload persistence, cross-account isolation or live sync. Updated plan/backlog prioritize the additive document upgrade, repository/save flow, opening existing plans and full song editing. Documentation-only changes; no new database migration was applied or app feature implemented in this turn.

## Full-content implementation verification — 2026-10-12

- Astro/Svelte checks: zero errors/warnings; three pre-existing clipboard deprecation hints. Website/offline/connected builds pass.
- 19 Node tests pass. Local PostgreSQL/PGlite executes migration upgrade with existing plans, restricted writer without Auth schema access, document backfill/legacy-create trigger, owner/foreign/anonymous read/write checks, revision conflicts, retry receipts/payload mismatch, malformed/duplicate-ID rejection and atomic import rollback. This is actual local database execution, not hosted Supabase proof.
- 86 Chromium workflows pass on the recorded build: original 54 offline/site regressions plus 32 mocked account/content flows across website/connected-file and desktop/phone. Includes open/add/edit/save/reload, independent plans, account clearing, draft recovery after failure, conflict retention, import/rename/flags/removal/undo and corrected local-set migration. Final destination-selection and scoped-undo checks pass across all four account/content projects (32 checks); the unaffected 54 baseline checks passed in the preceding full run.
- Offline HTML: 108,878 bytes, reproducible SHA-256 121a3534dde134a6ed57d0138ea0ca414e9456564c11cd2ad5a037d6081d7ce6. Connected HTML: 326,001 bytes, no required sibling assets. Offline request audits remain network-free.
- party-map-cloud.png and party-map-cloud-mobile.png show the cloud workspace using synthetic test data, not the user's live account or plans.
- Migration 004 is prepared and tested locally; no remote database writes/configuration changes were made. The user must apply it and verify actual Chrome file-origin add/save/reload and account isolation. Live notifications/range editing and other remaining backlog items are not marked complete.

## Login hardening verification — 2026-10-12

- Public read-only Auth settings: Email/signup enabled, confirmation off. Server password minimum is not exposed by the settings response. Public JWKS contains an ES256/P-256 EC key; this is published-key metadata, not proof of which algorithm a particular issued session token uses. No private signing key or admin credential was accessed or generated.
- Replaced stale-memory-first auth storage with authoritative persistent reads. Blocked removal now throws a visible logout failure. Write fallback clears any older persisted credential before accepting a memory-only replacement; blocked cleanup is rejected. New signup requires 12 characters, while existing-password login retains the provider's rules.
- Added configuration guards for HTTPS Auth URLs and public publishable/legacy anon keys; secret/service-role inputs and URL credentials are rejected. This guard classifies configuration only and never substitutes for Supabase JWT verification. Added private-key ignore patterns.
- 25 Node/model/database/package tests pass, including external-storage replacement/removal, write/read/removal failures and privileged-key/HTTP refusal. All 94 browser workflows pass, including persisted logout failure/retry/reload, session-only storage and password-rule regression checks across website/connected-file and desktop/phone. Astro/Svelte checks pass with only the three existing clipboard deprecation hints.
- Website/offline/connected builds pass. Offline: 108,912 bytes, reproducible SHA-256 b669d4c09e48b335cfd47f06f9df56c6f75c03896ca02b52efb24f04af654d4c. Connected: 327,044 bytes. No automatic offline network requests.
- Existing title/import rendering has no raw HTML/eval insertion in src. This inspection and test coverage do not certify absence of every XSS issue. Hosted password policy, verified email/recovery, HTTPS/CSP and real hosted A/B/invalid-JWT access checks remain E15 public-release gates. The selected SMTP-free confirmation-off setup was not changed.

## Track-first release evidence — 2026-10-12

- 33 Node/model/database/packaging tests and 54 Chromium workflows pass after the final changes. Astro check has zero errors/warnings and one legacy clipboard deprecation hint; Svelte check has zero errors/warnings. Website, offline and connected HTML builds pass.
- Full HH:mm hours/endpoints use upper SVG baseline 13; minute-only labels share lower baseline 33. Desktop labels use five minutes, narrow views ten minutes; browser geometry checks verify no label overlap or row staggering.
- The authenticated original import has 126 tracks, 26 sections, 42 downloads, 25 peaks and 2 ideas. User clarified the initial 12:30 marker meant 00:30. The signed-in UI corrected the document to 24-hour 00:30–04:00, preserved original marker values and renamed the plan. After reload/open the real account acknowledges Saved to account and restores the corrected ruler and estimated first-track time 00:30 → ~00:33.
- Real PostgreSQL jsonb ordering exposed repeated save attempts despite successful writes. Comparing validated canonical documents fixes acknowledgement; a regression proves reordered response keys produce exactly one save. No tracks were added/removed during the clock correction.
- Own-account backup was downloaded and schema-validated before clock correction, retaining a recovery snapshot. Private backup/session/screenshot data stay outside Git.
- Remaining gates include real hosted two-account/anonymous API checks, authored end-gap reconnect coverage, native assistive-technology review, IndexedDB capacity and private Realtime push. Active-plan refresh currently polls every 15 seconds and on focus.

## E22 — Compact sticky ruler (2026-10-12)

The current suite has 60 passing Chromium workflows and 33 passing Node/model/database/packaging checks. New responsive cases verify each section is keyboard-accessible, selection removes minute labels while retaining whole-hour anchors, selected ranges remain marked ~, the terminal ending stays unknown, and the track heading lands below the sticky dock. All-track scrolling forward/back updates section highlighting without filtering the 126 results; full-scale reset restores minute labels. Dock height is under 180px in the checked initial desktop/phone layouts. Website and both HTML builds pass; Svelte check reports zero errors/warnings. Real signed-in UI navigation verifies 01:50–01:57 selection and top-positioned dock without database writes. Previous screenshots and floating-return descriptions are superseded by this dock. Native assistive-technology and hosted account-isolation release gates remain unchanged.

E22-S5 verification: 60 browser workflows pass, including scrolling after enabling Full scale, switching back to section times, visible start/end labels without overlap on phone/desktop, and Top returning to scrollY 0. Packaging tests pass; Svelte check has zero errors/warnings; website and both self-contained builds succeed. Real signed-in UI shows full minute labels retained after scrolling, boundary labels and the restored Top control. No account data was edited.

## E22-S6 — Continuous numbered chapters and UI corrections (2026-10-26)

34 Node/model/database/packaging tests and all 66 Chromium workflows pass across website/offline/connected outputs and desktop/phone/short projects. Static checks, three builds, offline structure and reproducibility pass. Eleven workflow tests and final docs/privacy/tooling gate pass after fixing deleted tracked-file inventory handling. The earlier UI aggregate remains recorded as FAIL solely for that scanner error; its application checks passed. See [full evidence and correction history](tasks/ui-ux-fixes.md).

Numbering is plan-wide and survives filtering; genre and flag counts describe the complete plan. Section selection focuses/jumps to a chapter in the continuous list; wheel scrolling into the next chapter changes ruler highlighting without filtering or saving. Browser regressions cover terminal Space selection, pinned Full scale, counted filters, readable light labels and direct mobile plan navigation. Live mobile first-track top improved from about 1322px to 761px. Synthetic refreshed screenshots show the compact opening; no private screenshot was committed. Hosted/native release gates remain open.
