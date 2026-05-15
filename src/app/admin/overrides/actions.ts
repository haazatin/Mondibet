"use server";

import { revalidatePath } from "next/cache";
import { recalculateMatchScores } from "@/app/admin/results/actions";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchResult, TournamentStage } from "@/types/tournament";

export interface OverrideActionState {
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

export async function saveMatchBetOverride(
  _previousState: OverrideActionState,
  formData: FormData,
): Promise<OverrideActionState> {
  const participantId = String(formData.get("participantId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  const homeScore = parseScore(formData.get("homeScore"));
  const awayScore = parseScore(formData.get("awayScore"));
  const advancingTeamId = emptyToNull(String(formData.get("advancingTeamId") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!participantId || !matchId || homeScore === null || awayScore === null || !reason) {
    return { status: "error", message: "Choose participant, match, scores, and a reason." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can override bets." };
  }

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id,tournament_id,display_name")
    .eq("id", participantId)
    .eq("tournament_id", current.tournamentId)
    .maybeSingle();

  if (participantError) {
    return { status: "error", message: participantError.message };
  }

  if (!participant) {
    return { status: "error", message: "Participant was not found." };
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

  const isDrawPrediction = homeScore === awayScore;
  const isKnockout = knockoutStages.has(match.stage as TournamentStage);

  if (isKnockout && isDrawPrediction && !advancingTeamId) {
    return { status: "error", message: "Choose the advancing team for a knockout draw." };
  }

  if (
    advancingTeamId &&
    advancingTeamId !== match.home_team_id &&
    advancingTeamId !== match.away_team_id
  ) {
    return { status: "error", message: "Advancing team must belong to this match." };
  }

  const { data: existingBet } = await supabase
    .from("match_bets")
    .select("*")
    .eq("match_id", match.id)
    .eq("participant_id", participant.id)
    .maybeSingle();

  const replacementBet = {
    match_id: match.id,
    participant_id: participant.id,
    predicted_home_score_90: homeScore,
    predicted_away_score_90: awayScore,
    predicted_advancing_team_id: isKnockout && isDrawPrediction ? advancingTeamId : null,
    submitted_at: new Date().toISOString(),
    submitted_by_user_id: current.user.id,
    is_admin_override: true,
    admin_override_reason: reason,
    updated_at: new Date().toISOString(),
  };

  const { data: savedBet, error: upsertError } = await supabase
    .from("match_bets")
    .upsert(replacementBet, { onConflict: "match_id,participant_id" })
    .select("id")
    .single();

  if (upsertError) {
    return { status: "error", message: upsertError.message };
  }

  const { error: auditError } = await supabase.from("admin_audit_log").insert({
    tournament_id: current.tournamentId,
    actor_user_id: current.user.id,
    action: existingBet ? "match_bet_override_update" : "match_bet_override_create",
    entity_type: "match_bet",
    entity_id: savedBet.id,
    before_json: existingBet ?? null,
    after_json: replacementBet,
    reason,
  });

  if (auditError) {
    return { status: "error", message: auditError.message };
  }

  const { data: result, error: resultError } = await supabase
    .from("results")
    .select("home_score_90,away_score_90,advancing_team_id")
    .eq("match_id", match.id)
    .maybeSingle();

  if (resultError) {
    return { status: "error", message: resultError.message };
  }

  let scoringMessage = "";

  if (result) {
    const scoringResult = await recalculateMatchScores({
      match: {
        id: match.id,
        tournamentId: match.tournament_id,
        stage: match.stage as TournamentStage,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
      },
      result: {
        homeScore90: result.home_score_90,
        awayScore90: result.away_score_90,
        advancingTeamId: result.advancing_team_id ?? undefined,
      } satisfies MatchResult,
    });

    if (scoringResult.status === "error") {
      return scoringResult;
    }

    scoringMessage = ` ${scoringResult.message}`;
  }

  revalidatePath("/admin");
  revalidatePath("/participant");

  return {
    status: "success",
    message: `Override saved for ${participant.display_name}.${scoringMessage}`,
  };
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
