"use client";

import { useActionState } from "react";
import { addMatch, type MatchActionState } from "@/app/admin/matches/actions";
import type { TournamentStage } from "@/types/tournament";

const initialState: MatchActionState = {
  status: "idle",
  message: "",
};

const stageOptions: { value: TournamentStage; label: string }[] = [
  { value: "group", label: "Group" },
  { value: "round_of_32", label: "Round of 32" },
  { value: "round_of_16", label: "Round of 16" },
  { value: "quarterfinal", label: "Quarterfinal" },
  { value: "semifinal", label: "Semifinal" },
  { value: "final", label: "Final" },
];

interface MatchFormProps {
  teams: { id: string; name: string }[];
  groups: { id: string; name: string }[];
}

export function MatchForm({ teams, groups }: MatchFormProps) {
  const [state, formAction, pending] = useActionState(addMatch, initialState);

  return (
    <form action={formAction} className="match-form">
      <label className="field">
        <span>Stage</span>
        <select name="stage" required>
          {stageOptions.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Group</span>
        <select name="groupId">
          <option value="">No group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Home team</span>
        <select name="homeTeamId" required>
          <option value="">Choose team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Away team</span>
        <select name="awayTeamId" required>
          <option value="">Choose team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Kickoff</span>
        <input name="startsAt" required type="datetime-local" />
      </label>
      <label className="field">
        <span>Order</span>
        <input min={1} name="sortOrder" required type="number" />
      </label>
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Adding..." : "Add match"}
      </button>
      {state.message ? (
        <p className={state.status === "error" ? "form-message error" : "form-message"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

