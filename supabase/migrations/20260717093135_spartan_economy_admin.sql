-- Production model for the five-stage pools, the project treasury and 300 Spartans.
-- All mutable tables stay private. Only server-side Edge Functions may call the RPCs.

alter table public.game_settings
    add column if not exists spartan_mining_enabled boolean not null default true,
    add column if not exists max_spartans_per_pool integer not null default 300
        check (max_spartans_per_pool between 0 and 300),
    add column if not exists spartan_tick_seconds integer not null default 60
        check (spartan_tick_seconds between 15 and 3600);

alter table public.spartan_bots
    rename column balance_demo_srum to srum_balance;

alter table public.spartan_bots
    alter column srum_balance set default 30,
    add column if not exists srum_locked numeric(18, 4) not null default 0 check (srum_locked >= 0),
    add column if not exists rumir_balance numeric(20, 2) not null default 0 check (rumir_balance >= 0),
    add column if not exists energy smallint not null default 100 check (energy between 0 and 100),
    add column if not exists mining_power numeric(8, 3) not null default 1 check (mining_power > 0),
    add column if not exists state text not null default 'idle'
        check (state in ('idle', 'mining', 'queued', 'matched', 'cooldown', 'disabled')),
    add column if not exists strategy text not null default 'balanced'
        check (strategy in ('careful', 'balanced', 'aggressive')),
    add column if not exists wins integer not null default 0 check (wins >= 0),
    add column if not exists losses integer not null default 0 check (losses >= 0),
    add column if not exists last_action_at timestamptz not null default now(),
    add column if not exists next_action_at timestamptz not null default now();

-- The requested starting range is 30..300 SRUM. The limit applies to the initial
-- amount only; afterwards a Spartan can earn or lose SRUM like any other player.
update public.spartan_bots
set srum_balance = (30 + ((id::integer * 7919) % 271))::numeric,
    rumir_balance = ((id::integer * 3571) % 25001)::numeric,
    mining_power = (0.75 + ((id::integer * 37) % 151) / 100.0)::numeric,
    strategy = case id % 3 when 0 then 'careful' when 1 then 'balanced' else 'aggressive' end,
    state = case when active then 'idle' else 'disabled' end,
    energy = (55 + ((id::integer * 13) % 46))::smallint,
    last_action_at = now(),
    next_action_at = now() + make_interval(secs => (id::integer % 60));

create table if not exists public.project_treasury (
    id boolean primary key default true check (id),
    srum_balance numeric(20, 4) not null default 0 check (srum_balance >= 0),
    total_penalties numeric(20, 4) not null default 0 check (total_penalties >= 0),
    total_winner_payouts numeric(20, 4) not null default 0 check (total_winner_payouts >= 0),
    updated_at timestamptz not null default now()
);

insert into public.project_treasury (id) values (true)
on conflict (id) do nothing;

create table if not exists public.game_accounts (
    telegram_user_id bigint primary key,
    nickname text not null default 'Майнер' check (char_length(nickname) between 1 and 64),
    srum_available numeric(20, 4) not null default 0 check (srum_available >= 0),
    srum_locked numeric(20, 4) not null default 0 check (srum_locked >= 0),
    rumir_balance numeric(20, 2) not null default 0 check (rumir_balance >= 0),
    usdt_balance numeric(20, 4) not null default 0 check (usdt_balance >= 0),
    ton_balance numeric(20, 6) not null default 0 check (ton_balance >= 0),
    wins integer not null default 0 check (wins >= 0),
    losses integer not null default 0 check (losses >= 0),
    is_suspended boolean not null default false,
    suspension_reason text not null default '' check (char_length(suspension_reason) <= 300),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.game_pools (
    id uuid primary key default extensions.gen_random_uuid(),
    name text not null check (char_length(name) between 2 and 80),
    description text not null default '' check (char_length(description) <= 500),
    enabled boolean not null default true,
    bots_allowed boolean not null default true,
    base_usdt numeric(20, 4) not null default 0 check (base_usdt >= 0),
    base_ton numeric(20, 6) not null default 0 check (base_ton >= 0),
    payout_asset text not null default 'USDT' check (payout_asset in ('USDT', 'TON')),
    ton_per_srum numeric(20, 8) not null default 0.2 check (ton_per_srum > 0),
    entry_srum_min numeric(18, 4) not null default 0.01 check (entry_srum_min > 0),
    entry_srum_default numeric(18, 4) not null default 1 check (entry_srum_default > 0),
    entry_srum_max numeric(18, 4) not null default 300 check (entry_srum_max > 0),
    activation_threshold integer not null default 2 check (activation_threshold between 0 and 300),
    target_queue_size integer not null default 10 check (target_queue_size between 1 and 300),
    priority smallint not null default 100 check (priority between 1 and 1000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_telegram_id bigint,
    check (entry_srum_min <= entry_srum_default and entry_srum_default <= entry_srum_max)
);

insert into public.game_pools (
    name, description, base_usdt, payout_asset, entry_srum_min, entry_srum_default,
    entry_srum_max, activation_threshold, target_queue_size
)
select
    'Криптобеспредел',
    'Основной пятиэтапный пул. 70% штрафа получает победитель, 30% уходит в казну.',
    0, 'USDT', 0.01, 1, 300, 2, 10
where not exists (select 1 from public.game_pools);

create table if not exists public.game_tasks (
    id uuid primary key default extensions.gen_random_uuid(),
    title text not null check (char_length(title) between 2 and 100),
    description text not null default '' check (char_length(description) <= 1000),
    task_url text check (task_url is null or task_url ~ '^https://'),
    reward_currency text not null default 'RUMIR' check (reward_currency in ('RUMIR', 'SRUM')),
    reward_amount numeric(20, 4) not null check (reward_amount > 0),
    budget_total numeric(20, 4) not null check (budget_total >= reward_amount),
    completion_limit integer not null default 1 check (completion_limit between 1 and 1000000),
    completions integer not null default 0 check (completions >= 0),
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_telegram_id bigint
);

create table if not exists public.mining_sessions (
    id uuid primary key default extensions.gen_random_uuid(),
    pool_id uuid not null references public.game_pools(id),
    participant_kind text not null check (participant_kind in ('human', 'spartan')),
    player_telegram_id bigint references public.game_accounts(telegram_user_id),
    spartan_id smallint references public.spartan_bots(id),
    stake_initial_srum numeric(20, 4) not null check (stake_initial_srum > 0),
    stake_remaining_srum numeric(20, 4) not null check (stake_remaining_srum >= 0),
    stage smallint not null default 1 check (stage between 1 and 5),
    status text not null default 'queued'
        check (status in ('queued', 'matched', 'paused', 'ended', 'cancelled')),
    wins integer not null default 0 check (wins >= 0),
    losses integer not null default 0 check (losses >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (
        (participant_kind = 'human' and player_telegram_id is not null and spartan_id is null)
        or
        (participant_kind = 'spartan' and spartan_id is not null and player_telegram_id is null)
    )
);

create unique index if not exists mining_sessions_one_human_per_pool_idx
    on public.mining_sessions (player_telegram_id, pool_id)
    where participant_kind = 'human' and status in ('queued', 'matched', 'paused');

create unique index if not exists mining_sessions_one_spartan_idx
    on public.mining_sessions (spartan_id)
    where participant_kind = 'spartan' and status in ('queued', 'matched', 'paused');

create table if not exists public.pool_queue (
    id bigint generated always as identity primary key,
    pool_id uuid not null references public.game_pools(id),
    session_id uuid not null references public.mining_sessions(id),
    participant_kind text not null check (participant_kind in ('human', 'spartan')),
    stage smallint not null check (stage between 1 and 5),
    status text not null default 'waiting' check (status in ('waiting', 'matched', 'cancelled', 'expired')),
    joined_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '5 minutes')
);

create unique index if not exists pool_queue_one_waiting_session_idx
    on public.pool_queue (session_id) where status = 'waiting';
create index if not exists pool_queue_match_idx
    on public.pool_queue (pool_id, stage, participant_kind, joined_at)
    where status = 'waiting';

create table if not exists public.pool_matches (
    id uuid primary key default extensions.gen_random_uuid(),
    pool_id uuid not null references public.game_pools(id),
    first_session_id uuid not null references public.mining_sessions(id),
    second_session_id uuid not null references public.mining_sessions(id),
    stage smallint not null check (stage between 1 and 5),
    bot_speed_ms integer check (bot_speed_ms is null or bot_speed_ms between 350 and 3000),
    bot_score integer check (bot_score is null or bot_score between 0 and 100),
    status text not null default 'active' check (status in ('active', 'resolved', 'draw', 'cancelled', 'expired')),
    winner_session_id uuid references public.mining_sessions(id),
    loser_session_id uuid references public.mining_sessions(id),
    loser_penalty_srum numeric(20, 4),
    winner_payout_srum numeric(20, 4),
    treasury_srum numeric(20, 4),
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '3 minutes'),
    resolved_at timestamptz,
    check (first_session_id <> second_session_id)
);

create unique index if not exists pool_matches_active_first_idx
    on public.pool_matches (first_session_id) where status = 'active';
create unique index if not exists pool_matches_active_second_idx
    on public.pool_matches (second_session_id) where status = 'active';

create table if not exists public.match_score_submissions (
    match_id uuid not null references public.pool_matches(id) on delete cascade,
    session_id uuid not null references public.mining_sessions(id),
    score integer not null check (score between 0 and 60),
    submitted_at timestamptz not null default now(),
    primary key (match_id, session_id)
);

create table if not exists public.economy_ledger (
    id bigint generated always as identity primary key,
    match_id uuid references public.pool_matches(id),
    pool_id uuid references public.game_pools(id),
    entry_type text not null check (entry_type in ('penalty', 'winner_payout', 'treasury', 'stake_lock', 'stake_release')),
    participant_kind text check (participant_kind in ('human', 'spartan', 'treasury')),
    player_telegram_id bigint,
    spartan_id smallint,
    amount_srum numeric(20, 4) not null check (amount_srum >= 0),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.spartan_activity (
    id bigint generated always as identity primary key,
    spartan_id smallint not null references public.spartan_bots(id),
    action text not null check (action in ('mine_rumir', 'join_pool', 'leave_pool', 'match', 'cooldown', 'admin_change')),
    amount numeric(20, 4) not null default 0,
    pool_id uuid references public.game_pools(id),
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.spartan_bots
    add column if not exists current_pool_id uuid references public.game_pools(id);

create index if not exists spartan_bots_worker_idx
    on public.spartan_bots (active, next_action_at, state);
create index if not exists spartan_activity_recent_idx
    on public.spartan_activity (created_at desc);
create index if not exists economy_ledger_recent_idx
    on public.economy_ledger (created_at desc);

alter table public.project_treasury enable row level security;
alter table public.game_accounts enable row level security;
alter table public.game_pools enable row level security;
alter table public.game_tasks enable row level security;
alter table public.mining_sessions enable row level security;
alter table public.pool_queue enable row level security;
alter table public.pool_matches enable row level security;
alter table public.match_score_submissions enable row level security;
alter table public.economy_ledger enable row level security;
alter table public.spartan_activity enable row level security;

revoke all on table public.project_treasury from anon, authenticated;
revoke all on table public.game_accounts from anon, authenticated;
revoke all on table public.game_pools from anon, authenticated;
revoke all on table public.game_tasks from anon, authenticated;
revoke all on table public.mining_sessions from anon, authenticated;
revoke all on table public.pool_queue from anon, authenticated;
revoke all on table public.pool_matches from anon, authenticated;
revoke all on table public.match_score_submissions from anon, authenticated;
revoke all on table public.economy_ledger from anon, authenticated;
revoke all on table public.spartan_activity from anon, authenticated;

grant all on table public.project_treasury to service_role;
grant all on table public.game_accounts to service_role;
grant all on table public.game_pools to service_role;
grant all on table public.game_tasks to service_role;
grant all on table public.mining_sessions to service_role;
grant all on table public.pool_queue to service_role;
grant all on table public.pool_matches to service_role;
grant all on table public.match_score_submissions to service_role;
grant all on table public.economy_ledger to service_role;
grant all on table public.spartan_activity to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.admin_patch_game_settings(
    p_admin_telegram_id bigint,
    p_patch jsonb
)
returns jsonb
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
    if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
        raise exception 'patch must be an object';
    end if;

    select * into old_settings from public.game_settings where id = true for update;
    update public.game_settings
       set bots_enabled = case when p_patch ? 'bots_enabled' then (p_patch->>'bots_enabled')::boolean else bots_enabled end,
           auto_fill_enabled = case when p_patch ? 'auto_fill_enabled' then (p_patch->>'auto_fill_enabled')::boolean else auto_fill_enabled end,
           activation_threshold = case when p_patch ? 'activation_threshold' then (p_patch->>'activation_threshold')::integer else activation_threshold end,
           target_pool_size = case when p_patch ? 'target_pool_size' then (p_patch->>'target_pool_size')::integer else target_pool_size end,
           maintenance_mode = case when p_patch ? 'maintenance_mode' then (p_patch->>'maintenance_mode')::boolean else maintenance_mode end,
           spartan_mining_enabled = case when p_patch ? 'spartan_mining_enabled' then (p_patch->>'spartan_mining_enabled')::boolean else spartan_mining_enabled end,
           max_spartans_per_pool = case when p_patch ? 'max_spartans_per_pool' then (p_patch->>'max_spartans_per_pool')::integer else max_spartans_per_pool end,
           spartan_tick_seconds = case when p_patch ? 'spartan_tick_seconds' then (p_patch->>'spartan_tick_seconds')::integer else spartan_tick_seconds end,
           updated_at = now(),
           updated_by_telegram_id = p_admin_telegram_id
     where id = true
     returning * into new_settings;

    -- Telegram quick commands act as global defaults for every existing pool.
    if p_patch ? 'activation_threshold' then
        update public.game_pools
           set activation_threshold = greatest(0, least(300, (p_patch->>'activation_threshold')::integer)),
               updated_at = now(), updated_by_telegram_id = p_admin_telegram_id;
    end if;
    if p_patch ? 'target_pool_size' then
        update public.game_pools
           set target_queue_size = greatest(1, least(300, (p_patch->>'target_pool_size')::integer)),
               updated_at = now(), updated_by_telegram_id = p_admin_telegram_id;
    end if;

    insert into public.admin_audit_log (telegram_admin_id, action, old_value, new_value)
    values (p_admin_telegram_id, 'patch_game_settings', to_jsonb(old_settings), to_jsonb(new_settings));
    return to_jsonb(new_settings);
end;
$$;

create or replace function public.admin_save_pool(
    p_admin_telegram_id bigint,
    p_pool jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    pool_id uuid;
    old_pool jsonb;
    saved public.game_pools%rowtype;
begin
    if p_admin_telegram_id is null or p_admin_telegram_id <= 0 then raise exception 'admin id is required'; end if;
    if p_pool is null or jsonb_typeof(p_pool) <> 'object' then raise exception 'pool must be an object'; end if;
    pool_id := nullif(p_pool->>'id', '')::uuid;
    if pool_id is not null then
        select to_jsonb(pool) into old_pool from public.game_pools as pool where pool.id = pool_id for update;
    end if;

    if pool_id is null then
        insert into public.game_pools (
            name, description, enabled, bots_allowed, base_usdt, base_ton, payout_asset,
            ton_per_srum, entry_srum_min, entry_srum_default, entry_srum_max,
            activation_threshold, target_queue_size, priority, updated_by_telegram_id
        ) values (
            trim(p_pool->>'name'), coalesce(p_pool->>'description', ''), coalesce((p_pool->>'enabled')::boolean, true),
            coalesce((p_pool->>'bots_allowed')::boolean, true), coalesce((p_pool->>'base_usdt')::numeric, 0),
            coalesce((p_pool->>'base_ton')::numeric, 0), coalesce(p_pool->>'payout_asset', 'USDT'),
            coalesce((p_pool->>'ton_per_srum')::numeric, 0.2), coalesce((p_pool->>'entry_srum_min')::numeric, 0.01),
            coalesce((p_pool->>'entry_srum_default')::numeric, 1), coalesce((p_pool->>'entry_srum_max')::numeric, 300),
            coalesce((p_pool->>'activation_threshold')::integer, 2), coalesce((p_pool->>'target_queue_size')::integer, 10),
            coalesce((p_pool->>'priority')::smallint, 100), p_admin_telegram_id
        ) returning * into saved;
    else
        update public.game_pools
           set name = coalesce(nullif(trim(p_pool->>'name'), ''), name),
               description = case when p_pool ? 'description' then p_pool->>'description' else description end,
               enabled = case when p_pool ? 'enabled' then (p_pool->>'enabled')::boolean else enabled end,
               bots_allowed = case when p_pool ? 'bots_allowed' then (p_pool->>'bots_allowed')::boolean else bots_allowed end,
               base_usdt = case when p_pool ? 'base_usdt' then (p_pool->>'base_usdt')::numeric else base_usdt end,
               base_ton = case when p_pool ? 'base_ton' then (p_pool->>'base_ton')::numeric else base_ton end,
               payout_asset = case when p_pool ? 'payout_asset' then p_pool->>'payout_asset' else payout_asset end,
               ton_per_srum = case when p_pool ? 'ton_per_srum' then (p_pool->>'ton_per_srum')::numeric else ton_per_srum end,
               entry_srum_min = case when p_pool ? 'entry_srum_min' then (p_pool->>'entry_srum_min')::numeric else entry_srum_min end,
               entry_srum_default = case when p_pool ? 'entry_srum_default' then (p_pool->>'entry_srum_default')::numeric else entry_srum_default end,
               entry_srum_max = case when p_pool ? 'entry_srum_max' then (p_pool->>'entry_srum_max')::numeric else entry_srum_max end,
               activation_threshold = case when p_pool ? 'activation_threshold' then (p_pool->>'activation_threshold')::integer else activation_threshold end,
               target_queue_size = case when p_pool ? 'target_queue_size' then (p_pool->>'target_queue_size')::integer else target_queue_size end,
               priority = case when p_pool ? 'priority' then (p_pool->>'priority')::smallint else priority end,
               updated_at = now(), updated_by_telegram_id = p_admin_telegram_id
         where id = pool_id returning * into saved;
        if saved.id is null then raise exception 'pool not found'; end if;
    end if;

    insert into public.admin_audit_log (telegram_admin_id, action, old_value, new_value)
    values (p_admin_telegram_id, 'save_pool', old_pool, to_jsonb(saved));
    return to_jsonb(saved);
end;
$$;

create or replace function public.admin_save_task(
    p_admin_telegram_id bigint,
    p_task jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    task_id uuid;
    old_task jsonb;
    saved public.game_tasks%rowtype;
begin
    if p_admin_telegram_id is null or p_admin_telegram_id <= 0 then raise exception 'admin id is required'; end if;
    if p_task is null or jsonb_typeof(p_task) <> 'object' then raise exception 'task must be an object'; end if;
    task_id := nullif(p_task->>'id', '')::uuid;
    if task_id is not null then
        select to_jsonb(task) into old_task from public.game_tasks as task where task.id = task_id for update;
    end if;

    if task_id is null then
        insert into public.game_tasks (
            title, description, task_url, reward_currency, reward_amount,
            budget_total, completion_limit, enabled, updated_by_telegram_id
        ) values (
            trim(p_task->>'title'), coalesce(p_task->>'description', ''), nullif(trim(p_task->>'task_url'), ''),
            coalesce(p_task->>'reward_currency', 'RUMIR'), (p_task->>'reward_amount')::numeric,
            (p_task->>'budget_total')::numeric, coalesce((p_task->>'completion_limit')::integer, 1),
            coalesce((p_task->>'enabled')::boolean, true), p_admin_telegram_id
        ) returning * into saved;
    else
        update public.game_tasks
           set title = coalesce(nullif(trim(p_task->>'title'), ''), title),
               description = case when p_task ? 'description' then p_task->>'description' else description end,
               task_url = case when p_task ? 'task_url' then nullif(trim(p_task->>'task_url'), '') else task_url end,
               reward_currency = case when p_task ? 'reward_currency' then p_task->>'reward_currency' else reward_currency end,
               reward_amount = case when p_task ? 'reward_amount' then (p_task->>'reward_amount')::numeric else reward_amount end,
               budget_total = case when p_task ? 'budget_total' then (p_task->>'budget_total')::numeric else budget_total end,
               completion_limit = case when p_task ? 'completion_limit' then (p_task->>'completion_limit')::integer else completion_limit end,
               enabled = case when p_task ? 'enabled' then (p_task->>'enabled')::boolean else enabled end,
               updated_at = now(), updated_by_telegram_id = p_admin_telegram_id
         where id = task_id returning * into saved;
        if saved.id is null then raise exception 'task not found'; end if;
    end if;

    insert into public.admin_audit_log (telegram_admin_id, action, old_value, new_value)
    values (p_admin_telegram_id, 'save_task', old_task, to_jsonb(saved));
    return to_jsonb(saved);
end;
$$;

create or replace function public.admin_update_spartan(
    p_admin_telegram_id bigint,
    p_spartan_id integer,
    p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    old_bot public.spartan_bots%rowtype;
    new_bot public.spartan_bots%rowtype;
    released_amount numeric := 0;
begin
    if p_admin_telegram_id is null or p_admin_telegram_id <= 0 then raise exception 'admin id is required'; end if;
    if p_spartan_id not between 1 and 300 then raise exception 'spartan id must be 1..300'; end if;
    select * into old_bot from public.spartan_bots where id = p_spartan_id for update;
    if old_bot.id is null then raise exception 'spartan not found'; end if;
    update public.spartan_bots
       set active = case when p_patch ? 'active' then (p_patch->>'active')::boolean else active end,
           strategy = case when p_patch ? 'strategy' then p_patch->>'strategy' else strategy end,
           mining_power = case when p_patch ? 'mining_power' then (p_patch->>'mining_power')::numeric else mining_power end,
           state = case
               when p_patch ? 'active' and not (p_patch->>'active')::boolean then 'disabled'
               when p_patch ? 'active' and (p_patch->>'active')::boolean and state = 'disabled' then 'idle'
               else state
           end,
           updated_at = now()
     where id = p_spartan_id returning * into new_bot;
    insert into public.admin_audit_log (telegram_admin_id, action, old_value, new_value)
    values (p_admin_telegram_id, 'update_spartan', to_jsonb(old_bot), to_jsonb(new_bot));
    insert into public.spartan_activity (spartan_id, action, details)
    values (p_spartan_id, 'admin_change', jsonb_build_object('admin_id', p_admin_telegram_id, 'patch', p_patch));

    if not new_bot.active then
        update public.pool_queue as queue set status = 'cancelled'
         where queue.status = 'waiting' and exists (
             select 1 from public.mining_sessions as session
              where session.id = queue.session_id and session.spartan_id = p_spartan_id
         );
        select coalesce(sum(stake_remaining_srum), 0) into released_amount
          from public.mining_sessions
         where spartan_id = p_spartan_id and status in ('queued', 'paused');
        update public.mining_sessions set status = 'ended', updated_at = now()
         where spartan_id = p_spartan_id and status in ('queued', 'paused');
        update public.spartan_bots
           set srum_balance = srum_balance + released_amount,
               srum_locked = greatest(0, srum_locked - released_amount),
               current_pool_id = null, updated_at = now()
         where id = p_spartan_id returning * into new_bot;
    end if;
    return to_jsonb(new_bot);
end;
$$;

create or replace function public.admin_update_player_status(
    p_admin_telegram_id bigint,
    p_player_telegram_id bigint,
    p_suspended boolean,
    p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    old_account public.game_accounts%rowtype;
    new_account public.game_accounts%rowtype;
begin
    if p_admin_telegram_id is null or p_admin_telegram_id <= 0 then raise exception 'admin id is required'; end if;
    if p_player_telegram_id is null or p_player_telegram_id <= 0 then raise exception 'player id is required'; end if;
    select * into old_account from public.game_accounts where telegram_user_id = p_player_telegram_id for update;
    if old_account.telegram_user_id is null then raise exception 'player not found'; end if;
    update public.game_accounts
       set is_suspended = p_suspended,
           suspension_reason = case when p_suspended then left(coalesce(p_reason, ''), 300) else '' end,
           updated_at = now()
     where telegram_user_id = p_player_telegram_id returning * into new_account;
    insert into public.admin_audit_log (telegram_admin_id, action, old_value, new_value)
    values (p_admin_telegram_id, 'update_player_status', to_jsonb(old_account), to_jsonb(new_account));
    return to_jsonb(new_account);
end;
$$;

create or replace function public.run_spartan_tick()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    settings public.game_settings%rowtype;
    pool_row public.game_pools%rowtype;
    selected_bot public.spartan_bots%rowtype;
    real_in_pool integer;
    bots_in_pool integer;
    bots_needed integer;
    created_count integer := 0;
    mined_count integer := 0;
    queue_index integer;
    new_session_id uuid;
    mined_amount numeric;
begin
    if not pg_try_advisory_xact_lock(426672731) then
        return jsonb_build_object('status', 'busy');
    end if;
    select * into settings from public.game_settings where id = true for update;

    update public.pool_queue set status = 'expired'
     where status = 'waiting' and expires_at <= now();
    update public.mining_sessions as session
       set status = 'paused', updated_at = now()
     where session.participant_kind = 'human' and session.status = 'queued'
       and not exists (
           select 1 from public.pool_queue as queue
            where queue.session_id = session.id and queue.status = 'waiting'
       );
    with released as (
        update public.mining_sessions as session
           set status = 'ended', updated_at = now()
         where session.participant_kind = 'spartan' and session.status = 'queued'
           and not exists (
               select 1 from public.pool_queue as queue
                where queue.session_id = session.id and queue.status = 'waiting'
           )
         returning session.spartan_id, session.stake_remaining_srum
    ), totals as (
        select spartan_id, sum(stake_remaining_srum) as amount from released group by spartan_id
    )
    update public.spartan_bots as bot
       set srum_balance = bot.srum_balance + totals.amount,
           srum_locked = greatest(0, bot.srum_locked - totals.amount),
           state = 'idle', current_pool_id = null, updated_at = now()
      from totals where bot.id = totals.spartan_id;

    if settings.bots_enabled and settings.spartan_mining_enabled and not settings.maintenance_mode then
        for selected_bot in
            select * from public.spartan_bots
             where active and state in ('idle', 'mining', 'cooldown') and next_action_at <= now()
             order by next_action_at, id
             for update skip locked
        loop
            mined_amount := round((selected_bot.mining_power * greatest(selected_bot.energy, 1) / 20.0)::numeric, 2);
            update public.spartan_bots
               set rumir_balance = rumir_balance + mined_amount,
                   energy = greatest(0, energy - 5),
                   state = case when energy > 10 then 'mining' else 'cooldown' end,
                   last_action_at = now(),
                   next_action_at = now() + make_interval(secs => settings.spartan_tick_seconds + (id % 30)),
                   updated_at = now()
             where id = selected_bot.id;
            insert into public.spartan_activity (spartan_id, action, amount, details)
            values (selected_bot.id, 'mine_rumir', mined_amount, jsonb_build_object('energy_before', selected_bot.energy));
            mined_count := mined_count + 1;
        end loop;
    else
        update public.spartan_bots
           set state = case when active then 'idle' else 'disabled' end,
               energy = least(100, energy + 5), updated_at = now()
         where state in ('mining', 'cooldown');
    end if;

    if not settings.bots_enabled or settings.maintenance_mode then
        update public.pool_queue as queue set status = 'cancelled'
         where queue.status = 'waiting' and queue.participant_kind = 'spartan';
        with released as (
            update public.mining_sessions as session
               set status = 'ended', updated_at = now()
             where session.participant_kind = 'spartan' and session.status = 'queued'
             returning session.spartan_id, session.stake_remaining_srum
        ), totals as (
            select spartan_id, sum(stake_remaining_srum) as amount from released group by spartan_id
        )
        update public.spartan_bots as bot
           set srum_balance = bot.srum_balance + totals.amount,
               srum_locked = greatest(0, bot.srum_locked - totals.amount),
               state = case when bot.active then 'idle' else 'disabled' end,
               current_pool_id = null, updated_at = now()
          from totals where bot.id = totals.spartan_id;
        return jsonb_build_object('status', 'ok', 'mined', mined_count, 'queued', 0, 'bots_enabled', false);
    end if;

    insert into public.pool_queue (pool_id, session_id, participant_kind, stage)
    select session.pool_id, session.id, 'spartan', session.stage
      from public.mining_sessions as session
      join public.spartan_bots as bot on bot.id = session.spartan_id and bot.active
      join public.game_pools as pool on pool.id = session.pool_id and pool.enabled and pool.bots_allowed
     where session.participant_kind = 'spartan' and session.status = 'paused'
       and session.stake_remaining_srum > 0
       and not exists (
           select 1 from public.pool_queue as queue
            where queue.session_id = session.id and queue.status = 'waiting'
       )
    on conflict do nothing;
    update public.mining_sessions as session
       set status = 'queued', updated_at = now()
     where session.participant_kind = 'spartan' and session.status = 'paused'
       and exists (
           select 1 from public.pool_queue as queue
            where queue.session_id = session.id and queue.status = 'waiting'
       );
    update public.spartan_bots as bot
       set state = 'queued', current_pool_id = session.pool_id, updated_at = now()
      from public.mining_sessions as session
     where session.spartan_id = bot.id and session.status = 'queued';

    for pool_row in
        select * from public.game_pools where enabled and bots_allowed order by priority, created_at
    loop
        select count(*)::integer into real_in_pool
          from public.mining_sessions
         where pool_id = pool_row.id and participant_kind = 'human'
           and status in ('queued', 'matched');
        select count(*)::integer into bots_in_pool
          from public.mining_sessions
         where pool_id = pool_row.id and participant_kind = 'spartan'
           and status in ('queued', 'matched');

        if settings.auto_fill_enabled and real_in_pool >= pool_row.activation_threshold then
            bots_needed := 0;
        else
            bots_needed := greatest(0, least(
                settings.max_spartans_per_pool - bots_in_pool,
                pool_row.target_queue_size - real_in_pool - bots_in_pool
            ));
        end if;

        for queue_index in 1..bots_needed loop
            select * into selected_bot
              from public.spartan_bots as bot
             where bot.active
               and bot.state in ('idle', 'mining', 'cooldown')
               and bot.srum_balance >= pool_row.entry_srum_default
               and not exists (
                   select 1 from public.mining_sessions as session
                    where session.spartan_id = bot.id
                      and session.status in ('queued', 'matched', 'paused')
               )
             order by case bot.strategy when 'aggressive' then 0 when 'balanced' then 1 else 2 end,
                      bot.matches_played, bot.id
             for update skip locked
             limit 1;
            exit when selected_bot.id is null;

            update public.spartan_bots
               set srum_balance = srum_balance - pool_row.entry_srum_default,
                   srum_locked = srum_locked + pool_row.entry_srum_default,
                   state = 'queued', current_pool_id = pool_row.id,
                   last_action_at = now(), updated_at = now()
             where id = selected_bot.id;
            insert into public.mining_sessions (
                pool_id, participant_kind, spartan_id, stake_initial_srum,
                stake_remaining_srum, stage, status
            ) values (
                pool_row.id, 'spartan', selected_bot.id, pool_row.entry_srum_default,
                pool_row.entry_srum_default, 1, 'queued'
            ) returning id into new_session_id;
            insert into public.pool_queue (pool_id, session_id, participant_kind, stage)
            values (pool_row.id, new_session_id, 'spartan', 1);
            insert into public.spartan_activity (spartan_id, action, amount, pool_id)
            values (selected_bot.id, 'join_pool', pool_row.entry_srum_default, pool_row.id);
            created_count := created_count + 1;
            selected_bot.id := null;
        end loop;
    end loop;

    return jsonb_build_object('status', 'ok', 'mined', mined_count, 'queued', created_count, 'bots_enabled', true);
end;
$$;

create or replace function public.get_game_pools()
returns table (
    id uuid, name text, description text, payout_asset text,
    display_usdt numeric, display_ton numeric,
    entry_srum_min numeric, entry_srum_default numeric, entry_srum_max numeric,
    players bigint, spartans bigint
)
language sql
security definer
set search_path = ''
stable
as $$
    select pool.id, pool.name, pool.description, pool.payout_asset,
           pool.base_usdt + coalesce(sum(session.stake_remaining_srum), 0) as display_usdt,
           pool.base_ton + coalesce(sum(session.stake_remaining_srum), 0) * pool.ton_per_srum as display_ton,
           pool.entry_srum_min, pool.entry_srum_default, pool.entry_srum_max,
           count(session.id) filter (where session.participant_kind = 'human') as players,
           count(session.id) filter (where session.participant_kind = 'spartan') as spartans
      from public.game_pools as pool
      left join public.mining_sessions as session
        on session.pool_id = pool.id and session.status in ('queued', 'matched', 'paused')
     where pool.enabled
     group by pool.id
     order by pool.priority, pool.created_at;
$$;

create or replace function public.join_game_pool(
    p_player_telegram_id bigint,
    p_nickname text,
    p_pool_id uuid,
    p_stake_srum numeric,
    p_session_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    settings public.game_settings%rowtype;
    pool_row public.game_pools%rowtype;
    account public.game_accounts%rowtype;
    own_session public.mining_sessions%rowtype;
    opponent_session public.mining_sessions%rowtype;
    opponent_queue_id bigint;
    own_queue_id bigint;
    match_id uuid;
    speed_ms integer;
    calculated_bot_score integer;
    bot_must_win boolean := false;
begin
    if p_player_telegram_id is null or p_player_telegram_id <= 0 then raise exception 'player id is required'; end if;
    select * into settings from public.game_settings where id = true;
    if settings.maintenance_mode then raise exception 'maintenance mode'; end if;
    select * into pool_row from public.game_pools where id = p_pool_id and enabled for update;
    if pool_row.id is null then raise exception 'pool is unavailable'; end if;

    insert into public.player_presence (telegram_user_id, nickname, last_seen_at)
    values (p_player_telegram_id, left(coalesce(nullif(trim(p_nickname), ''), 'Майнер'), 64), now())
    on conflict (telegram_user_id) do update
        set nickname = excluded.nickname, last_seen_at = excluded.last_seen_at;
    insert into public.game_accounts (telegram_user_id, nickname)
    values (p_player_telegram_id, left(coalesce(nullif(trim(p_nickname), ''), 'Майнер'), 64))
    on conflict (telegram_user_id) do update set nickname = excluded.nickname, updated_at = now();

    if p_session_id is null then
        if p_stake_srum < pool_row.entry_srum_min or p_stake_srum > pool_row.entry_srum_max then
            raise exception 'stake is outside pool limits';
        end if;
        select * into account from public.game_accounts where telegram_user_id = p_player_telegram_id for update;
        if account.is_suspended then raise exception 'player is suspended'; end if;
        if account.srum_available < p_stake_srum then raise exception 'insufficient SRUM'; end if;
        update public.game_accounts
           set srum_available = srum_available - p_stake_srum,
               srum_locked = srum_locked + p_stake_srum, updated_at = now()
         where telegram_user_id = p_player_telegram_id;
        insert into public.mining_sessions (
            pool_id, participant_kind, player_telegram_id, stake_initial_srum,
            stake_remaining_srum, stage, status
        ) values (p_pool_id, 'human', p_player_telegram_id, p_stake_srum, p_stake_srum, 1, 'queued')
        returning * into own_session;
        insert into public.economy_ledger (
            pool_id, entry_type, participant_kind, player_telegram_id, amount_srum
        ) values (p_pool_id, 'stake_lock', 'human', p_player_telegram_id, p_stake_srum);
    else
        select * into own_session from public.mining_sessions
         where id = p_session_id and player_telegram_id = p_player_telegram_id
           and pool_id = p_pool_id and status = 'paused' for update;
        if own_session.id is null then raise exception 'paused session not found'; end if;
        update public.mining_sessions set status = 'queued', updated_at = now() where id = own_session.id;
    end if;

    insert into public.pool_queue (pool_id, session_id, participant_kind, stage)
    values (p_pool_id, own_session.id, 'human', own_session.stage)
    returning id into own_queue_id;

    select queue.id, session into opponent_queue_id, opponent_session
      from public.pool_queue as queue
      join public.mining_sessions as session on session.id = queue.session_id
     where queue.pool_id = p_pool_id and queue.status = 'waiting'
       and queue.session_id <> own_session.id and queue.stage = own_session.stage
     order by case when session.participant_kind = 'human' then 0 else 1 end, queue.joined_at
     for update of queue skip locked
     limit 1;

    if opponent_session.id is null then
        return jsonb_build_object('status', 'waiting', 'session_id', own_session.id, 'stage', own_session.stage);
    end if;

    if opponent_session.participant_kind = 'spartan' then
        select case strategy when 'aggressive' then 650 when 'balanced' then 900 else 1200 end,
               own_session.stage = 5 or last_lost_stage = own_session.stage - 1
          into speed_ms, bot_must_win
          from public.spartan_bots where id = opponent_session.spartan_id;
        speed_ms := speed_ms + floor(random() * 180)::integer;
        calculated_bot_score := case
            when coalesce(bot_must_win, false) then 61
            else least(60, greatest(1, floor(20000.0 / speed_ms)::integer + floor(random() * 7)::integer))
        end;
    end if;

    update public.pool_queue set status = 'matched' where id in (own_queue_id, opponent_queue_id);
    update public.mining_sessions set status = 'matched', updated_at = now()
     where id in (own_session.id, opponent_session.id);
    if opponent_session.participant_kind = 'spartan' then
        update public.spartan_bots set state = 'matched', updated_at = now()
         where id = opponent_session.spartan_id;
    end if;
    insert into public.pool_matches (
        pool_id, first_session_id, second_session_id, stage, bot_speed_ms, bot_score
    ) values (
        p_pool_id, own_session.id, opponent_session.id, own_session.stage, speed_ms, calculated_bot_score
    ) returning id into match_id;

    return jsonb_build_object(
        'status', 'matched', 'match_id', match_id, 'session_id', own_session.id, 'pool_id', p_pool_id,
        'stage', own_session.stage, 'stake_remaining_srum', own_session.stake_remaining_srum,
        'opponent', jsonb_build_object(
            'kind', opponent_session.participant_kind,
            'spartan_id', opponent_session.spartan_id,
            'label', case when opponent_session.participant_kind = 'spartan' then 'Спартанец' else 'Игрок' end,
            'name', case
                when opponent_session.participant_kind = 'spartan' then (select name from public.spartan_bots where id = opponent_session.spartan_id)
                else (select nickname from public.game_accounts where telegram_user_id = opponent_session.player_telegram_id)
            end,
            'speed_ms', speed_ms
        )
    );
end;
$$;

create or replace function public.resolve_game_pool_match(
    p_match_id uuid,
    p_player_telegram_id bigint,
    p_player_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    game_match public.pool_matches%rowtype;
    pool_row public.game_pools%rowtype;
    own_session public.mining_sessions%rowtype;
    other_session public.mining_sessions%rowtype;
    first_score integer;
    second_score integer;
    winner public.mining_sessions%rowtype;
    loser public.mining_sessions%rowtype;
    penalty_rates numeric[] := array[0.10, 0.20, 0.40, 0.80, 1.00];
    penalty numeric(20,4);
    winner_share numeric(20,4);
    treasury_share numeric(20,4);
    remaining numeric(20,4);
begin
    if p_player_score not between 0 and 60 then raise exception 'score must be 0..60'; end if;
    select * into game_match from public.pool_matches where id = p_match_id for update;
    if game_match.id is null or game_match.status <> 'active' or game_match.expires_at <= now() then
        raise exception 'match is not active';
    end if;
    select * into own_session from public.mining_sessions
     where id in (game_match.first_session_id, game_match.second_session_id)
       and player_telegram_id = p_player_telegram_id for update;
    if own_session.id is null then raise exception 'player is not in this match'; end if;
    select * into other_session from public.mining_sessions
     where id = case when own_session.id = game_match.first_session_id then game_match.second_session_id else game_match.first_session_id end
     for update;
    select * into pool_row from public.game_pools where id = game_match.pool_id;

    insert into public.match_score_submissions (match_id, session_id, score)
    values (game_match.id, own_session.id, p_player_score)
    on conflict (match_id, session_id) do update set score = excluded.score, submitted_at = now();

    if own_session.id = game_match.first_session_id then first_score := p_player_score; else second_score := p_player_score; end if;
    if other_session.participant_kind = 'spartan' then
        if other_session.id = game_match.first_session_id then first_score := game_match.bot_score; else second_score := game_match.bot_score; end if;
    else
        select score into first_score from public.match_score_submissions
         where match_id = game_match.id and session_id = game_match.first_session_id;
        select score into second_score from public.match_score_submissions
         where match_id = game_match.id and session_id = game_match.second_session_id;
        if first_score is null or second_score is null then
            return jsonb_build_object('status', 'waiting_for_opponent');
        end if;
    end if;

    if first_score = second_score then
        update public.pool_matches set status = 'draw', resolved_at = now() where id = game_match.id;
        update public.mining_sessions set status = 'paused', updated_at = now()
         where id in (game_match.first_session_id, game_match.second_session_id);
        return jsonb_build_object('status', 'draw', 'stage', game_match.stage);
    elsif first_score > second_score then
        select * into winner from public.mining_sessions where id = game_match.first_session_id;
        select * into loser from public.mining_sessions where id = game_match.second_session_id;
    else
        select * into winner from public.mining_sessions where id = game_match.second_session_id;
        select * into loser from public.mining_sessions where id = game_match.first_session_id;
    end if;

    penalty := round((loser.stake_remaining_srum * penalty_rates[game_match.stage::integer])::numeric, 4);
    winner_share := round((penalty * 0.70)::numeric, 4);
    treasury_share := penalty - winner_share;
    remaining := greatest(0, loser.stake_remaining_srum - penalty);

    update public.mining_sessions
       set stage = case when participant_kind = 'human' then least(5, stage + 1) else 1 end,
           status = case when participant_kind = 'human' then 'paused' else 'ended' end,
           wins = wins + 1, updated_at = now()
     where id = winner.id;
    update public.mining_sessions
       set stage = case when participant_kind = 'human' then 1 else least(5, game_match.stage + 1) end,
           stake_remaining_srum = remaining,
           status = case when remaining > 0 then 'paused' else 'ended' end,
           losses = losses + 1, updated_at = now()
     where id = loser.id;

    if loser.participant_kind = 'human' then
        update public.game_accounts
           set srum_locked = greatest(0, srum_locked - penalty), losses = losses + 1, updated_at = now()
         where telegram_user_id = loser.player_telegram_id;
    else
        update public.spartan_bots
           set srum_locked = greatest(0, srum_locked - penalty), losses = losses + 1,
               last_lost_stage = game_match.stage,
               state = case when not active then 'disabled' when remaining > 0 then 'idle' else 'cooldown' end,
               current_pool_id = null, matches_played = matches_played + 1, updated_at = now()
         where id = loser.spartan_id;
    end if;

    if winner.participant_kind = 'human' then
        update public.game_accounts
           set usdt_balance = usdt_balance + case when pool_row.payout_asset = 'USDT' then winner_share else 0 end,
               ton_balance = ton_balance + case when pool_row.payout_asset = 'TON' then winner_share * pool_row.ton_per_srum else 0 end,
               wins = wins + 1, updated_at = now()
         where telegram_user_id = winner.player_telegram_id;
    else
        update public.spartan_bots
           set srum_balance = srum_balance + winner_share + winner.stake_remaining_srum,
               srum_locked = greatest(0, srum_locked - winner.stake_remaining_srum),
               wins = wins + 1,
               last_lost_stage = null, state = case when active then 'idle' else 'disabled' end, current_pool_id = null,
               matches_played = matches_played + 1, updated_at = now()
         where id = winner.spartan_id;
    end if;

    update public.project_treasury
       set srum_balance = srum_balance + treasury_share,
           total_penalties = total_penalties + penalty,
           total_winner_payouts = total_winner_payouts + winner_share,
           updated_at = now()
     where id = true;
    update public.pool_matches
       set status = 'resolved', winner_session_id = winner.id, loser_session_id = loser.id,
           loser_penalty_srum = penalty, winner_payout_srum = winner_share,
           treasury_srum = treasury_share, resolved_at = now()
     where id = game_match.id;

    insert into public.economy_ledger (match_id, pool_id, entry_type, participant_kind, player_telegram_id, spartan_id, amount_srum, metadata)
    values
        (game_match.id, game_match.pool_id, 'penalty', loser.participant_kind, loser.player_telegram_id, loser.spartan_id, penalty, jsonb_build_object('stage', game_match.stage)),
        (game_match.id, game_match.pool_id, 'winner_payout', winner.participant_kind, winner.player_telegram_id, winner.spartan_id, winner_share, jsonb_build_object('asset', pool_row.payout_asset)),
        (game_match.id, game_match.pool_id, 'treasury', 'treasury', null, null, treasury_share, jsonb_build_object('share', 0.30));
    insert into public.economy_ledger (
        match_id, pool_id, entry_type, participant_kind, spartan_id, amount_srum, metadata
    )
    select game_match.id, game_match.pool_id, 'stake_release', 'spartan', winner.spartan_id,
           winner.stake_remaining_srum, jsonb_build_object('reason', 'bot_cycle_reset_after_win')
     where winner.participant_kind = 'spartan';

    return jsonb_build_object(
        'status', 'resolved', 'player_won', winner.player_telegram_id = p_player_telegram_id,
        'stage_before', game_match.stage,
        'next_stage', case when winner.player_telegram_id = p_player_telegram_id then least(5, game_match.stage + 1) else 1 end,
        'penalty_srum', penalty, 'winner_payout_srum', winner_share,
        'treasury_srum', treasury_share,
        'remaining_stake_srum', case when loser.player_telegram_id = p_player_telegram_id then remaining else own_session.stake_remaining_srum end,
        'payout_asset', pool_row.payout_asset,
        'player_payout_amount', case
            when winner.player_telegram_id <> p_player_telegram_id then 0
            when pool_row.payout_asset = 'TON' then winner_share * pool_row.ton_per_srum
            else winner_share
        end,
        'player_balances', (
            select jsonb_build_object(
                'srum_available', account.srum_available,
                'srum_locked', account.srum_locked,
                'rumir', account.rumir_balance,
                'usdt', account.usdt_balance,
                'ton', account.ton_balance
            ) from public.game_accounts as account
             where account.telegram_user_id = p_player_telegram_id
        )
    );
end;
$$;

create or replace function public.get_game_pool_match_result(
    p_match_id uuid,
    p_player_telegram_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
    game_match public.pool_matches%rowtype;
    own_session public.mining_sessions%rowtype;
    pool_row public.game_pools%rowtype;
begin
    select * into game_match from public.pool_matches where id = p_match_id;
    if game_match.id is null then raise exception 'match not found'; end if;
    select * into own_session from public.mining_sessions
     where id in (game_match.first_session_id, game_match.second_session_id)
       and player_telegram_id = p_player_telegram_id;
    if own_session.id is null then raise exception 'player is not in this match'; end if;
    select * into pool_row from public.game_pools where id = game_match.pool_id;

    if game_match.status = 'active' then
        return jsonb_build_object('status', 'active');
    end if;
    if game_match.status = 'draw' then
        return jsonb_build_object(
            'status', 'draw', 'stage', own_session.stage,
            'remaining_stake_srum', own_session.stake_remaining_srum,
            'player_balances', (
                select jsonb_build_object(
                    'srum_available', account.srum_available, 'srum_locked', account.srum_locked,
                    'rumir', account.rumir_balance, 'usdt', account.usdt_balance, 'ton', account.ton_balance
                ) from public.game_accounts as account where account.telegram_user_id = p_player_telegram_id
            )
        );
    end if;
    if game_match.status <> 'resolved' then
        return jsonb_build_object('status', game_match.status);
    end if;

    return jsonb_build_object(
        'status', 'resolved',
        'player_won', game_match.winner_session_id = own_session.id,
        'stage_before', game_match.stage,
        'next_stage', own_session.stage,
        'penalty_srum', game_match.loser_penalty_srum,
        'winner_payout_srum', game_match.winner_payout_srum,
        'treasury_srum', game_match.treasury_srum,
        'remaining_stake_srum', own_session.stake_remaining_srum,
        'payout_asset', pool_row.payout_asset,
        'player_payout_amount', case
            when game_match.winner_session_id <> own_session.id then 0
            when pool_row.payout_asset = 'TON' then game_match.winner_payout_srum * pool_row.ton_per_srum
            else game_match.winner_payout_srum
        end,
        'player_balances', (
            select jsonb_build_object(
                'srum_available', account.srum_available, 'srum_locked', account.srum_locked,
                'rumir', account.rumir_balance, 'usdt', account.usdt_balance, 'ton', account.ton_balance
            ) from public.game_accounts as account where account.telegram_user_id = p_player_telegram_id
        )
    );
end;
$$;

create or replace function public.cancel_game_pool_match(
    p_match_id uuid,
    p_player_telegram_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    game_match public.pool_matches%rowtype;
    own_session public.mining_sessions%rowtype;
    other_session public.mining_sessions%rowtype;
begin
    select * into game_match from public.pool_matches where id = p_match_id for update;
    if game_match.id is null or game_match.status <> 'active' then
        raise exception 'active match not found';
    end if;
    select * into own_session from public.mining_sessions
     where id in (game_match.first_session_id, game_match.second_session_id)
       and player_telegram_id = p_player_telegram_id for update;
    if own_session.id is null then raise exception 'player is not in this match'; end if;
    select * into other_session from public.mining_sessions
     where id = case when own_session.id = game_match.first_session_id then game_match.second_session_id else game_match.first_session_id end
     for update;

    update public.pool_matches set status = 'cancelled', resolved_at = now() where id = game_match.id;
    update public.mining_sessions set status = 'paused', updated_at = now()
     where id in (own_session.id, other_session.id);
    if other_session.participant_kind = 'spartan' then
        update public.spartan_bots set state = 'idle', current_pool_id = null, updated_at = now()
         where id = other_session.spartan_id;
    end if;
    return jsonb_build_object('status', 'cancelled', 'session_id', own_session.id);
end;
$$;

create or replace function public.close_game_pool_session(
    p_player_telegram_id bigint,
    p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    session_row public.mining_sessions%rowtype;
begin
    select * into session_row from public.mining_sessions
     where id = p_session_id and player_telegram_id = p_player_telegram_id
       and status in ('paused', 'queued') for update;
    if session_row.id is null then raise exception 'releasable session not found'; end if;
    update public.pool_queue set status = 'cancelled'
     where session_id = session_row.id and status = 'waiting';
    update public.game_accounts
       set srum_locked = greatest(0, srum_locked - session_row.stake_remaining_srum),
           srum_available = srum_available + session_row.stake_remaining_srum,
           updated_at = now()
     where telegram_user_id = p_player_telegram_id;
    update public.mining_sessions set status = 'ended', updated_at = now() where id = session_row.id;
    insert into public.economy_ledger (pool_id, entry_type, participant_kind, player_telegram_id, amount_srum)
    values (session_row.pool_id, 'stake_release', 'human', p_player_telegram_id, session_row.stake_remaining_srum);
    return jsonb_build_object('status', 'ended', 'released_srum', session_row.stake_remaining_srum);
end;
$$;

revoke all on function public.admin_patch_game_settings(bigint, jsonb) from public, anon, authenticated;
revoke all on function public.admin_save_pool(bigint, jsonb) from public, anon, authenticated;
revoke all on function public.admin_save_task(bigint, jsonb) from public, anon, authenticated;
revoke all on function public.admin_update_spartan(bigint, integer, jsonb) from public, anon, authenticated;
revoke all on function public.admin_update_player_status(bigint, bigint, boolean, text) from public, anon, authenticated;
revoke all on function public.run_spartan_tick() from public, anon, authenticated;
revoke all on function public.get_game_pools() from public, anon, authenticated;
revoke all on function public.join_game_pool(bigint, text, uuid, numeric, uuid) from public, anon, authenticated;
revoke all on function public.resolve_game_pool_match(uuid, bigint, integer) from public, anon, authenticated;
revoke all on function public.get_game_pool_match_result(uuid, bigint) from public, anon, authenticated;
revoke all on function public.cancel_game_pool_match(uuid, bigint) from public, anon, authenticated;
revoke all on function public.close_game_pool_session(bigint, uuid) from public, anon, authenticated;

grant execute on function public.admin_patch_game_settings(bigint, jsonb) to service_role;
grant execute on function public.admin_save_pool(bigint, jsonb) to service_role;
grant execute on function public.admin_save_task(bigint, jsonb) to service_role;
grant execute on function public.admin_update_spartan(bigint, integer, jsonb) to service_role;
grant execute on function public.admin_update_player_status(bigint, bigint, boolean, text) to service_role;
grant execute on function public.run_spartan_tick() to service_role;
grant execute on function public.get_game_pools() to service_role;
grant execute on function public.join_game_pool(bigint, text, uuid, numeric, uuid) to service_role;
grant execute on function public.resolve_game_pool_match(uuid, bigint, integer) to service_role;
grant execute on function public.get_game_pool_match_result(uuid, bigint) to service_role;
grant execute on function public.cancel_game_pool_match(uuid, bigint) to service_role;
grant execute on function public.close_game_pool_session(bigint, uuid) to service_role;

-- Superseded demo RPCs reference the pre-production Spartan balance column.
-- Removing them prevents any accidental use alongside the real pool economy.
drop function if exists public.claim_training_spartan(bigint, integer, numeric);
drop function if exists public.resolve_training_spartan(uuid, bigint, boolean);

comment on table public.project_treasury is
    'Receives exactly 30% of every loser penalty. The winner receives the other 70%.';
comment on table public.mining_sessions is
    'A five-stage session. After a loss the remaining stake stays locked and the stage returns to 1.';
comment on table public.spartan_bots is
    'Exactly 300 disclosed NPC participants with their own SRUM, locked stake, RUMIR and activity state.';

-- Supabase Cron keeps the army active without an open administrator screen.
create extension if not exists pg_cron with schema pg_catalog;
do $$
declare
    existing_job record;
begin
    for existing_job in select jobid from cron.job where jobname = 'crypto-borsch-spartan-tick'
    loop
        perform cron.unschedule(existing_job.jobid);
    end loop;
    perform cron.schedule(
        'crypto-borsch-spartan-tick',
        '* * * * *',
        'select public.run_spartan_tick()'
    );
end;
$$;
