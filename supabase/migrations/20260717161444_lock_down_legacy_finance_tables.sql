-- The original public client granted anonymous users unrestricted write access
-- to legacy financial tables. The server-managed economy does not use direct
-- Data API access, so keep the data but close every public path to it.

alter table public.users enable row level security;
alter table public.transactions enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.tournaments enable row level security;

drop policy if exists "Allow all for anon" on public.users;
drop policy if exists users_select_own on public.users;
drop policy if exists users_update_own on public.users;
drop policy if exists users_service_all on public.users;

drop policy if exists "Allow all for anon" on public.transactions;

drop policy if exists "Allow all for anon" on public.withdrawal_requests;
drop policy if exists withdrawals_insert_own on public.withdrawal_requests;
drop policy if exists withdrawals_select_own on public.withdrawal_requests;
drop policy if exists withdrawals_service_all on public.withdrawal_requests;

drop policy if exists "Allow all for anon" on public.tournaments;

revoke all privileges on table public.users from public, anon, authenticated;
revoke all privileges on table public.transactions from public, anon, authenticated;
revoke all privileges on table public.withdrawal_requests from public, anon, authenticated;
revoke all privileges on table public.tournaments from public, anon, authenticated;

-- Cover foreign keys used by matchmaking, ledger, bot activity and retained
-- legacy records. Besides improving joins this prevents slow parent updates.
create index if not exists economy_ledger_match_id_idx
  on public.economy_ledger (match_id);
create index if not exists economy_ledger_pool_id_idx
  on public.economy_ledger (pool_id);
create index if not exists match_score_submissions_session_id_idx
  on public.match_score_submissions (session_id);
create index if not exists mining_sessions_pool_id_idx
  on public.mining_sessions (pool_id);
create index if not exists pool_matches_loser_session_id_idx
  on public.pool_matches (loser_session_id);
create index if not exists pool_matches_pool_id_idx
  on public.pool_matches (pool_id);
create index if not exists pool_matches_winner_session_id_idx
  on public.pool_matches (winner_session_id);
create index if not exists spartan_activity_pool_id_idx
  on public.spartan_activity (pool_id);
create index if not exists spartan_activity_spartan_id_idx
  on public.spartan_activity (spartan_id);
create index if not exists spartan_bots_current_pool_id_idx
  on public.spartan_bots (current_pool_id);
create index if not exists tournaments_created_by_idx
  on public.tournaments (created_by);
create index if not exists training_matches_bot_id_idx
  on public.training_matches (bot_id);
create index if not exists transactions_user_id_idx
  on public.transactions (user_id);
create index if not exists withdrawal_requests_user_id_idx
  on public.withdrawal_requests (user_id);
