"use client";

import { useState } from "react";

export interface LockedParticipantBet {
  participant_id: string;
  participant_name: string;
  predicted_home_score_90: number;
  predicted_away_score_90: number;
  predicted_advancing_team_id: string | null;
  submitted_at: string;
}

export interface LockedParticipantBetMatch {
  id: string;
  sort_order: number;
  starts_at: string;
  daily_lock_at: string;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
  bets: LockedParticipantBet[];
}

interface LockedParticipantBetsProps {
  matches: LockedParticipantBetMatch[];
}

const visibleLockedMatchCount = 5;

export function LockedParticipantBets({ matches }: LockedParticipantBetsProps) {
  const [showRecent, setShowRecent] = useState(false);
  const visibleMatches = showRecent ? matches.slice(0, visibleLockedMatchCount) : matches.slice(0, 1);

  if (matches.length === 0) {
    return <p className="empty-state">Participant bets will appear here after a match locks.</p>;
  }

  return (
    <div className="match-list-section">
      <div className="section-actions">
        <span>
          Showing {visibleMatches.length} of {Math.min(matches.length, visibleLockedMatchCount)} locked matches
        </span>
        {matches.length > 1 ? (
          <button
            className="secondary-button"
            onClick={() => setShowRecent((current) => !current)}
            type="button"
          >
            {showRecent ? "Show latest" : "Show last 5"}
          </button>
        ) : null}
      </div>
      <div className="result-entry-list">
        {visibleMatches.map((match) => (
          <article className="result-entry-card" key={match.id}>
            <div className="match-bet-header">
              <div>
                <div className="match-meta">
                  Match {match.sort_order} · Locked {formatDate(match.daily_lock_at)}
                </div>
                <h3>
                  {match.home_team?.name ?? "TBD"} vs {match.away_team?.name ?? "TBD"}
                </h3>
              </div>
            </div>
            {match.bets.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Bet</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.bets.map((bet) => (
                      <tr key={`${match.id}-${bet.participant_id}`}>
                        <td>{bet.participant_name}</td>
                        <td>{formatBet(match, bet)}</td>
                        <td>{formatDate(bet.submitted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No submitted bets for this locked match yet.</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function formatBet(match: LockedParticipantBetMatch, bet: LockedParticipantBet): string {
  const score = `${bet.predicted_home_score_90}-${bet.predicted_away_score_90}`;
  const advancingTeam = formatAdvancingTeam(match, bet.predicted_advancing_team_id);

  if (advancingTeam) {
    return `${score}, ${advancingTeam} advances`;
  }

  return score;
}

function formatAdvancingTeam(match: LockedParticipantBetMatch, teamId: string | null): string {
  if (!teamId) {
    return "";
  }

  return [match.home_team, match.away_team].find((team) => team?.id === teamId)?.name ?? "Team";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
