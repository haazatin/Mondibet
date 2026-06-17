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

export async function deleteDraftMatch(formData: FormData): Promise<void> {
  const matchId = String(formData.get("matchId") ?? "");

  if (!matchId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return;
  }

  const { count: betCount } = await supabase
    .from("match_bets")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId);
  const { count: resultCount } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId);

  if ((betCount ?? 0) > 0 || (resultCount ?? 0) > 0) {
    return;
  }

  await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("tournament_id", current.tournamentId);

  revalidatePath("/admin");
  revalidatePath("/participant");
}

function emptyToNull(value: string): string | null {
  return value.trim() ? value : null;
}
