# Supabase email/password and private account setup

Updated 2026-10-12 for Chrome and the double-click connected HTML. Each recipient creates their own email/password account and gets a private **My plans** area. No Google Cloud resources, email templates or SMTP are needed for this selected basic login flow.

The user reports running the prepared SQL. Public Auth settings confirm Email enabled, signup enabled and email confirmation disabled. Real signup/session persistence and two-user database isolation still need verification. The separate offline HTML remains usable without login or network.

## Enable full plan and song storage

The user confirms creating a real plan. The next app build opens plans and edits full content; it needs one additional database upgrade.

1. In project **aemfewsfcrcmtafnypxa**, open SQL Editor → New query as **postgres**.
2. Run the entire [202610120004_plan_documents.sql](../supabase/migrations/202610120004_plan_documents.sql) **once**, after 003. Existing plan names/IDs/owners are retained and receive blank content documents. The result reports the number of plans with documents. Do not rerun 001.
3. Open the new connected HTML or refresh the website. In My plans, click your plan, add a genre section/time and song, then **Save to account**.
4. Wait for **Saved to your account**, reload, and check the song is restored. Create another plan and switch using **My plans**. Check a second ordinary account separately before marking privacy verified.
5. **More → Import notes** previews content and defaults to creating a new plan atomically. Unchecking Create a new plan explicitly replaces the selected plan's draft; save it afterward. From Local planner, **Save set to account** creates a new cloud copy with current title corrections and leaves local notes intact.

Failed saves retain an account/plan-scoped draft and an export option. Revision conflicts preserve your work: export it, save it as a new plan, or explicitly discard it and load the account version. Saved status requires a server acknowledgement. The app blocks switching/sign-out while a document is unsaved; the separate Local planner view does not discard the mounted cloud workspace.

Migration 004 has been tested in local PostgreSQL (PGlite) with owner/foreign/anonymous sessions, raw-write denial, legacy create/backfill, validation, revision conflicts, receipts and atomic import rollback. Browser workflows use mocked Supabase responses; live hosted migration and full-content verification remain pending. The initial content release uses explicit Save; automatic cross-device notifications are not included yet.

## 1. Current authentication settings

In Supabase **Authentication → Sign In / Providers**, Email and signup must be enabled, with **Confirm email off** for this SMTP-free flow. These settings are already confirmed for this project; no further provider changes are needed. The app uses `signUp({ email, password })` and `signInWithPassword`. Signup opens the private area only when Supabase returns a session. [Official password authentication guide](https://supabase.com/docs/guides/auth/passwords).

Email addresses are not verified in this configuration. Email confirmation and password recovery by mail require email delivery; neither is part of this initial flow. Keep your password securely and enter it only into the app, never in chat.

## 2. Try your account

1. Open the newly built `dist/party-map-connected.html` in Chrome with internet enabled, or refresh the local website.
2. Click **Sign in**, then **New here? Create account**. Enter your email and a password (at least 12 characters for new accounts, subject to your Supabase password policy).
3. Click **Create account**. You should enter **My plans** immediately.
4. Create a named plan, reload, and confirm it remains. Sign out and sign in again with the same email/password.
5. A recipient follows the same steps with their own email/password. They should start with an empty private area.

## 3. Apply the private metadata migration

The user reports this migration has already been run. Do not run it again unless troubleshooting a failed transaction. For a fresh project, check the project's Table Editor first. If `club_plans`, either RPC below, or a `party_map_plan_writer` role already exists, stop and review that existing schema rather than resetting it.

1. Open **SQL Editor → New query**.
2. Paste the entire contents of [202610120001_private_plans.sql](../supabase/migrations/202610120001_private_plans.sql).
3. Review, then run it once. It creates the table, a dedicated restricted writer role, owner-scoped row-level security, an immutable identity trigger and create/rename RPCs inside one transaction.
4. Keep the query/result for troubleshooting. If the transaction fails, report the error without credentials; do not remove its privacy checks to force success.

The browser publishable key cannot execute schema migrations or configure authentication. Run this query in your own authenticated dashboard. No database password or service-role key is required by the app.

Signed-in browser users may SELECT only their own metadata. Direct INSERT/UPDATE/DELETE privileges are withheld. The two RPCs run as a dedicated `NOLOGIN`, `NOBYPASSRLS` role with an empty search path and grants only for owner-scoped table operations. Anonymous users cannot read or execute those operations. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), [database function security](https://supabase.com/docs/guides/database/functions).

### If creating a plan reports `permission denied for schema auth`

Run [202610120002_auth_identity_permissions.sql](../supabase/migrations/202610120002_auth_identity_permissions.sql) in a new Supabase SQL Editor query. It grants only schema lookup and execution of `auth.uid()` to the signed-in role and the restricted plan-function role. It does not grant access to `auth.users`, alter RLS, or change existing plans. The four verification flags should all return true. Then retry **Create plan**; no new HTML build or account is needed. Do not rerun the initial table-creation migration.

This is the targeted repair for the missing-grant error reported on 2026-10-12. The user reports that the error persists, so successful repair is not established; the browser publishable key cannot apply or inspect administrative grants.

### Confirmed diagnosis and repair

Diagnostic received 2026-10-12: the RPC owner is correctly party_map_plan_writer, but its auth_schema_usage is false. Execute permission on auth.uid() is true, so schema access remains the blocker. Caller grants, table permissions, policies and RPC signatures match the intended setup in the supplied report. Why the earlier grant did not take effect is not established.

Run the entire [202610120003_plan_request_identity.sql](../supabase/migrations/202610120003_plan_request_identity.sql) as **postgres** in the same SQL Editor. It adds a SECURITY INVOKER helper using the exact subject lookup shown by the installed auth.uid(), then updates the two plan RPCs and three owner policies to use it. Supabase Data API still verifies JWTs; a client-supplied owner ID does not determine identity. Existing plans, restricted RPC ownership/grants, identity trigger and RLS stay intact. No Auth schema grant is required by the writer after this repair.

The migration validates synthetic JSON claims, subject precedence and missing claims as the writer before committing; no accounts or plans are created. Failed assertions roll back the repair. After success, three readiness flags should be true. Retry Create plan, then reload. Real persistence and A/B isolation still need verification. This SQL has been reviewed locally but cannot be executed remotely with the browser key.

### Further diagnostics if 003 fails

1. Confirm the dashboard project reference is **aemfewsfcrcmtafnypxa**, matching the connected page. In the SQL Editor select the **postgres** role and primary database.
2. Run the full [read-only setup diagnostic](../supabase/diagnostics/private_plan_setup.sql) in a new query. Copy the single `setup_report` result. It contains app function definitions/owners, role permissions, plan RLS policies and triggers; it contains no account rows, passwords or session tokens.
3. Expected: `party_map_plan_writer` exists with login/bypass RLS false; both it and `authenticated` have Auth schema usage and execute permission on `auth.uid()`. Create has arguments `p_id uuid, p_name text, p_owner_id uuid`, is SECURITY DEFINER, and is owned by `party_map_plan_writer`. Rename has the same owner/security mode. Table RLS is enabled/forced and policies restrict `owner_id` to `auth.uid()`.
4. Do not grant all Auth tables, disable RLS, expose the Auth schema through Data API, or change function ownership to postgres as a workaround. Inspect the report before another repair. If SQL Editor itself fails, copy its full error including DETAIL/CONTEXT instead of rerunning the initial migration.

Required setup order for a **new empty project**: enable Email/signup with confirmation off, run migrations 202610120001, 202610120002 and 202610120003 in order. On this existing project with the received diagnostic, run **003 only**; the initial migration intentionally fails if objects already exist. Data API must serve the `public` schema used by the app; Auth is not an exposed data schema requirement. No SMTP, Google OAuth, Storage bucket, Realtime configuration or redirect URL is needed for this initial password-login/plan-name feature.

## 4. Public configuration

Use the project base URL `https://aemfewsfcrcmtafnypxa.supabase.co`, without `/rest/v1/`, and the supplied **publishable** key in ignored local build configuration:

```dotenv
PUBLIC_SUPABASE_URL=https://aemfewsfcrcmtafnypxa.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

These values are public client configuration and can be bundled in the connected HTML. A secret/service-role key, SMTP password, user session or account password must never be bundled. [Official key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

## 5. Initial API contract and limits

- List metadata through `club_plans`, ordered by `updated_at` and `id`, with paging. RLS supplies ownership enforcement even if a client omits its owner filter.
- Create through `create_club_plan(p_id UUID, p_name text, p_owner_id UUID)`. Capture the signed-in user's UUID before starting the request and pass it as `p_owner_id`; the server rejects it if it differs from the token's account. This prevents a delayed account-A create from becoming account B's metadata after an account switch. Generate the plan UUID once and retain it for retries. Repeating that UUID for the same owner returns the existing metadata without renaming it. Names are trimmed and limited to 160 characters.
- Rename through `rename_club_plan(p_id UUID, p_name text)`. Unknown or another user's IDs receive the same unavailable error. Ownership, ID and creation time cannot change.

Migrations 001–003 store **plan names only**. Migration 004 adds full ordered song/section/time documents, revisioned save receipts and atomic import/create. The current app opens and edits those documents after 004 is applied; it does not automatically synchronize other sessions. Live notifications remain the next E13 phase. Metadata rename currently has no revision/conflict protocol; concurrent renames follow the last successful write. Do not claim those future stories are complete from this migration.

## 6. Verify with two ordinary accounts

After the reported schema setup, test the connected file in Chrome with internet enabled:

1. Account A creates an email/password account, creates a plan, reloads and signs out.
2. A second ordinary email address signs in as B; it cannot see A's plan. B creates its own plan and sees it after reload.
3. With A and B's actual authenticated API sessions, test a known foreign UUID: SELECT returns no foreign rows and rename/create collisions fail. Anonymous requests and authenticated direct writes fail. Repeat A's create UUID and confirm no duplicate plan or rename.
4. Check wrong passwords, signup errors, confirmation-required responses, network errors, denied storage and logout. Private data and delayed results from A must never appear in B's account area.

Do not share passwords or session tokens in chat, logs or screenshots. Mocked tests alone do not establish server privacy. Record actual outcomes before closing E10-S0, E10-S2/S3 or E14-S1. Direct `file://` support must be tested without a local server or disabled Chrome protections.

## Password-login hardening — 2026-10-12

Keep Supabase Auth as the email/password identity provider. The supplied Node example issues client JWTs, and the .NET example authenticates a single static API key; neither implements this app's individual password accounts. No private signing key or shared API secret belongs in the browser/downloadable HTML. Supabase's managed signing-key system is described in [JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys). Public JWKS metadata for this project currently reports ES256, EC, P-256; private keys were not accessed or generated.

The client now requires 12 characters for new passwords, rejects non-HTTPS Auth URLs and secret/service-role client keys, reads persistent sessions instead of stale per-tab memory, and reports failed persisted-token removal as a logout error. Memory fallback on write failure first clears the previous persisted value. Passwords remain transient form inputs and are cleared after requests. Existing-account login does not add a new frontend minimum that would lock out earlier users.

**Dashboard actions still required for a public release:** set the Supabase server-side minimum password length to 12 or stronger, review password rules and Auth rate limits, and enable leaked-password protection if your plan supports it. Frontend validation can be bypassed, so it is not server policy. The public settings endpoint does not expose this project's password minimum, and the agent has not changed it. [Password security](https://supabase.com/docs/guides/auth/password-security), [rate limits](https://supabase.com/docs/guides/auth/rate-limits).

Confirm email is still off for the user's selected SMTP-free flow. This protects accounts with passwords but does not verify ownership of their email addresses, and mail recovery is not implemented. For verified public signup/recovery, configure delivery and a compatible confirmation flow: in-page email codes for the standalone file or an approved hosted callback for a website. Do not simply enable confirmation and leave links pointing at an unavailable local URL. SMTP/provider changes and their flow are a separate deployment step. [Email configuration](https://supabase.com/docs/guides/auth/general-configuration), [mail delivery](https://supabase.com/docs/guides/auth/auth-smtp).

Serve a public website over HTTPS. The current browser SDK keeps access/refresh tokens in browser storage; this means malicious same-origin JavaScript could read them. Current imports/titles are escaped by Svelte; an additional hosted CSP and XSS review belong in the public deployment gate. A downloadable file cannot use an application server's HttpOnly session-cookie architecture without changing the delivery design. No permanent username-login alias is implemented; the current identifier is email.

Local-session sign-out does not sign out other devices. Already-issued access JWTs may remain valid until expiry; do not advertise instantaneous global token revocation. Keep Auth/API token verification and database RLS as the authorization boundary. Local PostgreSQL ownership tests and mocked browser tests pass, but actual hosted A/B/API isolation remains a release gate. [Session behavior](https://supabase.com/docs/guides/auth/sessions).
