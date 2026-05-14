# Data Model

This is an initial high-level model. It should become Supabase/Postgres migrations when development starts.

## Core Tables

### tournaments

- `id`
- `name`
- `season`
- `starts_at`
- `ends_at`
- `status`
- `created_at`

### teams

- `id`
- `tournament_id`
- `name`
- `short_name`
- `fifa_code`

### groups

- `id`
- `tournament_id`
- `name`
- `sort_order`

### group_teams

- `id`
- `group_id`
- `team_id`
- `seed_order`

### matches

- `id`
- `tournament_id`
- `stage`
- `group_id`
- `home_team_id`
- `away_team_id`
- `starts_at`
- `betting_deadline_at`
- `status`
- `sort_order`

Stages should include:

- `group`
- `round_of_32`
- `round_of_16`
- `quarterfinal`
- `semifinal`
- `final`

### participants

- `id`
- `user_id`
- `tournament_id`
- `email`
- `display_name`
- `status`
- `created_at`

### results

- `id`
- `match_id`
- `home_score_90`
- `away_score_90`
- `home_score_final`
- `away_score_final`
- `advancing_team_id`
- `source`
- `is_official`
- `created_by`
- `created_at`
- `updated_at`

The 90-minute score is required for knockout scoring.

## Betting Tables

### match_bets

- `id`
- `match_id`
- `participant_id`
- `predicted_home_score_90`
- `predicted_away_score_90`
- `predicted_outcome`
- `predicted_advancing_team_id`
- `submitted_at`
- `locked_at`
- `submitted_by_user_id`
- `is_admin_override`
- `admin_override_reason`
- `created_at`
- `updated_at`

### group_bonus_bets

- `id`
- `participant_id`
- `group_id`
- `predicted_first_team_id`
- `predicted_second_team_id`
- `predicted_third_team_id`
- `submitted_at`
- `locked_at`
- `submitted_by_user_id`
- `is_admin_override`
- `admin_override_reason`

### best_third_place_bets

- `id`
- `participant_id`
- `team_id`
- `submitted_at`
- `locked_at`
- `submitted_by_user_id`
- `is_admin_override`
- `admin_override_reason`

### general_bonus_bets

- `id`
- `participant_id`
- `champion_team_id`
- `runner_up_team_id`
- `top_scorer_name`
- `top_scorer_goals`
- `player_of_tournament`
- `surprise_team_id`
- `disappointment_team_id`
- `highest_scoring_group_id`
- `lowest_scoring_group_id`
- `most_goals_team_id`
- `fewest_goals_team_id`
- `submitted_at`
- `locked_at`
- `submitted_by_user_id`
- `is_admin_override`
- `admin_override_reason`

Surprise and disappointment are stored as optional fun predictions but are not scored.

## Scoring Tables

### score_events

- `id`
- `participant_id`
- `tournament_id`
- `source_type`
- `source_id`
- `category`
- `points`
- `reason`
- `calculated_at`

Examples:

- source type: `match_bet`, category: `correct_winner`
- source type: `match_bet`, category: `exact_score`
- source type: `group_bonus_bet`, category: `correct_qualifier`
- source type: `general_bonus_bet`, category: `champion`

### leaderboard_snapshots

- `id`
- `tournament_id`
- `created_at`
- `created_by`
- `is_published`

### leaderboard_snapshot_rows

- `id`
- `snapshot_id`
- `participant_id`
- `rank`
- `total_points`
- `group_stage_points`
- `knockout_points`
- `bonus_points`
- `streak_points`
- `tie_break_status`

Only published snapshots are visible to participants. Draft recalculations remain admin-only until published.

## Admin And Audit

### admin_audit_log

- `id`
- `tournament_id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `before_json`
- `after_json`
- `reason`
- `created_at`

### scoring_runs

- `id`
- `tournament_id`
- `trigger`
- `status`
- `started_at`
- `finished_at`
- `error`

## Design Notes

- Keep raw bets immutable after lock except through explicit admin correction.
- Store score breakdowns so users can understand totals.
- Store snapshots so published leaderboards do not unexpectedly change without admin intent.
- Keep scoring rules in code first; optionally persist rule configuration later.
- Admin corrections should replace the participant-visible value while preserving before/after values in the admin audit log.
- Participant login uses Supabase Auth with Google SSO as the primary method and email magic links as a fallback.
- Participant self-submission is blocked after lock; admin overrides remain available with a required reason.
