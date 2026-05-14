create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  short_name text,
  fifa_code text
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  sort_order integer not null
);

create table public.group_teams (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  seed_order integer,
  unique (group_id, team_id)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  email text not null,
  display_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (tournament_id, email)
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  role text not null check (role in ('admin', 'participant')),
  created_at timestamptz not null default now(),
  unique (user_id, tournament_id, role)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage text not null,
  group_id uuid references public.groups(id) on delete set null,
  home_team_id uuid references public.teams(id) on delete restrict,
  away_team_id uuid references public.teams(id) on delete restrict,
  starts_at timestamptz not null,
  daily_lock_at timestamptz not null,
  status text not null default 'scheduled',
  sort_order integer not null
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score_90 integer not null,
  away_score_90 integer not null,
  home_score_final integer,
  away_score_final integer,
  advancing_team_id uuid references public.teams(id) on delete restrict,
  source text not null default 'admin',
  is_official boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id)
);

create table public.match_bets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  predicted_home_score_90 integer not null,
  predicted_away_score_90 integer not null,
  predicted_advancing_team_id uuid references public.teams(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  locked_at timestamptz,
  submitted_by_user_id uuid,
  is_admin_override boolean not null default false,
  admin_override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_admin_override = false or admin_override_reason is not null),
  unique (match_id, participant_id)
);

create table public.group_bonus_bets (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  predicted_first_team_id uuid references public.teams(id) on delete restrict,
  predicted_second_team_id uuid references public.teams(id) on delete restrict,
  predicted_third_team_id uuid references public.teams(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  locked_at timestamptz,
  submitted_by_user_id uuid,
  is_admin_override boolean not null default false,
  admin_override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_admin_override = false or admin_override_reason is not null),
  unique (participant_id, group_id)
);

create table public.best_third_place_bets (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  locked_at timestamptz,
  submitted_by_user_id uuid,
  is_admin_override boolean not null default false,
  admin_override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_admin_override = false or admin_override_reason is not null),
  unique (participant_id, team_id)
);

create table public.general_bonus_bets (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  champion_team_id uuid references public.teams(id) on delete restrict,
  runner_up_team_id uuid references public.teams(id) on delete restrict,
  top_scorer_name text,
  top_scorer_goals integer,
  player_of_tournament text,
  surprise_team_id uuid references public.teams(id) on delete restrict,
  disappointment_team_id uuid references public.teams(id) on delete restrict,
  highest_scoring_group_id uuid references public.groups(id) on delete restrict,
  lowest_scoring_group_id uuid references public.groups(id) on delete restrict,
  most_goals_team_id uuid references public.teams(id) on delete restrict,
  fewest_goals_team_id uuid references public.teams(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  locked_at timestamptz,
  submitted_by_user_id uuid,
  is_admin_override boolean not null default false,
  admin_override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_admin_override = false or admin_override_reason is not null),
  unique (participant_id)
);

create table public.score_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  category text not null,
  points integer not null,
  reason text not null,
  calculated_at timestamptz not null default now()
);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid,
  is_published boolean not null default false
);

create table public.leaderboard_snapshot_rows (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.leaderboard_snapshots(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  rank integer not null,
  total_points integer not null,
  group_stage_points integer not null default 0,
  knockout_points integer not null default 0,
  bonus_points integer not null default 0,
  streak_points integer not null default 0,
  tie_break_status text
);

create table public.scoring_runs (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  trigger text not null,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index participants_user_id_idx on public.participants(user_id);
create index teams_tournament_id_idx on public.teams(tournament_id);
create index groups_tournament_id_idx on public.groups(tournament_id);
create index group_teams_group_id_idx on public.group_teams(group_id);
create index matches_tournament_starts_at_idx on public.matches(tournament_id, starts_at);
create index score_events_participant_idx on public.score_events(participant_id, tournament_id);
create index leaderboard_snapshots_published_idx on public.leaderboard_snapshots(tournament_id, is_published, created_at desc);

alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.groups enable row level security;
alter table public.group_teams enable row level security;
alter table public.participants enable row level security;
alter table public.user_roles enable row level security;
alter table public.matches enable row level security;
alter table public.results enable row level security;
alter table public.match_bets enable row level security;
alter table public.group_bonus_bets enable row level security;
alter table public.best_third_place_bets enable row level security;
alter table public.general_bonus_bets enable row level security;
alter table public.score_events enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.leaderboard_snapshot_rows enable row level security;
alter table public.scoring_runs enable row level security;
alter table public.admin_audit_log enable row level security;

create or replace function public.claim_invited_participant()
returns table (
  participant_id uuid,
  tournament_id uuid,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invited_participant record;
begin
  if current_user_id is null or current_email = '' then
    return;
  end if;

  select id, tournament_id, user_id
  into invited_participant
  from public.participants
  where lower(email) = current_email
  limit 1;

  if not found then
    return;
  end if;

  if invited_participant.user_id is not null
     and invited_participant.user_id <> current_user_id then
    return;
  end if;

  if invited_participant.user_id is null then
    update public.participants
    set user_id = current_user_id
    where id = invited_participant.id
      and user_id is null;
  end if;

  insert into public.user_roles (user_id, tournament_id, role)
  values (current_user_id, invited_participant.tournament_id, 'participant')
  on conflict (user_id, tournament_id, role) do nothing;

  return query
  select invited_participant.id, invited_participant.tournament_id, 'participant'::text;
end;
$$;

grant execute on function public.claim_invited_participant() to authenticated;

create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their participant role"
on public.user_roles
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'participant'
  and exists (
    select 1
    from public.participants participant
    where participant.user_id = (select auth.uid())
      and participant.tournament_id = user_roles.tournament_id
  )
);

create policy "Users can read their own participant profile"
on public.participants
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Invited users can read unclaimed participant profile"
on public.participants
for select
to authenticated
using (
  user_id is null
  and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
);

create policy "Invited users can claim their participant profile"
on public.participants
for update
to authenticated
using (
  user_id is null
  and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
)
with check (
  user_id = (select auth.uid())
  and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
);

create policy "Admins can read tournament participants"
on public.participants
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = participants.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament participants"
on public.participants
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = participants.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament teams"
on public.teams
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = teams.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament teams"
on public.teams
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = teams.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament groups"
on public.groups
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = groups.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament groups"
on public.groups
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = groups.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can read group assignments"
on public.group_teams
for select
to authenticated
using (
  exists (
    select 1
    from public.groups tournament_groups
    join public.user_roles roles
      on roles.tournament_id = tournament_groups.tournament_id
    where tournament_groups.id = group_teams.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can create group assignments"
on public.group_teams
for insert
to authenticated
with check (
  exists (
    select 1
    from public.groups tournament_groups
    join public.teams tournament_teams
      on tournament_teams.tournament_id = tournament_groups.tournament_id
    join public.user_roles roles
      on roles.tournament_id = tournament_groups.tournament_id
    where tournament_groups.id = group_teams.group_id
      and tournament_teams.id = group_teams.team_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament matches"
on public.matches
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = matches.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament matches"
on public.matches
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = matches.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can update tournament matches"
on public.matches
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = matches.tournament_id
      and roles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = matches.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Published leaderboard snapshots are readable"
on public.leaderboard_snapshots
for select
to authenticated
using (is_published = true);

create policy "Published leaderboard rows are readable"
on public.leaderboard_snapshot_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.leaderboard_snapshots snapshots
    where snapshots.id = leaderboard_snapshot_rows.snapshot_id
      and snapshots.is_published = true
  )
);
