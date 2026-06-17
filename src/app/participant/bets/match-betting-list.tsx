"use client";

import { useActionState, useMemo, useState } from "react";
import { saveMatchBet, type MatchBetActionState } from "./actions";

export interface ParticipantMatch {
  id: string;
  stage: string;
  starts_at: string;
  daily_lock_at: string;
  sort_order: number;
  groups: { name: string } | null;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
  bet: {
    predicted_home_score_90: number;
    predicted_away_score_90: number;
    predicted_advancing_team_id: string | null;
    submitted_at: string;
  } | null;
}

interface MatchBettingListProps {
  matches: ParticipantMatch[];
}

const initialState: MatchBetActionState = {
  status: "idle",
  message: "",
};

const knockoutStages = new Set(["round_of_32", "round_of_16", "quarterfinal", "semifinal", "final"]);
const defaultVisibleMatchCount = 5;

export function MatchBettingList({ matches }: MatchBettingListProps) {
  const [showAll, setShowAll] = useState(false);
  const [loadedAt] = useState(() => new Date().toISOString());
  const visibleMatches = useMemo(() => {
    if (showAll) {
      return matches;
    }

    const upcomingMatches = matches.filter((match) => match.starts_at > loadedAt);
    return upcomingMatches.slice(0, defaultVisibleMatchCount);
  }, [loadedAt, matches, showAll]);

  if (matches.length === 0) {
    return null;
  }

  if (visibleMatches.length === 0) {
    return <p className="empty-state">No upcoming matches are available.</p>;
  }

  return (
    <div className="match-list-section">
      <div className="section-actions">
        <span>
          Showing {visibleMatches.length} of {matches.length} matches
        </span>
        {matches.length > defaultVisibleMatchCount ? (
          <button
            className="secondary-button"
            onClick={() => setShowAll((current) => !current)}
            type="button"
          >
            {showAll ? "See less" : "See more"}
          </button>
        ) : null}
      </div>
      <div className="match-bet-list">
        {visibleMatches.map((match) => (
          <MatchBetCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function MatchBetCard({ match }: { match: ParticipantMatch }) {
  const [state, formAction, pending] = useActionState(saveMatchBet, initialState);
  const isKnockout = knockoutStages.has(match.stage);
  const homeTeam = match.home_team;
  const awayTeam = match.away_team;
  const isSubmitted = Boolean(match.bet);
  const canSubmit = Boolean(homeTeam && awayTeam && !isSubmitted);

  return (
    <article className="match-bet-card">
      <div className="match-bet-header">
        <div>
          <div className="match-meta">
            {match.sort_order} · {formatStage(match.stage, match.groups?.name)}
          </div>
          <h3>
            {homeTeam?.name ?? "TBD"} vs {awayTeam?.name ?? "TBD"}
          </h3>
        </div>
      </div>

      <dl className="match-times">
        <div>
          <dt>Kickoff</dt>
          <dd>{formatDate(match.starts_at)}</dd>
        </div>
        <div>
          <dt>Bet lock</dt>
          <dd>{formatDate(match.daily_lock_at)}</dd>
        </div>
      </dl>

      <form action={formAction} className="bet-form">
        <input name="matchId" type="hidden" value={match.id} />
        <label className="field compact-field">
          <span>{homeTeam?.name ?? "Home"}</span>
          <input
            defaultValue={match.bet?.predicted_home_score_90 ?? ""}
            disabled={!canSubmit || pending}
            min="0"
            name="homeScore"
            required
            type="number"
          />
        </label>
        <label className="field compact-field">
          <span>{awayTeam?.name ?? "Away"}</span>
          <input
            defaultValue={match.bet?.predicted_away_score_90 ?? ""}
            disabled={!canSubmit || pending}
            min="0"
            name="awayScore"
            required
            type="number"
          />
        </label>
        {isKnockout ? (
          <label className="field compact-field advancing-field">
            <span>Advancing team</span>
            <select
              defaultValue={match.bet?.predicted_advancing_team_id ?? ""}
              disabled={!canSubmit || pending}
              name="advancingTeamId"
            >
              <option value="">Only for draw</option>
              {homeTeam ? <option value={homeTeam.id}>{homeTeam.name}</option> : null}
              {awayTeam ? <option value={awayTeam.id}>{awayTeam.name}</option> : null}
            </select>
          </label>
        ) : null}
        <button className="primary-button bet-submit-button" disabled={!canSubmit || pending} type="submit">
          {pending ? "Saving..." : isSubmitted ? "Bet submitted" : "Save bet"}
        </button>
      </form>

      <div className="bet-card-footer">
        {match.bet ? (
          <span>Saved {formatDate(match.bet.submitted_at)}. Ask the admin for changes.</span>
        ) : (
          <span>No bet yet</span>
        )}
        {state.message ? (
          <span className={state.status === "error" ? "form-message error" : "form-message"}>
            {state.message}
          </span>
        ) : null}
      </div>
    </article>
  );
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
