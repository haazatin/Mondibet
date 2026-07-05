"use client";

import { useActionState } from "react";
import { deleteDraftMatch } from "@/app/admin/matches/actions";
import type { MatchActionState } from "@/app/admin/matches/actions";

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
    bettorNames?: string[];
    result?: {
      home_score_90: number;
      away_score_90: number;
    } | null;
  }[];
}

const initialDeleteState: MatchActionState = {
  status: "idle",
  message: "",
};

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
            <th>Bet lock</th>
            <th>Result</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({ match }: { match: MatchListProps["matches"][number] }) {
  const [state, formAction, pending] = useActionState(deleteDraftMatch, initialDeleteState);

  return (
    <tr>
      <td>{match.sort_order}</td>
      <td>{formatStage(match.stage, match.groups?.name)}</td>
      <td>
        {match.home_team?.name ?? "TBD"} vs {match.away_team?.name ?? "TBD"}
      </td>
      <td>{formatDate(match.starts_at)}</td>
      <td>{formatDate(match.daily_lock_at)}</td>
      <td>
        {match.result ? `${match.result.home_score_90}-${match.result.away_score_90}` : "Pending"}
      </td>
      <td>
        {match.result ? null : (
          <>
            <form
              action={formAction}
              onSubmit={(event) => {
                if (!window.confirm(buildDeleteConfirmation(match))) {
                  event.preventDefault();
                }
              }}
            >
              <input name="matchId" type="hidden" value={match.id} />
              <button className="secondary-button" disabled={pending} type="submit">
                {pending ? "Deleting..." : "Delete"}
              </button>
            </form>
            {state.message ? (
              <p className={state.status === "error" ? "form-message error" : "form-message"}>
                {state.message}
              </p>
            ) : null}
          </>
        )}
      </td>
    </tr>
  );
}

function buildDeleteConfirmation(match: MatchListProps["matches"][number]): string {
  const matchName = `${match.home_team?.name ?? "TBD"} vs ${match.away_team?.name ?? "TBD"}`;
  const bettorNames = match.bettorNames ?? [];

  if (bettorNames.length === 0) {
    return `Delete ${matchName}?\n\nNo submitted bets were found for this match.`;
  }

  return `Delete ${matchName} and ${bettorNames.length} submitted bet${
    bettorNames.length === 1 ? "" : "s"
  }?\n\nParticipants with bets:\n${bettorNames.map((name) => `- ${name}`).join("\n")}`;
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
