# Supabase email sign-in and private account setup

Prepared 2026-10-12 for Chrome and a double-click connected HTML file. Each recipient signs in with their own email verification code and sees their own **My plans** area. No Google Cloud account or OAuth client is needed.

The repository contains a proposed metadata migration. It has **not been applied to your Supabase project**. Real email delivery, direct-file login, session persistence and account isolation must be verified before calling the connection complete. The separate offline HTML remains usable without login or network.

## 1. Enable email accounts

Open your project in the [Supabase dashboard](https://supabase.com/dashboard). In **Authentication → Sign In / Providers**, enable the **Email** provider and allow new users to sign up. Dashboard wording can vary. Recipients are app users, not Supabase project-team members.

In **Authentication → Email Templates → Magic Link**, use a code template containing the exact variable `{{ .Token }}`:

```html
<h2>Your Party Map sign-in code</h2>
<p>Enter this code in Party Map:</p>
<p><strong>{{ .Token }}</strong></p>
<p>If you did not request this code, ignore this email.</p>
```

Save the template. This replaces the default magic-link experience with a code entered in the open HTML page. The app requests signup/sign-in with `signInWithOtp`, then verifies the email and code using `verifyOtp` with type `email`. New users can be created by this flow when signup is enabled. [Official email-code guide](https://supabase.com/docs/guides/auth/auth-email-passwordless).

## 2. Configure delivery for other users

To send codes to ordinary recipient addresses, configure **custom SMTP** in the Authentication email settings. Choose an email-delivery provider, follow its sender/domain verification instructions, and enter its SMTP host, port, username, password and approved sender directly in Supabase. Mail credentials must never be placed in the HTML, committed to Git, or sent in chat.

Supabase's default email service is restricted to project-team addresses and is unsuitable for distributing this page to other users. Email sign-in can be implemented before SMTP is configured, but delivery to those recipients remains blocked until configuration succeeds. [Official SMTP setup and restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

## 3. Apply the private metadata migration

The user reported an empty database. Check the project's Table Editor first. If `club_plans`, either RPC below, or a `party_map_plan_writer` role already exists, stop and review that existing schema rather than resetting it.

1. Open **SQL Editor → New query**.
2. Paste the entire contents of [202610120001_private_plans.sql](../supabase/migrations/202610120001_private_plans.sql).
3. Review, then run it once. It creates the table, a dedicated restricted writer role, owner-scoped row-level security, an immutable identity trigger and create/rename RPCs inside one transaction.
4. Keep the query/result for troubleshooting. If the transaction fails, report the error without credentials; do not remove its privacy checks to force success.

The browser publishable key cannot execute schema migrations or configure authentication. Run this query in your own authenticated dashboard. No database password or service-role key is required by the app.

Signed-in browser users may SELECT only their own metadata. Direct INSERT/UPDATE/DELETE privileges are withheld. The two RPCs run as a dedicated `NOLOGIN`, `NOBYPASSRLS` role with an empty search path and grants only for owner-scoped table operations. Anonymous users cannot read or execute those operations. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), [database function security](https://supabase.com/docs/guides/database/functions).

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

This first migration stores **plan names only**. It does not store songs, upload existing local notes, open a cloud timeline, or synchronize edits. Canonical documents, atomic revisioned saves, conflicts and live notifications require the later E11/E13 migrations. Metadata rename currently has no revision/conflict protocol; concurrent renames follow the last successful write. Do not claim those future stories are complete from this migration.

## 6. Verify with two ordinary accounts

After SMTP and schema setup, test the connected file in Chrome with internet enabled:

1. Account A requests and enters a code, creates a plan, reloads and signs out.
2. A second ordinary email address signs in as B; it cannot see A's plan. B creates its own plan and sees it after reload.
3. With A and B's actual authenticated API sessions, test a known foreign UUID: SELECT returns no foreign rows and rename/create collisions fail. Anonymous requests and authenticated direct writes fail. Repeat A's create UUID and confirm no duplicate plan or rename.
4. Check invalid/expired codes, mail/network errors, denied storage and logout. Private data and delayed results from A must never appear in B's account area.

Do not share codes or session tokens in chat, logs or screenshots. Mocked tests alone do not establish server privacy. Record actual outcomes before closing E10-S0, E10-S2/S3 or E14-S1. Direct `file://` support must be tested without a local server or disabled Chrome protections.
