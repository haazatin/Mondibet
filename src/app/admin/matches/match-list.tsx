import { deleteDraftMatch } from "@/app/admin/matches/actions";

interface MatchListProps {
  matches: {
    id: string;
    stage: string;
    starts_at: string;
    daily_lock_at: string;
    sort_order: number;
    groups: { name: string } | null;
    home_team: { name: string } | null;
    away_team: { name: string } | null;
    result?: {
      home_score_90: number;
      away_score_90: number;
    } | null;
  }[];
}

export function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return <p className="empty-state">No matches yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Stage</th>
            <th>Match</th>
            <th>Kickoff</th>
            <th>Daily lock</th>
            <th>Result</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <tr key={match.id}>
              <td>{match.sort_order}</td>
              <td>{formatStage(match.stage, match.groups?.name)}</td>
              <td>
                {match.home_team?.name ?? "TBD"} vs {match.away_team?.name ?? "TBD"}
              </td>
              <td>{formatDate(match.starts_at)}</td>
              <td>{formatDate(match.daily_lock_at)}</td>
              <td>
                {match.result
                  ? `${match.result.home_score_90}-${match.result.away_score_90}`
                  : "Pending"}
              </td>
              <td>
                {match.result ? null : (
                  <form action={deleteDraftMatch}>
                    <input name="matchId" type="hidden" value={match.id} />
                    <button className="secondary-button" type="submit">
                      Delete
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatStage(stage: string, groupName: string | undefined): string {
  if (stage === "group" && groupName) {
    return groupName;
  }

  return stage.replaceAll("_", " ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
