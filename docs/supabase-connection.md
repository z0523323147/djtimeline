# Supabase connection checklist

Updated 2026-10-12.

## Selected configuration

- Project base URL: https://aemfewsfcrcmtafnypxa.supabase.co.
- Public publishable key is in ignored local build configuration; no privileged key is needed in chat.
- Browser: Chrome. Delivery: double-click connected HTML with no local server; internet is needed for account access.
- Email/password signup and sign-in, with each account's own private plans. Google OAuth, email codes and SMTP are superseded for this initial flow.
- User reports the prepared SQL was run in the initially empty database.
- Read-only public Auth settings show Email enabled, signup enabled and confirmation disabled. No remote settings were changed by the agent.

## Next verification

Open the newly built connected HTML, choose Sign in → New here? Create account, and enter your own email/password. Create a plan, reload, sign out and sign in again. Test a second account separately, then verify A/B/anonymous direct-access isolation against the database. Mocked browser checks establish UI behavior, not server ownership security.

No SMTP is required for this basic password flow with confirmation disabled. Email addresses are unverified and email-based password recovery is not implemented. [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords).

The initial area stores plan names only; songs remain in the local planner. Canonical song documents, opening cloud timelines, revisioned saving and live sync remain later backlog tasks. Full connection completion requires those gates, real file-origin session persistence and database isolation evidence.

Use [supabase-setup.md](supabase-setup.md) for setup and verification details. The network-free offline edition remains separate.
