# App Architecture

## Recommended Stack

- Frontend: Next.js on Vercel.
- Backend/API: Next.js API routes or server actions on Vercel.
- Database/Auth: Supabase, using Google SSO as the primary login method and email magic links as a fallback.
- Source control and deploy trigger: GitHub.

## Deployment Shape

```text
Browser
  |
  v
Vercel Next.js App
  |-- Frontend pages and components
  |-- Backend API routes / server actions
  |-- Scoring engine code
  |
  v
Supabase
  |-- Postgres database
  |-- Auth
  |-- Optional storage
```

## Backend Location

The backend code sits in the Next.js application and runs on Vercel as serverless functions.

Supabase stores data and handles auth. Supabase is not where the primary scoring code should live.

## Authentication

Participants and admins authenticate through Supabase Auth.

- Primary method: Google SSO.
- Fallback method: email magic link.
- Invitation gate: a signed-in user's email must match a participant row created by an admin, or the user must have an admin role.
- OAuth callback: Supabase redirects back to the app's `/auth/callback` route, where the session is exchanged and the user is sent to `/dashboard`.

Required provider setup:

- Enable Google as a Supabase Auth provider.
- Configure the Google OAuth client ID and client secret in Supabase.
- Add the Supabase OAuth callback URL in Google Cloud as an authorized redirect URI.
- Keep the app redirect URLs configured in Supabase for local and deployed app URLs.

## Scoring Engine Location

The scoring logic should live in versioned application code, for example:

```text
src/lib/scoring/
  rules.ts
  scoreMatchBet.ts
  scoreKnockoutBet.ts
  scoreBonusBet.ts
  scoreStreaks.ts
  buildLeaderboard.ts
```

API routes call the scoring engine when:

- A result is entered or corrected.
- A bet is submitted or corrected.
- An admin manually triggers recalculation.

## Data Flow Examples

### Participant Submits Bet

```text
Participant UI
  -> Vercel API/server action
  -> Validate deadline and permissions
  -> Store bet in Supabase
  -> Return confirmation
```

### Admin Enters Result

```text
Admin UI
  -> Vercel API/server action
  -> Validate admin permission
  -> Store official result in Supabase
  -> Run scoring engine
  -> Store score breakdowns and leaderboard snapshot
```

### Leaderboard View

```text
Participant/Admin UI
  -> Vercel API/server action
  -> Read leaderboard snapshot and breakdowns from Supabase
  -> Render standings
```

## Environments

- Local development: `.env.local`.
- Preview deployments: Vercel preview environment variables.
- Production: Vercel production environment variables.

Expected environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

The service role key must only be used server-side.

## GitHub Deployment Flow

```text
Local repo
  -> GitHub
  -> Vercel deploy
  -> Vercel talks to Supabase
```

## Security Principles

- Participant users can read and modify only their own bets before lock.
- Admin users can manage results, participants, and corrections.
- Admin users can enter late bets for participants through an audited override flow.
- Server-side code enforces deadlines and permissions.
- Supabase row-level security should mirror the same access rules.
- All admin changes should be audit-logged.

## Why Not Spreadsheet As Backend

The spreadsheet is not a reliable backend for this application because:

- Formula logic is difficult to test.
- Manual corrections are hard to audit.
- Concurrent participant entry is fragile.
- Permissions are awkward.
- Deployment and backup story is weaker than a database-backed app.
