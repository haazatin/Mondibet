"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { scoreGroupBonus } from "@/lib/scoring/groupBonus";
import { GENERAL_BONUS_POINTS } from "@/lib/scoring/rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface BonusResultActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function saveGroupBonusResult(
  _previousState: BonusResultActionState,
  formData: FormData,
): Promise<BonusResultActionState> {
  const groupId = String(formData.get("groupId") ?? "");
  const firstTeamId = emptyToNull(String(formData.get("firstTeamId") ?? ""));
  const secondTeamId = emptyToNull(String(formData.get("secondTeamId") ?? ""));
  const thirdTeamId = emptyToNull(String(formData.get("thirdTeamId") ?? ""));

  if (!groupId || !firstTeamId || !secondTeamId || !thirdTeamId) {
    return { status: "error", message: "Choose first, second, and third place teams." };
  }

  if (new Set([firstTeamId, secondTeamId, thirdTeamId]).size !== 3) {
    return { status: "error", message: "Each position must use a different team." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can enter bonus results." };
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

  const { data: allowedTeams, error: teamsError } = await supabase
    .from("group_teams")
    .select("team_id")
    .eq("group_id", group.id);

  if (teamsError) {
    return { status: "error", message: teamsError.message };
  }

  const allowedTeamIds = new Set((allowedTeams ?? []).map((team) => team.team_id));

  if (![firstTeamId, secondTeamId, thirdTeamId].every((teamId) => allowedTeamIds.has(teamId))) {
    return { status: "error", message: "Group results must use teams assigned to this group." };
  }

  const { data: savedResult, error: resultError } = await supabase
    .from("group_bonus_results")
    .upsert(
      {
        group_id: group.id,
        first_team_id: firstTeamId,
        second_team_id: secondTeamId,
        third_team_id: thirdTeamId,
        created_by: current.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_id" },
    )
    .select("id")
    .single();

  if (resultError) {
    return { status: "error", message: resultError.message };
  }

  const scoringResult = await recalculateGroupBonusScores({
    groupId: group.id,
    resultId: savedResult.id,
    tournamentId: group.tournament_id,
    firstTeamId,
    secondTeamId,
    thirdTeamId,
  });

  if (scoringResult.status === "error") {
    return scoringResult;
  }

  revalidatePath("/admin");
  revalidatePath("/participant");

  return { status: "success", message: `Group bonus result saved. ${scoringResult.message}` };
}

export async function saveGeneralBonusResult(
  _previousState: BonusResultActionState,
  formData: FormData,
): Promise<BonusResultActionState> {
  const topScorerGoals = parseOptionalInteger(formData.get("topScorerGoals"));

  if (topScorerGoals === "invalid") {
    return { status: "error", message: "Top scorer goals must be a non-negative number." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can enter bonus results." };
  }

  const { data: savedResult, error: resultError } = await supabase
    .from("general_bonus_results")
    .upsert(
      {
        tournament_id: current.tournamentId,
        champion_team_id: emptyToNull(String(formData.get("championTeamId") ?? "")),
        runner_up_team_id: emptyToNull(String(formData.get("runnerUpTeamId") ?? "")),
        top_scorer_name: emptyToNull(String(formData.get("topScorerName") ?? "")),
        top_scorer_goals: topScorerGoals,
        player_of_tournament: emptyToNull(String(formData.get("playerOfTournament") ?? "")),
        highest_scoring_group_id: emptyToNull(String(formData.get("highestScoringGroupId") ?? "")),
        lowest_scoring_group_id: emptyToNull(String(formData.get("lowestScoringGroupId") ?? "")),
        most_goals_team_id: emptyToNull(String(formData.get("mostGoalsTeamId") ?? "")),
        fewest_goals_team_id: emptyToNull(String(formData.get("fewestGoalsTeamId") ?? "")),
        created_by: current.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tournament_id" },
    )
    .select(
      "id,tournament_id,champion_team_id,runner_up_team_id,top_scorer_name,top_scorer_goals,player_of_tournament,highest_scoring_group_id,lowest_scoring_group_id,most_goals_team_id,fewest_goals_team_id",
    )
    .single();

  if (resultError) {
    return { status: "error", message: resultError.message };
  }

  const scoringResult = await recalculateGeneralBonusScores(savedResult);

  if (scoringResult.status === "error") {
    return scoringResult;
  }

  revalidatePath("/admin");
  revalidatePath("/participant");

  return { status: "success", message: `General bonus result saved. ${scoringResult.message}` };
}

export async function recalculateGroupBonusScores({
  groupId,
  resultId,
  tournamentId,
  firstTeamId,
  secondTeamId,
  thirdTeamId,
}: {
  groupId: string;
  resultId: string;
  tournamentId: string;
  firstTeamId: string;
  secondTeamId: string;
  thirdTeamId: string;
}): Promise<BonusResultActionState> {
  const supabase = await createSupabaseServerClient();
  const { data: bets, error: betsError } = await supabase
    .from("group_bonus_bets")
    .select(
      "id,participant_id,predicted_first_team_id,predicted_second_team_id,predicted_third_team_id",
    )
    .eq("group_id", groupId);

  if (betsError) {
    return { status: "error", message: betsError.message };
  }

  const { error: deleteError } = await supabase
    .from("score_events")
    .delete()
    .eq("source_type", "group_bonus")
    .eq("source_id", resultId);

  if (deleteError) {
    return { status: "error", message: deleteError.message };
  }

  const scoreEvents = (bets ?? []).flatMap((bet) => {
    const breakdown = scoreGroupBonus(
      {
        firstTeamId: bet.predicted_first_team_id ?? undefined,
        secondTeamId: bet.predicted_second_team_id ?? undefined,
        thirdTeamId: bet.predicted_third_team_id ?? undefined,
      },
      {
        firstTeamId,
        secondTeamId,
        thirdTeamId,
      },
    );

    return [
      {
        category: "group_bonus_qualifier",
        points: breakdown.qualifierPoints,
        reason: "Correct group qualifier",
      },
      {
        category: "group_bonus_position",
        points: breakdown.exactPositionPoints,
        reason: "Correct group position",
      },
      {
        category: "group_bonus_perfect",
        points: breakdown.perfectGroupPoints,
        reason: "Perfect group prediction",
      },
    ]
      .filter((event) => event.points > 0)
      .map((event) => ({
        participant_id: bet.participant_id,
        tournament_id: tournamentId,
        source_type: "group_bonus",
        source_id: resultId,
        category: event.category,
        points: event.points,
        reason: event.reason,
      }));
  });

  if (scoreEvents.length > 0) {
    const { error: insertError } = await supabase.from("score_events").insert(scoreEvents);

    if (insertError) {
      return { status: "error", message: insertError.message };
    }
  }

  return { status: "success", message: `${scoreEvents.length} score events recalculated.` };
}

export async function recalculateGeneralBonusScores(result: {
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
}): Promise<BonusResultActionState> {
  const supabase = await createSupabaseServerClient();
  const { data: bets, error: betsError } = await supabase
    .from("general_bonus_bets")
    .select(
      "id,participant_id,champion_team_id,runner_up_team_id,top_scorer_name,top_scorer_goals,player_of_tournament,highest_scoring_group_id,lowest_scoring_group_id,most_goals_team_id,fewest_goals_team_id,participants!inner(tournament_id)",
    )
    .eq("participants.tournament_id", result.tournament_id);

  if (betsError) {
    return { status: "error", message: betsError.message };
  }

  const { error: deleteError } = await supabase
    .from("score_events")
    .delete()
    .eq("source_type", "general_bonus")
    .eq("source_id", result.id);

  if (deleteError) {
    return { status: "error", message: deleteError.message };
  }

  const scoreEvents = (bets ?? []).flatMap((bet) =>
    buildGeneralBonusEvents(bet, result).map((event) => ({
      participant_id: bet.participant_id,
      tournament_id: result.tournament_id,
      source_type: "general_bonus",
      source_id: result.id,
      category: event.category,
      points: event.points,
      reason: event.reason,
    })),
  );

  if (scoreEvents.length > 0) {
    const { error: insertError } = await supabase.from("score_events").insert(scoreEvents);

    if (insertError) {
      return { status: "error", message: insertError.message };
    }
  }

  return { status: "success", message: `${scoreEvents.length} score events recalculated.` };
}

function buildGeneralBonusEvents(
  bet: {
    champion_team_id: string | null;
    runner_up_team_id: string | null;
    top_scorer_name: string | null;
    top_scorer_goals: number | null;
    player_of_tournament: string | null;
    highest_scoring_group_id: string | null;
    lowest_scoring_group_id: string | null;
    most_goals_team_id: string | null;
    fewest_goals_team_id: string | null;
  },
  result: {
    champion_team_id: string | null;
    runner_up_team_id: string | null;
    top_scorer_name: string | null;
    top_scorer_goals: number | null;
    player_of_tournament: string | null;
    highest_scoring_group_id: string | null;
    lowest_scoring_group_id: string | null;
    most_goals_team_id: string | null;
    fewest_goals_team_id: string | null;
  },
) {
  return [
    teamEvent("general_bonus_champion", bet.champion_team_id, result.champion_team_id, GENERAL_BONUS_POINTS.champion, "Correct champion"),
    teamEvent("general_bonus_runner_up", bet.runner_up_team_id, result.runner_up_team_id, GENERAL_BONUS_POINTS.runnerUp, "Correct runner-up"),
    textEvent("general_bonus_top_scorer", bet.top_scorer_name, result.top_scorer_name, GENERAL_BONUS_POINTS.topScorer, "Correct top scorer"),
    numberEvent("general_bonus_top_scorer_goals", bet.top_scorer_goals, result.top_scorer_goals, GENERAL_BONUS_POINTS.topScorerGoalCount, "Correct top scorer goal count"),
    textEvent("general_bonus_player", bet.player_of_tournament, result.player_of_tournament, GENERAL_BONUS_POINTS.playerOfTournament, "Correct player of the tournament"),
    teamEvent("general_bonus_highest_group", bet.highest_scoring_group_id, result.highest_scoring_group_id, GENERAL_BONUS_POINTS.highestScoringGroup, "Correct highest-scoring group"),
    teamEvent("general_bonus_lowest_group", bet.lowest_scoring_group_id, result.lowest_scoring_group_id, GENERAL_BONUS_POINTS.lowestScoringGroup, "Correct lowest-scoring group"),
    teamEvent("general_bonus_most_goals_team", bet.most_goals_team_id, result.most_goals_team_id, GENERAL_BONUS_POINTS.mostGoalsTeam, "Correct team with most goals"),
    teamEvent("general_bonus_fewest_goals_team", bet.fewest_goals_team_id, result.fewest_goals_team_id, GENERAL_BONUS_POINTS.fewestGoalsTeam, "Correct team with fewest goals"),
  ].filter((event): event is { category: string; points: number; reason: string } => Boolean(event));
}

function teamEvent(
  category: string,
  predicted: string | null,
  actual: string | null,
  points: number,
  reason: string,
) {
  return predicted && actual && predicted === actual ? { category, points, reason } : null;
}

function textEvent(
  category: string,
  predicted: string | null,
  actual: string | null,
  points: number,
  reason: string,
) {
  return predicted && actual && normalizeText(predicted) === normalizeText(actual)
    ? { category, points, reason }
    : null;
}

function numberEvent(
  category: string,
  predicted: number | null,
  actual: number | null,
  points: number,
  reason: string,
) {
  return predicted !== null && actual !== null && predicted === actual ? { category, points, reason } : null;
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

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}
