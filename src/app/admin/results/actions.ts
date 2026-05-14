"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { scoreMatchBet } from "@/lib/scoring/match";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchBet, MatchResult, TournamentStage } from "@/types/tournament";

export interface ResultActionState {
  status: "idle" | "success" | "error";
  message: string;
}

const knockoutStages = new Set<TournamentStage>([
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "final",
]);

export async function saveResult(
  _previousState: ResultActionState,
  formData: FormData,
): Promise<ResultActionState> {
  const matchId = String(formData.get("matchId") ?? "");
  const homeScore90 = parseScore(formData.get("homeScore90"));
  const awayScore90 = parseScore(formData.get("awayScore90"));
  const homeScoreFinal = parseOptionalScore(formData.get("homeScoreFinal"));
  const awayScoreFinal = parseOptionalScore(formData.get("awayScoreFinal"));
  const advancingTeamId = emptyToNull(String(formData.get("advancingTeamId") ?? ""));

  if (!matchId || homeScore90 === null || awayScore90 === null) {
    return { status: "error", message: "Enter a valid 90-minute score." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can enter results." };
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id,tournament_id,stage,home_team_id,away_team_id")
    .eq("id", matchId)
    .eq("tournament_id", current.tournamentId)
    .maybeSingle();

  if (matchError) {
    return { status: "error", message: matchError.message };
  }

  if (!match) {
    return { status: "error", message: "Match was not found." };
  }

  const isKnockout = knockoutStages.has(match.stage as TournamentStage);
  const isDrawAfter90 = homeScore90 === awayScore90;

  if (isKnockout && isDrawAfter90 && !advancingTeamId) {
    return { status: "error", message: "Choose the advancing team for a knockout draw." };
  }

  if (
    advancingTeamId &&
    advancingTeamId !== match.home_team_id &&
    advancingTeamId !== match.away_team_id
  ) {
    return { status: "error", message: "Advancing team must belong to this match." };
  }

  const officialResult: MatchResult = {
    homeScore90,
    awayScore90,
    advancingTeamId: isKnockout && isDrawAfter90 ? advancingTeamId ?? undefined : undefined,
  };

  const { error: resultError } = await supabase.from("results").upsert(
    {
      match_id: match.id,
      home_score_90: homeScore90,
      away_score_90: awayScore90,
      home_score_final: homeScoreFinal,
      away_score_final: awayScoreFinal,
      advancing_team_id: officialResult.advancingTeamId ?? null,
      source: "admin",
      is_official: true,
      created_by: current.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id" },
  );

  if (resultError) {
    return { status: "error", message: resultError.message };
  }

  const scoringResult = await recalculateMatchScores({
    match: {
      id: match.id,
      tournamentId: match.tournament_id,
      stage: match.stage as TournamentStage,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
    },
    result: officialResult,
  });

  if (scoringResult.status === "error") {
    return scoringResult;
  }

  revalidatePath("/admin");
  revalidatePath("/participant");

  return { status: "success", message: `Result saved. ${scoringResult.message}` };
}

async function recalculateMatchScores({
  match,
  result,
}: {
  match: {
    id: string;
    tournamentId: string;
    stage: TournamentStage;
    homeTeamId: string;
    awayTeamId: string;
  };
  result: MatchResult;
}): Promise<ResultActionState> {
  const supabase = await createSupabaseServerClient();

  const { data: bets, error: betsError } = await supabase
    .from("match_bets")
    .select(
      "id,participant_id,predicted_home_score_90,predicted_away_score_90,predicted_advancing_team_id",
    )
    .eq("match_id", match.id);

  if (betsError) {
    return { status: "error", message: betsError.message };
  }

  const { error: deleteError } = await supabase
    .from("score_events")
    .delete()
    .eq("source_type", "match")
    .eq("source_id", match.id);

  if (deleteError) {
    return { status: "error", message: deleteError.message };
  }

  const scoreEvents = (bets ?? []).flatMap((bet) => {
    const breakdown = scoreMatchBet(
      {
        stage: match.stage,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
      },
      {
        predictedHomeScore90: bet.predicted_home_score_90,
        predictedAwayScore90: bet.predicted_away_score_90,
        predictedAdvancingTeamId: bet.predicted_advancing_team_id ?? undefined,
      } satisfies MatchBet,
      result,
    );

    return [
      {
        category: "match_outcome",
        points: breakdown.outcomePoints,
        reason: "Correct match outcome",
      },
      {
        category: "exact_score",
        points: breakdown.exactScorePoints,
        reason: "Exact 90-minute score",
      },
      {
        category: "goal_difference",
        points: breakdown.goalDifferencePoints,
        reason: "Correct goal difference",
      },
    ]
      .filter((event) => event.points > 0)
      .map((event) => ({
        participant_id: bet.participant_id,
        tournament_id: match.tournamentId,
        source_type: "match",
        source_id: match.id,
        category: event.category,
        points: event.points,
        reason: event.reason,
      }));
  });

  if (scoreEvents.length === 0) {
    return { status: "success", message: "No score events were created." };
  }

  const { error: insertError } = await supabase.from("score_events").insert(scoreEvents);

  if (insertError) {
    return { status: "error", message: insertError.message };
  }

  return { status: "success", message: `${scoreEvents.length} score events recalculated.` };
}

function parseScore(value: FormDataEntryValue | null): number | null {
  const score = Number(String(value ?? "").trim());

  if (!Number.isInteger(score) || score < 0 || score > 99) {
    return null;
  }

  return score;
}

function parseOptionalScore(value: FormDataEntryValue | null): number | null {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  return parseScore(rawValue);
}

function emptyToNull(value: string): string | null {
  return value.trim() ? value : null;
}
