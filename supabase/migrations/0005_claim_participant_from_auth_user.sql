create or replace function public.claim_invited_participant()
returns table (
  participant_id uuid,
  tournament_id uuid,
  role text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := '';
  invited_participant record;
begin
  if current_user_id is null then
    return;
  end if;

  select lower(coalesce(users.email, ''))
  into current_email
  from auth.users users
  where users.id = current_user_id;

  if current_email = '' then
    current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  end if;

  if current_email = '' then
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

  update public.participants
  set user_id = current_user_id
  where id = invited_participant.id
    and user_id is distinct from current_user_id;

  insert into public.user_roles (user_id, tournament_id, role)
  values (current_user_id, invited_participant.tournament_id, 'participant')
  on conflict on constraint user_roles_user_id_tournament_id_role_key do nothing;

  return query
  select
    invited_participant.id as participant_id,
    invited_participant.tournament_id as tournament_id,
    'participant'::text as role;
end;
$$;

grant execute on function public.claim_invited_participant() to authenticated;
