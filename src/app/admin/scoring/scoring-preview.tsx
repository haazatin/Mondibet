interface ScoringPreviewProps {
  events: {
    id: string;
    source_type: string;
    category: string;
    points: number;
    reason: string;
    calculated_at: string;
    participants: { display_name: string } | null;
    matches: {
      sort_order: number;
      home_team: { name: string } | null;
      away_team: { name: string } | null;
    } | null;
  }[];
}

export function ScoringPreview({ events }: ScoringPreviewProps) {
  const totalPoints = events.reduce((sum, event) => sum + event.points, 0);

  if (events.length === 0) {
    return <p className="empty-state">No score events yet. Enter results after bets are submitted.</p>;
  }

  return (
    <div className="score-summary">
      <div className="score-total">
        <span>Total draft points</span>
        <strong>{totalPoints}</strong>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Source</th>
              <th>Category</th>
              <th>Points</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.participants?.display_name ?? "Participant"}</td>
                <td>{formatSource(event)}</td>
                <td>{formatCategory(event.category)}</td>
                <td>{event.points}</td>
                <td>{event.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatSource(event: ScoringPreviewProps["events"][number]): string {
  if (event.source_type !== "match") {
    return formatCategory(event.source_type);
  }

  const match = event.matches;

  if (!match) {
    return "Match";
  }

  return `${match.sort_order} · ${match.home_team?.name ?? "TBD"} vs ${
    match.away_team?.name ?? "TBD"
  }`;
}

function formatCategory(category: string): string {
  return category.replaceAll("_", " ");
}
