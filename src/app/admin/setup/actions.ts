"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SetupActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function addTeam(
  _previousState: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim();
  const fifaCode = String(formData.get("fifaCode") ?? "").trim().toUpperCase();

  if (!name) {
    return { status: "error", message: "Team name is required." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can add teams." };
  }

  const { error } = await supabase.from("teams").insert({
    tournament_id: current.tournamentId,
    name,
    short_name: shortName || null,
    fifa_code: fifaCode || null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/admin");
  return { status: "success", message: `${name} was added.` };
}

export async function addGroup(
  _previousState: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = Number(sortOrderRaw);

  if (!name || !Number.isInteger(sortOrder)) {
    return { status: "error", message: "Group name and order are required." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can add groups." };
  }

  const { error } = await supabase.from("groups").insert({
    tournament_id: current.tournamentId,
    name,
    sort_order: sortOrder,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/admin");
  return { status: "success", message: `${name} was added.` };
}

export async function assignTeamToGroup(
  _previousState: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const groupId = String(formData.get("groupId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const seedOrderRaw = String(formData.get("seedOrder") ?? "").trim();
  const seedOrder = seedOrderRaw ? Number(seedOrderRaw) : null;

  if (!groupId || !teamId || (seedOrder !== null && !Number.isInteger(seedOrder))) {
    return { status: "error", message: "Choose a team, group, and valid seed order." };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return { status: "error", message: "Only admins can assign teams." };
  }

  const { error } = await supabase.from("group_teams").insert({
    group_id: groupId,
    team_id: teamId,
    seed_order: seedOrder,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/admin");
  return { status: "success", message: "Team assigned to group." };
}

