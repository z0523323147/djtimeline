# TASK-UIUX-REVIEW — live website UI/UX review

Date: 2026-10-26. Integrator/reviewer: Codex primary agent. Status: review complete with corrections recommended. Scope: current checked-in website, navigation, timeline, track browsing and editor. Owned file: this record only. Acceptance: inspect actual browser behavior at 1280×900, 390×844 and 1280×600; prioritize observable usability issues without changing plan content.

## 1. Middleware & Ingestion Analysis

ALLOWED: user explicitly requested browser activation followed by UI/UX review. Use existing session for read-only navigation; do not create/import/rename/remove/save cloud content. An empty editor can be opened and cancelled. Preserve all existing working-tree changes. Findings are scoped to observed UI, not an exhaustive accessibility certification.

## 2. RAG & Memory Strategy

Consulted project instructions, README/plan/backlog/current-state/decisions/workflow from the preceding architecture review; inspected current [styles](../../src/styles/app.css), [tokens](../../src/styles/tokens.css), [account UI](../../src/views/AccountArea.svelte), [workspace](../../src/views/CloudPlanWorkspace.svelte), [timeline](../../src/views/PartyPage.svelte), [tracks](../../src/views/TracksPage.svelte), [editor](../../src/components/TrackDialog.svelte), browser fixtures/tests and existing screenshots.

Fresh browser observations supersede screenshot-only assumptions. Served tracked dist/site with the existing localhost server; no rebuild was performed. Existing source and historical screenshots help explain observations but do not prove every current browser path. No account identifiers, plan names or track titles are retained in this record.

## 3. Orchestration & MAG Blueprint

One agent; no delegation. Sequence: source/context inspection, supported website browser access, responsive measurements, safe navigation/editor probes, restore temporary UI preferences, write findings, run documentation/tooling/privacy gate. Product fixes remain separate work.

## 4. Tools, Skills & Harness Definition

Read computer-use guidance and used the supplied cua browser API for all browser interaction. Earlier file:// access was rejected by browser protocol policy and was not retried or bypassed. The normal website at http://127.0.0.1:4180 opened successfully through the supported HTTP browser surface. The server serves dist/site only; the blocked downloadable HTML was not proxied or repackaged.

Browser active: desktop 1280×900, phone 390×844, short desktop 1280×600. Used DOM-backed geometry/computed colors, screenshots, semantic controls and native accessibility state. One disclosure locator did not match; inspected fresh state and used the exposed accessibility action instead. No hidden application state or browser storage was queried through page evaluation.

Read the available Canvas skill during the preceding architecture review; its required managed workspace directory was not resolvable in this Windows workspace. Kept this deliverable in the established project task-record format. No Canvas preview is claimed.

## 5. MCP Architecture

Session browser tools and local shell suffice; no new integration installed. An existing authenticated session was present. Plans were opened read-only; no database content mutation was submitted. Theme was temporarily inspected in dark mode and restored to the original light setting; viewport override was reset. Browser tab was retained for the user.

## 6. Lifecycle Hooks (Observability)

Browser operations, screenshots and local server are outside fixed-wrapper telemetry. Record only sanitized measurements here. A cropped screenshot of the blank Add track dialog is saved in the session visualization directory, outside the repository; it excludes account identity, plan titles and track content. No private screenshots or browser state were added to Git.

Documentation/privacy/tooling gate is required after this record is written. No app source/build was changed, so no new build or full regression-suite claim is made.

## 7. Guardrails Inspection

Verdict: **[AMEND WITH CORRECTION]** for the inspected UI. Reviewer: primary Codex agent; no separate independent reviewer. Findings below distinguish measured defects from design improvements.

### 1. P1 — Download and Idea labels are difficult to read in light mode

Observed computed colors: Download rgb(193,232,162), Idea rgb(215,186,255), track-panel background rgb(255,255,255). Calculated relative-luminance contrast is approximately 1.37:1 and 1.70:1 respectively. These are small status labels central to DJ preparation. Their pale fixed colors survive the light-theme token switch, unlike Peak, which uses a theme token.

Evidence: [fixed label colors](../../src/styles/app.css), selectors .download and .idea; [track tags](../../src/views/TracksPage.svelte). Correction: provide theme-aware semantic tokens and verify tag text against each theme's panel background. Keep the text/icon cues.

### 2. P2 — Opening a populated plan puts tracks well below the first viewport

At scroll position zero on a populated 26-section plan, first track top was about 1053px at 1280×900 and 1322px at 390×844. On phone the genre-sequence panel alone was about 523px tall. Account heading, navigation, plan heading, toolbar, ruler, full genre grid and track filters all precede the first track. The overview-first intent is preserved, but the long opening stack makes the inspect-tracks step unnecessarily distant.

Evidence: live DOM geometry; [account layout](../../src/views/AccountArea.svelte), [timeline/genre sequence](../../src/views/PartyPage.svelte), [styles](../../src/styles/app.css). Correction: reduce repeated heading/navigation space and make the full genre list expandable while retaining an obvious, large-control path to every section. Keep the full-width ruler above tracks and avoid Party/Tracks tabs.

### 3. P2 — Repeated genre sections lack visible timing identifiers

Genre buttons show only genre and track count. Repeated Hip-hop, House or Edm sections can look identical, including repeated genre/count combinations. Their useful time identifiers are in title/ARIA text, which does not give phone users a visible distinction before choosing.

Evidence: live genre controls and [button markup](../../src/views/PartyPage.svelte). Correction: include a concise visible start/range on each large alternative control; preserve ~ or range wording for uncertain times. Evaluate this together with the expandable sequence improvement so added labels do not further bury tracks.

### 4. P2 — Mobile My plans returns to a placeholder with the actual list hidden

On phone, press the plan toolbar's My plans button. The plan closes and Choose a plan appears, while the mobile plans drawer stays collapsed. The user must press the other My plans control to reveal the list. The empty area offers Import notes rather than the plan selection/create actions implied by the navigation.

Evidence: live return-to-plans flow; [backToPlans and drawer state](../../src/views/AccountArea.svelte). Correction: have this navigation reveal the mobile list and focus its heading/search. Give a truly empty workspace a direct Create plan action alongside import.

### 5. P2 — Full scale touch target is smaller than the project's control contract

Measured selected-ruler Full scale button: about 65.7×32px at 390×844. It is the direct way to restore timeline detail after selection, but its height is below the project's 44px control target. Large section alternatives do not replace this action.

Evidence: live button rectangle; [scale-reset rule](../../src/styles/app.css). Correction: preserve compact text while providing at least a 44px activation area and verify the sticky ruler's resulting height on short phone windows.

### 6. P2 — A download-shaped row action actually opens a Google search

The row link uses a downward arrow/tray icon. Its accessible name and tooltip correctly describe Google search, but those cues are not persistently visible on touch devices. The visible symbol suggests downloading a file, and the nearby Download flag adds ambiguity.

Evidence: live action/link semantics and [track action markup](../../src/views/TracksPage.svelte). No external search was launched. Correction: use a search/external-search icon and a concise visible label where space permits, retaining current corrected-title query encoding.

Lower-priority design observations: Peak/Download/Idea flags are hidden under the same Overnight & track options disclosure as day offsets, although flagging is a routine preparation task. Empty plans still present inactive previous/next controls and the full search/filter apparatus. Consider exposing common flags separately and simplifying only the empty state.

Verified strengths:

- No horizontal page overflow in the measured desktop/phone initial layouts.
- Keyboard Enter on a large genre button selected its section, focused the track heading and scrolled it below the sticky ruler; measured heading gap was about 16px.
- Selected boundaries and timing uncertainty remain explicit; search-no-match feedback gives a Reset recovery path, which restored the list.
- Editor opens focused on Track name; Cancel restores focus to Add track. No save was submitted.
- Short-window editor caps its height and scrolls: expanded content about 657px inside a 540px dialog at a 600px viewport. Footer below the viewport is reachable through dialog scrolling; no clipping defect is claimed.
- Dark-mode shell remains coherent; original light preference was restored. Detailed dark-theme track contrast was not measured live.

Limits: no touchscreen device, mobile software keyboard, native screen reader, 200% zoom, login/recovery, import completion, removal/undo, save, offline file or real reconnect journey was exercised. Prior automated results remain historical. The browser's 390×844 viewport is responsive-layout evidence, not physical-device evidence. Existing saved-status durability finding remains in the [architecture review](architecture-review.md), not a newly tested browser defect here.

## 8. Final Validated Deliverable

Deliverable: six prioritized findings with measured evidence and bounded correction directions, plus verified strengths/limits. No application files or generated outputs were edited; no product/backlog acceptance was closed. Suggested implementation sequence: light-theme readability and mobile navigation, then opening hierarchy/repeated-section labels, then touch target and search-action affordance. Run appropriate UI/state gates with responsive browser checks after implementation.
