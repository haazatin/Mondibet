export interface CompletedMatchResult {
  match_id: string;
  sort_order: number;
  stage: string;
  starts_at: string;
  home_team_name: string | null;
  away_team_name: string | null;
  predicted_home_score_90: number | null;
  predicted_away_score_90: number | null;
  predicted_advancing_team_name: string | null;
  actual_home_score_90: number;
  actual_away_score_90: number;
  actual_advancing_team_name: string | null;
  points: number;
  reasons: string;
}

interface CompletedMatchResultsProps {
  results: CompletedMatchResult[];
}

export function CompletedMatchResults({ results }: CompletedMatchResultsProps) {
  if (results.length === 0) {
    return <p className="empty-state">Completed match details will appear after results are entered.</p>;
  }

  return (
    <div className="table-wrap score-summary">
      <table className="data-table">
        <thead>
          <tr>
            <th>Match</th>
            <th>Your bet</th>
            <th>Actual result</th>
            <th>Points</th>
            <th>Breakdown</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.match_id}>
              <td>
                {result.sort_order} · {result.home_team_name ?? "TBD"} vs{" "}
                {result.away_team_name ?? "TBD"}
              </td>
              <td>{formatBet(result)}</td>
              <td>{formatActualResult(result)}</td>
              <td>{result.points}</td>
              <td>{result.reasons || "No points"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatBet(result: CompletedMatchResult): string {
  if (result.predicted_home_score_90 === null || result.predicted_away_score_90 === null) {
    return "No bet";
  }

  const score = `${result.predicted_home_score_90}-${result.predicted_away_score_90}`;

  if (result.predicted_advancing_team_name) {
    return `${score}, ${result.predicted_advancing_team_name} advances`;
  }

  return score;
}

function formatActualResult(result: CompletedMatchResult): string {
  const score = `${result.actual_home_score_90}-${result.actual_away_score_90}`;

  if (result.actual_advancing_team_name) {
    return `${score}, ${result.actual_advancing_team_name} advanced`;
  }

  return score;
}
