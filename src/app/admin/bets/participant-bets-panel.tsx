"use client";

import { useMemo, useState } from "react";

interface AdminMatchBet {
  match_id: string;
  participant_id: string;
  participant_name: string;
  predicted_home_score_90: number;
  predicted_away_score_90: number;
  predicted_advancing_team_id: string | null;
  submitted_at: string;
}

interface AdminBetMatch {
  id: string;
  sort_order: number;
  groups: { name: string } | null;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
  result: unknown | null;
}

interface ParticipantBetsPanelProps {
  bets: AdminMatchBet[];
  matches: AdminBetMatch[];
}

export function ParticipantBetsPanel({ bets, matches }: ParticipantBetsPanelProps) {
  const [showFinishedMatches, setShowFinishedMatches] = useState(false);
  const betsByMatchId = useMemo(() => {
    const grouped = new Map<string, AdminMatchBet[]>();

    for (const bet of bets) {
      const current = grouped.get(bet.match_id) ?? [];
      current.push(bet);
      grouped.set(bet.match_id, current);
    }

    return grouped;
  }, [bets]);
  const visibleMatches = matches.filter(
    (match) => betsByMatchId.has(match.id) && (showFinishedMatches || !match.result),
  );
  const hiddenFinishedCount = matches.filter(
    (match) => betsByMatchId.has(match.id) && match.result,
  ).length;

  if (bets.length === 0) {
    return <p className="empty-state">No participant match bets have been submitted yet.</p>;
  }

  return (
    <div className="match-list-section">
      <div className="section-actions">
        <span>
          Showing {visibleMatches.length} matches
          {hiddenFinishedCount > 0 && !showFinishedMatches ? `, ${hiddenFinishedCount} finished hidden` : ""}
        </span>
        {hiddenFinishedCount > 0 ? (
          <button
            className="secondary-button"
            onClick={() => setShowFinishedMatches((current) => !current)}
            type="button"
          >
            {showFinishedMatches ? "Hide finished games" : "Unhide finished games"}
          </button>
        ) : null}
      </div>
      {visibleMatches.length === 0 ? (
        <p className="empty-state">No open-game bets to show.</p>
      ) : (
        <div className="result-entry-list">
          {visibleMatches.map((match) => (
            <article className="result-entry-card" key={match.id}>
              <div className="match-bet-header">
                <div>
                  <div className="match-meta">
                    {match.sort_order} · {match.groups?.name ?? "Match"}
                  </div>
                  <h3>
                    {match.home_team?.name ?? "TBD"} vs {match.away_team?.name ?? "TBD"}
                  </h3>
                </div>
                {match.result ? <span className="status-pill">Result saved</span> : null}
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Bet</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(betsByMatchId.get(match.id) ?? []).map((bet) => (
                      <tr key={`${bet.match_id}-${bet.participant_id}`}>
                        <td>{bet.participant_name}</td>
                        <td>{formatBet(match, bet)}</td>
                        <td>{formatDate(bet.submitted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBet(match: AdminBetMatch, bet: AdminMatchBet): string {
  const score = `${bet.predicted_home_score_90}-${bet.predicted_away_score_90}`;

  if (!bet.predicted_advancing_team_id) {
    return score;
  }

  const advancingTeam =
    [match.home_team, match.away_team].find((team) => team?.id === bet.predicted_advancing_team_id)?.name ??
    "Team";

  return `${score}, ${advancingTeam} advances`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
