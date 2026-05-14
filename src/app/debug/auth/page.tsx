import { getCurrentUserRole } from "@/lib/auth/roles";
import { hasPublicSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthDebugPage() {
  if (!hasPublicSupabaseEnv()) {
    return <DebugShell data={{ error: "Supabase env is missing" }} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const email = user?.email?.trim().toLowerCase() ?? null;

  const roleQuery = user
    ? await supabase
        .from("user_roles")
        .select("id,user_id,tournament_id,role")
        .eq("user_id", user.id)
    : null;
  const participantByUserQuery = user
    ? await supabase
        .from("participants")
        .select("id,email,display_name,user_id,tournament_id,status")
        .eq("user_id", user.id)
    : null;
  const participantByEmailQuery = email
    ? await supabase
        .from("participants")
        .select("id,email,display_name,user_id,tournament_id,status")
        .eq("email", email)
    : null;
  const claimQuery = user ? await supabase.rpc("claim_invited_participant") : null;
  const currentRole = await getCurrentUserRole(supabase);

  return (
    <DebugShell
      data={{
        user: user
          ? {
              id: user.id,
              email: user.email,
            }
          : null,
        userError: userError?.message ?? null,
        roleRows: roleQuery?.data ?? null,
        roleError: roleQuery?.error?.message ?? null,
        participantByUser: participantByUserQuery?.data ?? null,
        participantByUserError: participantByUserQuery?.error?.message ?? null,
        participantByEmail: participantByEmailQuery?.data ?? null,
        participantByEmailError: participantByEmailQuery?.error?.message ?? null,
        claimData: claimQuery?.data ?? null,
        claimError: claimQuery?.error?.message ?? null,
        currentRole,
      }}
    />
  );
}

function DebugShell({ data }: { data: unknown }) {
  return (
    <main className="shell">
      <section className="notice-panel debug-panel">
        <h1>Auth Debug</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </section>
    </main>
  );
}
