interface ParticipantScoreSummaryProps {
  events: {
    id: string;
    source_type?: string;
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
                <th>Source</th>
                <th>Category</th>
                <th>Points</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{formatSource(event)}</td>
                  <td>{formatCategory(event.category)}</td>
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

function formatSource(event: ParticipantScoreSummaryProps["events"][number]): string {
  if (event.source_type && event.source_type !== "match") {
    return formatCategory(event.source_type);
  }

  if (!event.matches) {
    return "Match";
  }

  return `${event.matches.sort_order} · ${event.matches.home_team?.name ?? "TBD"} vs ${
    event.matches.away_team?.name ?? "TBD"
  }`;
}

function formatCategory(category: string): string {
  return category.replaceAll("_", " ");
}
