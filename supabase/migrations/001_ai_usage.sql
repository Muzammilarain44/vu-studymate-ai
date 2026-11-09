-- Atomic daily generation limit, scoped to the signed-in user.
create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  used int not null default 0 check (used >= 0),
  primary key (user_id, usage_day)
);
alter table public.ai_daily_usage enable row level security;
-- No direct table access for clients; only the definer RPC below can update usage.
revoke all on public.ai_daily_usage from anon, authenticated;
create or replace function public.claim_ai_generation()
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare current_usage int;
begin
  if auth.uid() is null then return false; end if;
  insert into public.ai_daily_usage(user_id, usage_day, used)
  values(auth.uid(), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_day) do update
    set used = public.ai_daily_usage.used + 1
    where public.ai_daily_usage.used < 3
  returning used into current_usage;
  return current_usage is not null;
end $$;
revoke all on function public.claim_ai_generation() from public, anon;
grant execute on function public.claim_ai_generation() to authenticated;
