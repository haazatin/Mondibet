# User Flows

## Participant: Sign In

1. Participant opens the app.
2. Participant clicks "Continue with Google".
3. Supabase and Google complete the OAuth sign-in.
4. App verifies that the signed-in email matches an invited participant.
5. App signs the participant in and loads their tournament dashboard.

## Participant: Submit Daily Match Bets

1. Participant signs in.
2. Participant opens today's matches.
3. App shows each match, kickoff time, and the daily betting deadline.
4. Participant enters exact score for each match.
5. For knockout matches, if predicting a draw after 90 minutes, participant also chooses the advancing team.
6. Participant submits bets.
7. Backend validates:
   - participant identity,
   - match belongs to active tournament,
   - daily betting deadline has not passed,
   - required fields are present.
8. Bet is saved and confirmation is shown.

## Participant: Submit Pre-Tournament Bonuses

1. Participant signs in before tournament opening-day deadline.
2. Participant fills group predictions and general bonus predictions.
3. Participant submits.
4. Backend validates the bonus deadline.
5. Bets are saved and locked at deadline.

## Participant: View Leaderboard

1. Participant opens leaderboard.
2. App loads latest published leaderboard snapshot.
3. Participant can inspect their own score breakdown.
4. If allowed, participant can inspect public breakdowns for others.

## Participant: View Bets

1. Participant can always view their own submitted bets.
2. Participant cannot view other participants' bets before the relevant match starts.
3. Participant can view other participants' bets after bets lock.
4. Participant can view other participants' bets after matches finish.

## Admin: Set Up Tournament

1. Admin creates tournament.
2. Admin enters or imports teams.
3. Admin assigns teams to groups.
4. Admin creates matches and kickoff times.
5. App derives each day's betting deadline as the earlier of 12:00 Israel time and the first kickoff of that day.
6. Admin invites participants.

## Admin: Enter Official Result

1. Admin opens result entry screen.
2. Admin selects a match.
3. Admin enters 90-minute score.
4. For knockout matches, admin enters final result and advancing team.
5. Backend saves result and audit log.
6. Backend recalculates affected scores.
7. Admin reviews updated leaderboard.
8. Admin publishes leaderboard snapshot.

## Admin: Correct A Bet Or Result

1. Admin selects entity to correct.
2. Admin enters replacement value and reason.
3. Backend saves before/after audit log.
4. Backend recalculates scores.
5. Admin may publish a new leaderboard snapshot.
6. Participants see the replacement value, not a correction marker. The audit history remains admin-only.

## Admin: Enter Late Bet For Participant

1. Admin selects participant and match or bonus form.
2. Admin enters the participant's bet.
3. Admin enters a required reason.
4. Backend saves the bet as an admin override.
5. Backend writes an audit log entry.
6. Backend recalculates affected draft scores.
7. Admin may publish a new leaderboard snapshot.

## Admin: Publish Leaderboard

1. Admin opens calculated leaderboard preview.
2. Admin reviews totals and tie-breakers.
3. Admin publishes snapshot.
4. Participants see the new published standings.

## System: Recalculate Scores

1. Trigger comes from result entry, correction, or manual admin action.
2. Backend clears previous generated score events for affected scope.
3. Backend recalculates match, bonus, streak, and leaderboard totals.
4. Backend stores score events and scoring run status.
5. Errors are visible to admin.
6. Recalculated standings remain draft until admin publishes a leaderboard snapshot.
