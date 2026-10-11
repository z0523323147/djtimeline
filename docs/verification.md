# Foundation verification — 2026-10-11

Completed stories: E7-S1–S4, E1-S1–S2, E5-S1. The migrated source preserves the pre-migration HTML for reference.

## Local evidence

- Windows; Node 24.14.1, pnpm 12.11.2; pinned dependencies and committed lockfile.
- Frozen-lockfile installation succeeds. Only esbuild's required package build script is explicitly allowed.
- Astro development server starts, `/` builds as a static route, and browser APIs are confined to mounted interaction code.
- `pnpm check`: Astro and Svelte report zero errors and zero warnings. TypeScript emits informational deprecation hints for the intentionally retained clipboard fallback.
- `pnpm build`: produces `dist/site/index.html` plus its assets and `dist/party-map.html`. Independent builds preserve the other output.
- 14 Node tests pass: parser baseline/grammar, rollover, sparse/repeated markers, uncertainty, filters, encoded links, storage identity/validation, and offline packaging including closing-tag payloads.
- 42 Chromium browser tests pass across hosted and direct `file://` builds at 1280×900, 390×844, and 1280×600.
- Browser coverage includes import/cancel/invalid input, `.txt` files, edit/save/reload, multilingual names, combined filters, corrected Google links, final-section Enter/Space activation, rapid-switch button alternatives, hostile text rendering, corrupt imported data, storage denial, clipboard fallback success, and clipboard failure feedback.
- Offline contexts disable networking. Request observation across every workflow reports no network or sibling assets; only the HTML document itself is requested. No app page errors were observed.
- The 4:00 Hip hop end marker opens `Me pregunto` without inventing an ending time. Every section has a separate full-size button in **Browse all sections**; rapid switches at 2:07–2:15 and 3:49–3:56 are covered without stretching the diagram.
- Two unchanged offline builds produce identical 75,119-byte files. SHA-256: `c0a3f9c507928955b619afc617b6abf6373ea3dfd445ffe3d44c5c337efcfa46`.

Bundled model: 126 tracks, 25 blocks, 26 sections, 42 downloads, 25 peaks, 2 ideas. Existing imported-note and correction keys are preserved; scoped title corrections reload correctly.

## Limits and next work

UX correction: verified removal of the duplicate section dropdown/card and continuous first-band rendering. Existing phone/desktop/short-height tests now select through the timeline, tabs, or full-size section-list buttons. A model check proves overview/peak grouping preserves detailed genre sections. Both outputs and the refreshed screenshots reflect this change.

Local Chromium tests establish behavior for this browser/runtime, not universal file-origin storage or clipboard guarantees. Other browsers may restrict these APIs differently; the app reports session-only changes and copy failure. Storage-full/quota-specific coverage, enlarged-text accessibility checks, import preview/restore, portable export, and the complete Linear visual refinement remain in the backlog.

GitHub Actions repeats installation, checks, builds, tests, and reproducibility and uploads the offline file. Its remote result is not inferred from local tests. No hosting deployment is configured.

The structural validator is a packaging guard, not a general HTML security auditor; runtime request checks and untrusted-text browser tests complement it. Google link parameters are tested without performing a real audio download or navigating to Google.

Genre detail mode is verified in all six browser projects: House at 1:30 and the subsequent EDM boundary in the 1:30–1:40 interval are rendered at readable size. The compact overview remains the default; the Genre details toggle reveals all section names and source boundaries. Updated screenshots were captured at settled phone/desktop viewports.
