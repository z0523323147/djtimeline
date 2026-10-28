# TASK-PILOT-DOC-LINKS — maintainable documentation-link gate

Date: 2026-10-26. Integrator/reviewer: primary Codex agent, self-review. Scope: add an executable local-link check for project instructions and workflow records. Owned: `scripts/workflow/docs.mjs`, its focused test cases and this record. Depends on E23–E26 tooling/contracts. Acceptance: detect broken local links with nonzero exit, accept encoded spaces/relative links, exclude fenced examples/external URLs, check nested task records and integrate without app changes.

## 1. Middleware & Ingestion Analysis

ALLOWED as bounded real local maintenance under E27. A link check makes task evidence navigable in future work. Preserve historical prose and HTML; no public/hosted state changes, private content, app assets or runtime telemetry.

## 2. RAG & Memory Strategy

Inspected README/AGENTS, workflow docs, package/CI and offline builder contracts. Fact: no docs link script existed in the baseline. Assumption: file existence is sufficient for this narrow gate; heading anchors and external availability remain explicit limitations. [Current state](../current-state.md) and [decisions](../decisions.md) provide current authority.

## 3. Orchestration & MAG Blueprint

Single-agent bounded implementation; no overlapping writers or subagents. Review follows integration/checks. No independence claimed.

## 4. Tools, Skills & Harness Definition

Manually read/applied [standalone-html-release](../../.agents/skills/standalone-html-release/SKILL.md): inspected build boundaries, selected docs/tooling/privacy category because no app/packaging logic changes. Discovery remains unverified. Implemented checkLinks and scoped file inventory; synthetic temp fixtures cover valid/broken links and encoded spaces. Harness: inspect → implement → gate → correct → recheck → self-review. Python metadata validator unavailable; Node fallback passed. No installation or external mutation.

## 5. MCP Architecture

NOT APPLICABLE: local files and Node establish the result; no service permissions/auth required.

## 6. Lifecycle Hooks (Observability)

Executed wrapper gate under TASK-PILOT-DOC-LINKS; operation IDs and actual results are retained in ignored bounded evidence and summarized in [verification](../verification.md). Only gate child commands are covered. Direct edits/inspection are not intercepted. No private notes, outputs, raw prompts or credentials are logged.

## 7. Guardrails Inspection

Required: docs/privacy/tooling. Actual evidence and corrections are recorded after the final gate below. App builds/browser/direct-file runs: NOT APPLICABLE for this change, because source/build scripts/artifacts are untouched. Existing packaging tests may be run as a supplemental check; they cannot establish new file-origin behavior. Hosted E14/E15/E16/native accessibility remain open. Reviewer: primary Codex agent, self-review. Rubric: requested outcome, complete local inventory, truthful limits, usable fixed commands, privacy and unchanged build/source constraints. No independent review ran.

## 8. Final Validated Deliverable

Linked implementation: [checker](../../scripts/workflow/docs.mjs), [tests](../../scripts/workflow/workflow.test.mjs), [CI](../../.github/workflows/ci.yml), [package scripts](../../package.json). Supported maintenance gate, not a hosted release. Remaining next steps: observe fresh-session skill catalog and obtain independent/hosted/native review when those product gates are in scope.

Observed result: [PASS], self-review by primary Codex integrator. Pilot gate `a7ea8406-f35e-4751-83b9-c9c5e7942c95` passed docs/privacy/tooling, each exit 0. A disposable nested broken-link probe first produced exit 1 (`5c90aac0-9c93-4613-ab07-a82adad1344d-post.json`); removed it and reran successfully. Ten focused tests pass. No document-content defect required a private input or app edit. Supplemental unchanged application tests passed 33/33 directly with Node; the failed pinned-pnpm wrapper/cache limitation is separately recorded in verification. Final handoff checks rerun after documentation edits. No independent/hosted/browser verification is implied.
