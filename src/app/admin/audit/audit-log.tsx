interface AuditLogProps {
  events: {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    reason: string | null;
    before_json: unknown;
    after_json: unknown;
    created_at: string;
    actor_user_id: string | null;
  }[];
}

export function AuditLog({ events }: AuditLogProps) {
  if (events.length === 0) {
    return <p className="empty-state">No audited admin actions yet.</p>;
  }

  return (
    <div className="table-wrap audit-log">
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Reason</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{formatDateTime(event.created_at)}</td>
              <td>{formatAction(event.action)}</td>
              <td>
                {formatAction(event.entity_type)}
                {event.entity_id ? <span className="audit-entity-id">{event.entity_id}</span> : null}
              </td>
              <td>{event.reason ?? "No reason recorded"}</td>
              <td>
                <details className="audit-details">
                  <summary>View JSON</summary>
                  <div className="audit-json-grid">
                    <AuditJson title="Before" value={event.before_json} />
                    <AuditJson title="After" value={event.after_json} />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditJson({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <div className="audit-json-title">{title}</div>
      <pre>{value == null ? "null" : JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

function formatAction(value: string): string {
  return value.replaceAll("_", " ");
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
