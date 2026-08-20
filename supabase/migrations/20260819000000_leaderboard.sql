create extension if not exists pgcrypto;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  browser_id uuid not null unique,
  username text not null check (username ~ '^[A-Za-z0-9 _-]{3,16}$'),
  avatar_id text not null check (avatar_id in ('golden-pup', 'cloud-pup', 'brown-pup', 'pink-pup', 'blue-pup', 'star-pup', 'cat-pal', 'bone-pal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index players_username_lower_key on public.players (lower(username));

create table public.leaderboard_scores (
  player_id uuid primary key references public.players(id) on delete cascade,
  score integer not null check (score between 1 and 1000000),
  level_reached smallint not null check (level_reached between 1 and 10),
  balls_caught integer not null check (balls_caught between 0 and 10000),
  updated_at timestamptz not null default now()
);

create index leaderboard_scores_score_desc_idx on public.leaderboard_scores (score desc);

alter table public.players enable row level security;
alter table public.leaderboard_scores enable row level security;

revoke all on table public.players from anon, authenticated;
revoke all on table public.leaderboard_scores from anon, authenticated;
grant usage on schema public to service_role;
grant all privileges on table public.players to service_role;
grant all privileges on table public.leaderboard_scores to service_role;

create or replace function public.submit_leaderboard_score(
  p_player_id uuid,
  p_score integer,
  p_level_reached smallint,
  p_balls_caught integer
)
returns public.leaderboard_scores
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_score public.leaderboard_scores;
begin
  if p_score not between 1 and 1000000
    or p_level_reached not between 1 and 10
    or p_balls_caught not between 0 and 10000 then
    raise exception 'Invalid leaderboard score';
  end if;

  insert into public.leaderboard_scores (player_id, score, level_reached, balls_caught, updated_at)
  values (p_player_id, p_score, p_level_reached, p_balls_caught, now())
  on conflict (player_id) do update
    set score = excluded.score,
        level_reached = excluded.level_reached,
        balls_caught = excluded.balls_caught,
        updated_at = now()
    where excluded.score > public.leaderboard_scores.score
  returning * into saved_score;

  if saved_score.player_id is null then
    select * into saved_score from public.leaderboard_scores where player_id = p_player_id;
  end if;
  return saved_score;
end;
$$;

revoke all on function public.submit_leaderboard_score(uuid, integer, smallint, integer) from public;
grant execute on function public.submit_leaderboard_score(uuid, integer, smallint, integer) to service_role;
