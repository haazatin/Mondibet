create policy "Admins can create tournament group bonus overrides"
on public.group_bonus_bets
for insert
to authenticated
with check (
  is_admin_override = true
  and admin_override_reason is not null
  and exists (
    select 1
    from public.participants participant
    join public.groups tournament_group
      on tournament_group.tournament_id = participant.tournament_id
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = group_bonus_bets.participant_id
      and tournament_group.id = group_bonus_bets.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can update tournament group bonus overrides"
on public.group_bonus_bets
for update
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    join public.groups tournament_group
      on tournament_group.tournament_id = participant.tournament_id
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = group_bonus_bets.participant_id
      and tournament_group.id = group_bonus_bets.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
)
with check (
  is_admin_override = true
  and admin_override_reason is not null
  and exists (
    select 1
    from public.participants participant
    join public.groups tournament_group
      on tournament_group.tournament_id = participant.tournament_id
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = group_bonus_bets.participant_id
      and tournament_group.id = group_bonus_bets.group_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can create tournament general bonus overrides"
on public.general_bonus_bets
for insert
to authenticated
with check (
  is_admin_override = true
  and admin_override_reason is not null
  and exists (
    select 1
    from public.participants participant
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = general_bonus_bets.participant_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);

create policy "Admins can update tournament general bonus overrides"
on public.general_bonus_bets
for update
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
)
with check (
  is_admin_override = true
  and admin_override_reason is not null
  and exists (
    select 1
    from public.participants participant
    join public.user_roles roles
      on roles.tournament_id = participant.tournament_id
    where participant.id = general_bonus_bets.participant_id
      and roles.user_id = (select auth.uid())
      and roles.role = 'admin'
  )
);
