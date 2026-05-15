"use server";

import { revalidatePath } from "next/cache";
import {
  recalculateGeneralBonusScores,
  recalculateGroupBonusScores,
} from "@/app/admin/bonus-results/actions";
import {
  recalculateMatchScores,
  recalculateTournamentStreakScores,
} from "@/app/admin/results/actions";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchResult, TournamentStage } from "@/types/tournament";

export interface OverrideActionState {
  status: "idle" | "success" | "error";
  message: string;
}

interface GeneralBonusResultRow {
  id: string;
  tournament_id: string;
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

    const streakResult = await recalculateTournamentStreakScores(match.tournament_id);

    if (streakResult.status === "error") {
      return streakResult;
    }

    scoringMessage = ` ${scoringResult.message} ${streakResult.message}`;
  }

  revalidatePath("/admin");
  revalidatePath("/participant");

  return {
    status: "success",
    message: `Override saved for ${participant.display_name}.${scoringMessage}`,
  };
}

export async function saveGroupBonusBetOverride(
  _previousState: OverrideActionState,
  formData: FormData,
): Promise<OverrideActionState> {
  const participantId = String(formData.get("participantId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const firstTeamId = emptyToNull(String(formData.get("firstTeamId") ?? ""));
  const secondTeamId = emptyToNull(String(formData.get("secondTeamId") ?? ""));
  const thirdTeamId = emptyToNull(String(formData.get("thirdTeamId") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!participantId || !groupId || !firstTeamId || !secondTeamId || !thirdTeamId || !reason) {
    return { status: "error", message: "Choose participant, group, teams, and a reason." };
  }

  if (new Set([firstTeamId, secondTeamId, thirdTeamId]).size !== 3) {
    return { status: "error", message: "Each group position must use a different team." };
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

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id,tournament_id")
    .eq("id", groupId)
    .eq("tournament_id", current.tournamentId)
    .maybeSingle();

  if (groupError) {
    return { status: "error", message: groupError.message };
  }

  if (!group) {
    return { status: "error", message: "Group was not found." };
  }

  const { data: groupTeams, error: groupTeamsError } = await supabase
    .from("group_teams")
    .select("team_id")
    .eq("group_id", group.id);

  if (groupTeamsError) {
    return { status: "error", message: groupTeamsError.message };
  }

  const allowedTeamIds = new Set((groupTeams ?? []).map((team) => team.team_id));

  if (![firstTeamId, secondTeamId, thirdTeamId].every((teamId) => allowedTeamIds.has(teamId))) {
    return { status: "error", message: "Group bonus teams must belong to the selected group." };
  }

  const { data: existingBet } = await supabase
    .from("group_bonus_bets")
    .select("*")
    .eq("participant_id", participant.id)
    .eq("group_id", group.id)
    .maybeSingle();

  const replacementBet = {
    participant_id: participant.id,
    group_id: group.id,
    predicted_first_team_id: firstTeamId,
    predicted_second_team_id: secondTeamId,
    predicted_third_team_id: thirdTeamId,
    submitted_at: new Date().toISOString(),
    submitted_by_user_id: current.user.id,
    is_admin_override: true,
    admin_override_reason: reason,
    updated_at: new Date().toISOString(),
  };

  const { data: savedBet, error: upsertError } = await supabase
    .from("group_bonus_bets")
    .upsert(replacementBet, { onConflict: "participant_id,group_id" })
    .select("id")
    .single();

  if (upsertError) {
    return { status: "error", message: upsertError.message };
  }

  const { error: auditError } = await supabase.from("admin_audit_log").insert({
    tournament_id: current.tournamentId,
    actor_user_id: current.user.id,
    action: existingBet ? "group_bonus_override_update" : "group_bonus_override_create",
    entity_type: "group_bonus_bet",
    entity_id: savedBet.id,
    before_json: existingBet ?? null,
    after_json: replacementBet,
    reason,
  });

  if (auditError) {
    return { status: "error", message: auditError.message };
  }

  const { data: result, error: resultError } = await supabase
    .from("group_bonus_results")
    .select("id,first_team_id,second_team_id,third_team_id")
    .eq("group_id", group.id)
    .maybeSingle();

  if (resultError) {
    return { status: "error", message: resultError.message };
  }

  let scoringMessage = "";

  if (result) {
    const scoringResult = await recalculateGroupBonusScores({
      groupId: group.id,
      resultId: result.id,
      tournamentId: group.tournament_id,
      firstTeamId: result.first_team_id,
      secondTeamId: result.second_team_id,
      thirdTeamId: result.third_team_id,
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
    message: `Group bonus override saved for ${participant.display_name}.${scoringMessage}`,
  };
}

export async function saveGeneralBonusBetOverride(
  _previousState: OverrideActionState,
  formData: FormData,
): Promise<OverrideActionState> {
  const participantId = String(formData.get("participantId") ?? "");
  const topScorerGoals = parseOptionalScore(formData.get("topScorerGoals"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!participantId || topScorerGoals === "invalid" || !reason) {
    return { status: "error", message: "Choose participant, valid values, and a reason." };
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

  const { data: existingBet } = await supabase
    .from("general_bonus_bets")
    .select("*")
    .eq("participant_id", participant.id)
    .maybeSingle();

  const replacementBet = {
    participant_id: participant.id,
    champion_team_id: emptyToNull(String(formData.get("championTeamId") ?? "")),
    runner_up_team_id: emptyToNull(String(formData.get("runnerUpTeamId") ?? "")),
    top_scorer_name: emptyToNull(String(formData.get("topScorerName") ?? "")),
    top_scorer_goals: topScorerGoals,
    player_of_tournament: emptyToNull(String(formData.get("playerOfTournament") ?? "")),
    surprise_team_id: emptyToNull(String(formData.get("surpriseTeamId") ?? "")),
    disappointment_team_id: emptyToNull(String(formData.get("disappointmentTeamId") ?? "")),
    highest_scoring_group_id: emptyToNull(String(formData.get("highestScoringGroupId") ?? "")),
    lowest_scoring_group_id: emptyToNull(String(formData.get("lowestScoringGroupId") ?? "")),
    most_goals_team_id: emptyToNull(String(formData.get("mostGoalsTeamId") ?? "")),
    fewest_goals_team_id: emptyToNull(String(formData.get("fewestGoalsTeamId") ?? "")),
    submitted_at: new Date().toISOString(),
    submitted_by_user_id: current.user.id,
    is_admin_override: true,
    admin_override_reason: reason,
    updated_at: new Date().toISOString(),
  };

  const { data: savedBet, error: upsertError } = await supabase
    .from("general_bonus_bets")
    .upsert(replacementBet, { onConflict: "participant_id" })
    .select("id")
    .single();

  if (upsertError) {
    return { status: "error", message: upsertError.message };
  }

  const { error: auditError } = await supabase.from("admin_audit_log").insert({
    tournament_id: current.tournamentId,
    actor_user_id: current.user.id,
    action: existingBet ? "general_bonus_override_update" : "general_bonus_override_create",
    entity_type: "general_bonus_bet",
    entity_id: savedBet.id,
    before_json: existingBet ?? null,
    after_json: replacementBet,
    reason,
  });

  if (auditError) {
    return { status: "error", message: auditError.message };
  }

  const { data: result, error: resultError } = await supabase
    .from("general_bonus_results")
    .select(
      "id,tournament_id,champion_team_id,runner_up_team_id,top_scorer_name,top_scorer_goals,player_of_tournament,highest_scoring_group_id,lowest_scoring_group_id,most_goals_team_id,fewest_goals_team_id",
    )
    .eq("tournament_id", current.tournamentId)
    .maybeSingle<GeneralBonusResultRow>();

  if (resultError) {
    return { status: "error", message: resultError.message };
  }

  let scoringMessage = "";

  if (result) {
    const scoringResult = await recalculateGeneralBonusScores(result);

    if (scoringResult.status === "error") {
      return scoringResult;
    }

    scoringMessage = ` ${scoringResult.message}`;
  }

  revalidatePath("/admin");
  revalidatePath("/participant");

  return {
    status: "success",
    message: `General bonus override saved for ${participant.display_name}.${scoringMessage}`,
  };
}

function parseScore(value: FormDataEntryValue | null): number | null {
  const score = Number(String(value ?? "").trim());

  if (!Number.isInteger(score) || score < 0 || score > 99) {
    return null;
  }

  return score;
}

function parseOptionalScore(value: FormDataEntryValue | null): number | null | "invalid" {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  const score = parseScore(rawValue);
  return score === null ? "invalid" : score;
}

function emptyToNull(value: string): string | null {
  return value.trim() ? value : null;
}
