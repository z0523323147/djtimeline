# TASK-MUSIC-RECOGNITION — integration investigation

Date: 2026-11-01. Owner/integrator: Codex. Status: research complete with limitations.
Scope/category: documentation. Owned files: this record and [investigation](../music-recognition-investigation.md).
Acceptance: compare documented YouTube/Shazam/browser API routes, recommend an integration compatible with Party Map, explain timing/cost/validation limits. Implementation is outside this request.

## 1. Middleware & Ingestion Analysis

User requested investigation and suggestions for automatically listening and identifying tracks. ALLOWED: repository inspection, public documentation research and local research records. No external mutation, microphone use, purchase or deployment is needed. Assumption: recorded music identification is the priority; humming is distinguished.

## 2. RAG & Memory Strategy

Read README, plan, backlog, workflow, current state, decisions and gate rules. Inspected TrackDialog, document validation/putTrack and workspace integration references. Public primary sources and research date appear in the investigation. Product source has no discovered recognition integration. Historical evidence does not establish live provider performance.

## 3. Orchestration & MAG Blueprint

Single integrator; no delegation authorized or used. Inspect project, research primary documentation, write bounded proposal, run documentation gate, self-review.

## 4. Tools, Skills & Harness Definition

Used PowerShell/rg, web research and apply_patch. Read the host canvas skill to assess applicability; this is a targeted existing-project integration proposal, delivered as repository documentation rather than a separate analytical app. No runtime skill activation is claimed for local packages. Several detailed ACRCloud pages were inaccessible; recommendation avoids undocumented SDK/auth claims. No provider code or credentials added.

## 5. MCP Architecture

Existing service plugins are not necessary for public API research. Proposed app topology is browser capture → authenticated server proxy → recognition provider. No endpoint or remote configuration was changed.

## 6. Lifecycle Hooks (Observability)

Controlled check: node scripts/workflow/runner.mjs gate TASK-MUSIC-RECOGNITION docs. Documentation links, privacy scan and workflow tooling all returned PASS (exit 0), report 5ccc8152-4ae8-4c2b-887c-2441dda23fb7. Browser research is outside wrapper coverage. Record contains public/synthetic information only.

## 7. Guardrails Inspection

Documentation/privacy/tooling gate: PASS. App builds, browser tests and live recognition benchmarks: NOT RUN; documentation-only scope. Hosted/native release gates remain open. Reviewer: Codex, self-review [PASS] for research scope: intent addressed, primary sources linked, costs distinguish marginal usage from subscription billing, existing source/offline contracts preserved, and unmeasured behavior explicitly identified. Important limits: no documented public YouTube sound-input route found; no direct Shazam browser SDK established; recognition time cannot become exact plan timing; vendor claims do not prove accuracy.

## 8. Final Validated Deliverable

Deliverable: linked investigation, recommended AudD prototype with ACRCloud comparison and native Shazam option. No product story marked complete and no backlog priority changed. Next observable implementation milestone is Listen once → review → existing editor; automatic collection follows measured evaluation and timing/provenance design.
