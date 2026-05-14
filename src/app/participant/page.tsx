import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { MatchBettingList, type ParticipantMatch } from "@/app/participant/bets/match-betting-list";
import { ParticipantScoreSummary } from "@/app/participant/scores/participant-score-summary";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { hasPublicSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface MyMatchScoreEvent {
  event_id: string;
  source_id: string;
  category: string;
  points: number;
  reason: string;
}

export default async function ParticipantPage() {
  if (!hasPublicSupabaseEnv()) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const current = await getCurrentUserRole(supabase);

  if (!current) {
    redirect("/not-invited");
  }

  if (current.role === "admin") {
    redirect("/admin");
  }

  const { data: participantByEmail } =
    current.tournamentId && current.user.email
      ? await supabase
          .from("participants")
          .select("id")
          .eq("tournament_id", current.tournamentId)
          .eq("email", current.user.email.toLowerCase())
          .maybeSingle()
      : { data: null };
  const effectiveParticipantId = current.participantId ?? participantByEmail?.id ?? null;

  const { data: matches, error: matchesError } =
    current.tournamentId
      ? await supabase
          .from("matches")
          .select(
            "id,stage,starts_at,daily_lock_at,sort_order,groups(name),home_team:teams!matches_home_team_id_fkey(id,name),away_team:teams!matches_away_team_id_fkey(id,name)",
          )
          .eq("tournament_id", current.tournamentId)
          .order("starts_at", { ascending: true })
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

  const { data: bets, error: betsError } = effectiveParticipantId
    ? await supabase
        .from("match_bets")
        .select(
          "match_id,predicted_home_score_90,predicted_away_score_90,predicted_advancing_team_id,submitted_at",
        )
        .eq("participant_id", effectiveParticipantId)
    : { data: [], error: null };

  const betsByMatchId = new Map((bets ?? []).map((bet) => [bet.match_id, bet]));
  const normalizedMatches: ParticipantMatch[] =
    matches?.map((match) => ({
      id: match.id,
      stage: match.stage,
      starts_at: match.starts_at,
      daily_lock_at: match.daily_lock_at,
      sort_order: match.sort_order,
      groups: Array.isArray(match.groups) ? match.groups[0] : match.groups,
      home_team: Array.isArray(match.home_team) ? match.home_team[0] : match.home_team,
      away_team: Array.isArray(match.away_team) ? match.away_team[0] : match.away_team,
      bet: betsByMatchId.get(match.id) ?? null,
    })) ?? [];
  const { data: scoreEvents, error: scoreEventsError } = current.tournamentId
    ? await supabase.rpc("get_my_match_score_events", {
        p_tournament_id: current.tournamentId,
      })
    : { data: [], error: null };
  const matchesById = new Map(normalizedMatches.map((match) => [match.id, match]));
  const myScoreEvents = (scoreEvents ?? []) as MyMatchScoreEvent[];
  const normalizedScoreEvents =
    myScoreEvents.map((event) => ({
      id: event.event_id,
      category: event.category,
      points: event.points,
      reason: event.reason,
      matches: matchesById.get(event.source_id) ?? null,
    }));

  return (
    <main className="shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-title">Participant</div>
          <div className="brand-subtitle">{current.user.email}</div>
        </div>
        <form action={signOut}>
          <button className="secondary-button" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="dashboard" aria-label="Participant modules">
        <article className="panel wide-panel">
          <h2>Today&apos;s Bets</h2>
          <p>Submit and update match bets until the shared daily lock time.</p>
          {matchesError || betsError ? (
            <p className="form-message error">
              {matchesError?.message ?? betsError?.message}
            </p>
          ) : null}
          {!matchesError && normalizedMatches.length === 0 ? (
            <p className="empty-state">No matches are scheduled yet.</p>
          ) : null}
          <MatchBettingList matches={normalizedMatches} />
        </article>
        <article className="panel">
          <h2>Bonus Bets</h2>
          <p>Pre-tournament group and general bonus predictions will live here.</p>
        </article>
        <article className="panel wide-panel">
          <h2>Your Score</h2>
          <p>Draft points from matches that already have official results.</p>
          {scoreEventsError ? <p className="form-message error">{scoreEventsError.message}</p> : null}
          <ParticipantScoreSummary events={normalizedScoreEvents} />
        </article>
        <article className="panel">
          <h2>Leaderboard</h2>
          <p>Participants see the latest admin-published leaderboard snapshot.</p>
        </article>
      </section>
    </main>
  );
}
