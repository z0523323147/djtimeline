# Track-first planner requirements

Updated: 2026-10-12. Status: core implementation complete locally; migration 005 confirmed applied, actual original-set import/reload/export verified. Remaining release evidence and capacity/push refinements are recorded in plan.md. This document is authoritative for the next iteration and supersedes manual section creation, Add song wording, explicit-save-only editing, automatic last-plan opening, and the example dashboard as the connected app's home screen.

## R1 — Start empty, keep plans within reach

- Connected app starts with the account's plan navigation and an empty main workspace. Do not auto-open the cached last plan or render the bundled set as an account plan. Authentication controls precede private data.
- Desktop: persistent searchable My plans rail, approximately 240px, alongside the main workspace. Timeline remains above tracks inside the workspace. Rail can collapse to increase timeline width.
- Phone: compact current-plan switcher opens a searchable plan drawer; no permanently squeezed sidebar. Plan rows show name, track count, last updated and pending-device status. Paginate/search beyond the first 50 plans.
- No plan selected: one quiet empty state with New plan and Import notes. Empty selected plan: Add track and Import notes. No dummy timeline.
- Switching plans restores only that plan's content/filter context; switching accounts clears private visible state. Pending operations retain their original owner/plan even after switching. New plan opens blank.
- Offline edition uses browser-local named plans and the same empty-first layout without Auth initialization. Existing notes remain discoverable as a local set; bundled notes become an explicit example/import, not a default dashboard. Do not discard legacy corrections.

## R2 — Add tracks, derive sections

- Users create/edit tracks; there is no Add section step or destination-section selector. All visible creation labels use Add track; browsing uses All tracks.
- Minimum fields: track name, manually chosen genre, start time. Optional end time; optional Peak/Download/Idea flags under a compact secondary disclosure.
- Before mixing ambiguous imported twelve-hour notes with new clock times, ask once whether the first source time is morning/night or afternoon/evening. Preserve original marker wording as originalValue when the user resolves it; do not guess AM/PM. Start time is captured from the device clock when the dialog opens, to the current minute, displayed in 24-hour HH:mm. It does not keep changing while the person types. Every field can be overridden; reopening starts a new draft at the new current time.
- Party timing uses elapsed minutes plus an explicit day offset for newly authored tracks. Show next-day input only when required. Never interpret adding a retrospective earlier time as an automatic 24-hour rollover. Legacy 12-hour notes retain their existing relative rollover evidence; no AM/PM/date is invented.
- Genre is a free-text editable combobox. Suggest distinct genres already used in the signed-in user's plans (cached locally when available), matching typed prefixes then substrings. Trim and case-fold for matching/deduplication while retaining display text. Do not merge different labels such as House, Tech house, and House/ dance. New genres remain allowed; no cross-account suggestions.
- Order authored tracks by effective start time; stable sequence breaks ties. Same-minute tracks remain visible in the list; their zero-width timing is not stretched into fake duration.
- Sections are derived contiguous intervals of one normalized genre. Merge adjacent same-genre coverage with no gap; title edits, source time markers and individual peak flags do not introduce genre dividers. A genre returning after another genre or a real gap creates another section. Selecting a derived section selects its tracks by stable UUIDs.

## R3 — Optional ending, continuous playback and gaps

- No authored end: coverage ends at the next known authored track start. Moving/editing/removing the next track recomputes this inferred end; do not persist it as explicit evidence.
- Last track with no end is open-ended. Keep it selectable inside the timeline using an end cap; any display padding is an estimate, never a stored finish.
- Explicit end earlier than the next start creates an empty timeline interval with grid but no genre fill. Example: House at 01:00 ends 01:07; Hip hop at 01:12 leaves 01:07–01:12 empty.
- Explicit end equal to next start is continuous. Adjacent House at 01:00 and 01:05 with no gap is one genre section, with two tracks below.
- End must be later than start after day offset. Explicit overlap with another known track is rejected with a field-level message; offer correction, never silently truncate the recorded end. Equal starts use stable order and point markers; don't imply simultaneous multi-lane playback.
- Legacy imports often identify a block or a genre change within a range, not an exact track start. Keep exact/range/unknown evidence. Do not apply the new-track Now default to imported tracks, distribute exact starts evenly, or create confirmed silence from missing data. Uncertain coverage is different from a confirmed gap.

## R4 — Focused creation, independent browsing

- Use a compact centered Add track modal on desktop and an adaptive dialog/sheet on phone. Dim and make the background inert while open. Name first; genre/start next; optional end directly available; primary Add track and secondary Cancel.
- Put a quiet + Add track button near the plan/track header. Hover/focus strengthens its appearance; it must be discoverable without hover and at least 44px on touch. A floating mobile + may supplement the header action only if it does not cover track controls.
- Only an explicit Add track action opens creation. All tracks, filters, section selection, copying, menu actions and plan navigation cannot open/collapse/change the creation draft accidentally. Confirmed code issue: CloudPlanWorkspace.svelte showAll currently sets songForm=true; remove that coupling during implementation.
- Enter submits only where appropriate; combobox Enter first selects a suggestion. Escape closes suggestions before the dialog. Cancel never commits. Dirty dismissal retains a per-plan draft or asks to discard; outside clicks cannot silently lose entered text. Restore focus to the opening control. Surface validation inside the dialog.
- On successful local commit, close the dialog, reveal the new track, derive sections immediately, and start automatic save. If local persistence is denied, keep the form/draft usable and show session-only status instead of claiming durability.

## R5 — Compact two-row ruler and timeline grid

- Latest user direction supersedes the all-five-minute mobile labels/staggered-ruler proposal: full HH:mm hour/endpoint labels stay on the TOP row; intermediate minute-only numbers stay on ONE bottom row.
- Labels use five-minute resolution on desktop and ten-minute resolution on phones. Extremely long ranges can coarsen labels/grid to avoid collisions and unbounded tick counts; short ordinary party ranges retain the requested resolution.
- Five-minute major grid extends across proportional timeline lanes and confirmed empty gaps; one-minute minor grid appears when pixel spacing permits. Labels/grid share numeric coordinates; none changes recorded source evidence.
- Hip-hop entry/exit labels show full HH:mm, including both ends of an uncertain range. Actual gaps have no genre fill, and unknown final endings remain selectable caps.
- Every track row shows time. Source-period estimates divide the duration to the next recorded marker by that period's track count, then derive each start/end from its position. Display ~ and Estimated; do not persist interpolated timestamps as exact. Explicit endings remain unmarked; omitted authored endings follow the next known start and are marked inferred. An unknown final ending is never guessed.
- A floating Back to timeline action appears while browsing tracks with the timeline above the viewport. It supports touch/keyboard, focus return and reduced motion.

## R6 — Automatic database saving and offline cache

- Add/edit/delete/undo commits update UI immediately and automatically queue a revisioned Supabase save. No separate Save click required. Network writes occur after commits, not on keystrokes. Existing Save becomes Retry only for a failed operation; status remains quiet near the title.
- Status vocabulary: Saving, Saved to account, Saved on this device — waiting for connection, Save failed — Retry, Changed elsewhere. Saved to account requires acknowledgement.
- Cache plan metadata, acknowledged snapshots and pending mutations by project/account/plan, preserving stable IDs, base revisions and operation IDs. Previously opened plans must reopen/edit offline after reload; uncached plans show unavailable offline. Browser storage can be denied, cleared or scoped differently across file paths; report actual capability.
- Evaluate IndexedDB from Chrome file:// first, then use validated localStorage fallback if needed. No service worker/local server is required. Passwords/private keys never enter exports or plan cache.
- On reconnect, validate session/owner before syncing; never replay under another account. Serialize/coalesce per plan, retry ambiguously acknowledged operations idempotently, handle expired sessions, and preserve conflicts as local copies. No last-write-wins overwrite.
- Switching plans while offline keeps each independent draft and queue. Sign-out locks private cached UI; never display A's cache to B. Retained recovery must be scoped and explicitly unlocked by the correct account; browser cache is not encrypted merely because keys contain a user ID. Cross-device changes use the existing E13-S2 authorized notification/refetch design.

## R7 — Import original notes and portable account backups

- Accept original pasted notes and .txt unchanged: inherited time/genre, full-line parenthesized genres, inline title parentheses, --/--- download, /// idea, standalone/inline Hebrew peak markers, multilingual titles and sequential rollover.
- Preview counts, time evidence, genre changes, warnings and destination. Unknown initial genre stays unspecified rather than guessed. Cancel/invalid input changes nothing. Default creates a new plan; replacing an existing plan requires a named destination and a pre-import recovery copy. Appending requires an explicit choice and timing-conflict preview.
- Latest clarification: the pasted 126-track default set is NOT an existing database plan. Import it as a new private database plan; do not replace an unrelated plan. Preserve the user's source; canonical bundled source differs only in blank/trailing whitespace for this set. Current corrections, if present, need preview before deciding which version to import.
- Prepare a validated document and import manifest now. Upload via the signed-in browser's owner-scoped atomic create-with-document API, with a stable retry operation. The agent must not invent an owner, request a password/admin key, or report remote upload from local parsing alone. Read back after acknowledgement and verify counts/content. Migration 004 availability must be verified first.
- Export selected plan or all of the signed-in user's plans to a versioned UTF-8 JSON backup. This is application data, not an administrative database dump: no other users, auth.users, JWTs, credentials, receipts or system tables.
- Backup retains metadata, stable track identities, explicit times/ends/day offsets, timing uncertainty, original/current names, genres, flags and source provenance. Unsent drafts can be included with clear device-pending status. All-plan export must fetch every page/document, failing clearly if incomplete.
- Restore validates version, lengths, limits, ownership-independent content and timing; preview then create new owner-scoped plans atomically per plan with retry receipts. Ignore exported owner IDs; new plan IDs under the current account. No silent partial-success claim for a multi-plan restore: show each result and retry missing entries without duplication.
- Corrected original-format notes export remains useful but cannot losslessly express explicit track endings without an agreed extension. JSON is the lossless backup; label any omitted fields in text export instead of discarding them silently.

## R8 — Minimal visual system and themes

- Use Linear-inspired hierarchy: one navigation rail/drawer, one active-plan header, timeline above generous track rows, restrained borders and progressive disclosure. Remove persistent editor panels and repetitive instructional paragraphs. Keep primary actions visible.
- Support Dark, Light and System, default System with explicit user override retained on this browser. Preserve hip-hop pink and peak amber meaning in both themes; selected state and grid contrast need separate theme tokens. Respect reduced motion and automatic text direction for Hebrew/Russian/English; time fields are LTR.
- Copy/edit/Google download search/remove use icon controls with accessible names/tooltips and 44px targets. Track rows have no visible numbering. Genre buttons show their track counts rather than section ordinals.
- Test 1280×900, 1280×600, 390×844 and 200% reflow with keyboard, touch, dialog focus, error/status announcements and both themes. Measure first-track visibility and no horizontal page overflow. Plan rails may scroll independently; timeline should not acquire internal scrolling to hide dense labels.

## Role review and sources

The orchestrator owns order/scope; UI/UX owns modal, plan navigation and ruler prototype; data architecture owns timing/model migration; sync owns durable cache/outbox; QA/accessibility own evidence. These are responsibility assignments, not a claim of independent subagent reviews or completed implementation.

- [Linear issue creation](https://linear.app/docs/creating-issues): focused creation modal and recoverable drafts inform the proposed Add track interaction, adapted to this product.
- [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): inert background, contained focus and focus restoration.
- [WAI editable combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): keyboard-selectable genre suggestions with custom input.

## First release acceptance

Sign in → deliberately open/create a plan → Add track with Now start and manual genre → see its automatically derived section → receive a cloud save acknowledgement → reload and restore. Add a track with an explicit early end and verify the real gap. Go offline, reopen a cached plan, add a track, reload, reconnect and save without duplicates or another account's data. Browse All tracks without opening an editor. Import the provided default set once as a new cloud plan, then export/restore a lossless backup.
