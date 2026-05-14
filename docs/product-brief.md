# Product Brief

## Purpose

Mondibet is an application for managing a friendly FIFA World Cup betting game. It replaces a manual spreadsheet workflow and makes the administrator's job easier while preserving the game rules from the Word source document.

## Source Of Truth

- Rules source of truth: `טופס התערבות מונדיאל 2026.docx`.
- Legacy Excel workbook: reference only. It is not authoritative for rules.

## Primary Users

### Participants

Participants need to:

- Sign in with Google SSO, with email magic link kept as a fallback.
- Submit daily match bets before the deadline.
- Submit pre-tournament bonus bets.
- See their submitted bets.
- See scores and leaderboard updates.
- Trust that locked bets cannot be changed after the deadline.

### Administrator

The administrator needs to:

- Set up the tournament, teams, groups, matches, and participants.
- Maintain the participant email list used for login.
- Open and close betting windows.
- Enter official results.
- Enter late participant bets or correct results/bets when needed, with an audit trail and reason.
- Recalculate scores.
- Publish leaderboards.
- Reduce manual spreadsheet maintenance.

## MVP Goals

- Participant registration or invitation.
- Participant login with Google SSO, with email magic link fallback.
- Daily match betting.
- Pre-tournament bonus betting.
- Admin result entry.
- Automatic scoring.
- Leaderboard with score breakdown.
- Basic audit log for admin changes.

## Non-Goals For MVP

- Automatic live result feed.
- Native mobile app.
- Payment collection.
- Complex social features.
- Public betting marketplace.

## Future Ideas

- Live results integration.
- Google Sheets export.
- Email or WhatsApp reminders.
- Rich stats and charts.
- Admin import from official fixture data.
- Multi-tournament support.

## Success Criteria

- The admin no longer needs to maintain scoring formulas manually.
- Participants can submit bets without sending messages to the organizer.
- Scores are explainable by category and match.
- The rules are testable in code.
- Deployment works without managing servers.
- The responsive web app works well on mobile and desktop browsers.
