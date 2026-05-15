"use client";

import { useActionState } from "react";
import { saveMatchBetOverride, type OverrideActionState } from "./actions";

interface MatchBetOverrideFormProps {
  participants: {
    id: string;
    display_name: string;
    email: string;
  }[];
  matches: {
    id: string;
    stage: string;
    sort_order: number;
    home_team: { id: string; name: string } | null;
    away_team: { id: string; name: string } | null;
  }[];
}

const initialState: OverrideActionState = {
  status: "idle",
  message: "",
};

export function MatchBetOverrideForm({ participants, matches }: MatchBetOverrideFormProps) {
  const [state, formAction, pending] = useActionState(saveMatchBetOverride, initialState);
  const canSubmit = participants.length > 0 && matches.length > 0;

  return (
    <form action={formAction} className="override-form">
      <label className="field">
        <span>Participant</span>
        <select disabled={!canSubmit || pending} name="participantId" required>
          <option value="">Choose participant</option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.display_name} · {participant.email}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Match</span>
        <select disabled={!canSubmit || pending} name="matchId" required>
          <option value="">Choose match</option>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.sort_order} · {match.home_team?.name ?? "TBD"} vs{" "}
              {match.away_team?.name ?? "TBD"}
            </option>
          ))}
        </select>
      </label>
      <label className="field compact-field">
        <span>Home score</span>
        <input disabled={!canSubmit || pending} min="0" name="homeScore" required type="number" />
      </label>
      <label className="field compact-field">
        <span>Away score</span>
        <input disabled={!canSubmit || pending} min="0" name="awayScore" required type="number" />
      </label>
      <label className="field">
        <span>Advancing team</span>
        <select disabled={!canSubmit || pending} name="advancingTeamId">
          <option value="">Only for knockout draw</option>
          {matches.flatMap((match) =>
            [match.home_team, match.away_team]
              .filter((team): team is { id: string; name: string } => Boolean(team))
              .map((team) => (
                <option key={`${match.id}-${team.id}`} value={team.id}>
                  Match {match.sort_order} · {team.name}
                </option>
              )),
          )}
        </select>
      </label>
      <label className="field override-reason-field">
        <span>Reason</span>
        <input
          disabled={!canSubmit || pending}
          name="reason"
          placeholder="Late manual submission, correction, etc."
          required
          type="text"
        />
      </label>
      <button className="primary-button" disabled={!canSubmit || pending} type="submit">
        {pending ? "Saving..." : "Save override"}
      </button>
      {state.message ? (
        <p className={state.status === "error" ? "form-message error" : "form-message"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
