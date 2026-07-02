# Rules And Scoring Spec

Source of truth: `טופס התערבות מונדיאל 2026.docx`.

The legacy Excel workbook is not authoritative for rules. It may be used only as historical reference for workflow ideas, admin pain points, or reporting examples.

## Tournament

- Competition: 2026 FIFA World Cup.
- Participants pay an entry fee of 100 NIS.
- Winner takes the pot, subject to the tie-breaker rules below.

## Submission Deadlines

### Daily Match Bets

- Each participant may submit a bet for each match before that match's lock time.
- Submission deadline: no later than seven hours before the match kickoff.
- After a match begins, its bet cannot be changed or updated.
- Participant self-submission locks separately per match, seven hours before that match's kickoff.
- Example: if a match starts at 22:00 Israel time, participant self-submission for that match locks at 15:00 Israel time.
- Admins may enter or correct bets for participants after lock when needed.
- Every admin late entry or correction must include an audit-log reason.

### Bonus Bets

- All bonus bets must be submitted by 12:00 on the tournament opening day.

## Match Bets

Each match bet includes:

- Winner identity, or draw.
- Exact match score.

For knockout matches, the exact score refers to the score after 90 minutes only, excluding extra time and penalties.

If the participant predicts a draw after 90 minutes in a knockout match, they must also select the team that advances to the next round.

## Group Stage Scoring

For each group-stage match:

| Condition | Points |
| --- | ---: |
| Correct winner, or correctly predicted draw | 5 |
| Exact score | 5 additional |
| Correct winner and correct goal difference, but not exact score | 2 additional |

Notes:

- Goal-difference points are awarded only if the participant also predicted the correct winner.
- No goal-difference points are awarded for a match that ended in a draw.

## Knockout Scoring

The knockout scoring varies by round.

| Stage | Correct Winner / Draw | Exact Score |
| --- | ---: | ---: |
| Round of 32 | 6 | 6 |
| Round of 16 | 7 | 7 |
| Quarterfinal | 8 | 8 |
| Semifinal | 10 | 10 |
| Final | 15 | 15 |

Additional knockout rule:

- If the participant predicts the correct winner and correct goal difference, but not the exact score, award 2 additional points.
- If the participant predicts a non-draw 90-minute winner, the actual 90-minute result is a draw, and the predicted winner advances, award exactly 2 points for correct advancing team.
- This 2-point advancing-team credit counts as a correct match for streak purposes.

Knockout interpretation:

- The result score is the score after 90 minutes.
- The "winner/draw" scoring item should be interpreted as:
  - For non-draw 90-minute predictions: correct 90-minute winner.
  - For knockout draw predictions: correct selected advancing team.
  - For draw 90-minute results: correct prediction of draw plus correct advancing team.
- The advancing team is required only when the participant predicts a draw after 90 minutes.
- Correctly selecting the advancing team does not create a separate bonus category.
- The advancing-team selection is part of determining whether a knockout draw prediction earns the normal stage outcome points, even if the selected team wins during 90 minutes.
- A knockout draw prediction does not earn goal-difference bonus points.
- The 2-point advancing-team credit for a non-draw prediction against an actual draw does not stack with normal outcome, exact-score, or goal-difference points.

## Group Bonus Bets

Participants predict the teams that qualify from each group and their positions.

For each group:

| Condition | Points |
| --- | ---: |
| Correctly predicted qualifying team | 3 |
| Correctly predicted team position: first, second, or third | 2 additional |
| Perfect prediction of all qualifiers and their positions in a group | 10 additional |

The form contains 12 groups and asks for:

- Group winner.
- Group second place.
- Group third place.
- Best third-place qualifiers.

Best third-place qualifiers are not scored as a separate bonus category. They are covered through group-position predictions.

## General Bonus Bets

| Bonus Bet | Points |
| --- | ---: |
| Correct champion | 25 |
| Correct runner-up | 15 |
| Correct tournament top scorer | 10 |
| Correct top scorer goal count | 10 |
| Correct player of the tournament | 10 |
| Correct highest-scoring group | 5 |
| Correct lowest-scoring group | 5 |
| Correct team with most goals in the tournament | 5 |
| Correct team with fewest goals in the tournament | 5 |

The form also asks for:

- Surprise of the tournament.
- Disappointment of the tournament.

Surprise of the tournament and disappointment of the tournament are not scored.

Participant visibility:

- Participants cannot see other participants' bets before the relevant match starts.
- Participants can see other participants' bets after bets are locked.
- Participants can see other participants' bets after matches finish.

## Streak Bonus

Participants can receive bonus points for consecutive correct winner/draw predictions:

| Streak | Bonus |
| --- | ---: |
| 3 correct winner/draw predictions in a row | 5 |
| 5 correct winner/draw predictions in a row | 10 |

The streak bonus is awarded once per streak. If a participant reaches 5 correct winner/draw predictions in a row, they receive only the 10-point streak bonus for that streak, not both the 3-streak and 5-streak bonuses.

## Official Results

If a match is canceled, stopped, or its official result is changed by FIFA, the official FIFA result determines scoring.

## Leaderboard Updates

The organizer may publish an updated leaderboard during the tournament. Participants see the latest admin-published leaderboard, not automatically recalculated draft standings.

## Final Tie-Breakers

If participants are tied on final points:

1. The participant who correctly predicted the champion wins.
2. If none of the tied participants predicted the champion, or if more than one tied participant predicted the champion, the participant with more knockout-stage points wins.
3. If still tied, the pot is split between the tied leaders.

## Implementation Notes

- Store every scoring component separately, not only final totals.
- The scoring engine must be deterministic and covered by tests.
- Rules should be configurable where practical, but the initial implementation should match this document exactly.
- Manual admin corrections must be audit-logged.
- Admin corrections replace the visible value for participants, while the previous value remains in the admin-only audit log.
- Admin-entered late bets are valid only through the admin override flow and must be audit-logged.
