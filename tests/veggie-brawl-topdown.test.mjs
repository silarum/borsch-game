import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const core = readFileSync(new URL('../js/veggie-brawl-topdown-core.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../js/veggie-brawl-topdown-engine.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/veggie-brawl-topdown-ui.js', import.meta.url), 'utf8');
const lobbyCss = readFileSync(new URL('../css/veggie-brawl-topdown-lobby.css', import.meta.url), 'utf8');
const arenaCss = readFileSync(new URL('../css/veggie-brawl-topdown-arena.css', import.meta.url), 'utf8');
const security = readFileSync(new URL('../js/security.js', import.meta.url), 'utf8');

const legacy = {
  modes: { pear_duel: { id:'pear_duel', name:'Pear', badge:'P', teamSize:1, seconds:90, goal:100 }, team_brawl: { id:'team_brawl', teamSize:3, seconds:120, goal:150 }, club_war: { id:'club_war', teamSize:5, seconds:150, goal:250 } },
  veggies: [{ id:'cabbage', name:'Cabbage', emoji:'C', role:'tank', hp:100, attack:10, speed:10, color:'#0f0' }, { id:'onion', name:'Onion', emoji:'O', role:'fast', hp:90, attack:9, speed:12, color:'#fff' }],
  weapons: [{ id:'pan', name:'Pan', icon:'P', damage:10, coins:2, uses:3 }],
  powerups: [{ id:'speed', name:'Speed', icon:'S', duration:1000 }]
};

function runtime() {
  const window = { VeggieBrawl: legacy };
  const context = { window, document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } }, localStorage: { getItem() { return null; }, setItem() {} }, setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, clearInterval() {}, Math, Date, Object, Array, Set, console };
  vm.runInNewContext(core, context);
  vm.runInNewContext(engine, context);
  vm.runInNewContext(ui, context);
  return window;
}

test('all top-down modules parse', () => {
  assert.doesNotThrow(() => new vm.Script(core));
  assert.doesNotThrow(() => new vm.Script(engine));
  assert.doesNotThrow(() => new vm.Script(ui));
});

test('exports top-down camera and eight-direction movement', () => {
  const window = runtime();
  assert.equal(window.VeggieBrawlTopDown.camera, 'top-down');
  assert.equal(window.VeggieBrawlTopDown.movement, '8-direction');
});

test('simulation has XY movement, roaming pear and random pickups', () => {
  assert.match(engine, /R\.movePear/);
  assert.match(engine, /R\.freePoint/);
  assert.match(engine, /Math\.hypot/);
  assert.match(core, /up:false,down:false/);
  assert.match(core, /data-td-action="dash"/);
});

test('styles include map, joystick and two-axis coordinates', () => {
  const styles = lobbyCss + arenaCss;
  assert.match(styles, /\.td-map/);
  assert.match(styles, /\.td-joystick/);
  assert.match(styles, /left:var\(--x\);top:var\(--y\)/);
  assert.match(styles, /touch-action:none/);
});

test('loader starts core, engine and UI after legacy Veggie Brawl', () => {
  assert.match(security, /veggie-brawl\.js\?v=20260723b/);
  assert.match(security, /veggie-brawl-topdown-core\.js\?v=20260724a/);
  assert.match(security, /veggie-brawl-topdown-engine\.js\?v=20260724a/);
  assert.match(security, /veggie-brawl-topdown-ui\.js\?v=20260724a/);
  assert.match(security, /veggie-brawl-topdown-arena\.css\?v=20260724a/);
});
