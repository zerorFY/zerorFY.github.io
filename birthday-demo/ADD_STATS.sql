-- Idempotent migration for the shared-key-protected birthday usage dashboard.
-- Configure the key digest separately after running this file; never commit the key.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.birthday_stats_access (
  singleton boolean primary key default true check (singleton),
  access_key_hash bytea not null,
  updated_at timestamptz not null default now()
);

alter table public.birthday_stats_access enable row level security;
revoke all on table public.birthday_stats_access from public, anon, authenticated;

create or replace function public.birthday_usage_stats(
  p_access_key text,
  p_recent_limit integer default 12
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_access_key_hash bytea;
  v_recent_limit integer := least(50, greatest(1, p_recent_limit));
  v_today_start timestamptz := date_trunc('day', now() at time zone 'America/Toronto') at time zone 'America/Toronto';
  v_result jsonb;
begin
  select access_key_hash
  into v_access_key_hash
  from public.birthday_stats_access
  where singleton = true;

  if v_access_key_hash is null
     or p_access_key is null
     or digest(p_access_key, 'sha256') <> v_access_key_hash then
    raise exception 'STATS_ACCESS_DENIED' using errcode = '28000';
  end if;

  perform public.birthday_usage_close_stale();

  select jsonb_build_object(
    'generated_at', now(),
    'summary', (
      select jsonb_build_object(
        'live_now', count(*) filter (where ended_at is null),
        'today_opens', count(*) filter (where started_at >= v_today_start),
        'today_watch_seconds', coalesce(sum(duration_seconds) filter (where started_at >= v_today_start), 0),
        'total_opens', count(*),
        'total_watch_seconds', coalesce(sum(duration_seconds), 0),
        'average_session_seconds', case when count(*) = 0 then 0 else round(coalesce(sum(duration_seconds), 0)::numeric / count(*)) end
      )
      from public.birthday_usage_sessions
    ),
    'live_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'session_id', session_id,
        'started_at', started_at,
        'last_seen_at', last_seen_at,
        'ended_at', ended_at,
        'duration_seconds', duration_seconds,
        'last_scene', last_scene,
        'status', 'live'
      ) order by started_at desc)
      from public.birthday_usage_sessions
      where ended_at is null
    ), '[]'::jsonb),
    'recent_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'session_id', session_id,
        'started_at', started_at,
        'last_seen_at', last_seen_at,
        'ended_at', ended_at,
        'duration_seconds', duration_seconds,
        'last_scene', last_scene,
        'status', case when ended_at is null then 'live' else 'finished' end
      ) order by started_at desc)
      from (
        select *
        from public.birthday_usage_sessions
        order by started_at desc
        limit v_recent_limit
      ) recent
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.birthday_usage_stats(text, integer) from public, anon, authenticated;
grant execute on function public.birthday_usage_stats(text, integer) to anon;
