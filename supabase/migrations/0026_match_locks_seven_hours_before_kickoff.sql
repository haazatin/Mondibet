update public.matches
set daily_lock_at = starts_at - interval '7 hours';
