import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import {
  BonusBettingPanel,
  type BonusGroup,
  type GeneralBonusBet,
} from "@/app/participant/bonus/bonus-betting-panel";
import { MatchBettingList, type ParticipantMatch } from "@/app/participant/bets/match-betting-list";
import { VisibleMatchBets } from "@/app/participant/bets/visible-match-bets";
import { PublishedLeaderboard } from "@/app/participant/leaderboard/published-leaderboard";
import {
  CompletedMatchResults,
  type CompletedBonusResult,
  type CompletedMatchResult,
} from "@/app/participant/results/completed-match-results";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { hasPublicSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

interface MatchBetRow {
  match_id: string;
  predicted_home_score_90: number;
  predicted_away_score_90: number;
  predicted_advancing_team_id: string | null;
  submitted_at: string;
}

interface GroupBonusBetRow {
  group_id: string;
  predicted_first_team_id: string | null;
  predicted_second_team_id: string | null;
  predicted_third_team_id: string | null;
  submitted_at: string;
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

  const { data: bets, error: betsError } = current.tournamentId
    ? await supabase.rpc("get_my_match_bets", {
        p_tournament_id: current.tournamentId,
      })
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
  const { data: groupBonusBets } = current.tournamentId
    ? await supabase.rpc("get_my_group_bonus_bets", {
        p_tournament_id: current.tournamentId,
      })
    : { data: [] };
  const { data: generalBonusBetRows } = current.tournamentId
    ? await supabase.rpc("get_my_general_bonus_bet", {
        p_tournament_id: current.tournamentId,
      })
    : { data: null };
  const { data: bonusLockAt } = current.tournamentId
    ? await supabase.rpc("get_bonus_lock_at", {
        p_tournament_id: current.tournamentId,
      })
    : { data: null };
  const { data: completedMatchResults } = current.tournamentId
    ? await supabase.rpc("get_my_completed_match_results", {
        p_tournament_id: current.tournamentId,
      })
    : { data: [] };
  const { data: completedBonusResults } = current.tournamentId
    ? await supabase.rpc("get_my_completed_bonus_results", {
        p_tournament_id: current.tournamentId,
      })
    : { data: [] };

  const normalizedBets = (bets ?? []) as MatchBetRow[];
  const betsByMatchId = new Map(normalizedBets.map((bet) => [bet.match_id, bet]));
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
  const normalizedGroupBonusBets = (groupBonusBets ?? []) as GroupBonusBetRow[];
  const groupBonusBetsByGroupId = new Map(
    normalizedGroupBonusBets.map((bet) => [bet.group_id, bet]),
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
  const { data: publishedRows } = current.tournamentId
    ? await supabase.rpc("get_latest_published_leaderboard", {
        p_tournament_id: current.tournamentId,
      })
    : { data: [] };
  const normalizedPublishedRows = (publishedRows ?? []) as PublishedLeaderboardRow[];
  const publishedAt = normalizedPublishedRows[0]?.published_at ?? null;
  const generalBonusBet = Array.isArray(generalBonusBetRows)
    ? (generalBonusBetRows[0] ?? null)
    : null;
  const completedMatchIds = new Set(
    ((completedMatchResults ?? []) as CompletedMatchResult[]).map((result) => result.match_id),
  );
  const pendingSubmittedMatches = normalizedMatches.filter(
    (match) => match.bet && !completedMatchIds.has(match.id),
  );

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
          <h2>Leaderboard</h2>
          <p>Latest admin-published standings snapshot.</p>
          <PublishedLeaderboard
            publishedAt={publishedAt}
            rows={normalizedPublishedRows}
          />
        </article>
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
          <h2>Your Next Bets</h2>
          <p>Your submitted match bets until the admin enters results.</p>
          <VisibleMatchBets matches={pendingSubmittedMatches} />
        </article>
        <article className="panel wide-panel">
          <h2>Completed Bets</h2>
          <p>Your bet, the official result, and the points you earned for each completed bet.</p>
          <CompletedMatchResults
            bonusResults={(completedBonusResults ?? []) as CompletedBonusResult[]}
            matchResults={(completedMatchResults ?? []) as CompletedMatchResult[]}
          />
        </article>
      </section>
    </main>
  );
}
