create extension if not exists pgcrypto with schema extensions;

create table if not exists public.game_settings (
    id boolean primary key default true check (id),
    bots_enabled boolean not null default true,
    auto_fill_enabled boolean not null default true,
    activation_threshold integer not null default 10 check (activation_threshold between 0 and 10000),
    target_pool_size integer not null default 20 check (target_pool_size between 1 and 300),
    maintenance_mode boolean not null default false,
    updated_at timestamptz not null default now(),
    updated_by_telegram_id bigint
);

insert into public.game_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.player_presence (
    telegram_user_id bigint primary key,
    nickname text not null default 'Майнер' check (char_length(nickname) between 1 and 64),
    last_seen_at timestamptz not null default now()
);

create index if not exists player_presence_last_seen_idx
    on public.player_presence (last_seen_at desc);

create table if not exists public.spartan_bots (
    id smallint primary key check (id between 1 and 300),
    name text not null unique check (char_length(name) between 1 and 64),
    balance_demo_srum numeric(18, 4) not null default 400 check (balance_demo_srum >= 0),
    last_lost_stage smallint check (last_lost_stage between 1 and 5),
    active boolean not null default true,
    matches_played integer not null default 0 check (matches_played >= 0),
    reserved_until timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

with bot_names as (
    select array[
        'Леонид','Ксеркс','Ахиллес','Гектор','Одиссей','Аякс','Патрокл','Диомед','Агамемнон','Менелай',
        'Нестор','Идоменей','Тевкр','Эант','Филоктет','Протесилай','Евриал','Сфенел','Полит','Антилох',
        'Фоант','Леит','Пенелей','Клоний','Аркесилай','Профоенор','Схедий','Элефенор','Евмен','Еврипил',
        'Калхант','Махаон','Подалирий','Неоптолем','Феникс','Автомедон','Алким','Бафикл','Еврибат','Стентор',
        'Талфибий','Евримедон','Антифат','Кикн','Гипполох','Акамант','Долон','Рес','Сарпедон','Главк'
    ]::text[] as names
)
insert into public.spartan_bots (id, name, balance_demo_srum)
select
    generated.id::smallint,
    case
        when generated.squad = 1 then bot_names.names[generated.name_index]
        else bot_names.names[generated.name_index] || '_' || generated.squad
    end,
    (400 + ((generated.id * 7919) % 2601))::numeric
from bot_names
cross join lateral (
    select
        series as id,
        (((series - 1) % 50) + 1)::integer as name_index,
        (((series - 1) / 50) + 1)::integer as squad
    from generate_series(1, 300) as g(series)
) as generated
on conflict (id) do nothing;

create table if not exists public.training_matches (
    id uuid primary key default extensions.gen_random_uuid(),
    player_telegram_id bigint not null,
    bot_id smallint not null references public.spartan_bots(id),
    stage smallint not null check (stage between 1 and 5),
    stake_demo_srum numeric(18, 4) not null check (stake_demo_srum between 0.01 and 5),
    planned_bot_result text not null check (planned_bot_result in ('win', 'lose')),
    actual_bot_result text check (actual_bot_result in ('win', 'lose')),
    status text not null default 'active' check (status in ('active', 'resolved', 'cancelled', 'expired')),
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '2 minutes'),
    resolved_at timestamptz
);

create unique index if not exists training_matches_one_active_per_player_idx
    on public.training_matches (player_telegram_id)
    where status = 'active';

create index if not exists training_matches_active_pool_idx
    on public.training_matches (status, expires_at);

create table if not exists public.admin_audit_log (
    id bigint generated always as identity primary key,
    telegram_admin_id bigint not null,
    action text not null check (char_length(action) between 1 and 100),
    old_value jsonb,
    new_value jsonb,
    created_at timestamptz not null default now()
);

alter table public.game_settings enable row level security;
alter table public.player_presence enable row level security;
alter table public.spartan_bots enable row level security;
alter table public.training_matches enable row level security;
alter table public.admin_audit_log enable row level security;

revoke all on table public.game_settings from anon, authenticated;
revoke all on table public.player_presence from anon, authenticated;
revoke all on table public.spartan_bots from anon, authenticated;
revoke all on table public.training_matches from anon, authenticated;
revoke all on table public.admin_audit_log from anon, authenticated;

grant all on table public.game_settings to service_role;
grant all on table public.player_presence to service_role;
grant all on table public.spartan_bots to service_role;
grant all on table public.training_matches to service_role;
grant all on table public.admin_audit_log to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.claim_training_spartan(
    p_player_telegram_id bigint,
    p_stage integer,
    p_stake_demo_srum numeric
)
returns table (
    match_id uuid,
    bot_id smallint,
    bot_name text,
    bot_speed_ms integer,
    bot_behavior text,
    real_players bigint,
    bots_in_pool bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    settings public.game_settings%rowtype;
    selected_bot public.spartan_bots%rowtype;
    real_count bigint;
    bot_count bigint;
    bot_slots bigint;
    behavior text;
    new_match_id uuid;
    speed_ms integer;
begin
    if p_player_telegram_id is null then
        raise exception 'player id is required';
    end if;
    if p_stage not between 1 and 5 then
        raise exception 'stage must be between 1 and 5';
    end if;
    if p_stake_demo_srum < 0.01 or p_stake_demo_srum > 5 then
        raise exception 'demo stake must be between 0.01 and 5';
    end if;

    select * into settings from public.game_settings where id = true;
    if settings.maintenance_mode then
        raise exception 'maintenance mode';
    end if;
    if not settings.bots_enabled then
        return;
    end if;

    update public.training_matches
       set status = 'expired'
     where status = 'active' and expires_at <= now();

    with cancelled as (
        update public.training_matches
           set status = 'cancelled', resolved_at = now()
         where player_telegram_id = p_player_telegram_id and status = 'active'
         returning bot_id
    )
    update public.spartan_bots
       set reserved_until = null, updated_at = now()
     where id in (select bot_id from cancelled);

    select count(*) into real_count
      from public.player_presence
     where last_seen_at > now() - interval '2 minutes';

    select count(*) into bot_count
      from public.training_matches
     where status = 'active' and expires_at > now();

    if settings.auto_fill_enabled then
        if real_count >= settings.activation_threshold then
            return;
        end if;
        bot_slots := greatest(0, settings.target_pool_size - real_count);
    else
        bot_slots := settings.target_pool_size;
    end if;

    if bot_count >= bot_slots then
        return;
    end if;

    select bot.* into selected_bot
      from public.spartan_bots as bot
     where bot.active
       and (bot.reserved_until is null or bot.reserved_until <= now())
     order by
       case
           when p_stage = 5 and bot.last_lost_stage = 4 then 0
           when p_stage = 5 then 1
           when p_stage < 5 and bot.last_lost_stage is null then 0
           when p_stage < 5 and bot.last_lost_stage = p_stage - 1 then 1
           else 2
       end,
       bot.matches_played,
       bot.id
     for update skip locked
     limit 1;

    if selected_bot.id is null then
        return;
    end if;

    behavior := case
        when p_stage = 5 then 'aggressive'
        when selected_bot.last_lost_stage is not null
             and selected_bot.last_lost_stage + 1 = p_stage then 'aggressive'
        else 'supportive'
    end;
    speed_ms := case
        when behavior = 'aggressive' then 500 + floor(random() * 200)::integer
        else 1200 + floor(random() * 300)::integer
    end;

    insert into public.training_matches (
        player_telegram_id, bot_id, stage, stake_demo_srum, planned_bot_result
    ) values (
        p_player_telegram_id,
        selected_bot.id,
        p_stage,
        p_stake_demo_srum,
        case when behavior = 'aggressive' then 'win' else 'lose' end
    )
    returning id into new_match_id;

    update public.spartan_bots
       set reserved_until = now() + interval '2 minutes', updated_at = now()
     where id = selected_bot.id;

    return query
    select new_match_id, selected_bot.id, selected_bot.name, speed_ms, behavior, real_count, bot_count + 1;
end;
$$;

create or replace function public.resolve_training_spartan(
    p_match_id uuid,
    p_player_telegram_id bigint,
    p_player_won boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    training_match public.training_matches%rowtype;
    penalty_rates numeric[] := array[0.10, 0.20, 0.40, 0.80, 1.00];
    reward_rates numeric[] := array[0.07, 0.14, 0.28, 0.56, 0.70];
    bot_won boolean;
begin
    select * into training_match
      from public.training_matches
     where id = p_match_id and player_telegram_id = p_player_telegram_id
     for update;

    if training_match.id is null then
        raise exception 'training match not found';
    end if;
    if training_match.status <> 'active' or training_match.expires_at <= now() then
        raise exception 'training match is not active';
    end if;

    bot_won := not p_player_won;

    update public.spartan_bots
       set last_lost_stage = case when bot_won then null else training_match.stage end,
           balance_demo_srum = greatest(
               0,
               balance_demo_srum + case
                   when bot_won then training_match.stake_demo_srum * reward_rates[(training_match.stage)::integer]
                   else -(training_match.stake_demo_srum * penalty_rates[(training_match.stage)::integer])
               end
           ),
           matches_played = matches_played + 1,
           reserved_until = null,
           updated_at = now()
     where id = training_match.bot_id;

    update public.training_matches
       set status = 'resolved',
           actual_bot_result = case when bot_won then 'win' else 'lose' end,
           resolved_at = now()
     where id = training_match.id;

    return jsonb_build_object(
        'match_id', training_match.id,
        'resolved', true,
        'training_only', true
    );
end;
$$;

create or replace function public.admin_update_game_settings(
    p_admin_telegram_id bigint,
    p_action text,
    p_bots_enabled boolean default null,
    p_auto_fill_enabled boolean default null,
    p_activation_threshold integer default null,
    p_target_pool_size integer default null,
    p_maintenance_mode boolean default null
)
returns public.game_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
    old_settings public.game_settings%rowtype;
    new_settings public.game_settings%rowtype;
begin
    if p_admin_telegram_id is null or p_admin_telegram_id <= 0 then
        raise exception 'admin id is required';
    end if;
    if p_action is null or char_length(p_action) not between 1 and 100 then
        raise exception 'valid action is required';
    end if;

    select * into old_settings from public.game_settings where id = true for update;

    update public.game_settings
       set bots_enabled = coalesce(p_bots_enabled, bots_enabled),
           auto_fill_enabled = coalesce(p_auto_fill_enabled, auto_fill_enabled),
           activation_threshold = coalesce(p_activation_threshold, activation_threshold),
           target_pool_size = coalesce(p_target_pool_size, target_pool_size),
           maintenance_mode = coalesce(p_maintenance_mode, maintenance_mode),
           updated_at = now(),
           updated_by_telegram_id = p_admin_telegram_id
     where id = true
     returning * into new_settings;

    if not new_settings.bots_enabled or new_settings.maintenance_mode then
        with cancelled as (
            update public.training_matches
               set status = 'cancelled', resolved_at = now()
             where status = 'active'
             returning bot_id
        )
        update public.spartan_bots
           set reserved_until = null, updated_at = now()
         where id in (select bot_id from cancelled);
    end if;

    insert into public.admin_audit_log (telegram_admin_id, action, old_value, new_value)
    values (p_admin_telegram_id, p_action, to_jsonb(old_settings), to_jsonb(new_settings));

    return new_settings;
end;
$$;

revoke all on function public.claim_training_spartan(bigint, integer, numeric) from public, anon, authenticated;
revoke all on function public.resolve_training_spartan(uuid, bigint, boolean) from public, anon, authenticated;
revoke all on function public.admin_update_game_settings(bigint, text, boolean, boolean, integer, integer, boolean) from public, anon, authenticated;
grant execute on function public.claim_training_spartan(bigint, integer, numeric) to service_role;
grant execute on function public.resolve_training_spartan(uuid, bigint, boolean) to service_role;
grant execute on function public.admin_update_game_settings(bigint, text, boolean, boolean, integer, integer, boolean) to service_role;

comment on table public.spartan_bots is
    '300 training-only bots. They must never substitute for undisclosed real-money opponents.';
comment on function public.claim_training_spartan(bigint, integer, numeric) is
    'Claims one of 300 training bots when server-controlled pool settings allow it.';
