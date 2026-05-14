"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ParticipantActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function addParticipant(
  _previousState: ParticipantActionState,
  formData: FormData,
): Promise<ParticipantActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!displayName || !email) {
    return {
      status: "error",
      message: "Display name and email are required.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const current = await getCurrentUserRole(supabase);

  if (!current || current.role !== "admin" || !current.tournamentId) {
    return {
      status: "error",
      message: "Only admins can add participants.",
    };
  }

  const { error } = await supabase
    .from("participants")
    .insert({
      tournament_id: current.tournamentId,
      display_name: displayName,
      email,
      status: "active",
    });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/admin");

  return {
    status: "success",
    message: `${displayName} was added.`,
  };
}

