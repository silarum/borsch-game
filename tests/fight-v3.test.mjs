import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const fightSource = readFileSync(new URL('../js/fight-v3-patch.js', import.meta.url), 'utf8');
const fightStyles = readFileSync(new URL('../css/fight-v3.css', import.meta.url), 'utf8');
const securitySource = readFileSync(new URL('../js/security.js', import.meta.url), 'utf8');

test('fight V3 JavaScript parses successfully', () => {
    assert.doesNotThrow(() => new vm.Script(fightSource));
});

test('fight V3 contains mobile movement and distance hitboxes', () => {
    assert.match(fightSource, /data-v3-move/);
    assert.match(fightSource, /function distance\(\)/);
    assert.match(fightSource, /action\.range/);
    assert.match(fightSource, /function movement\(type\)/);
    assert.match(fightSource, /SpeechSynthesisUtterance/);
});

test('fight V3 styles include moving combatants and mobile controls', () => {
    assert.match(fightStyles, /\.combatant-track/);
    assert.match(fightStyles, /\.movement-pad/);
    assert.match(fightStyles, /fighterSpecialV3/);
});

test('security loader activates fight V3 after core scripts', () => {
    assert.match(securitySource, /fight-v3\.css\?v=20260723a/);
    assert.match(securitySource, /fight-v3-patch\.js\?v=20260723a/);
});
