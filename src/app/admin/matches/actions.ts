"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/lib/auth/roles";
import {
  getMatchBettingLockTime,
  parseIsraelDateTimeLocal,
} from "@/lib/scoring/deadlines";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TournamentStage } from "@/types/tournament";

export interface MatchActionState {
  status: "idle" | "success" | "error";
  message: string;
}

const stages = new Set<TournamentStage>([
  "group",
  "round_of_32",
  "round_of_16",
  "quarterfinal",
  "semifinal",
  "final",
]);

export async function addMatch(
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const stage = String(formData.get("stage") ?? "") as TournamentStage;
  const groupId = emptyToNull(String(formData.get("groupId") ?? ""));
  const homeTeamId = String(formData.get("homeTeamId") ?? "");
  const awayTeamId = String(formData.get("awayTeamId") ?? "");
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const sortOrder = Number(String(formData.get("sortOrder") ?? ""));

  if (!stages.has(stage) || !homeTeamId || !awayTeamId || !startsAtRaw || !Number.isInteger(sortOrder)) {
    return { status: "error", message: "Fill all required match fields." };
  }

  if (homeTeamId === awayTeamId) {
    return { status: "error", message: "Home and away teams must be different." };
  }

  const startsAt = parseIsraelDateTimeLocal(startsAtRaw);

  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return { status: "error", message: "Kickoff time is invalid." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can add matches." };
  }

  const dailyLockAt = getMatchBettingLockTime(startsAt);

  const { error: insertError } = await supabase.from("matches").insert({
    tournament_id: current.tournamentId,
    stage,
    group_id: stage === "group" ? groupId : null,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    starts_at: startsAt.toISOString(),
    daily_lock_at: dailyLockAt.toISOString(),
    sort_order: sortOrder,
    status: "scheduled",
  });

  if (insertError) {
    return { status: "error", message: insertError.message };
  }

  revalidatePath("/admin");
  return { status: "success", message: "Match added." };
}

export async function deleteDraftMatch(
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const matchId = String(formData.get("matchId") ?? "");

  if (!matchId) {
    return { status: "error", message: "Match was not found." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can delete matches." };
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id,sort_order")
    .eq("id", matchId)
    .eq("tournament_id", current.tournamentId)
    .maybeSingle();

  if (matchError) {
    return { status: "error", message: matchError.message };
  }

  if (!match) {
    return { status: "error", message: "Match was not found." };
  }

  const { count: betCount, error: betCountError } = await supabase
    .from("match_bets")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId);

  if (betCountError) {
    return { status: "error", message: betCountError.message };
  }

  const { count: resultCount, error: resultCountError } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId);

  if (resultCountError) {
    return { status: "error", message: resultCountError.message };
  }

  if ((resultCount ?? 0) > 0) {
    return {
      status: "error",
      message: "Matches with saved results cannot be deleted from setup.",
    };
  }

  const { error: scoreDeleteError } = await supabase
    .from("score_events")
    .delete()
    .eq("tournament_id", current.tournamentId)
    .eq("source_type", "match")
    .eq("source_id", matchId);

  if (scoreDeleteError) {
    return { status: "error", message: scoreDeleteError.message };
  }

  const { error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("tournament_id", current.tournamentId);

  if (deleteError) {
    return { status: "error", message: deleteError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/participant");

  const deletedBetCount = betCount ?? 0;
  return {
    status: "success",
    message:
      deletedBetCount > 0
        ? `Match ${match.sort_order} deleted with ${deletedBetCount} submitted bet${
            deletedBetCount === 1 ? "" : "s"
          }.`
        : `Match ${match.sort_order} deleted.`,
  };
}

function emptyToNull(value: string): string | null {
  return value.trim() ? value : null;
}
