create policy "Participants can read their own score events"
on public.score_events
for select
to authenticated
using (
  exists (
    select 1
    from public.participants participant
    where participant.id = score_events.participant_id
      and (
        participant.user_id = (select auth.uid())
        or lower(participant.email) = public.current_auth_email()
      )
  )
);
