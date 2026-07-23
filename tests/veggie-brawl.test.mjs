import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/veggie-brawl.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../css/veggie-brawl.css', import.meta.url), 'utf8');
const security = readFileSync(new URL('../js/security.js', import.meta.url), 'utf8');

test('Veggie Brawl JavaScript parses', () => {
    assert.doesNotThrow(() => new vm.Script(source));
});

test('Veggie Brawl exports three coin battle modes', () => {
    const listeners = {};
    const storage = new Map();
    const window = {};
    const context = {
        window,
        document: {
            addEventListener(name, handler) { listeners[name] = handler; },
            getElementById() { return null; },
            querySelectorAll() { return []; }
        },
        localStorage: {
            getItem(key) { return storage.get(key) ?? null; },
            setItem(key, value) { storage.set(key, String(value)); }
        },
        setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
        console, Math, Date, Object, Array, Set, Map
    };
    window.window = window;
    vm.runInNewContext(source, context);
    assert.equal(window.VeggieBrawl.modes.pear_duel.goal, 100);
    assert.equal(window.VeggieBrawl.modes.team_brawl.teamSize, 3);
    assert.equal(window.VeggieBrawl.modes.club_war.teamSize, 5);
    assert.equal(window.VeggieBrawl.veggies.length, 9);
    assert.equal(window.VeggieBrawl.weapons.length, 5);
    assert.equal(window.VeggieBrawl.powerups.length, 6);
});

test('arena includes pear, coins, pickups, knockout and mobile controls', () => {
    assert.match(source, /class="funny-pear"/);
    assert.match(source, /flying-brawl-coin/);
    assert.match(source, /function knockOut/);
    assert.match(source, /function spawnPickup/);
    assert.match(source, /data-brawl-hold="left"/);
    assert.match(source, /ClubLeaguePlatform\.recordFightResult/);
});

test('Veggie Brawl styles cover the complete battle UI', () => {
    assert.match(styles, /\.brawl-mode-grid/);
    assert.match(styles, /\.funny-pear/);
    assert.match(styles, /\.veggie-fighter/);
    assert.match(styles, /\.brawl-pickup/);
    assert.match(styles, /\.flying-brawl-coin/);
    assert.match(styles, /@media \(max-width: 560px\)/);
});

test('security loader activates Veggie Brawl after the legacy fight module', () => {
    assert.match(security, /veggie-brawl\.css\?v=20260723b/);
    assert.match(security, /veggie-brawl\.js\?v=20260723b/);
    assert.match(security, /fightScript\.addEventListener\('load', loadVeggieBrawl/);
});
