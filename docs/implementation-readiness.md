# Implementation Readiness

The project is ready to begin implementation.

## Finalized Decisions

- Source of truth for rules: Word document only.
- Legacy Excel: reference only, not authoritative.
- App type: responsive web app, no native mobile app for MVP.
- Hosting: Next.js on Vercel.
- Backend/API: Next.js server-side code on Vercel.
- Database/Auth: Supabase.
- Auth method: Google SSO through Supabase Auth.
- Participant self-submission lock: all matches on a given day lock at the earlier of 12:00 Israel time and the first kickoff of that day.
- Admin override: admins can enter or correct bets after lock with a required audit-log reason.
- Leaderboard: visible standings update only when admin publishes a snapshot.
- Payments: outside the app for MVP.

## First Implementation Milestone

Build the foundation:

1. Initialize Git.
2. Initialize a Next.js app.
3. Add TypeScript, linting, and basic test setup.
4. Add Supabase environment configuration.
5. Create initial database schema migrations.
6. Implement the scoring engine as pure TypeScript functions with tests.

## Recommended Build Order

1. Project scaffold and repo hygiene.
2. Database schema.
3. Scoring engine and tests.
4. Admin tournament setup.
5. Participant auth and dashboard.
6. Match betting and lock enforcement.
7. Admin result entry and recalculation.
8. Leaderboard publishing.

## Early Test Priorities

- Group-stage match scoring.
- Knockout stage scoring by round.
- Knockout draw with advancing team.
- Group bonus scoring.
- General bonus scoring.
- Streak bonus behavior.
- Tie-breakers.
- Daily participant lock enforcement.
- Admin override audit behavior.
