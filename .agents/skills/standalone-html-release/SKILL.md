---
name: standalone-html-release
description: Validate Party Map shared-source website and single-file offline/connected build contracts, packaging tooling and release evidence.
---

Read root AGENTS.md, docs/current-state.md, docs/workflow-gates.md and package.json. Active source is src/; historical HTML must stay unchanged. Use pinned pnpm 12.11.2; npm exec --yes --package=pnpm@12.11.2 -- pnpm is the documented fallback.

Website, local offline and connected outputs share Svelte logic. Inline required CSS/JS/SDK for downloadable files; do not add sibling chunks. Local offline must make no automatic network requests; connected uses public config only. Never inspect/persist credentials or real account plans as release evidence. App code must not import workflow tooling or gain telemetry.

Choose checks proportional to scope. For packaging changes run check, test, all three builds, check:offline, test:e2e and reproducibility. Structural checks cannot prove file:// behavior; browser tests must exercise direct files and request audit. UI changes include 390×844, 1280×900 and short views, large alternatives, keyboard, multilingual text and uncertainty. For documentation-only contract review, inspect source and run docs/tooling/privacy gates; explicitly mark builds/browser NOT APPLICABLE and do not claim a new release.

Retain unverified hosted E14/E15/E16 and native accessibility gates. Report packaged versus executed versus verified capability, self versus independent review and actual artifact evidence. No deployment, migration, hosting or global configuration follows from invoking this skill.
