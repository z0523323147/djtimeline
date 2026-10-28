---
name: set-notes-parser
description: Change or review DJ notes parsing, markers, inherited genre/time and timing uncertainty in the shared Party Map model.
---

Read root AGENTS.md, docs/current-state.md and relevant src/lib/parser.ts, documents.ts and tests before changing interpretation. Keep parsing DOM-independent and shared by website/offline/connected builds.

Only a full parenthesized genre line changes genre; preserve parentheses in track titles and Hebrew/Russian/English text. Time/genre inherit; standalone peak persists until a new genre, inline peak tags one track. Strip download/idea markers without generating blank tracks. Preserve UUIDs and original timing provenance. Sequential twelve-hour rollover never establishes AM/PM or exact per-track times; unknown endings remain unknown. Authored 24-hour/day-offset timing follows document v2 rules.

Use synthetic fixtures for inheritance, markers, parentheses, sparse/terminal sections, rollover and uncertainty. Treat import/storage as untrusted text; never put real notes or sessions in evidence. Run pnpm check and pnpm test for model changes; add relevant browser/build checks for affected interaction/packaging. Report actual results and semantics, not visual placement as timing proof.
