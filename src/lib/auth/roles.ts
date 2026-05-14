import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "participant";

export interface CurrentUserRole {
  user: User;
  role: AppRole;
  tournamentId: string | null;
  participantId: string | null;
}

export async function getCurrentUserRole(
  supabase: SupabaseClient,
): Promise<CurrentUserRole | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role,tournament_id")
    .eq("user_id", user.id)
    .order("role", { ascending: true });

  if (!roleRows || roleRows.length === 0) {
    return claimParticipantByEmail(supabase, user);
  }

  const roles = roleRows?.map((row) => row.role) ?? [];
  const role: AppRole = roles.includes("admin") ? "admin" : "participant";
  const tournamentId =
    roleRows?.find((row) => row.role === role)?.tournament_id ??
    roleRows?.[0]?.tournament_id ??
    null;
  let participantId = await getParticipantId(supabase, user.id, tournamentId);

  if (role === "participant" && !participantId) {
    const claimed = await claimParticipantByEmail(supabase, user);

    if (claimed?.participantId) {
      participantId = claimed.participantId;
    }
  }

  return { user, role, tournamentId, participantId };
}

async function claimParticipantByEmail(
  supabase: SupabaseClient,
  user: User,
): Promise<CurrentUserRole | null> {
  const { data: claimedRows } = await supabase.rpc("claim_invited_participant");
  const claimed = Array.isArray(claimedRows) ? claimedRows[0] : null;

  if (claimed?.participant_id && claimed?.tournament_id) {
    return {
      user,
      role: "participant",
      tournamentId: claimed.tournament_id,
      participantId: claimed.participant_id,
    };
  }

  const email = user.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("id,tournament_id,user_id")
    .eq("email", email)
    .maybeSingle();

  if (!participant || (participant.user_id && participant.user_id !== user.id)) {
    return null;
  }

  if (!participant.user_id) {
    const { error: updateError } = await supabase
      .from("participants")
      .update({ user_id: user.id })
      .eq("id", participant.id)
      .is("user_id", null);

    if (updateError) {
      return null;
    }
  }

  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: user.id,
    tournament_id: participant.tournament_id,
    role: "participant",
  });

  if (roleError && roleError.code !== "23505") {
    return null;
  }

  return {
    user,
    role: "participant",
    tournamentId: participant.tournament_id,
    participantId: participant.id,
  };
}

async function getParticipantId(
  supabase: SupabaseClient,
  userId: string,
  tournamentId: string | null,
): Promise<string | null> {
  if (!tournamentId) {
    return null;
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("id")
    .eq("user_id", userId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  return participant?.id ?? null;
}
