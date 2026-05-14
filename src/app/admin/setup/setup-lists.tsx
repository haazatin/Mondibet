interface SetupListsProps {
  teams: {
    id: string;
    name: string;
    short_name: string | null;
    fifa_code: string | null;
  }[];
  groups: {
    id: string;
    name: string;
    sort_order: number;
  }[];
  groupTeams: {
    id: string;
    seed_order: number | null;
    groups: { name: string } | null;
    teams: { name: string } | null;
  }[];
}

export function SetupLists({ teams, groups, groupTeams }: SetupListsProps) {
  return (
    <div className="setup-grid">
      <SummaryList
        empty="No teams yet."
        items={teams.map((team) => ({
          id: team.id,
          title: team.name,
          detail: [team.short_name, team.fifa_code].filter(Boolean).join(" · "),
        }))}
        title="Teams"
      />
      <SummaryList
        empty="No groups yet."
        items={groups.map((group) => ({
          id: group.id,
          title: group.name,
          detail: `Order ${group.sort_order}`,
        }))}
        title="Groups"
      />
      <SummaryList
        empty="No group assignments yet."
        items={groupTeams.map((assignment) => ({
          id: assignment.id,
          title: `${assignment.groups?.name ?? "Group"} · ${assignment.teams?.name ?? "Team"}`,
          detail: assignment.seed_order ? `Seed ${assignment.seed_order}` : "",
        }))}
        title="Group Assignments"
      />
    </div>
  );
}

interface SummaryListProps {
  title: string;
  empty: string;
  items: {
    id: string;
    title: string;
    detail: string;
  }[];
}

function SummaryList({ title, empty, items }: SummaryListProps) {
  return (
    <div className="summary-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="empty-state">{empty}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              {item.detail ? <span>{item.detail}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

