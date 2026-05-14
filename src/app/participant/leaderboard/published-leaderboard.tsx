interface PublishedLeaderboardProps {
  publishedAt?: string | null;
  rows: {
    row_id: string;
    rank: number;
    total_points: number;
    group_stage_points: number;
    knockout_points: number;
    bonus_points: number;
    streak_points: number;
    participant_name: string;
  }[];
}

export function PublishedLeaderboard({ publishedAt, rows }: PublishedLeaderboardProps) {
  if (!publishedAt) {
    return <p className="empty-state">No leaderboard has been published yet.</p>;
  }

  return (
    <div className="score-summary">
      <p className="empty-state">Published {formatDate(publishedAt)}</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Participant</th>
              <th>Total</th>
              <th>Match</th>
              <th>Bonus</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.row_id}>
                <td>{row.rank}</td>
                <td>{row.participant_name}</td>
                <td>{row.total_points}</td>
                <td>{row.group_stage_points + row.knockout_points}</td>
                <td>{row.bonus_points}</td>
                <td>{row.streak_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
