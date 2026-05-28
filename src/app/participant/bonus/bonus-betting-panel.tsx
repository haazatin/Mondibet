"use client";

import { useActionState, useState } from "react";
import {
  saveGeneralBonusBet,
  saveGroupBonusBet,
  type BonusBetActionState,
} from "@/app/participant/bonus/actions";

export interface BonusTeam {
  id: string;
  name: string;
}

export interface BonusGroup {
  id: string;
  name: string;
  sort_order: number;
  teams: BonusTeam[];
  bet: {
    predicted_first_team_id: string | null;
    predicted_second_team_id: string | null;
    predicted_third_team_id: string | null;
    submitted_at: string;
  } | null;
}

export interface GeneralBonusBet {
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  top_scorer_name: string | null;
  top_scorer_goals: number | null;
  player_of_tournament: string | null;
  surprise_team_id: string | null;
  disappointment_team_id: string | null;
  highest_scoring_group_id: string | null;
  lowest_scoring_group_id: string | null;
  most_goals_team_id: string | null;
  fewest_goals_team_id: string | null;
  submitted_at: string;
}

interface BonusBettingPanelProps {
  bonusLockAt: string | null;
  groups: BonusGroup[];
  teams: BonusTeam[];
  generalBet: GeneralBonusBet | null;
}

const initialState: BonusBetActionState = {
  status: "idle",
  message: "",
};

export function BonusBettingPanel({
  bonusLockAt,
  groups,
  teams,
  generalBet,
}: BonusBettingPanelProps) {
  const [isHidden, setIsHidden] = useState(false);

  if (groups.length === 0 && teams.length === 0) {
    return <p className="empty-state">Bonus betting will appear after teams and groups are set up.</p>;
  }

  return (
    <div className="bonus-betting">
      <div className="section-actions">
        <span>Pre-tournament predictions</span>
        <button
          className="secondary-button"
          onClick={() => setIsHidden((current) => !current)}
          type="button"
        >
          {isHidden ? "Show bonus section" : "Hide bonus section"}
        </button>
      </div>
      {isHidden ? null : (
        <>
      <div className="status-pill">
        Bonus lock: {bonusLockAt ? formatDate(bonusLockAt) : "not configured"}
      </div>
      <GeneralBonusForm
        bet={generalBet}
        disabled={!bonusLockAt}
        groups={groups}
        teams={teams}
      />
      <div className="bonus-group-grid">
        {groups.map((group) => (
          <GroupBonusForm
            disabled={!bonusLockAt}
            group={group}
            key={group.id}
          />
        ))}
      </div>
        </>
      )}
    </div>
  );
}

function GeneralBonusForm({
  bet,
  disabled,
  groups,
  teams,
}: {
  bet: GeneralBonusBet | null;
  disabled: boolean;
  groups: BonusGroup[];
  teams: BonusTeam[];
}) {
  const [state, formAction, pending] = useActionState(saveGeneralBonusBet, initialState);
  const isDisabled = disabled || pending;

  return (
    <form action={formAction} className="bonus-form">
      <h3>General Bonus</h3>
      <div className="bonus-form-grid">
        <TeamSelect
          defaultValue={bet?.champion_team_id}
          disabled={isDisabled}
          label="Champion"
          name="championTeamId"
          teams={teams}
        />
        <TeamSelect
          defaultValue={bet?.runner_up_team_id}
          disabled={isDisabled}
          label="Runner-up"
          name="runnerUpTeamId"
          teams={teams}
        />
        <label className="field compact-field">
          <span>Top scorer</span>
          <input
            defaultValue={bet?.top_scorer_name ?? ""}
            disabled={isDisabled}
            name="topScorerName"
            type="text"
          />
        </label>
        <label className="field compact-field">
          <span>Top scorer goals</span>
          <input
            defaultValue={bet?.top_scorer_goals ?? ""}
            disabled={isDisabled}
            min="0"
            name="topScorerGoals"
            type="number"
          />
        </label>
        <label className="field compact-field">
          <span>Player of tournament</span>
          <input
            defaultValue={bet?.player_of_tournament ?? ""}
            disabled={isDisabled}
            name="playerOfTournament"
            type="text"
          />
        </label>
        <GroupSelect
          defaultValue={bet?.highest_scoring_group_id}
          disabled={isDisabled}
          groups={groups}
          label="Highest-scoring group"
          name="highestScoringGroupId"
        />
        <GroupSelect
          defaultValue={bet?.lowest_scoring_group_id}
          disabled={isDisabled}
          groups={groups}
          label="Lowest-scoring group"
          name="lowestScoringGroupId"
        />
        <TeamSelect
          defaultValue={bet?.most_goals_team_id}
          disabled={isDisabled}
          label="Team with most goals"
          name="mostGoalsTeamId"
          teams={teams}
        />
        <TeamSelect
          defaultValue={bet?.fewest_goals_team_id}
          disabled={isDisabled}
          label="Team with fewest goals"
          name="fewestGoalsTeamId"
          teams={teams}
        />
        <TeamSelect
          defaultValue={bet?.surprise_team_id}
          disabled={isDisabled}
          label="Surprise team"
          name="surpriseTeamId"
          teams={teams}
        />
        <TeamSelect
          defaultValue={bet?.disappointment_team_id}
          disabled={isDisabled}
          label="Disappointment team"
          name="disappointmentTeamId"
          teams={teams}
        />
      </div>
      <div className="bet-card-footer">
        {bet ? <span>Saved {formatDate(bet.submitted_at)}</span> : <span>No general bonus yet</span>}
        <button className="primary-button" disabled={isDisabled} type="submit">
          {pending ? "Saving..." : bet ? "Update general bonus" : "Save general bonus"}
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

function GroupBonusForm({ disabled, group }: { disabled: boolean; group: BonusGroup }) {
  const [state, formAction, pending] = useActionState(saveGroupBonusBet, initialState);
  const isDisabled = disabled || pending || group.teams.length < 3;

  return (
    <form action={formAction} className="bonus-form">
      <input name="groupId" type="hidden" value={group.id} />
      <h3>{group.name}</h3>
      <TeamSelect
        defaultValue={group.bet?.predicted_first_team_id}
        disabled={isDisabled}
        label="First place"
        name="firstTeamId"
        required
        teams={group.teams}
      />
      <TeamSelect
        defaultValue={group.bet?.predicted_second_team_id}
        disabled={isDisabled}
        label="Second place"
        name="secondTeamId"
        required
        teams={group.teams}
      />
      <TeamSelect
        defaultValue={group.bet?.predicted_third_team_id}
        disabled={isDisabled}
        label="Third place"
        name="thirdTeamId"
        required
        teams={group.teams}
      />
      <div className="bet-card-footer">
        {group.bet ? <span>Saved {formatDate(group.bet.submitted_at)}</span> : <span>No group bonus yet</span>}
        <button className="primary-button" disabled={isDisabled} type="submit">
          {pending ? "Saving..." : group.bet ? "Update group" : "Save group"}
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
  teams: BonusTeam[];
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
  groups: BonusGroup[];
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
