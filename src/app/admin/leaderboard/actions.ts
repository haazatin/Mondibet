"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { buildDraftLeaderboard } from "@/lib/leaderboard/draft";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PublishLeaderboardState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function publishLeaderboard(): Promise<PublishLeaderboardState> {
  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can publish leaderboards." };
  }

  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("id,display_name")
    .eq("tournament_id", current.tournamentId)
    .eq("status", "active");

  if (participantsError) {
    return { status: "error", message: participantsError.message };
  }

  const { data: scoreEvents, error: scoreEventsError } = await supabase
    .from("score_events")
    .select("participant_id,category,points")
    .eq("tournament_id", current.tournamentId);

  if (scoreEventsError) {
    return { status: "error", message: scoreEventsError.message };
  }

  const rows = buildDraftLeaderboard({
    participants:
      participants?.map((participant) => ({
        id: participant.id,
        displayName: participant.display_name,
      })) ?? [],
    scoreEvents: scoreEvents ?? [],
  });

  const { data: snapshot, error: snapshotError } = await supabase
    .from("leaderboard_snapshots")
    .insert({
      tournament_id: current.tournamentId,
      created_by: current.user.id,
      is_published: true,
    })
    .select("id")
    .single();

  if (snapshotError) {
    return { status: "error", message: snapshotError.message };
  }

  if (rows.length > 0) {
    const { error: rowsError } = await supabase.from("leaderboard_snapshot_rows").insert(
      rows.map((row) => ({
        snapshot_id: snapshot.id,
        participant_id: row.participantId,
        rank: row.rank,
        total_points: row.totalPoints,
        group_stage_points: row.groupStagePoints,
        knockout_points: row.knockoutPoints,
        bonus_points: row.bonusPoints,
        streak_points: row.streakPoints,
        tie_break_status: null,
      })),
    );

    if (rowsError) {
      return { status: "error", message: rowsError.message };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/participant");

  return { status: "success", message: `Leaderboard published with ${rows.length} rows.` };
}
