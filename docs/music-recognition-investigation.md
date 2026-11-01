# Automatic music identification for Party Map

Research date: 2026-11-01. Status: recommendation, not an implemented or benchmarked integration. [Task evidence](tasks/music-recognition-research.md).

## Recommendation

Prototype **AudD** for the existing browser app, with **ACRCloud** as the comparison provider. Add a Listen action beside Add track. Start with identification and review, then introduce an explicit Start listening / Stop listening session that automatically collects detected tracks. Use YouTube as a destination for finding the identified recording. Consider ShazamKit if a native companion app becomes worthwhile.

Assumption: the goal is to identify recorded music playing nearby, or from a mixer/audio input. Speaking a title, humming a melody, and identifying an original recording are different inputs; this proposal prioritizes the last one. No claim is made that one provider recognizes the user's DJ collection best.

## Options and evidence

### YouTube Music / Google sound search

YouTube Music's consumer Sound Search uses the microphone and accepts playing, singing or humming. It is useful immediately as a manual workflow. [Google help](https://support.google.com/youtubemusic/answer/13401025?hl=en).

The documented YouTube Data API search method accepts search parameters such as a text query; it does not document an audio-recognition input. I found no documented public YouTube Music Sound Search API in this investigation. Therefore, do not build automatic import around controlling its microphone button or an assumed result callback. This is a finding about available documentation, not proof that no private or partner interface exists. [YouTube search reference](https://developers.google.com/youtube/data/reference/rest/v3/search/list).

After identification, an encoded title/artist YouTube search link can provide a useful first version without adding YouTube API credentials. A search result is a candidate recording, not proof of the exact remix.

### Shazam / ShazamKit

Apple documents ShazamKit for Apple platforms and Android, including catalog matching and developer-token setup. Apple says its recognition uses noninvertible audio signatures rather than sharing audio with Apple. No browser JavaScript SDK is documented on the inspected overview. It is a strong native-app candidate, but not a direct SDK addition to this Astro/Svelte website or standalone HTML. A native bridge would be separate engineering work. Do not use unofficial Shazam endpoints as the production foundation. [Apple overview](https://developer.apple.com/shazamkit/), [Android SDK](https://developer.apple.com/shazamkit/android/).

### AudD — first prototype

AudD documents an HTTP interface accepting audio uploads and returning artist/title/album plus optional service metadata. A processed request may return no match; that must be a normal result in the UI. The documented song timecode is a position within the recording, not the party's clock time. It also offers separate long-file and stream services. [API documentation](https://docs.audd.io/).

The public site says the standard endpoint analyzes about 12 seconds per request. It lists 300 evaluation requests, then plans starting at $5/month including 1,000 requests, with $5 per additional 1,000. These are published terms checked on the research date, not a purchased plan or quote. [AudD product and pricing](https://audd.io/).

The separate monitoring service takes stream URLs and supports callbacks. A browser microphone is not automatically such a URL; the basic sample-upload route is the simpler first experiment. [Stream documentation](https://docs.audd.io/streams/).

### ACRCloud — benchmark alternative

ACRCloud offers music recognition and maps results to external services, including YouTube, and identifiers such as ISRC. This makes it a credible alternative for recognition plus discovery links. Its published catalog size is vendor information, not evidence of recognition quality for this collection. Obtain applicable pricing and verify sample formats/limits before implementation. [ACRCloud music recognition](https://www.acrcloud.com/music-recognition/).

The documentation index was reachable, but detailed API Markdown pages failed to load through the research tool. No exact Web SDK integration, authentication recipe, price or latency is asserted here. [Documentation index](https://docs.acrcloud.com/reference/identification-api).

## Proposed user flow

1. Select **Listen** and grant microphone access. Explain that short clips are sent to the recognition provider. Show Listening, Stop and the selected input.
2. Capture roughly 10 seconds and identify the recording. Show artist/title, an optional service link, and Add / Try again / Dismiss. Keep No match distinct from network, permission and quota errors.
3. Add opens the existing track editor with the detected title. Genre remains editable; broad provider genres should not silently replace DJ categories. The user chooses a plan time explicitly.
4. In a later **automatic listening** mode, take samples periodically and collect stable matches into a reviewable detected-track list. Default to review; optional automatic adding follows only after timing/provenance support and accuracy testing.

Starting experiment: a 10-second clip every 20 seconds. This is a proposed cadence, not measured optimal coverage. Stop on explicit request; abort in-flight requests where possible and reject late responses after stop, logout or plan/account switching. Show when listening is interrupted. Do not promise operation with the phone locked, app closed or tab suspended without device tests.

Use provider recording IDs/ISRC where available and normalized artist/title as a fallback to merge consecutive detections. Require repeated agreement before auto-acceptance; do not invent confidence percentages when a provider supplies none. Merge repeated observations within a run, but preserve genuine later replays. Remixes and alternate versions need review. Retain unresolved detections visibly rather than silently dropping or guessing them.

## Fit with the current project

Inspected integration points: [TrackDialog](../src/components/TrackDialog.svelte), [document validation and putTrack](../src/lib/documents.ts), and [cloud workspace](../src/views/CloudPlanWorkspace.svelte).

- Keep capture in a small browser module, provider normalization behind an adapter, and repeat-detection logic in pure functions. Svelte owns controls and results. Reuse the existing commit/autosave path for confirmed additions.
- The current document validator projects an allowlist of fields; adding arbitrary recognition properties would not preserve them. Its authored starts are integer plan minutes rendered as exact. Do not store first-heard time as an exact transition. Phase one keeps observations outside the canonical plan until the user confirms a start. Persistent observations or automatic additions require an explicit schema/backup/server validation design and, where needed, an additive migration.
- A later observation record should distinguish capture interval, first/last heard, provider/recording identity and review status from planned or verified track starts. A missed sample or crossfade is not an exact ending. Recognition cannot reliably supply every genre, peak, download or idea flag.
- Put paid provider credentials in a server-side secret, never a VITE variable or downloadable HTML. A proposed authenticated Supabase Edge Function could validate the session, cap clip size/duration, enforce per-user request limits, call the provider and return minimal metadata. This new endpoint is justified by credential protection and billing control; it has not been created or deployed.
- Preserve the local offline edition's no-automatic-network contract. Initial recognition should target the HTTPS connected website. The connected HTML needs separately tested file-origin/CORS/auth handling before support is claimed. Internet recognition is unavailable offline; manual adding remains useful.
- Request audio only after a user action. Discard app-held audio after each request; do not persist clips in plans, backups, telemetry or logs. Verify provider retention and terms before real use rather than claiming provider deletion has been established.

Browser microphone access requires permission and a secure context. File URLs can qualify, but that does not establish compatibility across downloadable editions and devices. A microphone captures its selected input; it does not automatically capture another app's internal audio. Mixer/USB input may be preferable when available, and tab/system capture needs a separately tested path. [Browser API reference](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Cost and evaluation

At one request every 20 seconds, a four-hour session sends 720 requests before retries: 4 × 3,600 / 20. At the published additional-request rate of $5/1,000, that is **$3.60 of marginal recognition usage**. It may fall within the monthly included allowance; this is not the complete invoice and excludes endpoint hosting, taxes and other sessions. One request every 30 seconds would send 480 requests, equivalent to $2.40 at that marginal rate. Stop/caps and retry backoff should bound spend. [Price basis](https://audd.io/).

Before provider selection, compare both on the same authorized test clips: Hebrew/Russian/English tracks, hip-hop, Afro/house, remixes, pitch/tempo changes, noisy room audio, crossfades, unknown tracks and later replays. Measure correct recording/version, false matches, missed tracks, detection delay, duplicates and actual request cost. Published vendor accuracy claims are insufficient.

Suggested first milestone: **Listen once → review candidate → add through the existing editor**. Then test automatic collection during a representative set. Browser checks should cover 390×844 and 1280×900, keyboard controls, microphone denial, no match, unsupported codec, offline/quota errors, stop/late responses and plan/account changes. Live audio/provider tests are separate from mocked UI tests. No provider account, payment, microphone capture, deployment or app implementation occurred during this investigation.
