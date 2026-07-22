import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/fight.js', import.meta.url), 'utf8');
const literal = (name, terminator = ';') => {
  const match = source.match(new RegExp(`const ${name} = ([\\s\\S]*?\\n    [\\]}]${terminator})`));
  if (!match) throw new Error(`Не найден ${name}`);
  return Function(`"use strict"; return (${match[1].slice(0, -1)});`)();
};

const fighters = literal('FIGHTERS');
const actions = literal('ACTIONS');
const styles = literal('AI_STYLES');

function randomFactory(seed) {
  return function random() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function choose(weightMap, random) {
  const entries = Object.entries(weightMap);
  let roll = random() * entries.reduce((sum, entry) => sum + entry[1], 0);
  for (const entry of entries) {
    roll -= entry[1];
    if (roll <= 0) return entry[0];
  }
  return 'punch';
}

function styled(fighter, type) {
  const action = { ...actions[type] };
  if (fighter.archetype === 'rushdown' && type === 'kick') { action.cooldown -= 55; action.range += 2; }
  if (fighter.archetype === 'tank' && type === 'heavy') action.power += 0.16;
  if (fighter.archetype === 'counter' && type === 'block') action.cost = Math.max(2, action.cost - 1);
  if (fighter.archetype === 'pressure' && type === 'heavy') action.stun = (action.stun || 0) + 0.09;
  if (fighter.archetype === 'trickster' && type === 'kick') action.accuracy += 0.07;
  if (fighter.archetype === 'striker' && (type === 'kick' || type === 'punch')) action.power += 0.09;
  if (fighter.archetype === 'technical' && type === 'punch') action.accuracy += 0.05;
  if (fighter.archetype === 'grappler' && type === 'heavy') action.power += 0.11;
  return action;
}

function recover(combatant, elapsedMs) {
  const base = 7.5 + combatant.speed / 17;
  const rate = combatant.archetype === 'rushdown' ? base * 1.22 : base;
  combatant.stamina = Math.min(100, combatant.stamina + rate * elapsedMs / 1000);
}

function simulate(leftBase, rightBase, seed) {
  const random = randomFactory(seed);
  const sides = [leftBase, rightBase].map((fighter) => ({ ...fighter, currentHp: fighter.hp, stamina: 100, meter: 0, readyAt: 0, blockUntil: 0, combo: 0 }));
  let now = 0;
  let previous = 0;
  while (now < 60000 && sides[0].currentHp > 0 && sides[1].currentHp > 0) {
    const attackerIndex = sides[0].readyAt <= sides[1].readyAt ? 0 : 1;
    const defenderIndex = 1 - attackerIndex;
    const attacker = sides[attackerIndex];
    const defender = sides[defenderIndex];
    now = Math.max(now, attacker.readyAt);
    const elapsed = now - previous;
    sides.forEach((fighter) => recover(fighter, elapsed));
    previous = now;
    const profile = styles[attacker.archetype];
    let type = attacker.meter >= 100 && attacker.stamina >= actions.special.cost && random() < 0.68 ? 'special' : choose(profile.weights, random);
    if (type === 'dodge') type = 'block';
    let action = styled(attacker, type);
    if (attacker.stamina < action.cost) { type = 'block'; action = styled(attacker, type); }
    attacker.stamina = Math.max(0, attacker.stamina - action.cost);
    attacker.readyAt = now + Math.max(170, action.cooldown - attacker.speed * 1.7);
    if (type === 'block') {
      attacker.blockUntil = now + (attacker.archetype === 'counter' ? 1000 : 820);
      continue;
    }
    if (type === 'special') attacker.meter = 0;
    let accuracy = action.accuracy + (attacker.speed - defender.speed) / 500;
    if (attacker.archetype === 'trickster' && type === 'kick') accuracy += 0.08;
    if (random() > Math.min(1, accuracy)) { attacker.combo = 0; continue; }
    attacker.combo += 1;
    const comboBonus = 1 + Math.min(0.32, Math.max(0, attacker.combo - 1) * 0.07);
    let damage = Math.max(2, Math.round(attacker.attack * action.power * (0.075 + random() * 0.026) * comboBonus));
    if (now < defender.blockUntil) {
      const reduction = 0.5 + defender.guard / 250;
      damage = Math.max(1, Math.round(damage * (1 - Math.min(0.8, reduction))));
      defender.blockUntil = 0;
      defender.meter = Math.min(100, defender.meter + (defender.archetype === 'counter' ? 24 : 14));
    }
    defender.currentHp -= damage;
    attacker.meter = Math.min(100, attacker.meter + (action.meter || 0) + Math.min(10, attacker.combo * 2));
  }
  const leftRatio = sides[0].currentHp / sides[0].hp;
  const rightRatio = sides[1].currentHp / sides[1].hp;
  return leftRatio === rightRatio ? (random() < 0.5 ? 0 : 1) : (leftRatio > rightRatio ? 0 : 1);
}

const boutsPerPair = Number(process.env.BALANCE_BOUTS || 300);
const totals = new Map(fighters.map((fighter) => [fighter.id, { wins: 0, bouts: 0, worst: 1, best: 0 }]));
for (let left = 0; left < fighters.length; left += 1) {
  for (let right = left + 1; right < fighters.length; right += 1) {
    let leftWins = 0;
    for (let bout = 0; bout < boutsPerPair; bout += 1) {
      if (simulate(fighters[left], fighters[right], 100000 + left * 10000 + right * 1000 + bout) === 0) leftWins += 1;
    }
    const leftRate = leftWins / boutsPerPair;
    const rightRate = 1 - leftRate;
    for (const [fighter, rate] of [[fighters[left], leftRate], [fighters[right], rightRate]]) {
      const total = totals.get(fighter.id);
      total.wins += rate * boutsPerPair;
      total.bouts += boutsPerPair;
      total.worst = Math.min(total.worst, rate);
      total.best = Math.max(total.best, rate);
    }
  }
}

console.log('fighter       avg     worst   best');
for (const fighter of fighters) {
  const total = totals.get(fighter.id);
  console.log(`${fighter.id.padEnd(13)} ${(total.wins / total.bouts * 100).toFixed(1).padStart(5)}%  ${(total.worst * 100).toFixed(1).padStart(5)}%  ${(total.best * 100).toFixed(1).padStart(5)}%`);
}

const outside = fighters.filter((fighter) => {
  const total = totals.get(fighter.id);
  const average = total.wins / total.bouts;
  return average < 0.42 || average > 0.58;
});
if (outside.length) {
  console.error(`Баланс вне коридора 42–58%: ${outside.map((fighter) => fighter.id).join(', ')}`);
  process.exitCode = 1;
}
