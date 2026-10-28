# Eight-pillar workflow adoption plan

Updated: 2026-10-26. Status: local workflow implemented and piloted with documented runtime limits; see [adoption record](tasks/workflow-adoption.md) and [pilot evidence](tasks/pilot-doc-links.md).

## Goal and scope

Make the eight-pillar architecture a repeatable development workflow for Playlist Timeline. Preserve the DJ app and its shared Astro/Svelte website, offline, and connected builds. This is an engineering-process change, not a request to add agents, RAG storage, MCP, telemetry, or an orchestration backend to the shipped app.

Portable source: [architecture starter](../AGENTIC-ARCHITECTURE-STARTER.md). Work items: [adoption backlog](agentic-adoption-backlog.md). Existing [product plan](../plan.md), [product backlog](../backlog.md), and [track-first requirements](track-first-requirements.md) retain their product scope. The starter is reusable guidance, not installed runtime configuration.

## Historical baseline before implementation

- P1 ingestion: AGENTS.md captures strong product/data/delivery constraints, but no standard task intake record exists.
- P2 grounding/memory: README, requirements, plan/backlog, and verification record decisions/evidence. Superseded history and conflicting current-state wording remain mixed together.
- P3 orchestration: SUBAGENTS.md defines recommended roles and one integrator; roles are not registered agents and delegation remains authorization-dependent.
- P4 tools/harness: package scripts, pure model tests, browser tests, packaging validation, and reproducibility exist. SKILLS.md explicitly describes recommendations rather than installed skill packages.
- P5 MCP: no checked-in project integration inventory was found. Session tools do not establish installed project configuration; Supabase is an app SDK integration.
- P6 hooks: CI/tool outputs provide logs. No checked-in project lifecycle-hook configuration or unified task trace was found.
- P7 gates: .github/workflows/ci.yml runs checks/builds/tests/reproducibility. No explicit eight-pillar completion report or dedicated secret-scanning step was found there. Hosted isolation and native accessibility remain separate product gates.
- P8 delivery: README and docs/verification.md distinguish local/mocked/live evidence, but no reusable task completion record exists.

Evidence basis: repository inspection for the architecture review and planning task. This baseline implies no fresh app tests, hosted checks, tool registrations or hook execution. Current observations are recorded separately in the task records. Previously documented test counts remain historical evidence.

## Invariants

- Preserve single-page timeline-above-tracks interaction, multilingual titles, timing uncertainty, corrected copy/search, import/recovery, and 44px controls.
- Keep active logic in src/ and build all editions from shared components. Preserve historical HTML and single-file offline behavior.
- Keep passwords, tokens, private plans, backups, and real account evidence out of tracked task records, logs, and artifacts.
- No automatic subagent dispatch, external mutation, hosting change, or new runtime dependency follows from this plan.
- Prefer project-local, portable checks; verify actual runtime capability before choosing hooks. Do not edit global agent configuration as an incidental step.

## Sequence and ownership

One implementing agent acts as integrator. Role labels below describe responsibilities, not permission to spawn agents. If delegation is later authorized, assign bounded files and independent review explicitly.

### A1 — Current knowledge and task contract (P0; E23)

Reconcile current guidance in a concise docs/current-state.md and dated docs/decisions.md. Mark historical sections clearly without erasing evidence or treating unverified release gates as complete. Add docs/agentic-workflow.md and docs/task-record-template.md, covering all eight pillars. Link the workflow from AGENTS.md once its instructions are concrete.

Owner: integrator/documentation. Dependencies: existing project requirements and verification records. Exit: a fresh task can identify current behavior, constraints, sources, scope, and evidence requirements without resolving contradictory historical instructions.

### A2 — Execution and integration contracts (P1; E24)

Prioritize actual project skill packages for parser/data safety and standalone release. Keep global installation separate; use a supported project-local discovery location and prove discovery before claiming activation. Define task assignments and tool contracts. Inventory local tools, the Supabase app integration, and any genuinely needed MCP tools in docs/integrations.md.

Owner: integrator/tooling. Dependencies: A1. Exit: installed versus proposed capabilities are explicit; one representative task follows a bounded harness loop; a local task can justify no MCP/no delegation.

### A3 — Privacy-safe lifecycle evidence (P1; E25)

Select verified runtime hooks or project-command wrappers. Capture sanitized pre/post metadata for major controlled operations, with retention and failure behavior. Limit coverage claims to observed operations. Never put agent telemetry in the offline app or log real plan content.

Owner: integrator/tooling. Dependencies: A1 and A2 tool contracts. Exit: synthetic success/failure events are correlated, sensitive synthetic values are excluded, and unsupported hook coverage is documented honestly.

### A4 — Two-tier completion gates (P0; E26)

Define change-category checks and an aggregate report that consumes actual exit results. Preserve existing CI and add focused privacy/secret checks with synthetic fixtures. Add a documented evaluative review with explicit verdict and reviewer identity. Reuse E14/E15/E16 release stories for hosted/security checks; do not create duplicate product implementations.

Owner: integrator/quality. Dependencies: A1 for gate design; A2/A3 for integrated evidence. Exit: a synthetic failed check prevents PASS; self-review cannot be represented as independent review; documentation completion cannot imply production readiness.

### A5 — Pilot and final adoption evidence (P1; E27)

Run the workflow on one bounded real project change, selected when implementation begins. Prefer a local change with an observable result and meaningful existing checks. Record all eight pillars, actual tool results, applicability decisions, remediation, and handoff. Include current relevant app checks if source/build paths are touched.

Owner: integrator; reviewer only if authorized and available. Dependencies: A1–A4. Exit: docs/verification.md records observed workflow adoption and limitations, with no change to unverified hosted/native product gates.

Execution order: E23 → E24 → E25 → E26 integration → E27. E26 gate specification may follow E23 before hook implementation. Priorities express importance, not permission to bypass prerequisites. No dates or effort estimates are asserted without implementation evidence.

## Validation and completion

Documentation: verify links, status/dependency consistency, all-eight-pillar coverage, and absence of sensitive evidence. Tooling: meaningful synthetic tests for redaction, failure propagation, retry bounds, and gate reporting. Existing app checks remain change-dependent: pnpm check, pnpm test, relevant builds, pnpm test:e2e, and reproducibility as required by the affected contract. Use the established 390×844, 1280×900, and short viewports for UI changes; packaging changes require direct-file browser evidence as well as structural checks.

Adoption is complete only when E23–E27 meet their acceptance criteria and a real pilot is recorded. Creating this plan/backlog completes planning only. Public hosting, database administration, account verification, private Realtime, IndexedDB, and native assistive-technology checks retain their existing scope and status.

## Adoption outcome — 2026-10-26

E23–E27 local acceptance criteria are met; see [completed backlog and evidence mapping](agentic-adoption-backlog.md). Fixed command wrappers replace unavailable runtime-hook interception. Repository skill packages are validated and manually usable; actual refreshed host discovery remains unverified and is explicitly documented under the allowed capability limitation. No independent reviewer ran. Existing unverified hosted/security/native product gates remain unchanged.
