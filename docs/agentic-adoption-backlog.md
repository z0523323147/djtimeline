# Eight-pillar workflow adoption backlog

Updated: 2026-10-26. Local implementation and pilot are complete with explicit capability limits. All stories below meet their local acceptance criteria, including the documented unavailable-discovery alternative. Host catalog discovery and independent review are not claimed. See [actual evidence](tasks/workflow-adoption.md), [pilot](tasks/pilot-doc-links.md) and [verification](verification.md).

Plan: [adoption plan](agentic-adoption-plan.md). Portable specification: [starter](../AGENTIC-ARCHITECTURE-STARTER.md). Product stories remain in [backlog.md](../backlog.md). IDs E23–E27 are reserved for this engineering workflow queue.

Owner for all stories: one implementing integrator. Role names describe work, not registered agents or delegation authorization. P0 means foundational/required; P1 means adoption work after prerequisites. A story is Done only when its acceptance evidence is recorded.

## E23 — Grounding and task intake · P0 · Done

### E23-S1 — Reconcile authoritative current state · P0 · Done

Pillars: 1, 2. Dependencies: none.

- [x] T1: Create docs/current-state.md from README, current requirements, source/configuration, and dated verification; label inspected versus historically reported facts.
- [x] T2: Create docs/decisions.md with rationale, evidence, and supersession references for current timing, source/build, authentication, storage, and ruler decisions.
- [x] T3: Label contradictory historical plan/backlog sections as historical; retain prior evidence and unresolved hosted/native gates. Link authoritative current state from README/plan/backlog.

Acceptance: a new reader identifies the active shared source, three outputs, current track-first/autosave behavior, LocalStorage/polling choices, and unresolved release gates without following obsolete manual-section/explicit-save guidance. No new live verification is claimed from documentation inspection.

### E23-S2 — Define and activate the project workflow · P0 · Done

Pillars: 1–8. Dependencies: E23-S1.

- [x] T1: Create docs/agentic-workflow.md covering intake constraints, sources, orchestration, tools, MCP applicability, observability, gates, and delivery.
- [x] T2: Create docs/task-record-template.md with task ID, date, scope, owned files, acceptance criteria, all eight sections, evidence and unresolved items.
- [x] T3: Add a short AGENTS.md link for substantial tasks, preserving authorization, privacy, single-source/offline contracts, and proportional treatment of trivial work.

Acceptance: one filled synthetic example distinguishes facts/assumptions, allowed scope, not-applicable pillars, proposed/installed tools, self/independent review, and actual/unrun checks. No secret fields or automatic agent dispatch are required.

## E24 — Skills, orchestration and integrations · P1 · Done

### E24-S1 — Package the first project skills · P1 · Done

Pillars: 3, 4. Dependencies: E23-S2.

- [x] T1: Inspect supported project-local skill discovery and select a portable location; do not assume SKILLS.md installs anything.
- [x] T2: Package set-notes-parser and standalone-html-release guidance with current src/, three-build, pnpm, uncertainty, and evidence contracts.
- [x] T3: Update SKILLS.md to distinguish proposed/packaged/discovered skills; verify actual discovery and invoke one relevant workflow.

Acceptance: both packages have valid metadata and bounded instructions; actual availability is evidenced or explicitly blocked. No global installation, duplicate app logic, or unnecessary runtime dependency is introduced.

### E24-S2 — Define orchestration and tool contracts · P1 · Done

Pillars: 3, 4. Dependencies: E23-S2.

- [x] T1: Add assignment/handoff fields to SUBAGENTS.md: objective, inputs, owned files, dependencies, prohibited actions, output, and acceptance criteria.
- [x] T2: Document single-agent default, authorized delegation, shared-file integration, bounded retries, and recovery for failed operations.
- [x] T3: Document important build/test operation inputs, expected outputs, failure behavior, and side effects.

Acceptance: an example partitions independent work without overlapping writers, reserves integration to one owner, and represents dependent review sequentially. Role documents cannot authorize deployment or messaging other chats.

### E24-S3 — Inventory integrations and permission boundaries · P1 · Done

Pillar: 5. Dependencies: E23-S2.

- [x] T1: Create docs/integrations.md separating local commands, app Supabase SDK access, and any actually available agent MCP tools.
- [x] T2: Record purpose, topology, tool/resource scope, read/write boundary, authentication handling, availability evidence, and supported recovery.
- [x] T3: Define a justified no-MCP path for local work and discovery/permission checks before external actions.

Acceptance: no credentials are recorded; recommended servers are not represented as installed. No new server or SDK replacement is added without a concrete task need.

## E25 — Lifecycle observability · P1 · Done

### E25-S1 — Implement bounded sanitized operation traces · P1 · Done

Pillar: 6. Dependencies: E23-S2, E24-S2, E24-S3.

- [x] T1: Verify available hook capabilities; choose supported project-local hooks or wrappers around controlled operations. Document what cannot be intercepted.
- [x] T2: Define event schema: task/operation IDs, timestamps, sanitized intent/resource category, result, duration, exit code, and evidence reference.
- [x] T3: Implement recording outside shipped app outputs; specify location, access, retention/rotation, and exclusions from Git/artifacts.
- [x] T4: Define failure behavior: report unavailable telemetry without bypassing checks; failed gate execution cannot produce PASS.
- [x] T5: Test paired synthetic success/failure events, logging failure, and exclusion of synthetic passwords/tokens/private plan titles/request bodies.

Acceptance: observed coverage matches claims, records correlate without private payloads, retention is bounded, and the offline app gains no telemetry/network dependency. Use meaningful failure/redaction tests rather than broad production logging.

## E26 — Deterministic and evaluative gates · P0 · Done

### E26-S1 — Produce evidence-based deterministic verdicts · P0 · Done

Pillars: 1, 4, 7. Dependencies: E23-S2 for design; E24-S2/E25-S1 for integration.

- [x] T1: Define required checks by change category: docs, parser/model, state/auth, UI, packaging, and release.
- [x] T2: Add a report/check entry point that uses actual exit statuses and records PASS/FAIL/NOT RUN/NOT APPLICABLE with reasons and evidence references.
- [x] T3: Add scoped secret/privacy scanning for tracked source and deliverable artifacts, with synthetic positive/negative fixtures and documented limitations. Preserve legitimate public Supabase configuration.
- [x] T4: Integrate appropriate gates with existing CI; preserve type checks, tests, three builds, offline validation, and reproducibility.
- [x] T5: Prove a failing selected check or failed gate runner prevents PASS; unrun required checks remain visibly incomplete.

Acceptance: report covers constraints and selected checks truthfully. No scan claims universal absence of secrets. Packaging structure cannot replace file:// browser checks; synthetic/local tests cannot establish hosted ownership or native accessibility.

### E26-S2 — Add evaluative review and completion rules · P0 · Done

Pillars: 7, 8. Dependencies: E23-S2, E26-S1.

- [x] T1: Define a review rubric for user intent, completeness, grounded claims, usability, hard constraints, and remaining risks.
- [x] T2: Record reviewer identity, independent versus self-review, and [PASS]/[AMEND WITH CORRECTION]/[HALT/BLOCK].
- [x] T3: Define correction/recheck flow and distinguish pre-mutation prerequisites from final handoff checks; retain existing authorization for routine edits.
- [x] T4: Link existing E14/E15/E16 hosted/security gates instead of creating duplicate product stories or requiring an LLM to approve every edit.

Acceptance: review cannot waive a failed required deterministic check, invent independence, grant external permission, or describe a planning deliverable as production-ready software. Unresolved items carry observable next steps.

## E27 — Pilot and delivery · P1 · Done

### E27-S1 — Exercise the workflow on a real bounded change · P1 · Done

Pillars: 1–8. Dependencies: E23–E26 acceptance criteria met.

- [x] T1: Select a real local task with a clear outcome and bounded ownership; record scope, constraints, sources, and expected evidence.
- [x] T2: Follow the workflow and record actual skills/tools, orchestration, MCP applicability, sanitized events, checks, corrections, and review verdict.
- [x] T3: Verify relevant user flows/builds when the selected change affects the app. Capture responsive/direct-file evidence when required by AGENTS.md.
- [x] T4: Update docs/verification.md, current-state/decisions, and story statuses only from observed pilot evidence. Deliver linked outputs and limitations.

Acceptance: a fresh reader can trace request → decisions → execution → checks → verdict → deliverable across all eight pillars. Workflow adoption and product release status remain distinct. Missing runtime capabilities or independent review are reported honestly, not silently marked complete.

## Queue and completion rule

Execute E23-S1 → E23-S2 → E24 → E25 → E26 integration → E27. E26 specification may begin after E23-S2. Dependencies are logical sequencing, not authorization for parallel agents.

The original task delivered planning only. The implementation task now records observed local acceptance evidence. Unverified product gates remain in the existing backlog.

## Acceptance evidence — 2026-10-26

- E23-S1/S2: [current state](current-state.md), [decisions](decisions.md), active AGENTS workflow link, [template](task-record-template.md) and [synthetic example](tasks/synthetic-example.md); obsolete history explicitly labeled in root plan/backlog.
- E24-S1: two valid local packages, official location support, manual release-workflow application. Actual host discovery is explicitly unavailable/unverified; documented fresh-session observation is the remaining capability check, as allowed by this story. Node metadata validation replaces unavailable Python validator.
- E24-S2/S3: [contracts](integrations.md) and SUBAGENTS assignment/handoff example cover bounded ownership, recovery, tool effects and no-MCP rationale. No agents launched.
- E25-S1: fixed wrapper events, ignored bounded retention, payload exclusion, paired success/failure, timeout/spawn/logging failures and rotation tested synthetically. Coverage is wrapper-only.
- E26-S1/S2: [category gates](workflow-gates.md), actual-exit reports, privacy fixtures, fail-closed tests and additive CI checks. Primary integrator self-review is explicitly identified; it cannot close independent product QA.
- E27-S1: [real pilot](tasks/pilot-doc-links.md) implemented recursive docs-link checking, observed a real nonzero broken-link probe, removed the disposable probe and rechecked successfully. No source/build/HTML change requires new app-browser evidence.

Verdict: local workflow adopted with limits. This completion does not claim refreshed host skill discovery, universal runtime hook coverage, independent review, remote CI, product release readiness or new hosted/native verification.
