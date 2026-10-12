# Supabase connection checklist

Updated: 2026-10-12. Initial account UI is built and configured locally. Public Auth/file-origin connectivity is verified; no remote schema/provider setting has changed, and real code delivery/login remain unverified.

## Received and selected

- Project URL: `https://aemfewsfcrcmtafnypxa.supabase.co`. The supplied `/rest/v1/` address is a data endpoint, not the SDK base URL.
- Public publishable key: received in the conversation; its value is not copied into this repository. No privileged credential is needed in chat.
- Browser: Google Chrome. Mobile is not a first-release requirement unless requested.
- Database: empty, as reported by the user; confirm remote state before applying migrations.
- Access: recipients of the downloadable file can sign up with email codes and get their own private plans. No project-team/admin membership is needed to use the app.
- Delivery: double-click the downloadable HTML (`file://`), with no local server. A hosted frontend, callback bridge or launcher is not approved.
- Google was the first choice, but the user prefers another method if Google Cloud resources are needed. Google does require an OAuth client ID/secret configured in Google Cloud/Supabase. Confirmed method: email verification-code login, avoiding Google OAuth setup and a redirect round trip. [Google setup requirements](https://supabase.com/docs/guides/auth/social-login/auth-google), [email code login](https://supabase.com/docs/guides/auth/auth-email-passwordless).

The first implementation gate remains real file-origin authentication and persistence in the target browser. Email verification code is confirmed by the user; the client flow is implemented and mock-tested; real code delivery/login are not validated. Email/password is an alternative if requested.

## Still needed

1. Email delivery: is custom SMTP already configured in Supabase? If not, prepare setup instructions for a supported provider. Public signup requires codes to reach ordinary user addresses; the default service only supports project-team addresses for testing. Configure mail credentials directly in Supabase, not in chat or the downloadable HTML. [SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).
2. Migration workflow: proposed next step is reviewed SQL that you run in the empty project's SQL editor, unless an authorized admin workflow becomes available. The supplied browser key cannot apply schema/Auth configuration. Use two disposable test accounts for ownership checks after SMTP works.

Known choices (Chrome, empty project, recipients can sign up, double-click with no server, email-code login) no longer need reconfirmation. Public signup creates separate private accounts; collaborative plans remain later scope. Never invite ordinary users as Supabase project-team members to bypass the default mail restriction.

## Email-code setup to prepare

In Supabase Authentication, enable the Email provider. Configure the relevant Magic Link email template to contain `{{ .Token }}` so the passwordless request sends a code rather than its default clickable link. The app will request the code and verify the email/code through Supabase; it will not require returning from a hosted callback page. Enable app-user signup, and test expiry/resend/errors. Each new account gets only its own plans. Exact dashboard navigation should be checked at implementation. [Official passwordless guide](https://supabase.com/docs/guides/auth/auth-email-passwordless).

The file-origin gate must verify Auth/API requests, code entry, session storage, reload/refresh and sign-out without disabling browser protection. If it fails in an agreed browser, record the exact issue and discuss alternatives rather than introduce a hidden server. The existing offline edition stays usable with networking disabled.

## Proposed local configuration

During E10-S1, create ignored local configuration using `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Commit only placeholder env examples. Public values will be embedded in the connected build; secret/service-role keys, passwords and sessions will never be used there. The offline build will not initialize the cloud client. [API-key guide](https://supabase.com/docs/guides/getting-started/api-keys).

Supabase preparation will be a reviewed migration/provider checklist tailored to the existing project. This document does not authorize deleting/resetting tables, changing global settings affecting other apps, publishing private plans, or disabling auth protections to bypass setup problems.

## Completion evidence

Connection is complete only after real email-code login works in the downloaded file, private plans survive reload, A/B/anonymous isolation passes direct-access tests, and a second authorized session observes committed edits. Mocked UI tests and the existing 16 model/54 browser checks do not establish a Supabase connection. Keep no-network offline verification separate.

Use [supabase-setup.md](supabase-setup.md) for the concrete SQL/email-template/SMTP steps now prepared. The first private area contains plan names; song documents and live editing are later migrations.
