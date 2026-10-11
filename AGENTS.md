# Project instructions

Applies to this entire project. Read [README.md](README.md), [plan.md](plan.md), and [backlog.md](backlog.md) before substantial work.

## Product

- Build a DJ preparation tool: see the whole party first, then inspect tracks.
- Preserve the accepted dark layout: desktop overview beside tracks; mobile Party/Tracks views.
- Make hip-hop entry/exit changes immediately understandable; retain genre section details.
- Keep copy, edit, Google download search, and pasted/.txt import working.
- Prefer plain user-facing wording, readable text, and large controls over dense dashboards.

## Source and architecture

- The active app is shared Astro/Svelte source in `src/`. `dj-set-timeline-v2.html` is the preserved pre-migration baseline (internal v3.0).
- The other HTML files are historical iterations. Do not edit them unless requested.
- Astro owns routes/static shell; Svelte owns interactive page views; parsing/model/filter logic remains DOM-independent.
- Keep the offline deliverable one HTML file with inline CSS/JS and no required sibling assets; development dependencies are allowed.
- Build website and offline outputs from the same Svelte components; do not duplicate app logic or depend on external island chunks in the offline file.
- Parse notes into structured tracks, blocks, and sections before rendering.
- Keep parsing, filtering, persistence, and rendering separate; prefer readable functions over compressed code.
- Use pnpm for the planned framework toolchain. Backend and hosting changes still need a concrete need within the requested scope.

## Data rules

- Time and genre persist until replaced. Only a full genre line declares a genre.
- Preserve parentheses inside track names and the original Hebrew, Russian, and English text.
- `--`/`---` mark downloads; `///` marks ideas; remove these markers from displayed names.
- A standalone `הפגזות` starts a peak section; a new genre resets it unless also marked peak.
- Inline `הפגזות` tags that track only. Blank or marker-only lines do not create tracks.
- Treat sequential 12-hour rollover consistently; do not assume AM/PM or invent exact times.
- Equal track spacing is diagram placement, not evidence of a real transition timestamp.
- Preserve current titles in copy and Google search after edits. Encode search query parameters.
- Treat imports and saved data as untrusted text. Use `textContent`, not HTML interpolation.
- Explain unavailable browser storage honestly; session-only changes are not durable saves.

## Interaction and validation

- Use 44px or larger primary controls; narrow timeline sections also need a usable alternative.
- Support click, tap, Enter, and Space for timeline selection, with clear selected state and focus.
- Use automatic text direction for multilingual names and LTR direction for time controls.
- Verify relevant flows at 390×844 and 1280×900; include short viewports when layout changes.
- For parser changes, check inheritance, markers, inline parentheses, rollover, and time uncertainty.
- For state changes, check import/cancel, reload, storage failure, corrected copy, and corrected search.
- Run the checked-in offline packaging tests for packaging changes; add parser and browser coverage as planned. Structural validation does not prove file:// behavior.
- Update docs and backlog status only when the implementation and evidence support the change.

## Collaboration

- [SKILLS.md](SKILLS.md) and [SUBAGENTS.md](SUBAGENTS.md) contain recommendations, not installed runtime configuration.
- Do not launch subagents automatically because their roles are documented; delegate only when authorized.
- When delegation is authorized, assign bounded file ownership and one integrator; preserve the shared website/offline source and regression coverage.
