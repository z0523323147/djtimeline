# Five recommended project skills

These are prioritized skill specifications, not installed `SKILL.md` packages. Each can become a focused skill folder with a `SKILL.md` containing `name`, `description`, and the workflow below. Keep runtime configuration separate from this recommendation document.

## 1. party-map-ux

**Purpose:** Improve the party overview, section selection, and mobile track workflow without returning to a dense dashboard.

**Use when:** Changing timeline visuals, layout, navigation, touch targets, labels, or the space available to tracks.

Suggested description: Improve this DJ planner's overview-first UI, readable time/genre changes, and desktop/mobile drill-down.

Workflow:

1. Read the accepted product decisions in [plan.md](plan.md) and inspect the current UI.
2. State the DJ action the design must make easier: understand flow, identify hip-hop timing, or inspect tracks.
3. Preserve quiet colors, simple wording, readable titles, and 44px primary controls. Handle narrow chart segments through usable alternatives without falsifying time proportions.
4. Verify desktop track space and separate mobile views at the documented sizes and a short-height viewport.
5. Report observed behavior and measurements; do not substitute a screenshot for interaction checks.

Expected output: a working UI change, before/after user benefit, and viewport/interaction evidence.

## 2. set-notes-parser

**Purpose:** Maintain the stateful raw-text grammar and truthful time boundaries.

**Use when:** Changing imports, marker matching, time rollover, genre sections, inferred placement, or text export.

Suggested description: Parse and serialize DJ set notes while preserving time/genre state, special markers, multilingual titles, and timing provenance.

Workflow:

1. Read the grammar in [AGENTS.md](AGENTS.md) and the existing parser before changing interpretation.
2. Establish fixtures for inherited genres, embedded parentheses, both hyphen markers, inline/section peaks, ideas, rollover, and sparse input.
3. Distinguish recorded timestamps, known intervals, and unknown endings. Diagram estimates must not become exact source times.
4. Verify structured track order and flags before rendering; include the terminal section and repeated timestamps.
5. For serialization, prove corrected-note re-import retains meaning.

Expected output: parser/model changes, meaningful fixtures, and explicit semantics for any new grammar.

## 3. browser-local-set-data

**Purpose:** Keep imported notes and corrections recoverable and scoped to the right set.

**Use when:** Changing local storage, import replacement, editing, export/restore, or named-set management.

Suggested description: Manage browser-local DJ notes and corrections, with safe import replacement, set-scoped persistence, export, and honest failure states.

Workflow:

1. Identify the active-note and correction storage keys and their identity relationship.
2. Preserve the active set on cancel, invalid input, and file-read failure.
3. Validate stored record shapes and exercise blocked/full/corrupt storage; distinguish durable saves from session-only edits.
4. Ensure copy and encoded Google search use the current corrected title even when persistence fails.
5. Check reload, switching note sets, and browser/origin portability. Add a recovery path when that is the requested change.

Expected output: coherent state transitions, error messages users can act on, and persistence/recovery evidence.

## 4. multilingual-web-accessibility

**Purpose:** Keep mixed Hebrew/Russian/English titles and keyboard/mobile interactions usable.

**Use when:** Changing text direction, SVG interaction, editing forms, dialogs, focus, or accessibility labels.

Suggested description: Review mixed-language DJ interfaces for text direction, accessible timeline activation, focus continuity, and readable controls.

Workflow:

1. Use automatic direction for titles, with LTR time controls and numeric displays.
2. Review complete Hebrew, Russian, English, and mixed-punctuation names without translating or normalizing displayed titles.
3. Verify Enter/Space activation, Escape/cancel behavior, dialog return focus, and meaningful detail focus after drill-down.
4. Check enlarged text, long titles, color-independent labels, and mobile targets.
5. Report specific failures with the triggering title/interaction and a minimal fix.

Expected output: accessible interaction changes or a prioritized review with reproducible evidence.

Reuse applicable guidance from the available `hebrew-rtl-web` skill. Its React/Tailwind-specific conventions should be adapted to this plain HTML app; do not add that stack solely to use the skill.

## 5. standalone-html-release

**Purpose:** Deliver one reliable HTML file with matching documentation and checks.

**Use when:** Refactoring the active file, preparing a release, adding checks, consolidating entry points, or preparing static hosting.

Suggested description: Validate and package this dependency-free HTML planner, preserving offline behavior and checking browser workflows and release documentation.

Workflow:

1. Confirm the active entry point from [README.md](README.md); do not update historical files unintentionally.
2. Check JavaScript syntax, parser outcomes, browser flows, and local-file behavior appropriate to the change.
3. Preserve inline assets and no required network dependencies; treat Google search as an explicit outbound action.
4. Refresh screenshots, release notes, limitations, and backlog status using actual evidence.
5. Prepare hosting or repository changes only within the requested scope; distinguish preparation from publication.

Expected output: a verified portable artifact, reproducible checks, and accurate release documentation.

## Adoption order

Start with `party-map-ux` and `set-notes-parser`, then `browser-local-set-data`, `multilingual-web-accessibility`, and `standalone-html-release`. Keep skills short and add scripts only for concrete repeated checks. Installing or registering them is a separate implementation step.
