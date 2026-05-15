interface VisibleMatchBet {
  match_id: string;
  participant_id: string;
  participant_name: string;
  predicted_home_score_90: number;
  predicted_away_score_90: number;
  predicted_advancing_team_id: string | null;
  submitted_at: string;
}

interface VisibleMatchBetsProps {
  matches: {
    id: string;
    sort_order: number;
    home_team: { id: string; name: string } | null;
    away_team: { id: string; name: string } | null;
  }[];
  bets: VisibleMatchBet[];
}

export function VisibleMatchBets({ matches, bets }: VisibleMatchBetsProps) {
  if (bets.length === 0) {
    return <p className="empty-state">Other bets will appear here after each match day locks.</p>;
  }

  const betsByMatch = new Map<string, VisibleMatchBet[]>();

  for (const bet of bets) {
    const current = betsByMatch.get(bet.match_id) ?? [];
    current.push(bet);
    betsByMatch.set(bet.match_id, current);
  }

  return (
    <div className="result-entry-list">
      {matches
        .filter((match) => betsByMatch.has(match.id))
        .map((match) => (
          <article className="result-entry-card" key={match.id}>
            <div className="match-bet-header">
              <div>
                <div className="match-meta">Match {match.sort_order}</div>
                <h3>
                  {match.home_team?.name ?? "TBD"} vs {match.away_team?.name ?? "TBD"}
                </h3>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Prediction</th>
                    <th>Advancing</th>
                  </tr>
                </thead>
                <tbody>
                  {(betsByMatch.get(match.id) ?? []).map((bet) => (
                    <tr key={`${bet.match_id}-${bet.participant_id}`}>
                      <td>{bet.participant_name}</td>
                      <td>
                        {bet.predicted_home_score_90}-{bet.predicted_away_score_90}
                      </td>
                      <td>{formatAdvancingTeam(match, bet.predicted_advancing_team_id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
    </div>
  );
}

function formatAdvancingTeam(
  match: VisibleMatchBetsProps["matches"][number],
  teamId: string | null,
): string {
  if (!teamId) {
    return "-";
  }

  if (teamId === match.home_team?.id) {
    return match.home_team.name;
  }

  if (teamId === match.away_team?.id) {
    return match.away_team.name;
  }

  return "Team";
}
