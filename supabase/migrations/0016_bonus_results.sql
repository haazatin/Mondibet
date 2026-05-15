create table public.group_bonus_results (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  first_team_id uuid not null references public.teams(id) on delete restrict,
  second_team_id uuid not null references public.teams(id) on delete restrict,
  third_team_id uuid not null references public.teams(id) on delete restrict,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id),
  check (
    first_team_id <> second_team_id
    and first_team_id <> third_team_id
    and second_team_id <> third_team_id
  )
);

create table public.general_bonus_results (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  champion_team_id uuid references public.teams(id) on delete restrict,
  runner_up_team_id uuid references public.teams(id) on delete restrict,
  top_scorer_name text,
  top_scorer_goals integer,
  player_of_tournament text,
  highest_scoring_group_id uuid references public.groups(id) on delete restrict,
  lowest_scoring_group_id uuid references public.groups(id) on delete restrict,
  most_goals_team_id uuid references public.teams(id) on delete restrict,
  fewest_goals_team_id uuid references public.teams(id) on delete restrict,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id),
  check (top_scorer_goals is null or top_scorer_goals >= 0)
);

alter table public.group_bonus_results enable row level security;
alter table public.general_bonus_results enable row level security;

create policy "Admins can read tournament group bonus bets"
on public.group_bonus_bets
for select
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = group_bonus_bets.participant_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament general bonus bets"
on public.general_bonus_bets
for select
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = general_bonus_bets.participant_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament group bonus results"
on public.group_bonus_results
for select
to authenticated
using (
  exists (
    select 1
    from public.groups tournament_group
    join public.user_roles roles
      on roles.tournament_id = tournament_group.tournament_id
    where tournament_group.id = group_bonus_results.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament group bonus results"
on public.group_bonus_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.groups tournament_group
    join public.user_roles roles
      on roles.tournament_id = tournament_group.tournament_id
    where tournament_group.id = group_bonus_results.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can update tournament group bonus results"
on public.group_bonus_results
for update
to authenticated
using (
  exists (
    select 1
    from public.groups tournament_group
    join public.user_roles roles
      on roles.tournament_id = tournament_group.tournament_id
    where tournament_group.id = group_bonus_results.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.groups tournament_group
    join public.user_roles roles
      on roles.tournament_id = tournament_group.tournament_id
    where tournament_group.id = group_bonus_results.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament general bonus results"
on public.general_bonus_results
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = general_bonus_results.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament general bonus results"
on public.general_bonus_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = general_bonus_results.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can update tournament general bonus results"
on public.general_bonus_results
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = general_bonus_results.tournament_id
      and roles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = general_bonus_results.tournament_id
      and roles.role = 'admin'
  )
);
