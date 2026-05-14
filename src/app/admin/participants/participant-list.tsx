interface ParticipantListProps {
  participants: {
    id: string;
    display_name: string;
    email: string;
    status: string;
  }[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  if (participants.length === 0) {
    return <p className="empty-state">No participants yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => (
            <tr key={participant.id}>
              <td>{participant.display_name}</td>
              <td>{participant.email}</td>
              <td>{participant.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

