interface ParticipantScoreSummaryProps {
  events: {
    id: string;
    category: string;
    points: number;
    reason: string;
    matches: {
      sort_order: number;
      home_team: { name: string } | null;
      away_team: { name: string } | null;
    } | null;
  }[];
}

export function ParticipantScoreSummary({ events }: ParticipantScoreSummaryProps) {
  const total = events.reduce((sum, event) => sum + event.points, 0);

  return (
    <div className="score-summary">
      <div className="score-total">
        <span>Your draft total</span>
        <strong>{total}</strong>
      </div>
      {events.length === 0 ? (
        <p className="empty-state">No points yet. Scores appear after the admin enters results.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Category</th>
                <th>Points</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{formatMatch(event.matches)}</td>
                  <td>{event.category.replaceAll("_", " ")}</td>
                  <td>{event.points}</td>
                  <td>{event.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatMatch(match: ParticipantScoreSummaryProps["events"][number]["matches"]): string {
  if (!match) {
    return "Match";
  }

  return `${match.sort_order} · ${match.home_team?.name ?? "TBD"} vs ${
    match.away_team?.name ?? "TBD"
  }`;
}
