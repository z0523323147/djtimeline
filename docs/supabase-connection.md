# Supabase connection checklist

Updated: 2026-10-12. Planning only: no Supabase project is connected and no remote schema/provider setting has changed.

## Received and selected

- Project URL: `https://aemfewsfcrcmtafnypxa.supabase.co`. The supplied `/rest/v1/` address is a data endpoint, not the SDK base URL.
- Public publishable key: received in the conversation; its value is not copied into this repository. No privileged credential is needed in chat.
- Delivery: double-click the downloadable HTML (`file://`), with no local server. A hosted frontend, callback bridge or launcher is not approved.
- Google was the first choice, but the user prefers another method if Google Cloud resources are needed. Google does require an OAuth client ID/secret configured in Google Cloud/Supabase. Confirmed method: email verification-code login, avoiding Google OAuth setup and a redirect round trip. [Google setup requirements](https://supabase.com/docs/guides/auth/social-login/auth-google), [email code login](https://supabase.com/docs/guides/auth/auth-email-passwordless).

The first implementation gate remains real file-origin authentication and persistence in the target browser. Email verification code is confirmed by the user; it has not been implemented or validated. Email/password is an alternative if requested.

## Still needed

1. Target browser/device: Chrome, Edge or another browser? Is the same downloadable file also expected to work on mobile?
2. Existing project: are there tables/users/another app we must preserve, or is the database empty?
3. Access: initially only your own account, existing invited accounts, or public signup? Plans are proposed private per account; shared editing is separate scope.
4. Email delivery: for initial testing, can you receive codes at an email address belonging to a member of the Supabase project team? Supabase's default mail service is limited; broader production use needs suitable SMTP configuration. Provide only delivery/setup status, not credentials or an account password. [SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).
5. Migration workflow: you run supplied reviewed SQL in the Supabase SQL editor, or choose an appropriately scoped authorized workflow. URL + browser key cannot create tables or configure Auth. A staging project/two disposable accounts are preferred for isolation tests.

## Email-code setup to prepare

In Supabase Authentication, enable the Email provider. Configure the relevant Magic Link email template to contain `{{ .Token }}` so the passwordless request sends a code rather than its default clickable link. The app will request the code and verify the email/code through Supabase; it will not require returning from a hosted callback page. Test expiry/resend/errors and the chosen signup policy. Exact dashboard navigation should be checked at implementation. [Official passwordless guide](https://supabase.com/docs/guides/auth/auth-email-passwordless).

The file-origin gate must verify Auth/API requests, code entry, session storage, reload/refresh and sign-out without disabling browser protection. If it fails in an agreed browser, record the exact issue and discuss alternatives rather than introduce a hidden server. The existing offline edition stays usable with networking disabled.

## Proposed local configuration

During E10-S1, create ignored local configuration using `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Commit only placeholder env examples. Public values will be embedded in the connected build; secret/service-role keys, passwords and sessions will never be used there. The offline build will not initialize the cloud client. [API-key guide](https://supabase.com/docs/guides/getting-started/api-keys).

Supabase preparation will be a reviewed migration/provider checklist tailored to the existing project. This document does not authorize deleting/resetting tables, changing global settings affecting other apps, publishing private plans, or disabling auth protections to bypass setup problems.

## Completion evidence

Connection is complete only after real email-code login works in the downloaded file, private plans survive reload, A/B/anonymous isolation passes direct-access tests, and a second authorized session observes committed edits. Mocked UI tests and the existing 16 model/54 browser checks do not establish a Supabase connection. Keep no-network offline verification separate.
