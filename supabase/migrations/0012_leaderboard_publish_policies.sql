create policy "Admins can read tournament leaderboard snapshots"
on public.leaderboard_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = leaderboard_snapshots.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament leaderboard snapshots"
on public.leaderboard_snapshots
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles roles
    where roles.user_id = (select auth.uid())
      and roles.tournament_id = leaderboard_snapshots.tournament_id
      and roles.role = 'admin'
  )
);

create policy "Admins can read tournament leaderboard rows"
on public.leaderboard_snapshot_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.leaderboard_snapshots snapshots
    join public.user_roles roles
      on roles.tournament_id = snapshots.tournament_id
    where snapshots.id = leaderboard_snapshot_rows.snapshot_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament leaderboard rows"
on public.leaderboard_snapshot_rows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.leaderboard_snapshots snapshots
    join public.user_roles roles
      on roles.tournament_id = snapshots.tournament_id
    where snapshots.id = leaderboard_snapshot_rows.snapshot_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Published leaderboard participants are readable"
on public.participants
for select
to authenticated
using (
  exists (
    select 1
    from public.leaderboard_snapshot_rows rows
    join public.leaderboard_snapshots snapshots
      on snapshots.id = rows.snapshot_id
    where rows.participant_id = participants.id
      and snapshots.is_published = true
  )
);
