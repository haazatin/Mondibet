"use client";

import { useActionState } from "react";
import { publishLeaderboard, type PublishLeaderboardState } from "./actions";
import type { DraftLeaderboardRow } from "@/lib/leaderboard/draft";

interface LeaderboardPublishPanelProps {
  draftRows: DraftLeaderboardRow[];
  latestPublishedAt?: string | null;
}

const initialState: PublishLeaderboardState = {
  status: "idle",
  message: "",
};

export function LeaderboardPublishPanel({
  draftRows,
  latestPublishedAt,
}: LeaderboardPublishPanelProps) {
  const [state, formAction, pending] = useActionState(publishLeaderboard, initialState);

  return (
    <div className="score-summary">
      <div className="leaderboard-header">
        <div className="score-total">
          <span>Draft rows</span>
          <strong>{draftRows.length}</strong>
        </div>
        <form action={formAction}>
          <button className="primary-button" disabled={pending} type="submit">
            {pending ? "Publishing..." : "Publish leaderboard"}
          </button>
        </form>
      </div>
      {latestPublishedAt ? (
        <p className="empty-state">Latest published {formatDate(latestPublishedAt)}</p>
      ) : null}
      {state.message ? (
        <p className={state.status === "error" ? "form-message error" : "form-message"}>
          {state.message}
        </p>
      ) : null}
      <LeaderboardTable rows={draftRows} />
    </div>
  );
}

function LeaderboardTable({ rows }: { rows: DraftLeaderboardRow[] }) {
  if (rows.length === 0) {
    return <p className="empty-state">No participants yet.</p>;
  }

  return (
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
            <tr key={row.participantId}>
              <td>{row.rank}</td>
              <td>{row.displayName}</td>
              <td>{row.totalPoints}</td>
              <td>{row.groupStagePoints + row.knockoutPoints}</td>
              <td>{row.bonusPoints}</td>
              <td>{row.streakPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
