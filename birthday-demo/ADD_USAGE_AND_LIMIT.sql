-- Idempotent migration for the private usage counter, shared 20-photo limit,
-- upload rollback, and END PARTY deletion.

create table if not exists public.birthday_usage_sessions (
  session_id uuid primary key,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  last_scene text not null default 'opening'
    check (last_scene in ('opening', 'labubu', 'spider', 'football', 'mixed', 'finale'))
);

alter table public.birthday_usage_sessions enable row level security;
revoke all on table public.birthday_usage_sessions from anon;

create or replace function public.birthday_usage_close_stale()
returns void
language sql
security definer
set search_path = public
as $$
  update public.birthday_usage_sessions
  set ended_at = last_seen_at
  where ended_at is null
    and last_seen_at <= now() - interval '90 seconds';
$$;

create or replace function public.birthday_usage_start(
  p_session_id uuid,
  p_scene text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_scene not in ('opening', 'labubu', 'spider', 'football', 'mixed', 'finale') then
    raise exception 'INVALID_BIRTHDAY_SCENE';
  end if;

  perform public.birthday_usage_close_stale();

  insert into public.birthday_usage_sessions (
    session_id,
    started_at,
    last_seen_at,
    duration_seconds,
    last_scene
  ) values (
    p_session_id,
    now(),
    now(),
    0,
    p_scene
  ) on conflict (session_id) do nothing;
end;
$$;

create or replace function public.birthday_usage_heartbeat(
  p_session_id uuid,
  p_duration_seconds integer,
  p_scene text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_scene not in ('opening', 'labubu', 'spider', 'football', 'mixed', 'finale') then
    raise exception 'INVALID_BIRTHDAY_SCENE';
  end if;

  perform public.birthday_usage_close_stale();

  update public.birthday_usage_sessions
  set last_seen_at = now(),
      duration_seconds = greatest(duration_seconds, greatest(0, p_duration_seconds)),
      last_scene = p_scene
  where session_id = p_session_id
    and ended_at is null;
end;
$$;

revoke all on function public.birthday_usage_close_stale() from public, anon, authenticated;
revoke all on function public.birthday_usage_start(uuid, text) from public, anon, authenticated;
revoke all on function public.birthday_usage_heartbeat(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.birthday_usage_start(uuid, text) to anon;
grant execute on function public.birthday_usage_heartbeat(uuid, integer, text) to anon;

create or replace function public.enforce_birthday_photo_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('birthday_photos_shared_limit'));
  if (select count(*) from public.birthday_photos) >= 20 then
    raise exception 'BIRTHDAY_PHOTO_LIMIT_REACHED';
  end if;
  return new;
end;
$$;

drop trigger if exists birthday_photos_limit_20 on public.birthday_photos;
create trigger birthday_photos_limit_20
before insert on public.birthday_photos
for each row execute function public.enforce_birthday_photo_limit();

revoke all on function public.enforce_birthday_photo_limit() from public, anon, authenticated;

drop policy if exists "birthday photos public delete" on public.birthday_photos;
create policy "birthday photos public delete"
on public.birthday_photos for delete
to anon
using (true);

drop policy if exists "birthday storage public delete" on storage.objects;
create policy "birthday storage public delete"
on storage.objects for delete
to anon
using (bucket_id = 'maxwell-birthday');
