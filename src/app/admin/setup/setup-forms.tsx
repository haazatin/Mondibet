"use client";

import { useActionState } from "react";
import {
  addGroup,
  addTeam,
  assignTeamToGroup,
  type SetupActionState,
} from "@/app/admin/setup/actions";

const initialState: SetupActionState = {
  status: "idle",
  message: "",
};

interface SetupFormsProps {
  teams: { id: string; name: string }[];
  groups: { id: string; name: string }[];
}

export function SetupForms({ teams, groups }: SetupFormsProps) {
  const [teamState, teamAction, teamPending] = useActionState(addTeam, initialState);
  const [groupState, groupAction, groupPending] = useActionState(addGroup, initialState);
  const [assignState, assignAction, assignPending] = useActionState(assignTeamToGroup, initialState);

  return (
    <div className="setup-grid">
      <form action={teamAction} className="stack-form">
        <h3>Add Team</h3>
        <label className="field">
          <span>Team name</span>
          <input name="name" placeholder="Argentina" required />
        </label>
        <label className="field">
          <span>Short name</span>
          <input name="shortName" placeholder="Argentina" />
        </label>
        <label className="field">
          <span>FIFA code</span>
          <input maxLength={3} name="fifaCode" placeholder="ARG" />
        </label>
        <button className="primary-button" disabled={teamPending} type="submit">
          {teamPending ? "Adding..." : "Add team"}
        </button>
        <ActionMessage state={teamState} />
      </form>

      <form action={groupAction} className="stack-form">
        <h3>Add Group</h3>
        <label className="field">
          <span>Group name</span>
          <input name="name" placeholder="Group A" required />
        </label>
        <label className="field">
          <span>Order</span>
          <input min={1} name="sortOrder" placeholder="1" required type="number" />
        </label>
        <button className="primary-button" disabled={groupPending} type="submit">
          {groupPending ? "Adding..." : "Add group"}
        </button>
        <ActionMessage state={groupState} />
      </form>

      <form action={assignAction} className="stack-form">
        <h3>Assign Team</h3>
        <label className="field">
          <span>Group</span>
          <select name="groupId" required>
            <option value="">Choose group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Team</span>
          <select name="teamId" required>
            <option value="">Choose team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Seed order</span>
          <input min={1} name="seedOrder" placeholder="1" type="number" />
        </label>
        <button className="primary-button" disabled={assignPending} type="submit">
          {assignPending ? "Assigning..." : "Assign team"}
        </button>
        <ActionMessage state={assignState} />
      </form>
    </div>
  );
}

function ActionMessage({ state }: { state: SetupActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={state.status === "error" ? "form-message error" : "form-message"}>
      {state.message}
    </p>
  );
}

