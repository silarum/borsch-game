import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

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
