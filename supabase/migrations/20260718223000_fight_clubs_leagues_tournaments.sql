-- Fight Club Network: реальные заведения, территориальные лиги и турниры.
-- Все записи доступны только серверным Edge Functions. Публичный клиент не пишет
-- в таблицы напрямую и не может самостоятельно подтверждать призы или результаты.

-- Вся игровая экономика рассчитывается в SILARUM. TON и USDT являются только
-- целевыми активами отдельной заявки на обмен после комиссии и сетевого газа.
alter table public.game_pools drop constraint if exists game_pools_payout_asset_check;
update public.game_pools set payout_asset = 'SILARUM' where payout_asset <> 'SILARUM';
alter table public.game_pools alter column payout_asset set default 'SILARUM';
alter table public.game_pools add constraint game_pools_payout_asset_check check (payout_asset = 'SILARUM');

create or replace function public.force_game_pool_silarum()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.payout_asset := 'SILARUM';
    return new;
end;
$$;

drop trigger if exists game_pools_force_silarum on public.game_pools;
create trigger game_pools_force_silarum
before insert or update of payout_asset on public.game_pools
for each row execute function public.force_game_pool_silarum();

create table if not exists public.fight_clubs (
    id uuid primary key default extensions.gen_random_uuid(),
    owner_telegram_user_id bigint not null,
    owner_nickname text not null check (char_length(owner_nickname) between 1 and 64),
    name text not null check (char_length(name) between 2 and 80),
    venue_name text not null check (char_length(venue_name) between 2 and 120),
    venue_type text not null default 'fast_food'
        check (venue_type in ('fast_food', 'cafe', 'restaurant', 'food_court', 'other')),
    country_code text not null check (country_code ~ '^[A-Z]{2}$'),
    region text not null default '' check (char_length(region) <= 100),
    city text not null check (char_length(city) between 1 and 100),
    district text not null default '' check (char_length(district) <= 100),
    address text not null default '' check (char_length(address) <= 240),
    description text not null default '' check (char_length(description) <= 1000),
    logo_url text check (logo_url is null or (logo_url ~ '^https://' and char_length(logo_url) <= 500)),
    status text not null default 'pending'
        check (status in ('pending', 'verified', 'suspended', 'rejected', 'closed')),
    verification_note text not null default '' check (char_length(verification_note) <= 500),
    rating integer not null default 1200 check (rating between 0 and 1000000),
    member_count integer not null default 1 check (member_count between 0 and 1000000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    verified_at timestamptz,
    verified_by_telegram_id bigint
);

create unique index if not exists fight_clubs_one_active_owner_idx
    on public.fight_clubs (owner_telegram_user_id)
    where status in ('pending', 'verified', 'suspended');
create index if not exists fight_clubs_location_rating_idx
    on public.fight_clubs (country_code, city, district, rating desc)
    where status = 'verified';

create table if not exists public.fight_club_members (
    club_id uuid not null references public.fight_clubs(id) on delete cascade,
    telegram_user_id bigint not null,
    nickname text not null check (char_length(nickname) between 1 and 64),
    role text not null default 'fighter'
        check (role in ('owner', 'manager', 'section_manager', 'referee', 'fighter')),
    permissions jsonb not null default '{}'::jsonb check (jsonb_typeof(permissions) = 'object'),
    fighter_key text not null default 'alpha' check (char_length(fighter_key) between 1 and 50),
    rating integer not null default 1200 check (rating between 0 and 1000000),
    wins integer not null default 0 check (wins >= 0),
    losses integer not null default 0 check (losses >= 0),
    status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'left')),
    joined_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (club_id, telegram_user_id)
);

create unique index if not exists fight_club_members_one_active_club_idx
    on public.fight_club_members (telegram_user_id)
    where status in ('invited', 'active');
create index if not exists fight_club_members_rating_idx
    on public.fight_club_members (club_id, rating desc)
    where status = 'active';

create table if not exists public.fight_leagues (
    id uuid primary key default extensions.gen_random_uuid(),
    name text not null check (char_length(name) between 2 and 120),
    tier text not null check (tier in ('district', 'city', 'world')),
    country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
    region text not null default '' check (char_length(region) <= 100),
    city text not null default '' check (char_length(city) <= 100),
    district text not null default '' check (char_length(district) <= 100),
    season text not null default '2026' check (char_length(season) between 1 and 30),
    status text not null default 'active' check (status in ('draft', 'active', 'finished', 'archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists fight_leagues_scope_idx
    on public.fight_leagues (tier, country_code, city, district, season, status);

insert into public.fight_leagues (name, tier, season, status)
select 'World Wolf League', 'world', '2026', 'active'
where not exists (
    select 1 from public.fight_leagues where tier = 'world' and season = '2026'
);

create table if not exists public.fight_tournaments (
    id uuid primary key default extensions.gen_random_uuid(),
    organizer_type text not null default 'club' check (organizer_type in ('club', 'platform')),
    organizer_club_id uuid references public.fight_clubs(id) on delete set null,
    created_by_telegram_id bigint not null,
    league_id uuid references public.fight_leagues(id) on delete set null,
    league_tier text not null check (league_tier in ('district', 'city', 'world')),
    country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
    city text not null default '' check (char_length(city) <= 100),
    district text not null default '' check (char_length(district) <= 100),
    title text not null check (char_length(title) between 3 and 120),
    description text not null default '' check (char_length(description) <= 2000),
    discipline text not null default 'fight' check (discipline in ('fight', 'borsch', 'mixed')),
    format text not null default 'knockout' check (format in ('knockout', 'round_robin', 'groups_knockout')),
    status text not null default 'draft'
        check (status in ('draft', 'pending_review', 'registration', 'live', 'finished', 'cancelled', 'rejected')),
    approval_status text not null default 'not_required'
        check (approval_status in ('not_required', 'pending', 'approved', 'rejected')),
    max_participants integer not null default 16 check (max_participants between 2 and 100000),
    min_rating integer not null default 0 check (min_rating between 0 and 1000000),
    entry_silarum numeric(18,4) not null default 0 check (entry_silarum >= 0),
    rules_text text not null default '' check (char_length(rules_text) <= 5000),
    eligibility jsonb not null default '{}'::jsonb check (jsonb_typeof(eligibility) = 'object'),
    prize_type text not null default 'food'
        check (prize_type in ('food', 'silarum', 'physical', 'digital', 'mixed')),
    prize_title text not null default '' check (char_length(prize_title) <= 200),
    prize_fund_amount numeric(20,4) not null default 0 check (prize_fund_amount >= 0),
    prize_currency text not null default 'SILARUM' check (prize_currency = 'SILARUM'),
    prize_fulfillment text not null default 'venue'
        check (prize_fulfillment in ('venue', 'voucher', 'manual_review')),
    financial_payout_enabled boolean not null default false,
    registration_ends_at timestamptz not null,
    starts_at timestamptz not null,
    ends_at timestamptz,
    terms_url text check (terms_url is null or (terms_url ~ '^https://' and char_length(terms_url) <= 500)),
    poster_url text check (poster_url is null or (poster_url ~ '^https://' and char_length(poster_url) <= 500)),
    min_age smallint not null default 13 check (min_age between 0 and 99),
    is_test_mode boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by_telegram_id bigint,
    check (registration_ends_at <= starts_at),
    check (ends_at is null or ends_at >= starts_at),
    check (organizer_type = 'platform' or organizer_club_id is not null),
    check (financial_payout_enabled = false or (approval_status = 'approved' and is_test_mode = false))
);

create index if not exists fight_tournaments_discovery_idx
    on public.fight_tournaments (status, league_tier, starts_at);
create index if not exists fight_tournaments_club_idx
    on public.fight_tournaments (organizer_club_id, created_at desc);
create index if not exists fight_tournaments_review_idx
    on public.fight_tournaments (approval_status, created_at)
    where approval_status = 'pending';

create table if not exists public.fight_tournament_prizes (
    id uuid primary key default extensions.gen_random_uuid(),
    tournament_id uuid not null references public.fight_tournaments(id) on delete cascade,
    place_from integer not null check (place_from >= 1),
    place_to integer not null check (place_to >= place_from),
    prize_type text not null check (prize_type in ('food', 'silarum', 'physical', 'digital')),
    title text not null check (char_length(title) between 1 and 200),
    description text not null default '' check (char_length(description) <= 1000),
    amount numeric(20,4) not null default 0 check (amount >= 0),
    currency text not null default 'SILARUM' check (currency = 'SILARUM'),
    quantity integer not null default 1 check (quantity >= 1),
    created_at timestamptz not null default now(),
    unique (tournament_id, place_from, place_to, title)
);

create table if not exists public.fight_tournament_registrations (
    tournament_id uuid not null references public.fight_tournaments(id) on delete cascade,
    telegram_user_id bigint not null,
    club_id uuid references public.fight_clubs(id) on delete set null,
    nickname text not null check (char_length(nickname) between 1 and 64),
    fighter_key text not null check (char_length(fighter_key) between 1 and 50),
    rating_at_entry integer not null default 1200 check (rating_at_entry >= 0),
    status text not null default 'registered'
        check (status in ('waitlist', 'registered', 'checked_in', 'eliminated', 'winner', 'withdrawn', 'disqualified')),
    eligibility_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(eligibility_snapshot) = 'object'),
    consented_at timestamptz not null default now(),
    registered_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (tournament_id, telegram_user_id)
);

create index if not exists fight_tournament_registrations_club_idx
    on public.fight_tournament_registrations (club_id, tournament_id, status);

create table if not exists public.fight_tournament_matches (
    id uuid primary key default extensions.gen_random_uuid(),
    tournament_id uuid not null references public.fight_tournaments(id) on delete cascade,
    round_number integer not null check (round_number >= 1),
    match_number integer not null check (match_number >= 1),
    player_one_telegram_id bigint,
    player_two_telegram_id bigint,
    winner_telegram_id bigint,
    status text not null default 'scheduled'
        check (status in ('scheduled', 'ready', 'live', 'submitted', 'verified', 'void')),
    score jsonb not null default '{}'::jsonb check (jsonb_typeof(score) = 'object'),
    starts_at timestamptz,
    verified_by_telegram_id bigint,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tournament_id, round_number, match_number),
    check (player_one_telegram_id is null or player_one_telegram_id <> player_two_telegram_id)
);

create index if not exists fight_tournament_matches_status_idx
    on public.fight_tournament_matches (tournament_id, status, round_number, match_number);

create table if not exists public.club_reward_vouchers (
    id uuid primary key default extensions.gen_random_uuid(),
    tournament_id uuid not null references public.fight_tournaments(id) on delete restrict,
    club_id uuid references public.fight_clubs(id) on delete set null,
    winner_telegram_user_id bigint not null,
    prize_id uuid references public.fight_tournament_prizes(id) on delete set null,
    public_code text not null unique check (public_code ~ '^[A-Z0-9-]{8,40}$'),
    title text not null check (char_length(title) between 1 and 200),
    amount_silarum numeric(20,4) not null default 0 check (amount_silarum >= 0),
    status text not null default 'issued' check (status in ('issued', 'redeemed', 'expired', 'cancelled')),
    expires_at timestamptz,
    redeemed_at timestamptz,
    redeemed_by_telegram_id bigint,
    created_at timestamptz not null default now()
);

create index if not exists club_reward_vouchers_winner_idx
    on public.club_reward_vouchers (winner_telegram_user_id, status, created_at desc);

create table if not exists public.fight_club_treasuries (
    club_id uuid primary key references public.fight_clubs(id) on delete cascade,
    silarum_available numeric(20,4) not null default 0 check (silarum_available >= 0),
    silarum_locked numeric(20,4) not null default 0 check (silarum_locked >= 0),
    version bigint not null default 0 check (version >= 0),
    exchange_enabled boolean not null default false,
    updated_at timestamptz not null default now()
);

create table if not exists public.fight_club_treasury_ledger (
    id uuid primary key default extensions.gen_random_uuid(),
    club_id uuid not null references public.fight_clubs(id) on delete restrict,
    actor_telegram_user_id bigint,
    operation text not null check (operation in (
        'deposit', 'tournament_lock', 'tournament_release', 'prize_debit', 'mining_entry',
        'mining_reward', 'mining_return', 'exchange_lock', 'exchange_release', 'exchange_debit', 'admin_adjustment'
    )),
    amount_silarum numeric(20,4) not null check (amount_silarum <> 0),
    balance_after_silarum numeric(20,4) not null check (balance_after_silarum >= 0),
    reference_type text not null default '' check (char_length(reference_type) <= 40),
    reference_id uuid,
    metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
    created_at timestamptz not null default now()
);

create index if not exists fight_club_treasury_ledger_club_idx
    on public.fight_club_treasury_ledger (club_id, created_at desc);

create table if not exists public.fight_club_prize_catalog (
    id uuid primary key default extensions.gen_random_uuid(),
    club_id uuid not null references public.fight_clubs(id) on delete cascade,
    title text not null check (char_length(title) between 2 and 200),
    description text not null default '' check (char_length(description) <= 1000),
    prize_type text not null check (prize_type in ('food', 'coupon', 'physical', 'digital', 'silarum')),
    price_silarum numeric(20,4) not null check (price_silarum > 0),
    stock integer not null default 0 check (stock >= 0),
    poster_url text check (poster_url is null or (poster_url ~ '^https://' and char_length(poster_url) <= 500)),
    status text not null default 'active' check (status in ('draft', 'active', 'paused', 'archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.fight_tournaments
    add column if not exists prize_catalog_item_id uuid references public.fight_club_prize_catalog(id) on delete set null;

create table if not exists public.fight_club_news_posts (
    id uuid primary key default extensions.gen_random_uuid(),
    club_id uuid not null references public.fight_clubs(id) on delete cascade,
    author_telegram_user_id bigint not null,
    post_type text not null default 'news' check (post_type in ('news', 'tournament', 'challenge', 'result', 'contribution')),
    title text not null check (char_length(title) between 2 and 160),
    body text not null default '' check (char_length(body) <= 5000),
    poster_url text check (poster_url is null or (poster_url ~ '^https://' and char_length(poster_url) <= 500)),
    related_tournament_id uuid references public.fight_tournaments(id) on delete set null,
    status text not null default 'published' check (status in ('draft', 'published', 'archived')),
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists fight_club_news_wall_idx
    on public.fight_club_news_posts (club_id, status, published_at desc, created_at desc);

create table if not exists public.fight_club_contribution_campaigns (
    id uuid primary key default extensions.gen_random_uuid(),
    club_id uuid not null references public.fight_clubs(id) on delete cascade,
    month_start date not null,
    suggested_silarum numeric(20,4) not null default 1 check (suggested_silarum > 0),
    message text not null default '' check (char_length(message) <= 500),
    enabled boolean not null default true,
    total_silarum numeric(20,4) not null default 0 check (total_silarum >= 0),
    contributor_count integer not null default 0 check (contributor_count >= 0),
    created_by_telegram_user_id bigint not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (club_id, month_start)
);

create index if not exists fight_club_contribution_campaigns_active_idx
    on public.fight_club_contribution_campaigns (club_id, month_start desc, enabled);

create table if not exists public.fight_club_contributions (
    id uuid primary key default extensions.gen_random_uuid(),
    campaign_id uuid not null references public.fight_club_contribution_campaigns(id) on delete restrict,
    club_id uuid not null references public.fight_clubs(id) on delete restrict,
    telegram_user_id bigint not null,
    nickname text not null check (char_length(nickname) between 1 and 64),
    amount_silarum numeric(20,4) not null check (amount_silarum > 0),
    publish_on_wall boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists fight_club_contributions_club_idx
    on public.fight_club_contributions (club_id, created_at desc);
create index if not exists fight_club_contributions_member_idx
    on public.fight_club_contributions (telegram_user_id, campaign_id, created_at desc);

create table if not exists public.fight_club_challenges (
    id uuid primary key default extensions.gen_random_uuid(),
    challenger_club_id uuid not null references public.fight_clubs(id) on delete cascade,
    defender_club_id uuid not null references public.fight_clubs(id) on delete cascade,
    created_by_telegram_user_id bigint not null,
    title text not null check (char_length(title) between 3 and 160),
    message text not null default '' check (char_length(message) <= 2000),
    proposed_starts_at timestamptz not null,
    format text not null default 'best_of_3' check (format in ('single', 'best_of_3', 'team_5x5')),
    rating_points integer not null default 25 check (rating_points between 0 and 1000),
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'live', 'finished', 'cancelled')),
    accepted_by_telegram_user_id bigint,
    winner_club_id uuid references public.fight_clubs(id) on delete set null,
    tournament_id uuid references public.fight_tournaments(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (challenger_club_id <> defender_club_id),
    check (winner_club_id is null or winner_club_id in (challenger_club_id, defender_club_id))
);

create index if not exists fight_club_challenges_status_idx
    on public.fight_club_challenges (status, proposed_starts_at, challenger_club_id, defender_club_id);

create table if not exists public.fight_club_mining_orders (
    id uuid primary key default extensions.gen_random_uuid(),
    club_id uuid not null references public.fight_clubs(id) on delete cascade,
    created_by_telegram_user_id bigint not null,
    fighter_telegram_user_id bigint not null,
    pool_id uuid references public.game_pools(id) on delete set null,
    entry_silarum numeric(18,4) not null check (entry_silarum > 0),
    reward_to_club_percent numeric(5,2) not null default 100 check (reward_to_club_percent between 0 and 100),
    fighter_consent_status text not null default 'pending' check (fighter_consent_status in ('pending', 'accepted', 'declined', 'revoked')),
    status text not null default 'pending_consent' check (status in ('draft', 'pending_consent', 'queued', 'active', 'completed', 'cancelled', 'failed')),
    server_session_id uuid,
    created_at timestamptz not null default now(),
    consented_at timestamptz,
    updated_at timestamptz not null default now()
);

create index if not exists fight_club_mining_orders_queue_idx
    on public.fight_club_mining_orders (club_id, status, created_at desc);
create index if not exists fight_club_mining_orders_fighter_idx
    on public.fight_club_mining_orders (fighter_telegram_user_id, fighter_consent_status, created_at desc);

create table if not exists public.silarum_exchange_requests (
    id uuid primary key default extensions.gen_random_uuid(),
    requester_telegram_user_id bigint not null,
    source_type text not null check (source_type in ('player', 'club')),
    source_club_id uuid references public.fight_clubs(id) on delete set null,
    amount_silarum numeric(20,4) not null check (amount_silarum > 0),
    target_asset text not null check (target_asset in ('TON', 'USDT')),
    quote_rate numeric(30,12) not null check (quote_rate > 0),
    service_commission_silarum numeric(20,4) not null default 0 check (service_commission_silarum >= 0),
    estimated_gas_target numeric(30,12) not null default 0 check (estimated_gas_target >= 0),
    net_target_amount numeric(30,12) not null check (net_target_amount >= 0),
    destination_address text not null check (char_length(destination_address) between 20 and 200),
    status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'processing', 'sent', 'rejected', 'cancelled', 'expired')),
    quote_expires_at timestamptz not null,
    tx_hash text check (tx_hash is null or char_length(tx_hash) <= 200),
    reviewed_by_telegram_id bigint,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check ((source_type = 'club' and source_club_id is not null) or source_type = 'player')
);

create index if not exists silarum_exchange_requests_review_idx
    on public.silarum_exchange_requests (status, created_at);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-posters', 'club-posters', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.server_join_fight_club(
    p_club_id uuid,
    p_telegram_user_id bigint,
    p_nickname text,
    p_fighter_key text default 'alpha'
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    target_club public.fight_clubs%rowtype;
    active_memberships integer;
begin
    select * into target_club from public.fight_clubs where id = p_club_id for update;
    if not found or target_club.status <> 'verified' then
        raise exception 'club_not_available';
    end if;
    select count(*) into active_memberships
    from public.fight_club_members
    where telegram_user_id = p_telegram_user_id and status in ('invited', 'active');
    if active_memberships > 0 then
        raise exception 'active_club_already_exists';
    end if;
    insert into public.fight_club_members (club_id, telegram_user_id, nickname, role, fighter_key, status)
    values (p_club_id, p_telegram_user_id, left(p_nickname, 64), 'fighter', left(p_fighter_key, 50), 'active');
    update public.fight_clubs
    set member_count = (
        select count(*) from public.fight_club_members where club_id = p_club_id and status = 'active'
    ), updated_at = now()
    where id = p_club_id;
    return jsonb_build_object('club_id', p_club_id, 'joined', true);
end;
$$;

create or replace function public.server_leave_fight_club(
    p_club_id uuid,
    p_telegram_user_id bigint
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    member_role text;
begin
    select role into member_role
    from public.fight_club_members
    where club_id = p_club_id and telegram_user_id = p_telegram_user_id and status = 'active'
    for update;
    if not found then raise exception 'active_membership_not_found'; end if;
    if member_role = 'owner' then raise exception 'owner_cannot_leave_club'; end if;
    update public.fight_club_members set status = 'left', updated_at = now()
    where club_id = p_club_id and telegram_user_id = p_telegram_user_id;
    update public.fight_clubs
    set member_count = (
        select count(*) from public.fight_club_members where club_id = p_club_id and status = 'active'
    ), updated_at = now()
    where id = p_club_id;
    return jsonb_build_object('club_id', p_club_id, 'left', true);
end;
$$;

create or replace function public.resolve_game_pool_match_silarum(
    p_match_id uuid,
    p_player_telegram_id bigint,
    p_player_score integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    result jsonb;
    resolved_match public.pool_matches%rowtype;
    winner_session public.mining_sessions%rowtype;
    mining_order public.fight_club_mining_orders%rowtype;
    club_reward_share numeric(20,4);
begin
    result := public.resolve_game_pool_match(p_match_id, p_player_telegram_id, p_player_score);
    if result->>'status' <> 'resolved' then return result; end if;
    select * into resolved_match from public.pool_matches where id = p_match_id;
    select * into winner_session from public.mining_sessions where id = resolved_match.winner_session_id;
    if winner_session.participant_kind = 'human' then
        update public.game_accounts
        set srum_available = srum_available + resolved_match.winner_payout_srum,
            wins = wins,
            updated_at = now()
        where telegram_user_id = winner_session.player_telegram_id;
        select * into mining_order
        from public.fight_club_mining_orders
        where server_session_id = winner_session.id and status in ('queued', 'active')
        order by created_at desc limit 1 for update;
        if found and mining_order.reward_to_club_percent > 0 then
            club_reward_share := round((resolved_match.winner_payout_srum * mining_order.reward_to_club_percent / 100)::numeric, 4);
            update public.game_accounts
            set srum_available = greatest(0, srum_available - club_reward_share), updated_at = now()
            where telegram_user_id = winner_session.player_telegram_id;
            update public.fight_club_treasuries
            set silarum_available = silarum_available + club_reward_share,
                version = version + 1, updated_at = now()
            where club_id = mining_order.club_id;
            insert into public.fight_club_treasury_ledger (
                club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum,
                reference_type, reference_id, metadata
            ) select mining_order.club_id, winner_session.player_telegram_id, 'mining_reward', club_reward_share,
                     treasury.silarum_available, 'club_mining_order', mining_order.id,
                     jsonb_build_object('match_id', p_match_id, 'club_percent', mining_order.reward_to_club_percent)
              from public.fight_club_treasuries as treasury where treasury.club_id = mining_order.club_id;
        end if;
    end if;
    update public.fight_club_mining_orders as mining
    set status = 'completed', updated_at = now()
    where mining.server_session_id in (resolved_match.first_session_id, resolved_match.second_session_id)
      and mining.status in ('queued', 'active')
      and exists (
          select 1 from public.mining_sessions as session
          where session.id = mining.server_session_id and session.status = 'ended'
      );
    update public.economy_ledger
    set metadata = jsonb_set(metadata, '{asset}', '"SILARUM"'::jsonb, true)
    where match_id = p_match_id and entry_type = 'winner_payout';
    result := jsonb_set(result, '{payout_asset}', '"SILARUM"'::jsonb, true);
    result := jsonb_set(result, '{player_balances}', coalesce((
        select jsonb_build_object(
            'srum_available', account.srum_available,
            'srum_locked', account.srum_locked,
            'rumir', account.rumir_balance,
            'usdt', account.usdt_balance,
            'ton', account.ton_balance
        ) from public.game_accounts as account where account.telegram_user_id = p_player_telegram_id
    ), '{}'::jsonb), true);
    return result;
end;
$$;

create or replace function public.server_fund_club_treasury(
    p_club_id uuid,
    p_actor_telegram_user_id bigint,
    p_amount_silarum numeric
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    account_row public.game_accounts%rowtype;
    treasury_row public.fight_club_treasuries%rowtype;
begin
    if p_amount_silarum <= 0 then raise exception 'invalid_amount'; end if;
    select * into account_row from public.game_accounts where telegram_user_id = p_actor_telegram_user_id for update;
    if not found or account_row.srum_available < p_amount_silarum then raise exception 'insufficient_silarum'; end if;
    insert into public.fight_club_treasuries (club_id) values (p_club_id) on conflict (club_id) do nothing;
    select * into treasury_row from public.fight_club_treasuries where club_id = p_club_id for update;
    update public.game_accounts
    set srum_available = srum_available - p_amount_silarum, updated_at = now()
    where telegram_user_id = p_actor_telegram_user_id;
    update public.fight_club_treasuries
    set silarum_available = silarum_available + p_amount_silarum, version = version + 1, updated_at = now()
    where club_id = p_club_id returning * into treasury_row;
    insert into public.fight_club_treasury_ledger (
        club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum, reference_type
    ) values (p_club_id, p_actor_telegram_user_id, 'deposit', p_amount_silarum, treasury_row.silarum_available, 'player_deposit');
    return jsonb_build_object('available', treasury_row.silarum_available, 'locked', treasury_row.silarum_locked);
end;
$$;

create or replace function public.server_lock_club_budget(
    p_club_id uuid,
    p_actor_telegram_user_id bigint,
    p_amount_silarum numeric,
    p_operation text,
    p_reference_type text,
    p_reference_id uuid
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    treasury_row public.fight_club_treasuries%rowtype;
begin
    if p_amount_silarum <= 0 or p_operation not in ('tournament_lock', 'mining_entry', 'exchange_lock') then
        raise exception 'invalid_budget_lock';
    end if;
    select * into treasury_row from public.fight_club_treasuries where club_id = p_club_id for update;
    if not found or treasury_row.silarum_available < p_amount_silarum then raise exception 'insufficient_club_silarum'; end if;
    update public.fight_club_treasuries
    set silarum_available = silarum_available - p_amount_silarum,
        silarum_locked = silarum_locked + p_amount_silarum,
        version = version + 1,
        updated_at = now()
    where club_id = p_club_id returning * into treasury_row;
    insert into public.fight_club_treasury_ledger (
        club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum,
        reference_type, reference_id
    ) values (
        p_club_id, p_actor_telegram_user_id, p_operation, -p_amount_silarum,
        treasury_row.silarum_available, left(p_reference_type, 40), p_reference_id
    );
    return jsonb_build_object('available', treasury_row.silarum_available, 'locked', treasury_row.silarum_locked);
end;
$$;

create or replace function public.server_release_club_budget(
    p_club_id uuid,
    p_actor_telegram_user_id bigint,
    p_amount_silarum numeric,
    p_operation text,
    p_reference_type text,
    p_reference_id uuid
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    treasury_row public.fight_club_treasuries%rowtype;
begin
    if p_amount_silarum <= 0 or p_operation not in ('tournament_release', 'exchange_release') then
        raise exception 'invalid_budget_release';
    end if;
    select * into treasury_row from public.fight_club_treasuries where club_id = p_club_id for update;
    if not found or treasury_row.silarum_locked < p_amount_silarum then raise exception 'insufficient_locked_silarum'; end if;
    update public.fight_club_treasuries
    set silarum_available = silarum_available + p_amount_silarum,
        silarum_locked = silarum_locked - p_amount_silarum,
        version = version + 1,
        updated_at = now()
    where club_id = p_club_id returning * into treasury_row;
    insert into public.fight_club_treasury_ledger (
        club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum,
        reference_type, reference_id
    ) values (
        p_club_id, p_actor_telegram_user_id, p_operation, p_amount_silarum,
        treasury_row.silarum_available, left(p_reference_type, 40), p_reference_id
    );
    return jsonb_build_object('available', treasury_row.silarum_available, 'locked', treasury_row.silarum_locked);
end;
$$;

create or replace function public.server_review_fight_tournament(
    p_tournament_id uuid,
    p_admin_telegram_user_id bigint,
    p_approval_status text
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    selected_tournament public.fight_tournaments%rowtype;
begin
    if p_approval_status not in ('approved', 'rejected') then raise exception 'invalid_tournament_review'; end if;
    select * into selected_tournament from public.fight_tournaments where id = p_tournament_id for update;
    if not found or selected_tournament.approval_status <> 'pending' then raise exception 'tournament_not_pending_review'; end if;
    if p_approval_status = 'rejected' and selected_tournament.organizer_club_id is not null
       and selected_tournament.prize_fund_amount > 0 then
        perform public.server_release_club_budget(
            selected_tournament.organizer_club_id, p_admin_telegram_user_id,
            selected_tournament.prize_fund_amount, 'tournament_release',
            'fight_tournament', selected_tournament.id
        );
    end if;
    update public.fight_tournaments
    set approval_status = p_approval_status,
        status = case when p_approval_status = 'approved' then 'registration' else 'rejected' end,
        financial_payout_enabled = false,
        reviewed_at = now(), reviewed_by_telegram_id = p_admin_telegram_user_id, updated_at = now()
    where id = p_tournament_id returning * into selected_tournament;
    return to_jsonb(selected_tournament);
end;
$$;

create or replace function public.server_verify_club_challenge(
    p_challenge_id uuid,
    p_admin_telegram_user_id bigint,
    p_winner_club_id uuid
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    selected_challenge public.fight_club_challenges%rowtype;
    loser_club_id uuid;
begin
    select * into selected_challenge from public.fight_club_challenges where id = p_challenge_id for update;
    if not found or selected_challenge.status not in ('accepted', 'live') then raise exception 'challenge_not_verifiable'; end if;
    if p_winner_club_id not in (selected_challenge.challenger_club_id, selected_challenge.defender_club_id) then
        raise exception 'winner_is_not_challenge_participant';
    end if;
    loser_club_id := case when p_winner_club_id = selected_challenge.challenger_club_id
        then selected_challenge.defender_club_id else selected_challenge.challenger_club_id end;
    update public.fight_clubs
    set rating = least(1000000, rating + selected_challenge.rating_points), updated_at = now()
    where id = p_winner_club_id;
    update public.fight_clubs
    set rating = greatest(0, rating - greatest(1, selected_challenge.rating_points / 2)), updated_at = now()
    where id = loser_club_id;
    update public.fight_club_challenges
    set winner_club_id = p_winner_club_id, status = 'finished', updated_at = now()
    where id = p_challenge_id returning * into selected_challenge;
    return to_jsonb(selected_challenge) || jsonb_build_object('verified_by', p_admin_telegram_user_id);
end;
$$;

create or replace function public.server_review_silarum_exchange(
    p_request_id uuid,
    p_admin_telegram_user_id bigint,
    p_approved boolean
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    selected_request public.silarum_exchange_requests%rowtype;
begin
    select * into selected_request from public.silarum_exchange_requests where id = p_request_id for update;
    if not found or selected_request.status <> 'pending_review' then raise exception 'exchange_request_not_pending'; end if;
    if p_approved and selected_request.quote_expires_at < now() then raise exception 'exchange_quote_expired'; end if;
    if not p_approved then
        if selected_request.source_type = 'club' then
            perform public.server_release_club_budget(
                selected_request.source_club_id, p_admin_telegram_user_id,
                selected_request.amount_silarum, 'exchange_release',
                'silarum_exchange', selected_request.id
            );
        else
            update public.game_accounts
            set srum_available = srum_available + selected_request.amount_silarum,
                srum_locked = srum_locked - selected_request.amount_silarum, updated_at = now()
            where telegram_user_id = selected_request.requester_telegram_user_id
              and srum_locked >= selected_request.amount_silarum;
            if not found then raise exception 'player_exchange_budget_missing'; end if;
        end if;
    end if;
    update public.silarum_exchange_requests
    set status = case when p_approved then 'approved' else 'rejected' end,
        reviewed_by_telegram_id = p_admin_telegram_user_id, updated_at = now()
    where id = p_request_id returning * into selected_request;
    return to_jsonb(selected_request);
end;
$$;

create or replace function public.server_complete_silarum_exchange(
    p_request_id uuid,
    p_admin_telegram_user_id bigint,
    p_tx_hash text
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    selected_request public.silarum_exchange_requests%rowtype;
    treasury_row public.fight_club_treasuries%rowtype;
begin
    if char_length(trim(coalesce(p_tx_hash, ''))) not between 10 and 200 then raise exception 'invalid_transaction_hash'; end if;
    select * into selected_request from public.silarum_exchange_requests where id = p_request_id for update;
    if not found or selected_request.status not in ('approved', 'processing') then raise exception 'exchange_request_not_approved'; end if;
    if selected_request.source_type = 'club' then
        update public.fight_club_treasuries
        set silarum_locked = silarum_locked - selected_request.amount_silarum,
            version = version + 1, updated_at = now()
        where club_id = selected_request.source_club_id
          and silarum_locked >= selected_request.amount_silarum
        returning * into treasury_row;
        if not found then raise exception 'exchange_budget_missing'; end if;
        insert into public.fight_club_treasury_ledger (
            club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum,
            reference_type, reference_id, metadata
        ) values (
            selected_request.source_club_id, p_admin_telegram_user_id, 'exchange_debit',
            -selected_request.amount_silarum, treasury_row.silarum_available,
            'silarum_exchange', selected_request.id,
            jsonb_build_object('target_asset', selected_request.target_asset, 'net_target_amount', selected_request.net_target_amount)
        );
    else
        update public.game_accounts
        set srum_locked = srum_locked - selected_request.amount_silarum, updated_at = now()
        where telegram_user_id = selected_request.requester_telegram_user_id
          and srum_locked >= selected_request.amount_silarum;
        if not found then raise exception 'player_exchange_budget_missing'; end if;
    end if;
    update public.silarum_exchange_requests
    set status = 'sent', tx_hash = trim(p_tx_hash), reviewed_by_telegram_id = p_admin_telegram_user_id, updated_at = now()
    where id = p_request_id returning * into selected_request;
    return to_jsonb(selected_request);
end;
$$;

create or replace function public.server_lock_player_exchange(
    p_request_id uuid,
    p_telegram_user_id bigint,
    p_amount_silarum numeric
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    account_row public.game_accounts%rowtype;
begin
    if p_amount_silarum <= 0 or not exists (
        select 1 from public.silarum_exchange_requests
        where id = p_request_id and requester_telegram_user_id = p_telegram_user_id
          and source_type = 'player' and status = 'pending_review' and amount_silarum = p_amount_silarum
    ) then raise exception 'invalid_player_exchange_lock'; end if;
    select * into account_row from public.game_accounts where telegram_user_id = p_telegram_user_id for update;
    if not found or account_row.srum_available < p_amount_silarum then raise exception 'insufficient_silarum'; end if;
    update public.game_accounts
    set srum_available = srum_available - p_amount_silarum,
        srum_locked = srum_locked + p_amount_silarum, updated_at = now()
    where telegram_user_id = p_telegram_user_id returning * into account_row;
    return jsonb_build_object('srum_available', account_row.srum_available, 'srum_locked', account_row.srum_locked);
end;
$$;

create or replace function public.server_accept_club_mining_order(
    p_order_id uuid,
    p_fighter_telegram_user_id bigint,
    p_fighter_nickname text
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    order_row public.fight_club_mining_orders%rowtype;
    treasury_row public.fight_club_treasuries%rowtype;
    pool_result jsonb;
begin
    select * into order_row from public.fight_club_mining_orders where id = p_order_id for update;
    if not found or order_row.fighter_telegram_user_id <> p_fighter_telegram_user_id
       or order_row.status <> 'pending_consent' or order_row.fighter_consent_status <> 'pending' then
        raise exception 'mining_order_not_available';
    end if;
    select * into treasury_row from public.fight_club_treasuries where club_id = order_row.club_id for update;
    if not found or treasury_row.silarum_available < order_row.entry_silarum then
        raise exception 'insufficient_club_silarum';
    end if;
    update public.fight_club_treasuries
    set silarum_available = silarum_available - order_row.entry_silarum,
        version = version + 1, updated_at = now()
    where club_id = order_row.club_id returning * into treasury_row;
    update public.game_accounts
    set srum_available = srum_available + order_row.entry_silarum, updated_at = now()
    where telegram_user_id = p_fighter_telegram_user_id;
    insert into public.fight_club_treasury_ledger (
        club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum,
        reference_type, reference_id, metadata
    ) values (
        order_row.club_id, p_fighter_telegram_user_id, 'mining_entry', -order_row.entry_silarum,
        treasury_row.silarum_available, 'club_mining_order', order_row.id,
        jsonb_build_object('fighter', p_fighter_telegram_user_id, 'pool_id', order_row.pool_id)
    );
    pool_result := public.join_game_pool(
        p_fighter_telegram_user_id,
        left(coalesce(nullif(trim(p_fighter_nickname), ''), 'Боец клуба'), 64),
        order_row.pool_id,
        order_row.entry_silarum,
        null
    );
    update public.fight_club_mining_orders
    set fighter_consent_status = 'accepted', consented_at = now(),
        status = case when pool_result->>'status' = 'matched' then 'active' else 'queued' end,
        server_session_id = (pool_result->>'session_id')::uuid,
        updated_at = now()
    where id = order_row.id;
    return pool_result || jsonb_build_object('order_id', order_row.id, 'funded_by_club', true);
end;
$$;

create or replace function public.server_contribute_club_monthly(
    p_request_id uuid,
    p_campaign_id uuid,
    p_telegram_user_id bigint,
    p_nickname text,
    p_amount_silarum numeric,
    p_publish_on_wall boolean default true
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    campaign_row public.fight_club_contribution_campaigns%rowtype;
    account_row public.game_accounts%rowtype;
    treasury_row public.fight_club_treasuries%rowtype;
    existing_contribution public.fight_club_contributions%rowtype;
    contribution_id uuid := p_request_id;
begin
    if p_request_id is null then raise exception 'contribution_request_id_required'; end if;
    if p_amount_silarum <= 0 then raise exception 'invalid_contribution_amount'; end if;
    select * into existing_contribution from public.fight_club_contributions where id = p_request_id;
    if found then
        if existing_contribution.telegram_user_id <> p_telegram_user_id
            or existing_contribution.campaign_id <> p_campaign_id then
            raise exception 'contribution_request_id_reused';
        end if;
        select * into account_row from public.game_accounts where telegram_user_id = p_telegram_user_id;
        select * into treasury_row from public.fight_club_treasuries where club_id = existing_contribution.club_id;
        return jsonb_build_object(
            'contribution_id', existing_contribution.id,
            'amount_silarum', existing_contribution.amount_silarum,
            'srum_available', coalesce(account_row.srum_available, 0),
            'club_silarum_available', coalesce(treasury_row.silarum_available, 0),
            'published_on_wall', existing_contribution.publish_on_wall,
            'idempotent_replay', true
        );
    end if;
    select * into campaign_row from public.fight_club_contribution_campaigns
    where id = p_campaign_id and enabled = true for update;
    if not found or campaign_row.month_start <> date_trunc('month', current_date)::date then
        raise exception 'contribution_campaign_not_active';
    end if;
    if not exists (
        select 1 from public.fight_club_members
        where club_id = campaign_row.club_id and telegram_user_id = p_telegram_user_id and status = 'active'
    ) then raise exception 'active_club_membership_required'; end if;
    select * into account_row from public.game_accounts where telegram_user_id = p_telegram_user_id for update;
    if not found then raise exception 'game_account_required'; end if;
    select * into existing_contribution from public.fight_club_contributions where id = p_request_id;
    if found then
        if existing_contribution.telegram_user_id <> p_telegram_user_id
            or existing_contribution.campaign_id <> p_campaign_id then
            raise exception 'contribution_request_id_reused';
        end if;
        select * into treasury_row from public.fight_club_treasuries where club_id = campaign_row.club_id;
        return jsonb_build_object(
            'contribution_id', existing_contribution.id,
            'amount_silarum', existing_contribution.amount_silarum,
            'srum_available', account_row.srum_available,
            'club_silarum_available', coalesce(treasury_row.silarum_available, 0),
            'published_on_wall', existing_contribution.publish_on_wall,
            'idempotent_replay', true
        );
    end if;
    if account_row.srum_available < p_amount_silarum then raise exception 'insufficient_silarum'; end if;
    update public.game_accounts
    set srum_available = srum_available - p_amount_silarum, updated_at = now()
    where telegram_user_id = p_telegram_user_id returning * into account_row;
    insert into public.fight_club_treasuries (club_id) values (campaign_row.club_id) on conflict (club_id) do nothing;
    update public.fight_club_treasuries
    set silarum_available = silarum_available + p_amount_silarum,
        version = version + 1, updated_at = now()
    where club_id = campaign_row.club_id returning * into treasury_row;
    insert into public.fight_club_contributions (
        id, campaign_id, club_id, telegram_user_id, nickname, amount_silarum, publish_on_wall
    ) values (
        contribution_id, campaign_row.id, campaign_row.club_id, p_telegram_user_id,
        left(coalesce(nullif(trim(p_nickname), ''), 'Боец клуба'), 64), p_amount_silarum, p_publish_on_wall
    ) returning id into contribution_id;
    update public.fight_club_contribution_campaigns
    set total_silarum = total_silarum + p_amount_silarum,
        contributor_count = (
            select count(distinct contribution.telegram_user_id)
            from public.fight_club_contributions as contribution
            where contribution.campaign_id = campaign_row.id
        ), updated_at = now()
    where id = campaign_row.id;
    insert into public.fight_club_treasury_ledger (
        club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum,
        reference_type, reference_id, metadata
    ) values (
        campaign_row.club_id, p_telegram_user_id, 'deposit', p_amount_silarum,
        treasury_row.silarum_available, 'monthly_contribution', contribution_id,
        jsonb_build_object('campaign_id', campaign_row.id, 'voluntary', true)
    );
    if p_publish_on_wall then
        insert into public.fight_club_news_posts (
            club_id, author_telegram_user_id, post_type, title, body, status, published_at
        ) values (
            campaign_row.club_id, p_telegram_user_id, 'contribution',
            'Спасибо, ' || left(coalesce(nullif(trim(p_nickname), ''), 'боец клуба'), 64) || '!',
            'Администрация клуба благодарит за добровольную поддержку: ' || p_amount_silarum || ' SILARUM.',
            'published', now()
        );
    end if;
    return jsonb_build_object(
        'contribution_id', contribution_id, 'amount_silarum', p_amount_silarum,
        'srum_available', account_row.srum_available,
        'club_silarum_available', treasury_row.silarum_available,
        'published_on_wall', p_publish_on_wall
    );
end;
$$;

create or replace function public.close_game_pool_session(
    p_player_telegram_id bigint,
    p_session_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    session_row public.mining_sessions%rowtype;
    mining_order public.fight_club_mining_orders%rowtype;
    treasury_row public.fight_club_treasuries%rowtype;
    club_funded boolean := false;
begin
    select * into session_row from public.mining_sessions
    where id = p_session_id and player_telegram_id = p_player_telegram_id
      and status in ('paused', 'queued') for update;
    if not found then raise exception 'releasable session not found'; end if;
    select * into mining_order from public.fight_club_mining_orders
    where server_session_id = session_row.id and status in ('queued', 'active')
    order by created_at desc limit 1 for update;
    club_funded := found;
    update public.pool_queue set status = 'cancelled'
    where session_id = session_row.id and status = 'waiting';
    if club_funded then
        update public.game_accounts
        set srum_locked = greatest(0, srum_locked - session_row.stake_remaining_srum), updated_at = now()
        where telegram_user_id = p_player_telegram_id;
        update public.fight_club_treasuries
        set silarum_available = silarum_available + session_row.stake_remaining_srum,
            version = version + 1, updated_at = now()
        where club_id = mining_order.club_id returning * into treasury_row;
        insert into public.fight_club_treasury_ledger (
            club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum,
            reference_type, reference_id, metadata
        ) values (
            mining_order.club_id, p_player_telegram_id, 'mining_return', session_row.stake_remaining_srum,
            treasury_row.silarum_available, 'club_mining_order', mining_order.id,
            jsonb_build_object('session_id', session_row.id)
        );
        update public.fight_club_mining_orders set status = 'completed', updated_at = now()
        where id = mining_order.id;
    else
        update public.game_accounts
        set srum_locked = greatest(0, srum_locked - session_row.stake_remaining_srum),
            srum_available = srum_available + session_row.stake_remaining_srum, updated_at = now()
        where telegram_user_id = p_player_telegram_id;
    end if;
    update public.mining_sessions set status = 'ended', updated_at = now() where id = session_row.id;
    insert into public.economy_ledger (pool_id, entry_type, participant_kind, player_telegram_id, amount_srum)
    values (session_row.pool_id, 'stake_release', 'human', p_player_telegram_id, session_row.stake_remaining_srum);
    return jsonb_build_object(
        'status', 'ended', 'released_srum', session_row.stake_remaining_srum,
        'funded_by_club', club_funded,
        'returned_to_club', case when club_funded then session_row.stake_remaining_srum else 0 end
    );
end;
$$;

create or replace function public.server_submit_tournament_result(
    p_match_id uuid,
    p_telegram_user_id bigint,
    p_claimed_self_won boolean
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    selected_match public.fight_tournament_matches%rowtype;
    claimed_winner bigint;
    claims jsonb;
begin
    select * into selected_match from public.fight_tournament_matches where id = p_match_id for update;
    if not found or selected_match.status not in ('scheduled', 'ready', 'live', 'submitted') then
        raise exception 'match_not_available';
    end if;
    if p_telegram_user_id not in (selected_match.player_one_telegram_id, selected_match.player_two_telegram_id) then
        raise exception 'not_a_match_participant';
    end if;
    claimed_winner := case
        when p_claimed_self_won then p_telegram_user_id
        when p_telegram_user_id = selected_match.player_one_telegram_id then selected_match.player_two_telegram_id
        else selected_match.player_one_telegram_id
    end;
    claims := coalesce(selected_match.score->'claims', '[]'::jsonb);
    if not claims @> jsonb_build_array(jsonb_build_object('by', p_telegram_user_id)) then
        claims := claims || jsonb_build_array(jsonb_build_object(
            'by', p_telegram_user_id,
            'claimed_winner', claimed_winner,
            'submitted_at', now()
        ));
    end if;
    update public.fight_tournament_matches
    set status = 'submitted', score = jsonb_set(selected_match.score, '{claims}', claims, true), updated_at = now()
    where id = p_match_id;
    return jsonb_build_object('match_id', p_match_id, 'status', 'submitted', 'claimed_winner', claimed_winner);
end;
$$;

create or replace function public.server_verify_tournament_result(
    p_match_id uuid,
    p_verifier_telegram_user_id bigint,
    p_winner_telegram_user_id bigint,
    p_platform_admin boolean default false
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
    selected_match public.fight_tournament_matches%rowtype;
    selected_tournament public.fight_tournaments%rowtype;
    loser_id bigint;
    can_verify boolean := false;
    unverified_count integer;
    round_winners bigint[];
    winner_count integer;
    next_round integer;
    idx integer;
    one_id bigint;
    two_id bigint;
    winner_club_id uuid;
    treasury_row public.fight_club_treasuries%rowtype;
begin
    select * into selected_match from public.fight_tournament_matches where id = p_match_id for update;
    if not found or selected_match.status not in ('scheduled', 'ready', 'live', 'submitted') then
        raise exception 'match_not_verifiable';
    end if;
    if p_winner_telegram_user_id not in (selected_match.player_one_telegram_id, selected_match.player_two_telegram_id) then
        raise exception 'winner_is_not_participant';
    end if;
    select * into selected_tournament from public.fight_tournaments where id = selected_match.tournament_id for update;
    if p_platform_admin then
        can_verify := true;
    elsif selected_tournament.organizer_type = 'club' then
        select exists (
            select 1 from public.fight_club_members
            where club_id = selected_tournament.organizer_club_id
              and telegram_user_id = p_verifier_telegram_user_id
              and (role = 'owner' or permissions->>'referee' = 'true')
              and status = 'active'
        ) into can_verify;
    end if;
    if not can_verify then raise exception 'referee_access_required'; end if;

    loser_id := case
        when p_winner_telegram_user_id = selected_match.player_one_telegram_id then selected_match.player_two_telegram_id
        else selected_match.player_one_telegram_id
    end;
    update public.fight_tournament_matches
    set winner_telegram_id = p_winner_telegram_user_id,
        status = 'verified',
        verified_by_telegram_id = p_verifier_telegram_user_id,
        score = jsonb_set(score, '{verified_at}', to_jsonb(now()), true),
        updated_at = now()
    where id = p_match_id;
    update public.fight_tournament_registrations
    set status = 'checked_in', updated_at = now()
    where tournament_id = selected_match.tournament_id and telegram_user_id = p_winner_telegram_user_id;
    if loser_id is not null then
        update public.fight_tournament_registrations
        set status = 'eliminated', updated_at = now()
        where tournament_id = selected_match.tournament_id and telegram_user_id = loser_id;
    end if;
    update public.fight_club_members
    set rating = least(1000000, rating + 25), wins = wins + 1, updated_at = now()
    where telegram_user_id = p_winner_telegram_user_id and status = 'active';
    if loser_id is not null then
        update public.fight_club_members
        set rating = greatest(0, rating - 12), losses = losses + 1, updated_at = now()
        where telegram_user_id = loser_id and status = 'active';
    end if;

    select count(*) into unverified_count
    from public.fight_tournament_matches
    where tournament_id = selected_match.tournament_id
      and round_number = selected_match.round_number
      and status <> 'verified';
    if unverified_count > 0 then
        return jsonb_build_object('match_id', p_match_id, 'status', 'verified', 'tournament_status', 'live');
    end if;

    select array_agg(winner_telegram_id order by match_number), count(*)
    into round_winners, winner_count
    from public.fight_tournament_matches
    where tournament_id = selected_match.tournament_id and round_number = selected_match.round_number;
    if winner_count = 1 then
        update public.fight_tournament_registrations
        set status = 'winner', updated_at = now()
        where tournament_id = selected_match.tournament_id and telegram_user_id = p_winner_telegram_user_id;
        update public.fight_tournaments set status = 'finished', ends_at = now(), updated_at = now()
        where id = selected_match.tournament_id;
        select club_id into winner_club_id
        from public.fight_tournament_registrations
        where tournament_id = selected_match.tournament_id and telegram_user_id = p_winner_telegram_user_id;
        if winner_club_id is not null then
            update public.fight_clubs set rating = least(1000000, rating + 30), updated_at = now() where id = winner_club_id;
        end if;
        if selected_tournament.organizer_club_id is not null and selected_tournament.prize_fund_amount > 0 then
            update public.fight_club_treasuries
            set silarum_locked = silarum_locked - selected_tournament.prize_fund_amount,
                version = version + 1, updated_at = now()
            where club_id = selected_tournament.organizer_club_id
              and silarum_locked >= selected_tournament.prize_fund_amount
            returning * into treasury_row;
            if not found then raise exception 'tournament_prize_budget_missing'; end if;
            insert into public.fight_club_treasury_ledger (
                club_id, actor_telegram_user_id, operation, amount_silarum, balance_after_silarum,
                reference_type, reference_id, metadata
            ) values (
                selected_tournament.organizer_club_id, p_verifier_telegram_user_id, 'prize_debit',
                -selected_tournament.prize_fund_amount, treasury_row.silarum_available,
                'fight_tournament', selected_tournament.id,
                jsonb_build_object('winner', p_winner_telegram_user_id, 'prize_type', selected_tournament.prize_type)
            );
            if selected_tournament.prize_type = 'silarum' then
                update public.game_accounts
                set srum_available = srum_available + selected_tournament.prize_fund_amount, updated_at = now()
                where telegram_user_id = p_winner_telegram_user_id;
            end if;
        end if;
        insert into public.club_reward_vouchers (
            tournament_id, club_id, winner_telegram_user_id, public_code, title, amount_silarum, status
        )
        select selected_tournament.id, selected_tournament.organizer_club_id, p_winner_telegram_user_id,
               'WOLF-' || upper(substr(md5(extensions.gen_random_uuid()::text), 1, 12)),
               selected_tournament.prize_title, selected_tournament.prize_fund_amount, 'issued'
        where not exists (
            select 1 from public.club_reward_vouchers
            where tournament_id = selected_tournament.id and winner_telegram_user_id = p_winner_telegram_user_id
        );
        return jsonb_build_object('match_id', p_match_id, 'status', 'verified', 'tournament_status', 'finished', 'winner', p_winner_telegram_user_id);
    end if;

    next_round := selected_match.round_number + 1;
    if not exists (
        select 1 from public.fight_tournament_matches
        where tournament_id = selected_match.tournament_id and round_number = next_round
    ) then
        idx := 1;
        while idx <= array_length(round_winners, 1) loop
            one_id := round_winners[idx];
            two_id := case when idx + 1 <= array_length(round_winners, 1) then round_winners[idx + 1] else null end;
            insert into public.fight_tournament_matches (
                tournament_id, round_number, match_number, player_one_telegram_id, player_two_telegram_id,
                winner_telegram_id, status, score
            ) values (
                selected_match.tournament_id, next_round, ((idx + 1) / 2), one_id, two_id,
                case when two_id is null then one_id else null end,
                case when two_id is null then 'verified' else 'scheduled' end,
                case when two_id is null then '{"bye":true}'::jsonb else '{}'::jsonb end
            );
            idx := idx + 2;
        end loop;
    end if;
    return jsonb_build_object('match_id', p_match_id, 'status', 'verified', 'tournament_status', 'live', 'next_round', next_round);
end;
$$;

alter table public.fight_clubs enable row level security;
alter table public.fight_club_members enable row level security;
alter table public.fight_leagues enable row level security;
alter table public.fight_tournaments enable row level security;
alter table public.fight_tournament_prizes enable row level security;
alter table public.fight_tournament_registrations enable row level security;
alter table public.fight_tournament_matches enable row level security;
alter table public.club_reward_vouchers enable row level security;
alter table public.fight_club_treasuries enable row level security;
alter table public.fight_club_treasury_ledger enable row level security;
alter table public.fight_club_prize_catalog enable row level security;
alter table public.fight_club_news_posts enable row level security;
alter table public.fight_club_contribution_campaigns enable row level security;
alter table public.fight_club_contributions enable row level security;
alter table public.fight_club_challenges enable row level security;
alter table public.fight_club_mining_orders enable row level security;
alter table public.silarum_exchange_requests enable row level security;

revoke all on table public.fight_clubs from public, anon, authenticated;
revoke all on table public.fight_club_members from public, anon, authenticated;
revoke all on table public.fight_leagues from public, anon, authenticated;
revoke all on table public.fight_tournaments from public, anon, authenticated;
revoke all on table public.fight_tournament_prizes from public, anon, authenticated;
revoke all on table public.fight_tournament_registrations from public, anon, authenticated;
revoke all on table public.fight_tournament_matches from public, anon, authenticated;
revoke all on table public.club_reward_vouchers from public, anon, authenticated;
revoke all on table public.fight_club_treasuries from public, anon, authenticated;
revoke all on table public.fight_club_treasury_ledger from public, anon, authenticated;
revoke all on table public.fight_club_prize_catalog from public, anon, authenticated;
revoke all on table public.fight_club_news_posts from public, anon, authenticated;
revoke all on table public.fight_club_contribution_campaigns from public, anon, authenticated;
revoke all on table public.fight_club_contributions from public, anon, authenticated;
revoke all on table public.fight_club_challenges from public, anon, authenticated;
revoke all on table public.fight_club_mining_orders from public, anon, authenticated;
revoke all on table public.silarum_exchange_requests from public, anon, authenticated;

grant all on table public.fight_clubs to service_role;
grant all on table public.fight_club_members to service_role;
grant all on table public.fight_leagues to service_role;
grant all on table public.fight_tournaments to service_role;
grant all on table public.fight_tournament_prizes to service_role;
grant all on table public.fight_tournament_registrations to service_role;
grant all on table public.fight_tournament_matches to service_role;
grant all on table public.club_reward_vouchers to service_role;
grant all on table public.fight_club_treasuries to service_role;
grant all on table public.fight_club_treasury_ledger to service_role;
grant all on table public.fight_club_prize_catalog to service_role;
grant all on table public.fight_club_news_posts to service_role;
grant all on table public.fight_club_contribution_campaigns to service_role;
grant all on table public.fight_club_contributions to service_role;
grant all on table public.fight_club_challenges to service_role;
grant all on table public.fight_club_mining_orders to service_role;
grant all on table public.silarum_exchange_requests to service_role;

revoke all on function public.server_join_fight_club(uuid, bigint, text, text) from public, anon, authenticated;
revoke all on function public.force_game_pool_silarum() from public, anon, authenticated;
revoke all on function public.server_leave_fight_club(uuid, bigint) from public, anon, authenticated;
revoke all on function public.resolve_game_pool_match_silarum(uuid, bigint, integer) from public, anon, authenticated;
revoke all on function public.server_fund_club_treasury(uuid, bigint, numeric) from public, anon, authenticated;
revoke all on function public.server_lock_club_budget(uuid, bigint, numeric, text, text, uuid) from public, anon, authenticated;
revoke all on function public.server_release_club_budget(uuid, bigint, numeric, text, text, uuid) from public, anon, authenticated;
revoke all on function public.server_review_fight_tournament(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.server_verify_club_challenge(uuid, bigint, uuid) from public, anon, authenticated;
revoke all on function public.server_review_silarum_exchange(uuid, bigint, boolean) from public, anon, authenticated;
revoke all on function public.server_complete_silarum_exchange(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.server_lock_player_exchange(uuid, bigint, numeric) from public, anon, authenticated;
revoke all on function public.server_accept_club_mining_order(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.server_contribute_club_monthly(uuid, uuid, bigint, text, numeric, boolean) from public, anon, authenticated;
revoke all on function public.close_game_pool_session(bigint, uuid) from public, anon, authenticated;
revoke all on function public.server_submit_tournament_result(uuid, bigint, boolean) from public, anon, authenticated;
revoke all on function public.server_verify_tournament_result(uuid, bigint, bigint, boolean) from public, anon, authenticated;
grant execute on function public.server_join_fight_club(uuid, bigint, text, text) to service_role;
grant execute on function public.server_leave_fight_club(uuid, bigint) to service_role;
grant execute on function public.resolve_game_pool_match_silarum(uuid, bigint, integer) to service_role;
grant execute on function public.server_fund_club_treasury(uuid, bigint, numeric) to service_role;
grant execute on function public.server_lock_club_budget(uuid, bigint, numeric, text, text, uuid) to service_role;
grant execute on function public.server_release_club_budget(uuid, bigint, numeric, text, text, uuid) to service_role;
grant execute on function public.server_review_fight_tournament(uuid, bigint, text) to service_role;
grant execute on function public.server_verify_club_challenge(uuid, bigint, uuid) to service_role;
grant execute on function public.server_review_silarum_exchange(uuid, bigint, boolean) to service_role;
grant execute on function public.server_complete_silarum_exchange(uuid, bigint, text) to service_role;
grant execute on function public.server_lock_player_exchange(uuid, bigint, numeric) to service_role;
grant execute on function public.server_accept_club_mining_order(uuid, bigint, text) to service_role;
grant execute on function public.server_contribute_club_monthly(uuid, uuid, bigint, text, numeric, boolean) to service_role;
grant execute on function public.close_game_pool_session(bigint, uuid) to service_role;
grant execute on function public.server_submit_tournament_result(uuid, bigint, boolean) to service_role;
grant execute on function public.server_verify_tournament_result(uuid, bigint, bigint, boolean) to service_role;
