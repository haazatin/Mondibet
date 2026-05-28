"use client";

interface AdminGroupBonusBet {
  group_id: string;
  participant_id: string;
  participant_name: string;
  predicted_first_team_id: string | null;
  predicted_second_team_id: string | null;
  predicted_third_team_id: string | null;
  submitted_at: string;
}

interface AdminGeneralBonusBet {
  participant_id: string;
  participant_name: string;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  top_scorer_name: string | null;
  top_scorer_goals: number | null;
  player_of_tournament: string | null;
  surprise_team_id: string | null;
  disappointment_team_id: string | null;
  highest_scoring_group_id: string | null;
  lowest_scoring_group_id: string | null;
  most_goals_team_id: string | null;
  fewest_goals_team_id: string | null;
  submitted_at: string;
}

interface ParticipantBonusBetsPanelProps {
  generalBets: AdminGeneralBonusBet[];
  groupBets: AdminGroupBonusBet[];
  groups: { id: string; name: string; sort_order: number }[];
  teams: { id: string; name: string }[];
}

export function ParticipantBonusBetsPanel({
  generalBets,
  groupBets,
  groups,
  teams,
}: ParticipantBonusBetsPanelProps) {
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const hasBets = generalBets.length > 0 || groupBets.length > 0;

  if (!hasBets) {
    return <p className="empty-state">No participant bonus bets have been submitted yet.</p>;
  }

  return (
    <div className="result-entry-list">
      <article className="result-entry-card">
        <div className="match-bet-header">
          <div>
            <div className="match-meta">Pre-tournament</div>
            <h3>General Bonus Bets</h3>
          </div>
        </div>
        {generalBets.length === 0 ? (
          <p className="empty-state">No general bonus bets submitted yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Bet</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {generalBets.map((bet) => (
                  <tr key={`general-${bet.participant_id}`}>
                    <td>{bet.participant_name}</td>
                    <td>{formatGeneralBet(bet, teamNames, groupNames)}</td>
                    <td>{formatDate(bet.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="result-entry-card">
        <div className="match-bet-header">
          <div>
            <div className="match-meta">Group standings</div>
            <h3>Group Bonus Bets</h3>
          </div>
        </div>
        {groupBets.length === 0 ? (
          <p className="empty-state">No group bonus bets submitted yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Group</th>
                  <th>Bet</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {groupBets.map((bet) => (
                  <tr key={`${bet.group_id}-${bet.participant_id}`}>
                    <td>{bet.participant_name}</td>
                    <td>{groupNames.get(bet.group_id) ?? "Group"}</td>
                    <td>{formatGroupBet(bet, teamNames)}</td>
                    <td>{formatDate(bet.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}

function formatGeneralBet(
  bet: AdminGeneralBonusBet,
  teamNames: Map<string, string>,
  groupNames: Map<string, string>,
): string {
  return [
    labelValue("Champion", teamName(teamNames, bet.champion_team_id)),
    labelValue("Runner-up", teamName(teamNames, bet.runner_up_team_id)),
    labelValue("Top scorer", bet.top_scorer_name),
    labelValue("Top scorer goals", bet.top_scorer_goals === null ? null : String(bet.top_scorer_goals)),
    labelValue("Player", bet.player_of_tournament),
    labelValue("Surprise", teamName(teamNames, bet.surprise_team_id)),
    labelValue("Disappointment", teamName(teamNames, bet.disappointment_team_id)),
    labelValue("Highest group", groupName(groupNames, bet.highest_scoring_group_id)),
    labelValue("Lowest group", groupName(groupNames, bet.lowest_scoring_group_id)),
    labelValue("Most goals", teamName(teamNames, bet.most_goals_team_id)),
    labelValue("Fewest goals", teamName(teamNames, bet.fewest_goals_team_id)),
  ]
    .filter(Boolean)
    .join(", ");
}

function formatGroupBet(bet: AdminGroupBonusBet, teamNames: Map<string, string>): string {
  return [
    labelValue("1st", teamName(teamNames, bet.predicted_first_team_id)),
    labelValue("2nd", teamName(teamNames, bet.predicted_second_team_id)),
    labelValue("3rd", teamName(teamNames, bet.predicted_third_team_id)),
  ]
    .filter(Boolean)
    .join(", ");
}

function labelValue(label: string, value: string | null): string {
  return value ? `${label}: ${value}` : "";
}

function teamName(teamNames: Map<string, string>, teamId: string | null): string | null {
  return teamId ? (teamNames.get(teamId) ?? "Team") : null;
}

function groupName(groupNames: Map<string, string>, groupId: string | null): string | null {
  return groupId ? (groupNames.get(groupId) ?? "Group") : null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
