import { redirect } from "next/navigation";
import { AuditLog } from "@/app/admin/audit/audit-log";
import {
  BonusResultPanel,
  type BonusResultGroup,
  type GeneralBonusResult,
} from "@/app/admin/bonus-results/bonus-result-panel";
import { CollapsibleAdminPanel } from "@/app/admin/collapsible-admin-panel";
import { signOut } from "@/app/auth/actions";
import { LeaderboardPublishPanel } from "@/app/admin/leaderboard/leaderboard-publish-panel";
import { MatchForm } from "@/app/admin/matches/match-form";
import { MatchList } from "@/app/admin/matches/match-list";
import { BonusBetOverrideForm } from "@/app/admin/overrides/bonus-bet-override-form";
import { MatchBetOverrideForm } from "@/app/admin/overrides/match-bet-override-form";
import { ParticipantForm } from "@/app/admin/participants/participant-form";
import { ParticipantList } from "@/app/admin/participants/participant-list";
import { ResultEntryList, type ResultEntryMatch } from "@/app/admin/results/result-entry-list";
import { ScoringPreview } from "@/app/admin/scoring/scoring-preview";
import { SetupForms } from "@/app/admin/setup/setup-forms";
import { SetupLists } from "@/app/admin/setup/setup-lists";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { buildDraftLeaderboard } from "@/lib/leaderboard/draft";
import { hasPublicSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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

  if (current.role !== "admin") {
    redirect("/participant");
  }

  const { data: participants } = current.tournamentId
    ? await supabase
        .from("participants")
        .select("id,display_name,email,status")
        .eq("tournament_id", current.tournamentId)
        .order("created_at", { ascending: true })
    : { data: [] };
  const { data: teams } = current.tournamentId
    ? await supabase
        .from("teams")
        .select("id,name,short_name,fifa_code")
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
    .select("id,group_id,team_id,seed_order,groups(id,name),teams(id,name)")
    .order("seed_order", { ascending: true });
  const { data: matches } = current.tournamentId
    ? await supabase
        .from("matches")
        .select(
          "id,stage,starts_at,daily_lock_at,sort_order,groups(name),home_team:teams!matches_home_team_id_fkey(id,name),away_team:teams!matches_away_team_id_fkey(id,name),results(home_score_90,away_score_90,home_score_final,away_score_final,advancing_team_id)",
        )
        .eq("tournament_id", current.tournamentId)
        .order("starts_at", { ascending: true })
        .order("sort_order", { ascending: true })
    : { data: [] };
  const normalizedGroupTeams =
    groupTeams?.map((assignment) => ({
      id: assignment.id,
      group_id: assignment.group_id,
      team_id: assignment.team_id,
      seed_order: assignment.seed_order,
      groups: Array.isArray(assignment.groups) ? assignment.groups[0] : assignment.groups,
      teams: Array.isArray(assignment.teams) ? assignment.teams[0] : assignment.teams,
    })) ?? [];
  const normalizedMatches =
    matches?.map((match) => ({
      id: match.id,
      stage: match.stage,
      starts_at: match.starts_at,
      daily_lock_at: match.daily_lock_at,
      sort_order: match.sort_order,
      groups: Array.isArray(match.groups) ? match.groups[0] : match.groups,
      home_team: Array.isArray(match.home_team) ? match.home_team[0] : match.home_team,
      away_team: Array.isArray(match.away_team) ? match.away_team[0] : match.away_team,
      result: Array.isArray(match.results) ? (match.results[0] ?? null) : (match.results ?? null),
    })) ?? [];
  const resultEntryMatches: ResultEntryMatch[] = normalizedMatches;
  const { data: scoreEvents } = current.tournamentId
    ? await supabase
        .from("score_events")
        .select(
          "id,participant_id,source_id,source_type,category,points,reason,calculated_at,participants(display_name)",
        )
        .eq("tournament_id", current.tournamentId)
        .order("calculated_at", { ascending: false })
    : { data: [] };
  const { data: groupBonusResults } = current.tournamentId
    ? await supabase
        .from("group_bonus_results")
        .select("group_id,first_team_id,second_team_id,third_team_id,groups!inner(tournament_id)")
        .eq("groups.tournament_id", current.tournamentId)
    : { data: [] };
  const { data: generalBonusResult } = current.tournamentId
    ? await supabase
        .from("general_bonus_results")
        .select(
          "champion_team_id,runner_up_team_id,top_scorer_name,top_scorer_goals,player_of_tournament,highest_scoring_group_id,lowest_scoring_group_id,most_goals_team_id,fewest_goals_team_id",
        )
        .eq("tournament_id", current.tournamentId)
        .maybeSingle()
    : { data: null };
  const matchesById = new Map(normalizedMatches.map((match) => [match.id, match]));
  const normalizedScoreEvents =
    scoreEvents?.map((event) => ({
      id: event.id,
      source_type: event.source_type,
      category: event.category,
      points: event.points,
      reason: event.reason,
      calculated_at: event.calculated_at,
      participants: Array.isArray(event.participants) ? event.participants[0] : event.participants,
      matches: matchesById.get(event.source_id) ?? null,
    })) ?? [];
  const groupBonusResultsByGroupId = new Map(
    (groupBonusResults ?? []).map((result) => [result.group_id, result]),
  );
  const groupTeamsByGroupId = new Map<string, BonusResultGroup["teams"]>();

  for (const assignment of normalizedGroupTeams) {
    if (!assignment.group_id || !assignment.teams) {
      continue;
    }

    const currentTeams = groupTeamsByGroupId.get(assignment.group_id) ?? [];
    currentTeams.push({
      id: assignment.team_id,
      name: assignment.teams.name,
    });
    groupTeamsByGroupId.set(assignment.group_id, currentTeams);
  }

  const normalizedBonusResultGroups: BonusResultGroup[] =
    groups?.map((group) => {
      const result = groupBonusResultsByGroupId.get(group.id);

      return {
        id: group.id,
        name: group.name,
        sort_order: group.sort_order,
        teams: groupTeamsByGroupId.get(group.id) ?? [],
        result: result
          ? {
              first_team_id: result.first_team_id,
              second_team_id: result.second_team_id,
              third_team_id: result.third_team_id,
            }
          : null,
      };
    }) ?? [];
  const draftLeaderboardRows = buildDraftLeaderboard({
    participants:
      participants?.map((participant) => ({
        id: participant.id,
        displayName: participant.display_name,
      })) ?? [],
    scoreEvents:
      scoreEvents?.map((event) => ({
        participant_id: event.participant_id,
        category: event.category,
        points: event.points,
      })) ?? [],
  });
  const { data: latestPublishedSnapshot } = current.tournamentId
    ? await supabase
        .from("leaderboard_snapshots")
        .select("id,created_at")
        .eq("tournament_id", current.tournamentId)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const { data: auditEvents } = current.tournamentId
    ? await supabase
        .from("admin_audit_log")
        .select(
          "id,action,entity_type,entity_id,reason,before_json,after_json,created_at,actor_user_id",
        )
        .eq("tournament_id", current.tournamentId)
        .order("created_at", { ascending: false })
        .limit(25)
    : { data: [] };

  return (
    <main className="shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-title">Admin</div>
          <div className="brand-subtitle">{current.user.email}</div>
        </div>
        <form action={signOut}>
          <button className="secondary-button" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="dashboard" aria-label="Admin modules">
        <article className="panel wide-panel">
          <h2>Bet Overrides</h2>
          <p>Enter or correct participant match bets after lock with a required audit reason.</p>
          <MatchBetOverrideForm
            participants={participants ?? []}
            matches={normalizedMatches}
          />
          <BonusBetOverrideForm
            groupTeams={normalizedGroupTeams}
            groups={groups ?? []}
            participants={participants ?? []}
            teams={teams ?? []}
          />
        </article>
        <article className="panel wide-panel">
          <h2>Publish Leaderboard</h2>
          <p>Review draft standings and publish a snapshot for participants.</p>
          <LeaderboardPublishPanel
            draftRows={draftLeaderboardRows}
            latestPublishedAt={latestPublishedSnapshot?.created_at ?? null}
          />
        </article>
        <article className="panel wide-panel">
          <h2>Results</h2>
          <p>Enter official results. Saving recalculates score events for submitted bets.</p>
          <ResultEntryList matches={resultEntryMatches} />
        </article>
        <CollapsibleAdminPanel
          description="Recent admin override and correction history."
          title="Audit Log"
        >
          <AuditLog events={auditEvents ?? []} />
        </CollapsibleAdminPanel>
        <article className="panel wide-panel">
          <h2>Participants</h2>
          <p>Add participant names and emails before inviting them to sign in.</p>
          <ParticipantForm />
          <ParticipantList participants={participants ?? []} />
        </article>
        <CollapsibleAdminPanel
          description="Add teams, groups, and group assignments before creating matches."
          title="Tournament Setup"
        >
          <SetupForms teams={teams ?? []} groups={groups ?? []} />
          <SetupLists teams={teams ?? []} groups={groups ?? []} groupTeams={normalizedGroupTeams} />
        </CollapsibleAdminPanel>
        <CollapsibleAdminPanel
          description="Create fixtures. The daily lock is calculated from the first kickoff of each day."
          title="Matches"
        >
          <MatchForm teams={teams ?? []} groups={groups ?? []} />
          <MatchList matches={normalizedMatches} />
        </CollapsibleAdminPanel>
        <CollapsibleAdminPanel
          description="Draft score events generated from official results and submitted bets."
          title="Scoring Preview"
        >
          <ScoringPreview events={normalizedScoreEvents} />
        </CollapsibleAdminPanel>
        <CollapsibleAdminPanel
          description="Enter official bonus outcomes. Saving recalculates bonus score events."
          title="Bonus Results"
        >
          <BonusResultPanel
            generalResult={(generalBonusResult ?? null) as GeneralBonusResult | null}
            groups={normalizedBonusResultGroups}
            teams={teams ?? []}
          />
        </CollapsibleAdminPanel>
      </section>
    </main>
  );
}
