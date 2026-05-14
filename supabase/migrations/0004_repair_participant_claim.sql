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
  has_existing_role boolean := false;
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

  select exists (
    select 1
    from public.user_roles roles
    where roles.user_id = current_user_id
      and roles.tournament_id = invited_participant.tournament_id
      and roles.role = 'participant'
  )
  into has_existing_role;

  if invited_participant.user_id is not null
     and invited_participant.user_id <> current_user_id
     and not has_existing_role then
    return;
  end if;

  if invited_participant.user_id is distinct from current_user_id then
    update public.participants
    set user_id = current_user_id
    where id = invited_participant.id;
  end if;

  insert into public.user_roles (user_id, tournament_id, role)
  values (current_user_id, invited_participant.tournament_id, 'participant')
  on conflict (user_id, tournament_id, role) do nothing;

  return query
  select invited_participant.id, invited_participant.tournament_id, 'participant'::text;
end;
$$;

grant execute on function public.claim_invited_participant() to authenticated;
