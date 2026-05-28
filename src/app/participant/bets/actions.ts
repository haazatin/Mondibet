"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TournamentStage } from "@/types/tournament";

export interface MatchBetActionState {
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

export async function saveMatchBet(
  _previousState: MatchBetActionState,
  formData: FormData,
): Promise<MatchBetActionState> {
  const matchId = String(formData.get("matchId") ?? "");
  const predictedHomeScore90 = parseScore(formData.get("homeScore"));
  const predictedAwayScore90 = parseScore(formData.get("awayScore"));
  const predictedAdvancingTeamId = emptyToNull(String(formData.get("advancingTeamId") ?? ""));

  if (!matchId || predictedHomeScore90 === null || predictedAwayScore90 === null) {
    return { status: "error", message: "Enter valid scores for both teams." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "participant" || !current.tournamentId || !current.participantId) {
    return { status: "error", message: "Only invited participants can submit bets." };
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id,tournament_id,stage,home_team_id,away_team_id,daily_lock_at")
    .eq("id", matchId)
    .eq("tournament_id", current.tournamentId)
    .maybeSingle();

  if (matchError) {
    return { status: "error", message: matchError.message };
  }

  if (!match) {
    return { status: "error", message: "Match was not found." };
  }

  const { data: existingBet, error: existingBetError } = await supabase
    .from("match_bets")
    .select("id")
    .eq("match_id", match.id)
    .eq("participant_id", current.participantId)
    .maybeSingle();

  if (existingBetError) {
    return { status: "error", message: existingBetError.message };
  }

  if (existingBet) {
    return {
      status: "error",
      message: "This bet is already submitted. Ask the admin to override it if needed.",
    };
  }

  const dailyLockAt = new Date(match.daily_lock_at);

  if (Date.now() >= dailyLockAt.getTime()) {
    return { status: "error", message: "Betting is locked for this match day." };
  }

  const isDrawPrediction = predictedHomeScore90 === predictedAwayScore90;
  const isKnockout = knockoutStages.has(match.stage as TournamentStage);

  if (isKnockout && isDrawPrediction && !predictedAdvancingTeamId) {
    return { status: "error", message: "Choose the advancing team for a knockout draw." };
  }

  if (
    predictedAdvancingTeamId &&
    predictedAdvancingTeamId !== match.home_team_id &&
    predictedAdvancingTeamId !== match.away_team_id
  ) {
    return { status: "error", message: "Advancing team must belong to this match." };
  }

  const { error: submitError } = await supabase.rpc("submit_match_bet", {
    p_match_id: match.id,
    p_predicted_home_score_90: predictedHomeScore90,
    p_predicted_away_score_90: predictedAwayScore90,
    p_predicted_advancing_team_id: isKnockout && isDrawPrediction ? predictedAdvancingTeamId : null,
  });

  if (submitError) {
    if (submitError.message.toLowerCase().includes("row-level security")) {
      return {
        status: "error",
        message:
          "Bet could not be saved because permissions or the lock time rejected it. Try a future match, or ask the admin to check your invitation.",
      };
    }

    return { status: "error", message: submitError.message };
  }

  revalidatePath("/participant");

  return { status: "success", message: "Bet saved." };
}

function parseScore(value: FormDataEntryValue | null): number | null {
  const score = Number(String(value ?? "").trim());

  if (!Number.isInteger(score) || score < 0 || score > 99) {
    return null;
  }

  return score;
}

function emptyToNull(value: string): string | null {
  return value.trim() ? value : null;
}
