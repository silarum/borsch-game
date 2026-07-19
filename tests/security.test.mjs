import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createRequire } from 'node:module';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const html = read('index.html');
const scriptPaths = [...html.matchAll(/<script\s+src="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((path) => !/^https?:/.test(path));
const scripts = scriptPaths.map((path) => ({ path, source: read(path) }));

test('все локальные JavaScript-файлы компилируются вместе', () => {
  for (const script of scripts) {
    assert.doesNotThrow(() => new Function(script.source), script.path);
  }
  assert.doesNotThrow(
    () => new Function(scripts.map((script) => script.source).join('\n;\n')),
    'конфликт глобальных объявлений между скриптами'
  );
});

test('в публичном клиенте нет секретов и административных паролей', () => {
  const publicSource = scripts.map((script) => script.source).join('\n');
  assert.doesNotMatch(publicSource, /\b\d{7,12}:[A-Za-z0-9_-]{30,}\b/, 'похожий на Telegram bot token секрет');
  assert.doesNotMatch(publicSource, /ADMIN_PASS|admin\s*\/\s*admin/i);
  assert.doesNotMatch(publicSource, /api\.telegram\.org\/bot/i);
});

test('браузер не изменяет таблицы Supabase и финансовые Edge Functions напрямую', () => {
  const publicSource = scripts.map((script) => script.source).join('\n');
  assert.doesNotMatch(publicSource, /\/rest\/v1\//);
  assert.doesNotMatch(publicSource, /functions\/v1\/(?:update-balance|process-withdrawal|buy-srum)/);
  assert.match(read('js/security.js'), /financialFeaturesEnabled:\s*false/);
  assert.match(read('js/security.js'), /cloudSyncEnabled:\s*false/);
});

test('HTML не содержит inline-обработчиков и плавающих CDN-версий', () => {
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(html, /@latest/);
  assert.match(html, /Content-Security-Policy/);
});

test('локальные ссылки и файлы TON Connect manifest существуют', () => {
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const path = match[1];
    if (/^(?:https?:|data:|#)/.test(path)) continue;
    assert.ok(existsSync(new URL(path, root)), `не найден ${path}`);
  }

  const manifest = JSON.parse(read('tonconnect-manifest.json'));
  for (const key of ['iconUrl', 'termsOfUseUrl', 'privacyPolicyUrl']) {
    const pathname = new URL(manifest[key]).pathname;
    const localPath = pathname.replace('/borsch-game/', '');
    assert.ok(existsSync(new URL(localPath, root)), `manifest: не найден ${localPath}`);
  }
});

test('публикуемые изображения оптимизированы', () => {
  const assetRoot = new URL('assets/', root);
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir.pathname, entry.name);
    return entry.isDirectory() ? walk(new URL(`${entry.name}/`, dir)) : [path];
  });
  const images = walk(assetRoot).filter((path) => ['.png', '.jpg', '.jpeg', '.webp'].includes(extname(path).toLowerCase()));
  assert.ok(images.length > 0, 'изображения не найдены');
  for (const image of images) {
    assert.ok(statSync(image).size < 700_000, `${image} больше 700 КБ`);
  }
});

test('Крипто Беспредел подключается после создания DOM и не останавливает арену', () => {
  const arena = read('js/arena.js');
  assert.match(arena, /function bindQuickDuelButton\(\)/);
  assert.match(arena, /document\.getElementById\('quick-duel-coin'\)/);
  assert.doesNotMatch(arena, /\nquickDuelCoin\.addEventListener/);
});

test('Голодные волки содержат девять бойцов, полноценное управление и рейтинговые лестницы', () => {
  const fight = read('js/fight.js');
  assert.match(html, /id="fight-screen"/);
  assert.match(html, /src="js\/fight\.js"/);
  assert.match(fight, /RUMIR Alpha/);
  assert.match(fight, /Luna Hash/);
  assert.equal([...fight.matchAll(/id: '[^']+', name:/g)].length, 9);
  for (const action of ['punch', 'kick', 'heavy', 'block', 'dodge', 'special']) {
    assert.match(fight, new RegExp(`${action}: \\{`));
  }
  assert.match(fight, /stamina/);
  assert.match(fight, /combo/);
  assert.match(fight, /stunnedUntil/);
  assert.match(fight, /CLUB_LADDER/);
  assert.match(read('js/arena.js'), /start-tournament-borsch/);
  assert.match(read('js/arena.js'), /start-tournament-fight/);
});

test('боевые спрайты оптимизированы, а овощи приземляются в кастрюлю до награды', () => {
  const fight = read('js/fight.js');
  const engine = read('js/game-engine.js');
  for (const id of ['alpha', 'luna', 'fenrir', 'she-wolf', 'khan', 'veles', 'mara', 'satoshi', 'borz']) {
    assert.ok(existsSync(new URL(`assets/fight/fighters/${id}.webp`, root)), `нет спрайта ${id}`);
  }
  assert.match(fight, /POSE_POSITION/);
  assert.match(fight, /spawnImpact/);
  assert.match(engine, /function getVeggieCutout/);
  assert.match(engine, /function pulsePot/);
  assert.match(engine, /flyVegToPot\(hole, img, function\(\)/);
  assert.doesNotMatch(engine, /if \(img\) flyVegToPot\(hole, img\.src\);\s*showCoinFountain/);
});

test('сеть Голодных волков связывает клубы, квалификацию, бой и призовой ваучер', () => {
  const clubs = read('js/club-leagues.js');
  const fight = read('js/fight.js');
  assert.match(html, /id="mining-club-screen"/);
  assert.match(html, /id="club-owner-screen"/);
  assert.match(html, /src="js\/club-leagues\.js"/);
  assert.match(clubs, /Районная лига/);
  assert.match(clubs, /Городская лига/);
  assert.match(clubs, /Мировая лига/);
  assert.match(clubs, /function createClub/);
  assert.match(clubs, /function createTournament/);
  assert.match(clubs, /function hasQualification/);
  assert.match(clubs, /function recordFightResult/);
  assert.match(clubs, /registration\.roundWins >= 2/);
  assert.match(clubs, /fightRewardVouchers/);
  assert.match(fight, /ClubLeaguePlatform\.recordFightResult/);
  assert.match(fight, /function openWolfFight\(mode, context\)/);
});

test('серверная сеть клубов закрыта RLS и не разрешает автоматическую финансовую выплату', () => {
  const migration = read('supabase/migrations/20260718223000_fight_clubs_leagues_tournaments.sql');
  const gameApi = read('supabase/functions/game-api/index.ts');
  const adminApi = read('supabase/functions/admin-api/index.ts');
  for (const table of ['fight_clubs', 'fight_club_members', 'fight_leagues', 'fight_tournaments', 'fight_tournament_registrations', 'fight_tournament_matches', 'club_reward_vouchers']) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`));
  }
  assert.match(migration, /financial_payout_enabled = false or \(approval_status = 'approved' and is_test_mode = false\)/);
  assert.match(gameApi, /action === 'create_fight_club'/);
  assert.match(gameApi, /action === 'join_fight_club'/);
  assert.match(gameApi, /server_join_fight_club/);
  assert.match(gameApi, /action === 'save_club_tournament'/);
  assert.match(gameApi, /action === 'register_fight_tournament'/);
  assert.match(gameApi, /action === 'start_club_tournament'/);
  assert.match(gameApi, /Qualifying tournament is required/);
  assert.match(migration, /create or replace function public\.server_join_fight_club/);
  assert.match(migration, /owner_cannot_leave_club/);
  assert.match(adminApi, /action === 'review_fight_club'/);
  assert.match(adminApi, /action === 'review_fight_tournament'/);
  assert.match(adminApi, /action === 'save_global_tournament'/);
  assert.match(adminApi, /financial_payout_enabled: false/);
});

test('инвестиции принимают SILARUM без фиксированного порога по курсу 1 к 10000 RUMIR', () => {
  const main = read('js/main.js');
  assert.match(main, /var SILARUM_TO_RUMIR = 10000/);
  assert.match(main, /min="0\.0001"/);
  assert.match(main, /порога входа нет/);
  assert.match(main, /srum -= amount/);
});

test('призы, пулы и обмен используют единую SILARUM-экономику с резервированием', () => {
  const migration = read('supabase/migrations/20260718223000_fight_clubs_leagues_tournaments.sql');
  const gameApi = read('supabase/functions/game-api/index.ts');
  const adminApi = read('supabase/functions/admin-api/index.ts');
  assert.match(migration, /check \(payout_asset = 'SILARUM'\)/);
  assert.match(migration, /prize_currency text not null default 'SILARUM' check \(prize_currency = 'SILARUM'\)/);
  assert.match(migration, /create table if not exists public\.silarum_exchange_requests/);
  assert.match(migration, /server_lock_player_exchange/);
  assert.match(migration, /server_review_silarum_exchange/);
  assert.match(migration, /server_complete_silarum_exchange/);
  assert.match(gameApi, /action === 'request_player_exchange'/);
  assert.match(gameApi, /SILARUM_EXCHANGE_COMMISSION_BPS/);
  assert.match(gameApi, /estimated_gas_target/);
  assert.match(adminApi, /action === 'review_silarum_exchange'/);
  assert.match(adminApi, /action === 'complete_silarum_exchange'/);
});

test('клубные права, майнинг по согласию и афиши проверяются сервером', () => {
  const clubs = read('js/club-leagues.js');
  const gameApi = read('supabase/functions/game-api/index.ts');
  const posterUpload = read('supabase/functions/club-poster-upload/index.ts');
  const migration = read('supabase/migrations/20260718223000_fight_clubs_leagues_tournaments.sql');
  assert.match(clubs, /function ownerWall/);
  assert.match(clubs, /function ownerTeam/);
  assert.match(clubs, /function ownerTreasury/);
  assert.match(clubs, /rewardToClubPercent/);
  assert.match(clubs, /fighterConsentStatus/);
  assert.match(gameApi, /action === 'update_club_member_permissions'/);
  assert.match(gameApi, /action === 'create_club_mining_order'/);
  assert.match(gameApi, /action === 'respond_club_mining_order'/);
  assert.match(migration, /fighter_consent_status text not null default 'pending'/);
  assert.match(migration, /server_accept_club_mining_order/);
  assert.match(posterUpload, /image\/jpeg/);
  assert.match(posterUpload, /manage_news/);
  assert.doesNotMatch(posterUpload, /TELEGRAM_ADMIN_BOT_TOKEN/);
});

test('иерархия клуба ограничивает отдельные разделы, а ежемесячная поддержка остаётся добровольной', () => {
  const clubs = read('js/club-leagues.js');
  const gameApi = read('supabase/functions/game-api/index.ts');
  const adminApi = read('supabase/functions/admin-api/index.ts');
  const admin = read('admin/admin.js');
  const migration = read('supabase/migrations/20260718223000_fight_clubs_leagues_tournaments.sql');
  for (const table of ['fight_club_contribution_campaigns', 'fight_club_contributions']) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`));
  }
  assert.match(migration, /'section_manager'/);
  assert.match(migration, /create or replace function public\.server_contribute_club_monthly/);
  assert.match(migration, /active_club_membership_required/);
  assert.match(migration, /p_request_id uuid/);
  assert.match(migration, /idempotent_replay/);
  assert.match(migration, /jsonb_build_object\('campaign_id', campaign_row\.id, 'voluntary', true\)/);
  assert.match(migration, /if p_publish_on_wall then/);
  assert.doesNotMatch(migration, /cron[^\n]*contribut|automatic[^\n]*contribut/i);
  assert.match(gameApi, /action === 'save_club_contribution_campaign'/);
  assert.match(gameApi, /action === 'contribute_club_monthly'/);
  assert.match(gameApi, /p_request_id: requestId/);
  assert.match(gameApi, /const canManageSection/);
  assert.match(gameApi, /memberPermissions/);
  assert.match(clubs, /Руководитель направления/);
  assert.match(clubs, /function canClub\(permission\)/);
  assert.match(clubs, /club-monthly-contribution-form/);
  assert.match(clubs, /Разрешаю опубликовать благодарность/);
  assert.match(clubs, /Взнос не обязателен/);
  assert.match(adminApi, /fight_club_contribution_campaigns/);
  assert.match(admin, /Добровольная поддержка/);
});

test('турнирные и межклубные результаты подтверждает серверный судья', () => {
  const migration = read('supabase/migrations/20260718223000_fight_clubs_leagues_tournaments.sql');
  const adminApi = read('supabase/functions/admin-api/index.ts');
  assert.match(migration, /server_submit_tournament_result/);
  assert.match(migration, /server_verify_tournament_result/);
  assert.match(migration, /referee_access_required/);
  assert.match(migration, /server_verify_club_challenge/);
  assert.match(migration, /tournament_prize_budget_missing/);
  assert.match(adminApi, /action === 'verify_tournament_match_result'/);
  assert.match(adminApi, /action === 'verify_club_challenge'/);
});

test('сервер содержит ровно 300 полноценных управляемых спартанцев', () => {
  const migration = read('supabase/migrations/202607170001_secure_spartans_and_admin.sql');
  const economyMigration = read('supabase/migrations/20260717093135_spartan_economy_admin.sql');
  const bots = read('js/bots.js');
  assert.match(migration, /generate_series\(1, 300\)/);
  assert.match(migration, /bots_enabled/);
  assert.match(migration, /auto_fill_enabled/);
  assert.match(migration, /activation_threshold/);
  assert.match(migration, /target_pool_size/);
  assert.match(migration, /enable row level security/);
  assert.match(bots, /length:\s*300/);
  assert.match(bots, /lastLostStage/);
  assert.match(economyMigration, /30 \+ \(\(id::integer \* 7919\) % 271\)/);
  assert.match(economyMigration, /rumir_balance/);
  assert.match(economyMigration, /run_spartan_tick/);
  assert.match(economyMigration, /state in \('idle', 'mining', 'queued', 'matched', 'cooldown', 'disabled'\)/);
  assert.match(economyMigration, /own_session\.stage = 5 or last_lost_stage = own_session\.stage - 1/);
  assert.match(economyMigration, /when coalesce\(bot_must_win, false\) then 61/);
  assert.match(economyMigration, /bot_cycle_reset_after_win/);
  assert.match(economyMigration, /queue\.session_id into opponent_queue_id, opponent_session_id/);
  assert.doesNotMatch(economyMigration, /session into opponent_queue_id, opponent_session/);
  assert.match(bots, /const shouldWin = stage === 5/);
});

test('Telegram-админка защищена секретом webhook и allowlist', () => {
  const admin = read('supabase/functions/telegram-admin/index.ts');
  const matchmaking = read('supabase/functions/matchmaking/index.ts');
  assert.match(admin, /X-Telegram-Bot-Api-Secret-Token/);
  assert.match(admin, /ADMIN_TELEGRAM_IDS/);
  assert.match(admin, /admin_patch_game_settings/);
  assert.match(admin, /TELEGRAM_ADMIN_BOT_TOKEN/);
  assert.match(admin, /getTelegramWebhookSecret/);
  assert.match(matchmaking, /validateTelegramInitData/);
  assert.match(matchmaking, /TELEGRAM_GAME_BOT_TOKEN/);
  assert.doesNotMatch(`${admin}\n${matchmaking}`, /\b\d{7,12}:[A-Za-z0-9_-]{30,}\b/);
});

test('Edge Functions поддерживают новый словарь секретных ключей Supabase', () => {
  const helper = read('supabase/functions/_shared/supabase-key.ts');
  const adminApi = read('supabase/functions/admin-api/index.ts');
  assert.match(helper, /Object\.values\(parsed\)/);
  assert.match(helper, /startsWith\('sb_secret_'\)/);
  assert.match(helper, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(adminApi, /getSupabaseSecretKey/);
});

test('экономика пяти этапов делит штраф 70/30 и удерживает пятый этап до поражения', () => {
  const require = createRequire(import.meta.url);
  const economy = require('../js/economy.js');
  assert.deepEqual(economy.calculateLoss(10, 1), {
    stage: 1,
    penalty: 1,
    winnerPayout: 0.7,
    treasury: 0.3,
    remainingStake: 9
  });
  assert.deepEqual(economy.calculateLoss(10, 5), {
    stage: 5,
    penalty: 10,
    winnerPayout: 7,
    treasury: 3,
    remainingStake: 0
  });
  assert.equal(economy.nextStage(5, true), 5);
  assert.equal(economy.nextStage(5, false), 1);
});

test('мобильная админ-панель не содержит секретов и управляет пулами, клубами, заданиями и спартанцами', () => {
  const adminHtml = read('admin/index.html');
  const adminScript = read('admin/admin.js');
  const adminApi = read('supabase/functions/admin-api/index.ts');
  assert.doesNotThrow(() => new Function(adminScript));
  assert.match(adminHtml, /viewport-fit=cover/);
  assert.match(adminScript, /save_pool/);
  assert.match(adminScript, /save_task/);
  assert.match(adminScript, /update_spartan/);
  assert.match(adminScript, /renderFightNetwork/);
  assert.match(adminScript, /review_fight_club/);
  assert.match(adminScript, /save_global_tournament/);
  assert.match(adminApi, /ADMIN_TELEGRAM_IDS/);
  assert.match(adminApi, /action === 'whoami'/);
  assert.match(adminApi, /action === 'health'/);
  assert.match(adminApi, /action === 'register_webhook'/);
  assert.match(adminScript, /register-webhook/);
  assert.doesNotMatch(`${adminHtml}\n${adminScript}\n${adminApi}`, /\b\d{7,12}:[A-Za-z0-9_-]{30,}\b/);
});

test('старые финансовые Edge Functions безопасно заблокированы', () => {
  for (const name of ['buy-srum', 'process-withdrawal', 'update-balance']) {
    const source = read(`supabase/functions/${name}/index.ts`);
    assert.match(source, /feature_disabled/);
    assert.match(source, /status:\s*410/);
  }
});

test('старые финансовые таблицы закрыты от публичных ролей', () => {
  const migration = read(
    'supabase/migrations/20260717161444_lock_down_legacy_finance_tables.sql'
  );
  for (const table of ['users', 'transactions', 'withdrawal_requests', 'tournaments']) {
    assert.match(
      migration,
      new RegExp(`revoke all privileges on table public\\.${table} from public, anon, authenticated`)
    );
  }
  assert.match(migration, /to_regclass\('public\.users'\)/);
  assert.match(migration, /drop policy if exists "Allow all for anon"/);
  assert.match(migration, /economy_ledger_match_id_idx/);
  assert.match(migration, /match_score_submissions_session_id_idx/);
  assert.doesNotMatch(migration, /drop table/i);
});
