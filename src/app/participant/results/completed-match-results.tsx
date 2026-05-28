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

export interface CompletedBonusResult {
  result_key: string;
  sort_order: number;
  bet_name: string;
  user_bet: string;
  actual_result: string;
  points: number;
  breakdown: string;
}

interface CompletedMatchResultsProps {
  bonusResults: CompletedBonusResult[];
  matchResults: CompletedMatchResult[];
}

export function CompletedMatchResults({ bonusResults, matchResults }: CompletedMatchResultsProps) {
  const total = [...matchResults, ...bonusResults].reduce((sum, result) => sum + result.points, 0);

  if (matchResults.length === 0 && bonusResults.length === 0) {
    return (
      <div className="score-summary">
        <div className="score-total">
          <span>Your draft total</span>
          <strong>0</strong>
        </div>
        <p className="empty-state">Completed bet details will appear after results are entered.</p>
      </div>
    );
  }

  return (
    <div className="score-summary">
      <div className="score-total">
        <span>Your draft total</span>
        <strong>{total}</strong>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bet</th>
              <th>Your bet</th>
              <th>Actual result</th>
              <th>Points</th>
              <th>Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {matchResults.map((result) => (
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
            {bonusResults.map((result) => (
              <tr key={result.result_key}>
                <td>{result.bet_name}</td>
                <td>{result.user_bet || "No bet"}</td>
                <td>{result.actual_result || "No result"}</td>
                <td>{result.points}</td>
                <td>{result.breakdown || "No points"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
