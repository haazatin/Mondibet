"use client";

import { useActionState } from "react";
import {
  saveGeneralBonusResult,
  saveGroupBonusResult,
  type BonusResultActionState,
} from "@/app/admin/bonus-results/actions";

export interface BonusResultTeam {
  id: string;
  name: string;
}

export interface BonusResultGroup {
  id: string;
  name: string;
  sort_order: number;
  teams: BonusResultTeam[];
  result: {
    first_team_id: string;
    second_team_id: string;
    third_team_id: string;
  } | null;
}

export interface GeneralBonusResult {
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  top_scorer_name: string | null;
  top_scorer_goals: number | null;
  player_of_tournament: string | null;
  highest_scoring_group_id: string | null;
  lowest_scoring_group_id: string | null;
  most_goals_team_id: string | null;
  fewest_goals_team_id: string | null;
}

interface BonusResultPanelProps {
  groups: BonusResultGroup[];
  teams: BonusResultTeam[];
  generalResult: GeneralBonusResult | null;
}

const initialState: BonusResultActionState = {
  status: "idle",
  message: "",
};

export function BonusResultPanel({ groups, teams, generalResult }: BonusResultPanelProps) {
  if (groups.length === 0 && teams.length === 0) {
    return <p className="empty-state">Set up teams and groups before entering bonus results.</p>;
  }

  return (
    <div className="bonus-betting">
      <GeneralBonusResultForm groups={groups} result={generalResult} teams={teams} />
      <div className="bonus-group-grid">
        {groups.map((group) => (
          <GroupBonusResultForm group={group} key={group.id} />
        ))}
      </div>
    </div>
  );
}

function GeneralBonusResultForm({
  groups,
  result,
  teams,
}: {
  groups: BonusResultGroup[];
  result: GeneralBonusResult | null;
  teams: BonusResultTeam[];
}) {
  const [state, formAction, pending] = useActionState(saveGeneralBonusResult, initialState);

  return (
    <form action={formAction} className="bonus-form">
      <h3>General Bonus Results</h3>
      <div className="bonus-form-grid">
        <TeamSelect
          defaultValue={result?.champion_team_id}
          disabled={pending}
          label="Champion"
          name="championTeamId"
          teams={teams}
        />
        <TeamSelect
          defaultValue={result?.runner_up_team_id}
          disabled={pending}
          label="Runner-up"
          name="runnerUpTeamId"
          teams={teams}
        />
        <label className="field compact-field">
          <span>Top scorer</span>
          <input
            defaultValue={result?.top_scorer_name ?? ""}
            disabled={pending}
            name="topScorerName"
            type="text"
          />
        </label>
        <label className="field compact-field">
          <span>Top scorer goals</span>
          <input
            defaultValue={result?.top_scorer_goals ?? ""}
            disabled={pending}
            min="0"
            name="topScorerGoals"
            type="number"
          />
        </label>
        <label className="field compact-field">
          <span>Player of tournament</span>
          <input
            defaultValue={result?.player_of_tournament ?? ""}
            disabled={pending}
            name="playerOfTournament"
            type="text"
          />
        </label>
        <GroupSelect
          defaultValue={result?.highest_scoring_group_id}
          disabled={pending}
          groups={groups}
          label="Highest-scoring group"
          name="highestScoringGroupId"
        />
        <GroupSelect
          defaultValue={result?.lowest_scoring_group_id}
          disabled={pending}
          groups={groups}
          label="Lowest-scoring group"
          name="lowestScoringGroupId"
        />
        <TeamSelect
          defaultValue={result?.most_goals_team_id}
          disabled={pending}
          label="Team with most goals"
          name="mostGoalsTeamId"
          teams={teams}
        />
        <TeamSelect
          defaultValue={result?.fewest_goals_team_id}
          disabled={pending}
          label="Team with fewest goals"
          name="fewestGoalsTeamId"
          teams={teams}
        />
      </div>
      <div className="bet-card-footer">
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Saving..." : result ? "Update general results" : "Save general results"}
        </button>
        {state.message ? (
          <span className={state.status === "error" ? "form-message error" : "form-message"}>
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function GroupBonusResultForm({ group }: { group: BonusResultGroup }) {
  const [state, formAction, pending] = useActionState(saveGroupBonusResult, initialState);
  const isDisabled = pending || group.teams.length < 3;

  return (
    <form action={formAction} className="bonus-form">
      <input name="groupId" type="hidden" value={group.id} />
      <h3>{group.name}</h3>
      <TeamSelect
        defaultValue={group.result?.first_team_id}
        disabled={isDisabled}
        label="First place"
        name="firstTeamId"
        required
        teams={group.teams}
      />
      <TeamSelect
        defaultValue={group.result?.second_team_id}
        disabled={isDisabled}
        label="Second place"
        name="secondTeamId"
        required
        teams={group.teams}
      />
      <TeamSelect
        defaultValue={group.result?.third_team_id}
        disabled={isDisabled}
        label="Third place"
        name="thirdTeamId"
        required
        teams={group.teams}
      />
      <div className="bet-card-footer">
        <button className="primary-button" disabled={isDisabled} type="submit">
          {pending ? "Saving..." : group.result ? "Update group result" : "Save group result"}
        </button>
        {state.message ? (
          <span className={state.status === "error" ? "form-message error" : "form-message"}>
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function TeamSelect({
  defaultValue,
  disabled,
  label,
  name,
  required = false,
  teams,
}: {
  defaultValue?: string | null;
  disabled: boolean;
  label: string;
  name: string;
  required?: boolean;
  teams: BonusResultTeam[];
}) {
  return (
    <label className="field compact-field">
      <span>{label}</span>
      <select defaultValue={defaultValue ?? ""} disabled={disabled} name={name} required={required}>
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
  defaultValue,
  disabled,
  groups,
  label,
  name,
}: {
  defaultValue?: string | null;
  disabled: boolean;
  groups: BonusResultGroup[];
  label: string;
  name: string;
}) {
  return (
    <label className="field compact-field">
      <span>{label}</span>
      <select defaultValue={defaultValue ?? ""} disabled={disabled} name={name}>
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
