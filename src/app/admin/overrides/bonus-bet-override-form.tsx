"use client";

import { useActionState } from "react";
import {
  saveGeneralBonusBetOverride,
  saveGroupBonusBetOverride,
  type OverrideActionState,
} from "./actions";

interface BonusBetOverrideFormProps {
  participants: {
    id: string;
    display_name: string;
    email: string;
  }[];
  groups: {
    id: string;
    name: string;
  }[];
  groupTeams: {
    group_id: string;
    team_id: string;
    groups: { name: string } | null;
    teams: { name: string } | null;
  }[];
  teams: {
    id: string;
    name: string;
  }[];
}

const initialState: OverrideActionState = {
  status: "idle",
  message: "",
};

export function BonusBetOverrideForm({
  participants,
  groups,
  groupTeams,
  teams,
}: BonusBetOverrideFormProps) {
  return (
    <div className="bonus-betting">
      <GroupBonusOverrideForm
        groupTeams={groupTeams}
        groups={groups}
        participants={participants}
      />
      <GeneralBonusOverrideForm
        groups={groups}
        participants={participants}
        teams={teams}
      />
    </div>
  );
}

function GroupBonusOverrideForm({
  participants,
  groups,
  groupTeams,
}: Pick<BonusBetOverrideFormProps, "participants" | "groups" | "groupTeams">) {
  const [state, formAction, pending] = useActionState(saveGroupBonusBetOverride, initialState);
  const canSubmit = participants.length > 0 && groups.length > 0 && groupTeams.length > 0;

  return (
    <form action={formAction} className="override-form">
      <h3 className="override-form-title">Group bonus override</h3>
      <ParticipantSelect disabled={!canSubmit || pending} participants={participants} />
      <label className="field">
        <span>Group</span>
        <select disabled={!canSubmit || pending} name="groupId" required>
          <option value="">Choose group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <GroupTeamSelect disabled={!canSubmit || pending} groupTeams={groupTeams} label="First place" name="firstTeamId" />
      <GroupTeamSelect disabled={!canSubmit || pending} groupTeams={groupTeams} label="Second place" name="secondTeamId" />
      <GroupTeamSelect disabled={!canSubmit || pending} groupTeams={groupTeams} label="Third place" name="thirdTeamId" />
      <ReasonField disabled={!canSubmit || pending} />
      <button className="primary-button" disabled={!canSubmit || pending} type="submit">
        {pending ? "Saving..." : "Save group bonus override"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function GeneralBonusOverrideForm({
  participants,
  groups,
  teams,
}: Pick<BonusBetOverrideFormProps, "participants" | "groups" | "teams">) {
  const [state, formAction, pending] = useActionState(saveGeneralBonusBetOverride, initialState);
  const canSubmit = participants.length > 0 && teams.length > 0;

  return (
    <form action={formAction} className="override-form">
      <h3 className="override-form-title">General bonus override</h3>
      <ParticipantSelect disabled={!canSubmit || pending} participants={participants} />
      <TeamSelect disabled={!canSubmit || pending} label="Champion" name="championTeamId" teams={teams} />
      <TeamSelect disabled={!canSubmit || pending} label="Runner-up" name="runnerUpTeamId" teams={teams} />
      <label className="field compact-field">
        <span>Top scorer</span>
        <input disabled={!canSubmit || pending} name="topScorerName" type="text" />
      </label>
      <label className="field compact-field">
        <span>Top scorer goals</span>
        <input disabled={!canSubmit || pending} min="0" name="topScorerGoals" type="number" />
      </label>
      <label className="field compact-field">
        <span>Player of tournament</span>
        <input disabled={!canSubmit || pending} name="playerOfTournament" type="text" />
      </label>
      <TeamSelect disabled={!canSubmit || pending} label="Surprise team" name="surpriseTeamId" teams={teams} />
      <TeamSelect disabled={!canSubmit || pending} label="Disappointment team" name="disappointmentTeamId" teams={teams} />
      <GroupSelect disabled={!canSubmit || pending} groups={groups} label="Highest-scoring group" name="highestScoringGroupId" />
      <GroupSelect disabled={!canSubmit || pending} groups={groups} label="Lowest-scoring group" name="lowestScoringGroupId" />
      <TeamSelect disabled={!canSubmit || pending} label="Team with most goals" name="mostGoalsTeamId" teams={teams} />
      <TeamSelect disabled={!canSubmit || pending} label="Team with fewest goals" name="fewestGoalsTeamId" teams={teams} />
      <ReasonField disabled={!canSubmit || pending} />
      <button className="primary-button" disabled={!canSubmit || pending} type="submit">
        {pending ? "Saving..." : "Save general bonus override"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function ParticipantSelect({
  disabled,
  participants,
}: {
  disabled: boolean;
  participants: BonusBetOverrideFormProps["participants"];
}) {
  return (
    <label className="field">
      <span>Participant</span>
      <select disabled={disabled} name="participantId" required>
        <option value="">Choose participant</option>
        {participants.map((participant) => (
          <option key={participant.id} value={participant.id}>
            {participant.display_name} · {participant.email}
          </option>
        ))}
      </select>
    </label>
  );
}

function TeamSelect({
  disabled,
  label,
  name,
  teams,
}: {
  disabled: boolean;
  label: string;
  name: string;
  teams: BonusBetOverrideFormProps["teams"];
}) {
  return (
    <label className="field compact-field">
      <span>{label}</span>
      <select disabled={disabled} name={name}>
        <option value="">Choose team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function GroupSelect({
  disabled,
  groups,
  label,
  name,
}: {
  disabled: boolean;
  groups: BonusBetOverrideFormProps["groups"];
  label: string;
  name: string;
}) {
  return (
    <label className="field compact-field">
      <span>{label}</span>
      <select disabled={disabled} name={name}>
        <option value="">Choose group</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function GroupTeamSelect({
  disabled,
  groupTeams,
  label,
  name,
}: {
  disabled: boolean;
  groupTeams: BonusBetOverrideFormProps["groupTeams"];
  label: string;
  name: string;
}) {
  return (
    <label className="field compact-field">
      <span>{label}</span>
      <select disabled={disabled} name={name} required>
        <option value="">Choose group team</option>
        {groupTeams.map((assignment) => (
          <option key={`${assignment.group_id}-${assignment.team_id}-${name}`} value={assignment.team_id}>
            {assignment.groups?.name ?? "Group"} · {assignment.teams?.name ?? "Team"}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReasonField({ disabled }: { disabled: boolean }) {
  return (
    <label className="field override-reason-field">
      <span>Reason</span>
      <input
        disabled={disabled}
        name="reason"
        placeholder="Late manual submission, correction, etc."
        required
        type="text"
      />
    </label>
  );
}

function ActionMessage({ state }: { state: OverrideActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={state.status === "error" ? "form-message error" : "form-message"}>
      {state.message}
    </p>
  );
}
