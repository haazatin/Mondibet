"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface BonusBetActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function saveGroupBonusBet(
  _previousState: BonusBetActionState,
  formData: FormData,
): Promise<BonusBetActionState> {
  const groupId = String(formData.get("groupId") ?? "");
  const firstTeamId = emptyToNull(String(formData.get("firstTeamId") ?? ""));
  const secondTeamId = emptyToNull(String(formData.get("secondTeamId") ?? ""));
  const thirdTeamId = emptyToNull(String(formData.get("thirdTeamId") ?? ""));

  if (!groupId || !firstTeamId || !secondTeamId || !thirdTeamId) {
    return { status: "error", message: "Choose first, second, and third place teams." };
  }

  if (new Set([firstTeamId, secondTeamId, thirdTeamId]).size !== 3) {
    return { status: "error", message: "Each group position must use a different team." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "participant" || !current.tournamentId) {
    return { status: "error", message: "Only invited participants can submit bonus bets." };
  }

  const { error } = await supabase.rpc("submit_group_bonus_bet", {
    p_group_id: groupId,
    p_predicted_first_team_id: firstTeamId,
    p_predicted_second_team_id: secondTeamId,
    p_predicted_third_team_id: thirdTeamId,
  });

  if (error) {
    return { status: "error", message: friendlyBonusError(error.message) };
  }

  revalidatePath("/participant");

  return { status: "success", message: "Group bonus saved." };
}

export async function saveGeneralBonusBet(
  _previousState: BonusBetActionState,
  formData: FormData,
): Promise<BonusBetActionState> {
  const topScorerGoals = parseOptionalInteger(formData.get("topScorerGoals"));

  if (topScorerGoals === "invalid") {
    return { status: "error", message: "Top scorer goals must be a non-negative number." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "participant" || !current.tournamentId) {
    return { status: "error", message: "Only invited participants can submit bonus bets." };
  }

  const { error } = await supabase.rpc("submit_general_bonus_bet", {
    p_champion_team_id: emptyToNull(String(formData.get("championTeamId") ?? "")),
    p_runner_up_team_id: emptyToNull(String(formData.get("runnerUpTeamId") ?? "")),
    p_top_scorer_name: emptyToNull(String(formData.get("topScorerName") ?? "")),
    p_top_scorer_goals: topScorerGoals,
    p_player_of_tournament: emptyToNull(String(formData.get("playerOfTournament") ?? "")),
    p_surprise_team_id: emptyToNull(String(formData.get("surpriseTeamId") ?? "")),
    p_disappointment_team_id: emptyToNull(String(formData.get("disappointmentTeamId") ?? "")),
    p_highest_scoring_group_id: emptyToNull(String(formData.get("highestScoringGroupId") ?? "")),
    p_lowest_scoring_group_id: emptyToNull(String(formData.get("lowestScoringGroupId") ?? "")),
    p_most_goals_team_id: emptyToNull(String(formData.get("mostGoalsTeamId") ?? "")),
    p_fewest_goals_team_id: emptyToNull(String(formData.get("fewestGoalsTeamId") ?? "")),
  });

  if (error) {
    return { status: "error", message: friendlyBonusError(error.message) };
  }

  revalidatePath("/participant");

  return { status: "success", message: "General bonus saved." };
}

function parseOptionalInteger(value: FormDataEntryValue | null): number | null | "invalid" {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) {
    return "invalid";
  }

  return parsed;
}

function emptyToNull(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function friendlyBonusError(message: string): string {
  if (message.toLowerCase().includes("locked")) {
    return "Bonus betting is locked.";
  }

  return message;
}
