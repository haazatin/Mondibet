import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import {
  BonusBettingPanel,
  type BonusGroup,
  type GeneralBonusBet,
} from "@/app/participant/bonus/bonus-betting-panel";
import { MatchBettingList, type ParticipantMatch } from "@/app/participant/bets/match-betting-list";
import { PublishedLeaderboard } from "@/app/participant/leaderboard/published-leaderboard";
import { ParticipantScoreSummary } from "@/app/participant/scores/participant-score-summary";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { hasPublicSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface MyMatchScoreEvent {
  event_id: string;
  source_id: string;
  source_type?: string;
  category: string;
  points: number;
  reason: string;
}

interface PublishedLeaderboardRow {
  snapshot_id: string;
  published_at: string;
  row_id: string;
  rank: number;
  participant_name: string;
  total_points: number;
  group_stage_points: number;
  knockout_points: number;
  bonus_points: number;
  streak_points: number;
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
  const { data: teams } = current.tournamentId
    ? await supabase
        .from("teams")
        .select("id,name")
        .eq("tournament_id", current.tournamentId)
        .order("name", { ascending: true })
    : { data: [] };
  const { data: groups } = current.tournamentId
    ? await supabase
        .from("groups")
        .select("id,name,sort_order")
        .eq("tournament_id", current.tournamentId)
        .order("sort_order", { ascending: true })
    : { data: [] };
  const { data: groupTeams } = await supabase
    .from("group_teams")
    .select("group_id,seed_order,teams(id,name)")
    .order("seed_order", { ascending: true });
  const { data: groupBonusBets } = effectiveParticipantId
    ? await supabase
        .from("group_bonus_bets")
        .select(
          "group_id,predicted_first_team_id,predicted_second_team_id,predicted_third_team_id,submitted_at",
        )
        .eq("participant_id", effectiveParticipantId)
    : { data: [] };
  const { data: generalBonusBet } = effectiveParticipantId
    ? await supabase
        .from("general_bonus_bets")
        .select(
          "champion_team_id,runner_up_team_id,top_scorer_name,top_scorer_goals,player_of_tournament,surprise_team_id,disappointment_team_id,highest_scoring_group_id,lowest_scoring_group_id,most_goals_team_id,fewest_goals_team_id,submitted_at",
        )
        .eq("participant_id", effectiveParticipantId)
        .maybeSingle()
    : { data: null };
  const { data: bonusLockAt } = current.tournamentId
    ? await supabase.rpc("get_bonus_lock_at", {
        p_tournament_id: current.tournamentId,
      })
    : { data: null };

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
  const groupBonusBetsByGroupId = new Map(
    (groupBonusBets ?? []).map((bet) => [bet.group_id, bet]),
  );
  const groupTeamsByGroupId = new Map<string, BonusGroup["teams"]>();

  for (const assignment of groupTeams ?? []) {
    const team = Array.isArray(assignment.teams) ? assignment.teams[0] : assignment.teams;

    if (!team) {
      continue;
    }

    const currentTeams = groupTeamsByGroupId.get(assignment.group_id) ?? [];
    currentTeams.push({
      id: team.id,
      name: team.name,
    });
    groupTeamsByGroupId.set(assignment.group_id, currentTeams);
  }

  const normalizedBonusGroups: BonusGroup[] =
    groups?.map((group) => ({
      id: group.id,
      name: group.name,
      sort_order: group.sort_order,
      teams: groupTeamsByGroupId.get(group.id) ?? [],
      bet: groupBonusBetsByGroupId.get(group.id) ?? null,
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
      source_type: event.source_type,
      category: event.category,
      points: event.points,
      reason: event.reason,
      matches: matchesById.get(event.source_id) ?? null,
    }));
  const { data: publishedRows } = current.tournamentId
    ? await supabase.rpc("get_latest_published_leaderboard", {
        p_tournament_id: current.tournamentId,
      })
    : { data: [] };
  const normalizedPublishedRows = (publishedRows ?? []) as PublishedLeaderboardRow[];
  const publishedAt = normalizedPublishedRows[0]?.published_at ?? null;

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
        <article className="panel wide-panel">
          <h2>Bonus Bets</h2>
          <p>Submit pre-tournament group and general bonus predictions.</p>
          <BonusBettingPanel
            bonusLockAt={bonusLockAt}
            generalBet={(generalBonusBet ?? null) as GeneralBonusBet | null}
            groups={normalizedBonusGroups}
            teams={teams ?? []}
          />
        </article>
        <article className="panel wide-panel">
          <h2>Your Score</h2>
          <p>Draft points from matches that already have official results.</p>
          {scoreEventsError ? <p className="form-message error">{scoreEventsError.message}</p> : null}
          <ParticipantScoreSummary events={normalizedScoreEvents} />
        </article>
        <article className="panel">
          <h2>Leaderboard</h2>
          <p>Latest admin-published standings snapshot.</p>
          <PublishedLeaderboard
            publishedAt={publishedAt}
            rows={normalizedPublishedRows}
          />
        </article>
      </section>
    </main>
  );
}
