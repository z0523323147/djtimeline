# Verification — 2026-10-11

The shared Astro/Svelte app renders a full-width timeline above tracks on desktop and mobile. Party/Tracks tabs, Genre details mode, and the black selection underline are removed. Linear’s homepage/product examples informed the neutral surfaces, clear hierarchy, restrained borders, and quiet row actions.

## Local evidence

- Windows, Node 24.14.1, pnpm 12.11.2, pinned dependencies and lockfile.
- Astro and Svelte checks: zero errors and warnings; three informational clipboard deprecation hints.
- Both website and self-contained offline builds succeed.
- 15 Node tests pass; bundled data remains 126 tracks, 25 blocks, 26 sections, 42 downloads, 25 peaks, and 2 ideas.
- 42 Chromium workflow checks pass across hosted and direct-file builds at 1280×900, 390×844, and 1280×600. After the final viewport/selection adjustment, the six layout/navigation checks pass again.
- Tests verify timeline above tracks, absence of tabs/detail toggle/underline, both labels in every genre bar, estimated ruler endpoints from 12:30 to 4:00, and illuminated terminal selection.
- Import/cancel, title correction/reload, combined filters, encoded Google search, clipboard fallback/failure, storage denial, hostile imported text, repeated markers, and exact-source track navigation are covered.
- Offline contexts disable networking and observe requests: no required network or sibling assets, and no app page errors.
- The 4:00 Hip hop section opens Me pregunto inside the final bar, with no inferred finish time. Large section/time jump buttons remain available.
- Hebrew-leading titles retain automatic RTL direction and align with English titles.
- Two offline builds produce identical 79,724-byte files. SHA-256: 8ac9dee3fef461eef3232651ec5dbdd813ea187e32f8b3d6c03a6a049e45c32a.

## UX and limits

A whole-party color strip provides macro context. Detailed bars occupy a bounded scroll region so tracks remain nearby. Rows use their own estimated time ranges, with five- or ten-minute ruler marks and endpoints. All names and changes remain inside the bars. Mobile uses horizontal panning and readable text rather than shrinking the desktop chart. Each row can have a different scale; source intervals remain authoritative. Track spacing supplies diagram estimates, never new source timestamps.

Desktop, phone, and selected-bar screenshots were visually reviewed. Other browsers may restrict file-origin storage/clipboard differently; the app reports session-only edits or copy failure. Quota-specific testing, enlarged-text accessibility, import preview/restore, and portable export remain in the backlog.

GitHub Actions is configured; remote results are not inferred from local checks. No hosting deployment is configured. Google query encoding is tested without navigating to Google or downloading audio.
