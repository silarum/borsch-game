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
  assert.match(matchmaking, /validateTelegramInitData/);
  assert.match(matchmaking, /TELEGRAM_GAME_BOT_TOKEN/);
  assert.doesNotMatch(`${admin}\n${matchmaking}`, /\b\d{7,12}:[A-Za-z0-9_-]{30,}\b/);
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

test('мобильная админ-панель не содержит секретов и управляет пулами, заданиями и спартанцами', () => {
  const adminHtml = read('admin/index.html');
  const adminScript = read('admin/admin.js');
  const adminApi = read('supabase/functions/admin-api/index.ts');
  assert.doesNotThrow(() => new Function(adminScript));
  assert.match(adminHtml, /viewport-fit=cover/);
  assert.match(adminScript, /save_pool/);
  assert.match(adminScript, /save_task/);
  assert.match(adminScript, /update_spartan/);
  assert.match(adminApi, /ADMIN_TELEGRAM_IDS/);
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
