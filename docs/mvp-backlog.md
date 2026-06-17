# MVP Backlog

## Phase 1: Foundation

- Initialize Next.js app.
- Add Supabase client setup.
- Create database migrations for core tables.
- Add Supabase Google SSO auth.
- Add roles: participant, admin.
- Add seed data support for tournament setup.

## Phase 2: Rules And Scoring Engine

- Implement group-stage match scoring.
- Implement knockout scoring by stage.
- Implement group bonus scoring.
- Implement general bonus scoring.
- Implement streak bonus scoring.
- Implement final tie-breakers.
- Add unit tests for every scoring rule.

## Phase 3: Admin Basics

- Admin participant management.
- Admin team and group setup.
- Admin match schedule management.
- Admin result entry.
- Admin late-bet entry for participants with required reason.
- Admin scoring recalculation action.
- Admin audit log view.

## Phase 4: Participant Betting

- Participant dashboard.
- Daily match betting form.
- Match lock enforcement: seven hours before each kickoff.
- Knockout betting behavior for 90-minute draw and advancing team.
- Pre-tournament bonus form.
- Bet confirmation and locked-state views.

## Phase 5: Leaderboard

- Score breakdown storage.
- Leaderboard calculation.
- Published leaderboard snapshot.
- Participant leaderboard view.
- Admin leaderboard preview.

## Phase 6: Deployment

- Initialize Git repository.
- Push to GitHub.
- Connect GitHub repo to Vercel.
- Create Supabase project.
- Configure Vercel environment variables.
- Run production smoke test.

## Later

- Live results integration.
- Import official fixture data.
- Reminder notifications.
- Google Sheets export.
- Advanced analytics.
- Multi-tournament support.
