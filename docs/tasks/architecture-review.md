# TASK-ARCH-REVIEW — project review against the eight-pillar architecture

Date: 2026-10-26. Owner/integrator/reviewer: Codex primary agent. Status: review complete with findings. Single-agent review; no separate independent reviewer.

Scope: review the new engineering architecture, its uncommitted workflow implementation, and selected application boundaries. Owned file: this record only. Preserve all existing working-tree changes. Acceptance: ground findings in inspected code and reproducible synthetic evidence; distinguish current checks, historical evidence and unverified release behavior. This is a targeted architecture review, not an exhaustive audit of every application path.

## 1. Middleware & Ingestion Analysis

The request is to review the project according to the new architecture. ALLOWED: local inspection, synthetic probes, existing tests and a privacy-safe review record. No implementation fixes, deployment, migration, external account operations or delegation are needed. Preserve shared source, three outputs, multilingual/timing semantics and historical HTML. No credentials or private plans were used.

## 2. RAG & Memory Strategy

Sources: root AGENTS/README/plan/backlog, the [starter](../../AGENTIC-ARCHITECTURE-STARTER.md), [workflow](../agentic-workflow.md), [current state](../current-state.md), [decisions](../decisions.md), [adoption plan](../agentic-adoption-plan.md), [adoption backlog](../agentic-adoption-backlog.md), [prior task evidence](workflow-adoption.md), [integration contracts](../integrations.md), [gate contract](../workflow-gates.md), local skills, package/CI scripts, workflow implementation/tests, entry points, builder, sync/local adapters and relevant model/browser tests.

Inspected structure matches D01: Astro owns the website shell, website/connected reuse CloudApp, offline uses PartyApp, and CloudApp delegates to PartyApp. The downloadable builder compiles one embedded IIFE and CSS from the shared components. Workflow tooling is separate from application source. This is source inspection, not fresh browser or artifact parity evidence.

All eight workflow pillars have procedures and task fields. Wrapper observability, no-MCP applicability and a single integrator are appropriate for this project. Existing tests cover failure propagation, missing required checks, logging failure and synthetic privacy patterns. The findings below identify gaps despite those passing checks.

The current session's supplied skill catalog explicitly lists both set-notes-parser and standalone-html-release at their repository paths. This is fresh host discovery evidence for this session; earlier records accurately describe their earlier unavailable discovery. No historical records or adoption statuses were rewritten. Hosted E14/E15/E16 and native accessibility gates remain unresolved.

## 3. Orchestration & MAG Blueprint

One reviewing agent, no delegation authorized or used. Sequence: retrieve constraints, inspect contracts and code, run the tooling gate, probe suspected failures with disposable synthetic fixtures, run existing application tests, evaluate findings, record and recheck documentation. Application implementation remains unchanged.

## 4. Tools, Skills & Harness Definition

Applied the discovered [standalone-html-release skill](../../.agents/skills/standalone-html-release/SKILL.md) for shared-source and evidence boundaries. Read the parser skill for its constraints; no parser behavior was changed. Used local PowerShell, Node, Git inventory and the fixed workflow wrapper.

The package-backed test operation failed before tests ran. A separate offline package-manager diagnostic returned ENOTCACHED for pinned pnpm 12.11.2. No installation or unchanged retry was attempted. The existing application test command ran directly with Node and passed all 33 tests; this is outside wrapper coverage and does not turn the failed wrapper result into PASS.

Two disposable probes used synthetic data only: an isolated temporary Git repository with a deleted tracked Markdown file, and the actual local adapter/PlanSync with blocked storage. Fixtures were not added to the project. A timeout/descendant probe returned 124 and the descendant did not survive in this run; no process-cleanup defect is claimed from it.

The available Canvas skill was inspected for presenting an architecture artifact. Its prescribed managed workspace directory could not be resolved from the available Windows project inventory; no matching Playlist Timeline workspace was present. This review uses the repository's established task-record format. No canvas activation or preview is claimed.

## 5. MCP Architecture

Not applicable: local files and tools cover this review. No MCP service, account connection or external integration was needed. Supabase remains the browser SDK/RLS application boundary; no hosted authority was inferred from local fixtures.

## 6. Lifecycle Hooks (Observability)

Initial tooling gate PASS: report b7d5aad5-83ff-4512-97af-cb17980d5bb5. Docs/privacy/tooling post-event IDs: 2c34821f-e3bb-48bf-9128-446cb4876f4b, 3a366e21-afe1-407c-ae9c-0a0a1b3bf28d, 3f1cf199-3e75-46ee-9c6c-a99d7ce90778.

Package-backed test operation FAIL, exit 1: post-event dfc3903f-7710-4dd1-906e-6fbc98225fe5. Evidence stays in ignored local .workflow-evidence with the existing retention rules. Direct inspection, probes and fallback application tests are outside wrapper coverage. No raw process output, user content or account identity is stored here.

## 7. Guardrails Inspection

Review outcome: **[AMEND WITH CORRECTION]**. The review itself is complete; the following implementation corrections remain open. Neither was fixed as part of this review.

### Finding 1 — P1: a local memory-only save is acknowledged as saved to an account

Locations: [local adapter](../../src/lib/local-plans.ts), lines 21–25 and 65; [sync](../../src/lib/plan-sync.ts), lines 46–48; [workspace](../../src/views/CloudPlanWorkspace.svelte), lines 44–47.

When LocalStorage is denied or full, local persist catches the failure and changes persistentSession to false, but saveDocument still resolves with a normal snapshot. PlanSync then clears pending/dirty and unconditionally sets status to Saved to account. The workspace close-page guard depends on dirty plus unavailable storage, so clearing dirty removes the guard for this unsaved edit. A storage warning is rendered, but the success acknowledgement and lost close-page protection contradict it. Even successful durable local edits receive the incorrect account wording.

Reproduced using createLocalPlanService and PlanSync with throwing getItem/setItem methods, creating a synthetic plan and committing one track. After flush the observed state was status=Saved to account, dirty=false, storageAvailable=false, persistentSession=false. The only edit is in memory and will not survive a fresh page instance.

Correction: represent local durability separately from acceptance into memory and cloud revision acknowledgement. Retain a session-only unsaved/recovery state and close-page protection until durable persistence or an appropriate recovery action; choose local/account wording from the adapter outcome. Add integration coverage for successful local storage and denied/quota-limited local storage, including reload and the close-page guard. This concerns D05 and existing E19/E14 storage acceptance, not a new backend requirement.

### Finding 2 — P2: unstaged tracked-file deletion breaks the privacy gate

Location: [privacy scanner](../../scripts/workflow/privacy.mjs), lines 25–36.

git ls-files --cached includes index entries deleted only from the working tree. The scanner opens every matching candidate without checking whether it still exists. An ordinary unstaged removal or rename of a tracked Markdown/source file therefore raises ENOENT and makes all category gates fail as scan-unavailable, even if the removed path contains no secret and all remaining files are safe. This principally breaks local pre-staging use; a committed deletion is absent from a clean CI index.

Reproduced in a disposable repository: create/add removed.md, delete it from the working tree, keep an empty dist directory, and invoke the actual scanner. Observed ENOENT. Existing privacy tests exercise signature matching but do not exercise this inventory case.

Correction: exclude confirmed working-tree deletions from the inventory or skip only ENOENT for a deleted candidate, preserving failures for unreadable existing files and other errors. Test the complete scanner against unstaged deletions/renames as well as existing secret-bearing files.

Checks actually run:

- PASS: docs/privacy/tooling category gate; all ten workflow tests pass on the current project tree. This does not contradict the isolated deletion failure.
- PASS: 33 existing Node application/database/packaging tests, run directly.
- CONFIRMED: both findings through actual implementation paths and synthetic fixtures.
- FAIL / prerequisite unavailable: pinned-pnpm test wrapper; offline diagnostic ENOTCACHED. No application assertion failed in that wrapper because tests never started.
- NOT RUN: fresh type checks, all three builds, browser/responsive/direct-file checks and reproducibility. This review changes no application/build behavior; earlier build/browser evidence remains historical.
- NOT RUN: hosted account isolation, real reconnect/edit paths, server auth policy, HTTPS/CSP and native accessibility. Existing release gates remain open.

Evaluative review by the primary agent: request covered through a scoped review, findings grounded in code and reproduced, public-only evidence retained, no overlapping writers or external mutations, no production-readiness claim. Tooling PASS is scoped to those checks and cannot override the reproduced defects.

## 8. Final Validated Deliverable

Deliverable: this review, two prioritized findings and correction/verification steps. No product story is newly marked Done and no existing adoption completion is reclassified as a release approval. No source, generated output or historical HTML was edited.

Next work: fix local save/durability semantics first; fix privacy inventory handling next; prepare the pinned pnpm toolchain before running the applicable state/tooling gates for those fixes. Hosted/native release work remains with the existing E14/E15/E16 queue.
