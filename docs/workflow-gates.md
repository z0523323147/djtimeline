# Completion gates

Run `node scripts/workflow/runner.mjs gate TASK-ID category`. Task IDs must be public opaque labels matching `TASK-[A-Z0-9-]`; never encode account or plan identity. The report lists required checks and category exclusions with reasons. A selected subset through the programmatic API leaves omitted requirements NOT RUN and cannot PASS. Unknown operations/categories fail closed. CLI takes no arbitrary commands.

- `docs` / `tooling`: documentation links, privacy scan, workflow tooling tests.
- `model`: above plus type/static checks and Node/model/database/packaging tests.
- `state` (including auth) / `ui`: above plus all three builds and browser suite. Include storage/account-race cases for state; 390×844, 1280×900 and short/reflow cases for UI.
- `packaging` / `release`: above plus offline structural validation and reproducibility. Browser suite includes direct-file output/request audits. Structure alone never proves file-origin behavior.

Categories compose local requirements. A release category PASS still requires the existing hosted/security/native gates before public release: E14, E15 and E16 in [product backlog](../backlog.md). Documentation-only work does not require app builds or browser runs. Changes to operation contracts require their focused tests; run broader checks when affected scope warrants them.

Operations are defined in [operations.mjs](../scripts/workflow/operations.mjs). `test` remains the original application suite; `test:workflow` adds tooling tests without changing product logic. CI retains its existing checks, three builds, browser checks, offline validation and reproducibility, adding docs/tooling/privacy checks. Local runs do not imply remote CI success.

Tier 1: actual exits, not prose assertions. Any failed/missing required check, spawn error, timeout, unavailable event/report storage or gate exception prevents PASS. Reports are local/ephemeral; store a sanitized summary in the task record. A report is evidence for the current invocation, not a signed attestation or proof that files were never changed afterward. Rerun after relevant edits.

Tier 2: integrator explicitly reviews user intent, completeness, grounded claims, practical usability, hard constraints and residual risks. Identify reviewer/self versus independent and choose [PASS], [AMEND WITH CORRECTION] or [HALT/BLOCK]. Explain applicability and remaining next steps. Self-review can satisfy a local workflow task; it cannot be relabeled independent QA or close an independent release gate. A failed required deterministic check cannot be waived. Existing authorization applies to routine corrections; external permissions remain separate.

Privacy scan scope: tracked and nonignored candidate text files plus current `dist/`; skip ignored local configuration/evidence and synthetic `tests/` fixtures. Detect private-key headers, Supabase secret-key signatures, quoted credential assignments and non-anon/session JWTs; allow public publishable and anon configuration. Output paths and rule IDs only, never matched values. These patterns cannot find arbitrary private prose, obfuscated credentials, binary secrets or every provider token. Manual review remains necessary. Fixtures test positive and negative signatures; fixture exclusion never applies to shipped output. Do not use real secrets to test this scanner.

Documentation checker verifies local Markdown inline-link targets in root workflow/product guidance, docs/*.md, docs/tasks/*.md and the two packages; fenced examples, external URLs and anchors are excluded. It checks path existence, not remote availability, heading anchors, prose consistency or references in code. Review those manually.
