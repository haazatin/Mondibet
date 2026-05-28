interface VisibleMatchBet {
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
    bet: VisibleMatchBet | null;
  }[];
}

export function VisibleMatchBets({ matches }: VisibleMatchBetsProps) {
  if (matches.length === 0) {
    return <p className="empty-state">Submitted match bets will appear here until results are entered.</p>;
  }

  return (
    <div className="result-entry-list">
      {matches.map((match) => (
        <article className="result-entry-card" key={match.id}>
          <div className="match-bet-header">
            <div>
              <div className="match-meta">Match {match.sort_order}</div>
              <h3>
                {match.home_team?.name ?? "TBD"} vs {match.away_team?.name ?? "TBD"}
              </h3>
            </div>
          </div>
          <dl className="match-times">
            <div>
              <dt>Your bet</dt>
              <dd>{formatBet(match)}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{match.bet ? formatDate(match.bet.submitted_at) : "-"}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function formatBet(match: VisibleMatchBetsProps["matches"][number]): string {
  if (!match.bet) {
    return "No bet";
  }

  const score = `${match.bet.predicted_home_score_90}-${match.bet.predicted_away_score_90}`;
  const advancingTeam = formatAdvancingTeam(match, match.bet.predicted_advancing_team_id);

  if (advancingTeam) {
    return `${score}, ${advancingTeam} advances`;
  }

  return score;
}

function formatAdvancingTeam(match: VisibleMatchBetsProps["matches"][number], teamId: string | null): string {
  if (!teamId) {
    return "";
  }

  return [match.home_team, match.away_team].find((team) => team?.id === teamId)?.name ?? "Team";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
