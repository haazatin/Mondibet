"use client";

import { useActionState } from "react";
import { saveResult, type ResultActionState } from "./actions";

export interface ResultEntryMatch {
  id: string;
  stage: string;
  sort_order: number;
  groups: { name: string } | null;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
  result: {
    home_score_90: number;
    away_score_90: number;
    home_score_final: number | null;
    away_score_final: number | null;
    advancing_team_id: string | null;
  } | null;
}

interface ResultEntryListProps {
  matches: ResultEntryMatch[];
}

const initialState: ResultActionState = {
  status: "idle",
  message: "",
};

const knockoutStages = new Set(["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"]);

export function ResultEntryList({ matches }: ResultEntryListProps) {
  if (matches.length === 0) {
    return <p className="empty-state">Create matches before entering results.</p>;
  }

  return (
    <div className="result-entry-list">
      {matches.map((match) => (
        <ResultEntryCard key={match.id} match={match} />
      ))}
    </div>
  );
}

function ResultEntryCard({ match }: { match: ResultEntryMatch }) {
  const [state, formAction, pending] = useActionState(saveResult, initialState);
  const homeTeam = match.home_team;
  const awayTeam = match.away_team;
  const isKnockout = knockoutStages.has(match.stage);
  const canSubmit = Boolean(homeTeam && awayTeam);

  return (
    <article className="result-entry-card">
      <div className="match-bet-header">
        <div>
          <div className="match-meta">
            {match.sort_order} · {formatStage(match.stage, match.groups?.name)}
          </div>
          <h3>
            {homeTeam?.name ?? "TBD"} vs {awayTeam?.name ?? "TBD"}
          </h3>
        </div>
        {match.result ? <span className="status-pill">Result saved</span> : null}
      </div>

      <form action={formAction} className="result-form">
        <input name="matchId" type="hidden" value={match.id} />
        <label className="field compact-field">
          <span>{homeTeam?.name ?? "Home"} 90&apos;</span>
          <input
            defaultValue={match.result?.home_score_90 ?? ""}
            disabled={!canSubmit || pending}
            min="0"
            name="homeScore90"
            required
            type="number"
          />
        </label>
        <label className="field compact-field">
          <span>{awayTeam?.name ?? "Away"} 90&apos;</span>
          <input
            defaultValue={match.result?.away_score_90 ?? ""}
            disabled={!canSubmit || pending}
            min="0"
            name="awayScore90"
            required
            type="number"
          />
        </label>
        {isKnockout ? (
          <>
            <label className="field compact-field">
              <span>{homeTeam?.name ?? "Home"} final</span>
              <input
                defaultValue={match.result?.home_score_final ?? ""}
                disabled={!canSubmit || pending}
                min="0"
                name="homeScoreFinal"
                type="number"
              />
            </label>
            <label className="field compact-field">
              <span>{awayTeam?.name ?? "Away"} final</span>
              <input
                defaultValue={match.result?.away_score_final ?? ""}
                disabled={!canSubmit || pending}
                min="0"
                name="awayScoreFinal"
                type="number"
              />
            </label>
            <label className="field compact-field advancing-field">
              <span>Advancing team</span>
              <select
                defaultValue={match.result?.advancing_team_id ?? ""}
                disabled={!canSubmit || pending}
                name="advancingTeamId"
              >
                <option value="">Only for 90&apos; draw</option>
                {homeTeam ? <option value={homeTeam.id}>{homeTeam.name}</option> : null}
                {awayTeam ? <option value={awayTeam.id}>{awayTeam.name}</option> : null}
              </select>
            </label>
          </>
        ) : null}
        <button className="primary-button result-submit-button" disabled={!canSubmit || pending} type="submit">
          {pending ? "Saving..." : match.result ? "Update result" : "Save result"}
        </button>
      </form>

      {state.message ? (
        <p className={state.status === "error" ? "form-message error" : "form-message"}>
          {state.message}
        </p>
      ) : null}
    </article>
  );
}

function formatStage(stage: string, groupName: string | undefined): string {
  if (stage === "group" && groupName) {
    return groupName;
  }

  return stage.replaceAll("_", " ");
}
