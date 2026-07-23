// Hungry Wolves: Veggie Brawl — funny vegetable arena battles.
(function () {
    'use strict';

    if (window.VeggieBrawl) return;

    const VERSION = '20260723b';
    const COIN_TARGETS = Object.freeze({ pear_duel: 100, team_brawl: 150, club_war: 250 });
    const MODE_CONFIG = Object.freeze({
        pear_duel: {
            id: 'pear_duel', name: 'Весёлая груша', badge: '🍐', teamSize: 1, seconds: 90,
            goal: COIN_TARGETS.pear_duel, pear: true,
            description: 'Один на один. Бей весёлую грушу, мешай сопернику и первым выбей 100 монет.'
        },
        team_brawl: {
            id: 'team_brawl', name: 'Толпа на толпу', badge: '🥕', teamSize: 3, seconds: 120,
            goal: COIN_TARGETS.team_brawl, pear: true,
            description: 'Команда 3×3. Общий счёт, предметы, усилители и быстрые возвращения после нокаута.'
        },
        club_war: {
            id: 'club_war', name: 'Клуб против клуба', badge: '🐺', teamSize: 5, seconds: 150,
            goal: COIN_TARGETS.club_war, pear: true,
            description: 'Большая битва 5×5 за рейтинг клуба. Побеждает клуб, первым собравший 250 монет.'
        }
    });

    const VEGGIES = Object.freeze([
        { id: 'cabbage', name: 'Капитан Капуста', emoji: '🥬', role: 'Танк', hp: 150, attack: 12, speed: 8.2, color: '#62d653', quip: 'Хрум-хрум!' },
        { id: 'onion', name: 'Лук-Разбойник', emoji: '🧅', role: 'Ловкач', hp: 105, attack: 10, speed: 12.2, color: '#b684e8', quip: 'Сейчас заплачешь!' },
        { id: 'potato', name: 'Карто-Боец', emoji: '🥔', role: 'Универсал', hp: 125, attack: 12, speed: 9.5, color: '#c99b5b', quip: 'Пюре будет!' },
        { id: 'carrot', name: 'Морковь-Ракета', emoji: '🥕', role: 'Спринтер', hp: 98, attack: 9, speed: 13.5, color: '#ff8a25', quip: 'Свистим!' },
        { id: 'pepper', name: 'Перец-Хулиган', emoji: '🌶️', role: 'Критовик', hp: 108, attack: 15, speed: 10.4, color: '#ff394f', quip: 'Будет остро!' },
        { id: 'beet', name: 'Свёкла-Берсерк', emoji: '🟣', role: 'Силач', hp: 135, attack: 17, speed: 7.8, color: '#a52c72', quip: 'Борщ-бум!' },
        { id: 'garlic', name: 'Чеснок-Ниндзя', emoji: '🧄', role: 'Уклонение', hp: 102, attack: 11, speed: 12.8, color: '#f3e8c8', quip: 'Пшик — и нет меня!' },
        { id: 'tomato', name: 'Томат-Шутник', emoji: '🍅', role: 'Хаос', hp: 112, attack: 13, speed: 10.8, color: '#ff5349', quip: 'Кетчуп пошёл!' },
        { id: 'beans', name: 'Фасоль-Близнец', emoji: '🫘', role: 'Комбо', hp: 118, attack: 11, speed: 11.4, color: '#8dcc61', quip: 'Двойной хлоп!' }
    ]);

    const WEAPONS = Object.freeze([
        { id: 'pan', name: 'Сковорода', icon: '🍳', damage: 18, coins: 4, uses: 3, sound: 'clang' },
        { id: 'rolling_pin', name: 'Скалка', icon: '🪵', damage: 14, coins: 3, uses: 4, sound: 'bonk' },
        { id: 'ladle', name: 'Половник', icon: '🥄', damage: 10, coins: 5, uses: 3, sound: 'plop' },
        { id: 'pot_lid', name: 'Крышка-щит', icon: '🛡️', damage: 8, coins: 2, uses: 4, sound: 'clang', shieldMs: 3500 },
        { id: 'golden_fork', name: 'Золотая вилка', icon: '🔱', damage: 20, coins: 7, uses: 2, sound: 'spark' }
    ]);

    const POWERUPS = Object.freeze([
        { id: 'double', name: 'Монеты ×2', icon: '✖️2', duration: 8000 },
        { id: 'shield', name: 'Крышка защиты', icon: '🛡️', duration: 6500 },
        { id: 'speed', name: 'Турбо-сок', icon: '⚡', duration: 7000 },
        { id: 'rage', name: 'Острый режим', icon: '🔥', duration: 6500 },
        { id: 'heal', name: 'Борщ-аптечка', icon: '🥣', duration: 0 },
        { id: 'magnet', name: 'Магнит монет', icon: '🧲', duration: 7000 }
    ]);

    const EXCLAMATIONS = ['Ой!', 'Пи-и!', 'Бум!', 'Шлёп!', 'Хрум!', 'Ай-ай!', 'Дзынь!', 'Плюх!'];
    const CLUB_NAMES = ['Голодные Волки', 'Крипто-Кухня', 'TON Огород', 'Банда Борща'];

    const baseOpen = window.openWolfFight;
    const baseStop = window.stopWolfFight;
    let selectedMode = localStorage.getItem('veggieBrawlMode') || 'pear_duel';
    let selectedVeggie = localStorage.getItem('veggieBrawlFighter') || 'cabbage';
    let pendingMode = 'training';
    let fightContext = null;
    let battle = null;
    let loop = null;
    let scheduled = [];
    let audioContext = null;
    let pickupCounter = 0;
    const input = { left: false, right: false };

    function veggie(id) {
        return VEGGIES.find(function (item) { return item.id === id; }) || VEGGIES[0];
    }

    function renderLobby() {
        stopBattle();
        const root = document.getElementById('fight-content');
        if (!root) return;
        const chosen = veggie(selectedVeggie);
        root.innerHTML = `
            <section class="brawl-club-hero">
                <div><small>HUNGRY WOLVES FIGHT CLUB</small><h1>Овощной беспредел</h1><p>Афиша клуба остаётся серьёзной. На арене начинается весёлая битва овощей за звонкие монеты.</p></div>
                <span class="brawl-wolf-seal">🐺<b>WOLF<br>ARENA</b></span>
            </section>
            <section class="brawl-mode-section">
                <div class="brawl-section-title"><small>ВЫБЕРИ БАТАЛИЮ</small><h2>Кто громче пищит — тот ещё не проиграл</h2></div>
                <div class="brawl-mode-grid">${Object.values(MODE_CONFIG).map(modeCard).join('')}</div>
            </section>
            <section class="brawl-roster-section">
                <div class="brawl-section-title"><small>ОВОЩНАЯ СОТНЯ</small><h2>Твой боец</h2></div>
                <div class="brawl-roster">${VEGGIES.map(rosterCard).join('')}</div>
                <div class="brawl-selected" style="--veg-color:${chosen.color}">
                    <span class="brawl-selected-emoji">${chosen.emoji}</span>
                    <div><small>${chosen.role.toUpperCase()}</small><h3>${chosen.name}</h3><p>«${chosen.quip}» · Жизнь ${chosen.hp} · Удар ${chosen.attack} · Скорость ${chosen.speed}</p></div>
                    <button class="brawl-start" data-brawl-start>НА АРЕНУ <span>🪙</span></button>
                </div>
            </section>
            <section class="brawl-rules-strip"><span>🍐 Бей грушу</span><span>🍳 Подбирай предметы</span><span>💥 Вырубай соперников</span><span>🪙 Собирай выигрыш</span></section>`;
    }

    function modeCard(mode) {
        const active = mode.id === selectedMode ? 'active' : '';
        return `<button class="brawl-mode-card ${active}" data-brawl-mode="${mode.id}" aria-pressed="${active === 'active'}">
            <span>${mode.badge}</span><div><b>${mode.name}</b><p>${mode.description}</p></div><strong>${mode.teamSize}×${mode.teamSize}</strong>
        </button>`;
    }

    function rosterCard(item) {
        const active = item.id === selectedVeggie ? 'active' : '';
        return `<button class="brawl-roster-card ${active}" data-brawl-veggie="${item.id}" style="--veg-color:${item.color}" aria-pressed="${active === 'active'}">
            <span>${item.emoji}</span><b>${item.name}</b><small>${item.role}</small>
        </button>`;
    }

    function startBattle() {
        stopBattle();
        const config = Object.assign({}, MODE_CONFIG[selectedMode] || MODE_CONFIG.pear_duel);
        const leftTeam = buildTeam('left', config.teamSize, veggie(selectedVeggie), true);
        const rightTeam = buildTeam('right', config.teamSize, randomVeggie(selectedVeggie), false);
        battle = {
            config: config,
            teams: {
                left: { id: 'left', name: pendingMode === 'tournament' ? 'Голодные Волки' : 'Твоя команда', score: 0, knockouts: 0, fighters: leftTeam },
                right: { id: 'right', name: pendingMode === 'tournament' ? CLUB_NAMES[1 + Math.floor(Math.random() * (CLUB_NAMES.length - 1))] : 'Овощные задиры', score: 0, knockouts: 0, fighters: rightTeam }
            },
            pear: { x: 50, mood: 'happy', wobbleUntil: 0 },
            pickups: [],
            ready: false,
            finished: false,
            seconds: config.seconds,
            endsAt: 0,
            lastTick: Date.now(),
            nextPickupAt: Date.now() + 3500,
            suddenDeath: false
        };
        ensureAudio();
        renderArena();
        announce('3');
        later(function () { announce('2'); }, 500);
        later(function () { announce('1'); }, 1000);
        later(function () {
            if (!battle) return;
            battle.ready = true;
            battle.endsAt = Date.now() + config.seconds * 1000;
            battle.lastTick = Date.now();
            announce('ОВОЩИ, В БОЙ!');
            sound('start');
            squeak('В бой!');
        }, 1500);
        loop = setInterval(tick, 50);
    }

    function buildTeam(side, size, leader, playerSide) {
        const result = [];
        const used = new Set([leader.id]);
        for (let index = 0; index < size; index += 1) {
            let template = index === 0 ? leader : randomUnusedVeggie(used);
            used.add(template.id);
            result.push(createFighter(template, side, index, playerSide && index === 0));
        }
        return result;
    }

    function createFighter(template, side, slot, controlled) {
        const spacing = side === 'left' ? 13 + slot * 5.5 : 87 - slot * 5.5;
        return {
            id: side + '-' + slot + '-' + template.id,
            template: template,
            side: side,
            slot: slot,
            controlled: controlled,
            x: spacing,
            y: 0,
            vy: 0,
            hp: template.hp,
            maxHp: template.hp,
            weapon: null,
            weaponUses: 0,
            blockingUntil: 0,
            shieldUntil: 0,
            rageUntil: 0,
            speedUntil: 0,
            doubleUntil: 0,
            magnetUntil: 0,
            stunnedUntil: 0,
            knockedUntil: 0,
            invulnerableUntil: 0,
            lastAttackAt: 0,
            nextAiAt: Date.now() + 700 + Math.random() * 600,
            target: 'pear',
            transient: ''
        };
    }

    function renderArena() {
        const root = document.getElementById('fight-content');
        if (!root || !battle) return;
        const config = battle.config;
        root.innerHTML = `
            <section class="brawl-arena" id="brawl-arena" data-mode="${config.id}">
                <div class="brawl-arena-lights"></div><div class="brawl-crowd">🐺 🥬 🐺 🥕 🐺 🍅 🐺</div>
                <header class="brawl-scoreboard">
                    ${teamScore('left')}<div class="brawl-goal"><small>ПЕРВЫМ ДО</small><b>${config.goal}</b><span>🪙</span><i id="brawl-clock">${config.seconds}</i></div>${teamScore('right')}
                </header>
                <div class="brawl-announcer hide" id="brawl-announcer">ОВОЩИ, В БОЙ!</div>
                <div class="brawl-stage" id="brawl-stage">
                    <div class="brawl-pickups" id="brawl-pickups"></div>
                    ${config.pear ? `<button class="funny-pear" id="funny-pear" data-brawl-target="pear" aria-label="Весёлая груша"><span>🍐</span><b>УДАРЬ<br>МЕНЯ!</b><i>😜</i></button>` : ''}
                    <div id="brawl-fighters">${allFighters().map(fighterMarkup).join('')}</div>
                    <div class="brawl-floor"></div>
                </div>
            </section>
            <section class="brawl-console">
                <div class="brawl-player-status">
                    <span id="brawl-player-face">${playerFighter().template.emoji}</span>
                    <div><b id="brawl-player-name">${playerFighter().template.name}</b><i><em id="brawl-player-hp"></em></i><small id="brawl-player-weapon">Руки готовы к шлепкам</small></div>
                </div>
                <div class="brawl-control-layout">
                    <div class="brawl-move-pad"><button data-brawl-hold="left">←</button><button data-brawl-action="jump">↑</button><button data-brawl-hold="right">→</button></div>
                    <div class="brawl-action-pad">
                        <button data-brawl-action="light"><span>👊</span><b>ШЛЁП</b></button>
                        <button data-brawl-action="heavy"><span>💥</span><b>БАБАХ</b></button>
                        <button data-brawl-action="weapon"><span>🍳</span><b>ПРЕДМЕТ</b></button>
                        <button data-brawl-action="block"><span>🛡️</span><b>БЛОК</b></button>
                    </div>
                </div>
                <div class="brawl-target-switch"><button data-brawl-player-target="pear" class="active">🍐 Бить грушу</button><button data-brawl-player-target="enemy">😵 Мешать врагам</button></div>
                <p id="brawl-tip">Подойди к груше и выбивай монеты. Соперника тоже можно отправить в нокаут.</p>
            </section>`;
        syncArena();
    }

    function teamScore(side) {
        const team = battle.teams[side];
        return `<div class="brawl-team-score ${side}"><small>${team.name}</small><b id="${side}-coin-score">0</b><span>🪙</span><i>KO <em id="${side}-ko-score">0</em></i></div>`;
    }

    function fighterMarkup(fighter) {
        const item = fighter.template;
        return `<button class="veggie-fighter ${fighter.side} ${fighter.controlled ? 'controlled' : ''}" id="${fighter.id}" data-brawl-target="${fighter.id}" style="--x:${fighter.x}%;--y:0px;--veg-color:${item.color}" aria-label="${item.name}">
            <span class="fighter-marker">${fighter.controlled ? 'ТЫ' : fighter.slot + 1}</span>
            <span class="veggie-body"><i class="veggie-face">•ᴗ•</i><b>${item.emoji}</b><em class="weapon-badge"></em></span>
            <span class="veggie-name">${item.name}</span><i class="mini-health"><em></em></i>
        </button>`;
    }

    function tick() {
        if (!battle || battle.finished) return;
        const now = Date.now();
        const dt = Math.min(0.08, Math.max(0.016, (now - battle.lastTick) / 1000));
        battle.lastTick = now;
        if (battle.ready) {
            battle.seconds = Math.max(0, Math.ceil((battle.endsAt - now) / 1000));
            moveControlled(dt, now);
            allFighters().forEach(function (fighter) {
                updateVertical(fighter, dt);
                if (!fighter.controlled) runAi(fighter, now, dt);
                checkPickupCollection(fighter, now);
                respawnIfNeeded(fighter, now);
            });
            keepBounds();
            if (now >= battle.nextPickupAt) spawnPickup(now);
            removeExpiredPickups(now);
            if (battle.seconds <= 0) finishByTime();
        }
        syncArena();
    }

    function moveControlled(dt, now) {
        const fighter = playerFighter();
        if (!fighter || !canMove(fighter, now)) return;
        const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (!axis) return;
        const boost = now < fighter.speedUntil ? 1.55 : 1;
        fighter.x += axis * (11 + fighter.template.speed * 0.65) * boost * dt;
    }

    function runAi(fighter, now, dt) {
        if (!canMove(fighter, now)) return;
        const target = chooseAiTarget(fighter, now);
        const targetX = target.kind === 'pear' ? battle.pear.x : (target.kind === 'pickup' ? target.pickup.x : target.fighter.x);
        const distance = Math.abs(targetX - fighter.x);
        const direction = targetX > fighter.x ? 1 : -1;
        const boost = now < fighter.speedUntil ? 1.45 : 1;
        if (distance > 15) fighter.x += direction * (8 + fighter.template.speed * 0.5) * boost * dt;
        if (now >= fighter.nextAiAt) {
            if (target.kind === 'pickup') { fighter.nextAiAt = now + 350; return; }
            if (distance <= 19) {
                const roll = Math.random();
                if (target.kind === 'fighter' && roll < 0.18) performAction(fighter, 'block');
                else if (fighter.weapon && roll < 0.54) performAction(fighter, 'weapon', target);
                else performAction(fighter, roll < 0.7 ? 'light' : 'heavy', target);
            } else if (Math.random() < 0.13 && fighter.y === 0) jump(fighter);
            fighter.nextAiAt = now + 520 + Math.random() * 780;
        }
    }

    function chooseAiTarget(fighter, now) {
        const enemies = enemyFighters(fighter.side).filter(function (item) { return now >= item.knockedUntil; });
        const team = battle.teams[fighter.side];
        const opponent = battle.teams[otherSide(fighter.side)];
        const pickup = nearestPickup(fighter);
        if (pickup && Math.abs(pickup.x - fighter.x) < 20 && Math.random() < 0.32) return { kind: 'pickup', x: pickup.x, pickup: pickup };
        if (enemies.length && (fighter.slot === 0 || opponent.score > team.score + 15 || Math.random() < 0.28)) {
            return { kind: 'fighter', fighter: nearestByX(fighter, enemies) };
        }
        return { kind: 'pear' };
    }

    function canMove(fighter, now) {
        return now >= fighter.knockedUntil && now >= fighter.stunnedUntil && !fighter.transient.includes('attack');
    }

    function updateVertical(fighter, dt) {
        if (fighter.y === 0 && fighter.vy === 0) return;
        fighter.y += fighter.vy * dt;
        fighter.vy -= 760 * dt;
        if (fighter.y <= 0) { fighter.y = 0; fighter.vy = 0; }
    }

    function jump(fighter) {
        const now = Date.now();
        if (!canMove(fighter, now) || fighter.y > 0) return;
        fighter.vy = 290 + fighter.template.speed * 4;
        sound('jump');
    }

    function performPlayerAction(type) {
        if (!battle || !battle.ready || battle.finished) return;
        const fighter = playerFighter();
        if (type === 'jump') return jump(fighter);
        performAction(fighter, type, resolvePlayerTarget(fighter));
    }

    function performAction(fighter, type, explicitTarget) {
        const now = Date.now();
        if (!canMove(fighter, now) || now - fighter.lastAttackAt < actionCooldown(fighter, type)) return false;
        if (type === 'block') {
            fighter.blockingUntil = now + 650;
            fighter.lastAttackAt = now;
            setTransient(fighter, 'blocking', 520);
            sound('block');
            return true;
        }
        const target = explicitTarget || chooseAttackTarget(fighter);
        if (!target) return false;
        const heavy = type === 'heavy';
        const weaponAttack = type === 'weapon' && fighter.weapon && fighter.weaponUses > 0;
        const range = weaponAttack ? 22 : (heavy ? 18 : 16);
        const targetX = target.kind === 'pear' ? battle.pear.x : target.fighter.x;
        if (Math.abs(targetX - fighter.x) > range) {
            if (fighter.controlled) setTip('Не достаёшь! Подойди ближе или переключи цель.');
            fighter.lastAttackAt = now - actionCooldown(fighter, type) + 180;
            sound('whiff');
            return false;
        }
        fighter.lastAttackAt = now;
        setTransient(fighter, 'attack ' + (weaponAttack ? 'weapon-attack' : heavy ? 'heavy-attack' : 'light-attack'), heavy ? 520 : 330);
        later(function () {
            if (!battle || battle.finished) return;
            resolveHit(fighter, target, heavy, weaponAttack);
        }, heavy ? 230 : 130);
        return true;
    }

    function resolveHit(attacker, target, heavy, weaponAttack) {
        const now = Date.now();
        if (target.kind === 'pear') {
            const weapon = weaponAttack ? attacker.weapon : null;
            const baseCoins = randomInt(heavy ? 3 : 2, heavy ? 6 : 4) + (weapon ? weapon.coins : 0);
            const coins = applyCoinMultipliers(attacker, baseCoins, now);
            addCoins(attacker.side, coins, battle.pear.x, 44, attacker);
            battle.pear.wobbleUntil = now + 380;
            battle.pear.mood = Math.random() < 0.35 ? 'dizzy' : 'laugh';
            consumeWeapon(attacker, weaponAttack);
            sound(weapon ? weapon.sound : heavy ? 'bonk' : 'plop');
            showSpeech(attacker, weapon ? weapon.name + '!' : attacker.template.quip);
            return;
        }
        const defender = target.fighter;
        if (!defender || now < defender.knockedUntil || now < defender.invulnerableUntil) return;
        if (defender.y > 55 && !heavy) { showSpeech(defender, 'Мимо!'); sound('whiff'); return; }
        const weapon = weaponAttack ? attacker.weapon : null;
        let damage = attacker.template.attack + randomInt(2, 7) + (heavy ? 7 : 0) + (weapon ? weapon.damage : 0);
        if (now < attacker.rageUntil) damage = Math.round(damage * 1.45);
        const blocked = now < defender.blockingUntil;
        const shielded = now < defender.shieldUntil;
        if (blocked) damage = Math.round(damage * 0.35);
        if (shielded) damage = Math.round(damage * 0.55);
        defender.hp = Math.max(0, defender.hp - damage);
        defender.x += attacker.side === 'left' ? Math.min(4.5, damage / 7) : -Math.min(4.5, damage / 7);
        const looseCoins = applyCoinMultipliers(attacker, randomInt(1, 3) + (weapon ? weapon.coins : 0), now);
        addCoins(attacker.side, looseCoins, defender.x, 42, attacker);
        setTransient(defender, blocked ? 'blocked-hit' : 'hit', 300);
        showSpeech(defender, blocked ? 'Дзынь!' : randomExclamation());
        sound(blocked || shielded ? 'clang' : weapon ? weapon.sound : heavy ? 'bonk' : 'squeak');
        consumeWeapon(attacker, weaponAttack);
        if (defender.hp <= 0) knockOut(defender, attacker);
    }

    function knockOut(defender, attacker) {
        const now = Date.now();
        defender.knockedUntil = now + 4200;
        defender.stunnedUntil = defender.knockedUntil;
        defender.transient = 'knocked';
        battle.teams[attacker.side].knockouts += 1;
        const koCoins = applyCoinMultipliers(attacker, randomInt(9, 14), now);
        addCoins(attacker.side, koCoins, defender.x, 38, attacker);
        announce('ОВОЩНОЙ НОКАУТ! +' + koCoins + ' 🪙');
        sound('ko');
        showSpeech(defender, 'Я в салат…');
    }

    function respawnIfNeeded(fighter, now) {
        if (!fighter.knockedUntil || now < fighter.knockedUntil || fighter.hp > 0) return;
        fighter.hp = fighter.maxHp;
        fighter.x = fighter.side === 'left' ? 12 + fighter.slot * 4.5 : 88 - fighter.slot * 4.5;
        fighter.y = 0;
        fighter.vy = 0;
        fighter.knockedUntil = 0;
        fighter.stunnedUntil = 0;
        fighter.invulnerableUntil = now + 1800;
        fighter.transient = 'respawning';
        later(function () { if (fighter) fighter.transient = ''; }, 650);
        showSpeech(fighter, 'Я снова хрустящий!');
    }

    function spawnPickup(now) {
        if (!battle || battle.pickups.length >= 4) {
            battle.nextPickupAt = now + 2500;
            return;
        }
        const category = Math.random() < 0.56 ? 'weapon' : 'powerup';
        const source = category === 'weapon' ? WEAPONS : POWERUPS;
        const item = source[Math.floor(Math.random() * source.length)];
        battle.pickups.push({ id: 'pickup-' + (++pickupCounter), category: category, item: item, x: randomInt(24, 76), expiresAt: now + 12000 });
        battle.nextPickupAt = now + randomInt(5200, 8200);
        sound('spawn');
        announce((category === 'weapon' ? 'ПРЕДМЕТ: ' : 'УСИЛИТЕЛЬ: ') + item.name);
    }

    function checkPickupCollection(fighter, now) {
        if (now < fighter.knockedUntil) return;
        const pickup = battle.pickups.find(function (item) { return Math.abs(item.x - fighter.x) <= 5; });
        if (!pickup) return;
        if (pickup.category === 'weapon') {
            fighter.weapon = pickup.item;
            fighter.weaponUses = pickup.item.uses;
            if (pickup.item.shieldMs) fighter.shieldUntil = Math.max(fighter.shieldUntil, now + pickup.item.shieldMs);
        } else {
            applyPowerup(fighter, pickup.item, now);
        }
        battle.pickups = battle.pickups.filter(function (item) { return item.id !== pickup.id; });
        showSpeech(fighter, pickup.item.icon + ' ' + pickup.item.name);
        sound('pickup');
    }

    function applyPowerup(fighter, powerup, now) {
        if (powerup.id === 'double') fighter.doubleUntil = now + powerup.duration;
        else if (powerup.id === 'shield') fighter.shieldUntil = now + powerup.duration;
        else if (powerup.id === 'speed') fighter.speedUntil = now + powerup.duration;
        else if (powerup.id === 'rage') fighter.rageUntil = now + powerup.duration;
        else if (powerup.id === 'magnet') { fighter.magnetUntil = now + powerup.duration; addCoins(fighter.side, 5, fighter.x, 50, fighter); }
        else if (powerup.id === 'heal') fighter.hp = Math.min(fighter.maxHp, fighter.hp + Math.round(fighter.maxHp * 0.42));
    }

    function consumeWeapon(fighter, used) {
        if (!used || !fighter.weapon) return;
        fighter.weaponUses -= 1;
        if (fighter.weaponUses <= 0) {
            showSpeech(fighter, fighter.weapon.name + ' сломалась!');
            fighter.weapon = null;
            fighter.weaponUses = 0;
        }
    }

    function applyCoinMultipliers(fighter, amount, now) {
        let value = amount;
        if (now < fighter.doubleUntil) value *= 2;
        if (now < fighter.magnetUntil) value += 1;
        return Math.max(1, Math.round(value));
    }

    function addCoins(side, amount, x, y, sourceFighter) {
        if (!battle || battle.finished) return;
        battle.teams[side].score += amount;
        spawnCoinBurst(side, amount, x, y);
        if (sourceFighter && sourceFighter.controlled) haptic(amount >= 8 ? 'heavy' : 'medium');
        sound('coin');
        if (battle.teams[side].score >= battle.config.goal) finishBattle(side);
    }

    function spawnCoinBurst(side, amount, x, y) {
        const stage = document.getElementById('brawl-stage');
        if (!stage) return;
        const count = Math.min(12, Math.max(3, Math.ceil(amount / 2)));
        for (let index = 0; index < count; index += 1) {
            const coin = document.createElement('span');
            coin.className = 'flying-brawl-coin ' + side;
            coin.textContent = '🪙';
            coin.style.setProperty('--coin-x', x + '%');
            coin.style.setProperty('--coin-y', y + '%');
            coin.style.setProperty('--coin-dx', (randomInt(-55, 55)) + 'px');
            coin.style.setProperty('--coin-dy', (randomInt(-85, -25)) + 'px');
            coin.style.animationDelay = (index * 18) + 'ms';
            stage.appendChild(coin);
            later(function () { coin.remove(); }, 900);
        }
    }

    function removeExpiredPickups(now) {
        battle.pickups = battle.pickups.filter(function (item) { return now < item.expiresAt; });
    }

    function finishByTime() {
        const left = battle.teams.left.score;
        const right = battle.teams.right.score;
        if (left === right && !battle.suddenDeath) {
            battle.suddenDeath = true;
            battle.endsAt = Date.now() + 15000;
            battle.config.goal = left + 1;
            announce('ЗОЛОТАЯ МОНЕТА!');
            return;
        }
        finishBattle(left >= right ? 'left' : 'right');
    }

    function finishBattle(winnerSide) {
        if (!battle || battle.finished) return;
        battle.finished = true;
        clearInterval(loop);
        loop = null;
        clearInputs();
        const won = winnerSide === 'left';
        const playerScore = battle.teams.left.score;
        const enemyScore = battle.teams.right.score;
        const rewardBase = selectedMode === 'club_war' ? 300 : selectedMode === 'team_brawl' ? 150 : 75;
        const reward = Math.max(10, Math.round(playerScore * 0.35) + (won ? rewardBase : 0));
        const stats = window.readLocalJson ? window.readLocalJson('veggieBrawlStats', { wins: 0, losses: 0, coins: 0, knockouts: 0 }) : { wins: 0, losses: 0, coins: 0, knockouts: 0 };
        stats.wins += won ? 1 : 0;
        stats.losses += won ? 0 : 1;
        stats.coins += playerScore;
        stats.knockouts += battle.teams.left.knockouts;
        localStorage.setItem('veggieBrawlStats', JSON.stringify(stats));
        window.rum = (window.rum || 0) + reward;
        window.updateUI?.();
        window.saveAll?.();
        if (pendingMode === 'tournament' && window.ClubLeaguePlatform) {
            window.ClubLeaguePlatform.recordFightResult(won, fightContext);
        }
        sound(won ? 'victory' : 'defeat');
        renderResult(won, playerScore, enemyScore, reward, stats);
    }

    function renderResult(won, playerScore, enemyScore, reward, stats) {
        const root = document.getElementById('fight-content');
        if (!root) return;
        root.innerHTML = `<section class="brawl-result ${won ? 'win' : 'lose'}">
            <small>HUNGRY WOLVES · VEGGIE BRAWL</small>
            <div class="brawl-result-cast"><span>${veggie(selectedVeggie).emoji}</span><b>${won ? '🏆' : '🥴'}</b><span>🍐</span></div>
            <h1>${won ? 'ОВОЩНАЯ ПОБЕДА!' : 'САЛАТНЫЙ РАЗГРОМ'}</h1>
            <p>${won ? 'Монеты звенят, груша смеётся, клуб празднует.' : 'Овощ помят, но снова готов к весёлому реваншу.'}</p>
            <div class="brawl-result-score"><span><small>Твоя команда</small><b>${playerScore} 🪙</b></span><i>:</i><span><small>Соперники</small><b>${enemyScore} 🪙</b></span></div>
            <div class="brawl-result-stats"><span>Награда <b>+${reward} RUMIR</b></span><span>Всего побед <b>${stats.wins}</b></span><span>Нокаутов <b>${stats.knockouts}</b></span></div>
            <button class="brawl-start" data-brawl-rematch>РЕВАНШ</button>
            <button class="brawl-secondary" data-brawl-lobby>Выбрать другую баталию</button>
        </section>`;
    }

    function syncArena() {
        if (!battle) return;
        const clock = document.getElementById('brawl-clock');
        if (clock) clock.textContent = battle.seconds;
        ['left', 'right'].forEach(function (side) {
            const score = document.getElementById(side + '-coin-score');
            const ko = document.getElementById(side + '-ko-score');
            if (score) score.textContent = battle.teams[side].score;
            if (ko) ko.textContent = battle.teams[side].knockouts;
        });
        const pear = document.getElementById('funny-pear');
        if (pear) {
            pear.classList.toggle('wobble', Date.now() < battle.pear.wobbleUntil);
            const face = pear.querySelector('i');
            if (face) face.textContent = battle.pear.mood === 'dizzy' ? '😵' : battle.pear.mood === 'laugh' ? '😂' : '😜';
        }
        const pickupRoot = document.getElementById('brawl-pickups');
        if (pickupRoot) pickupRoot.innerHTML = battle.pickups.map(pickupMarkup).join('');
        allFighters().forEach(syncFighter);
        const player = playerFighter();
        const hp = document.getElementById('brawl-player-hp');
        const weapon = document.getElementById('brawl-player-weapon');
        if (hp && player) hp.style.width = Math.max(0, player.hp / player.maxHp * 100) + '%';
        if (weapon && player) weapon.textContent = player.weapon ? player.weapon.icon + ' ' + player.weapon.name + ' · ' + player.weaponUses + ' удара' : activePowerText(player);
    }

    function pickupMarkup(pickup) {
        return `<span class="brawl-pickup ${pickup.category}" style="--pickup-x:${pickup.x}%" title="${pickup.item.name}"><b>${pickup.item.icon}</b><small>${pickup.item.name}</small></span>`;
    }

    function syncFighter(fighter) {
        const node = document.getElementById(fighter.id);
        if (!node) return;
        const now = Date.now();
        node.style.setProperty('--x', fighter.x + '%');
        node.style.setProperty('--y', (-fighter.y) + 'px');
        node.className = 'veggie-fighter ' + fighter.side + (fighter.controlled ? ' controlled' : '') + (fighter.transient ? ' ' + fighter.transient : '') + (now < fighter.knockedUntil ? ' knocked' : '') + (now < fighter.shieldUntil ? ' shielded' : '') + (now < fighter.rageUntil ? ' enraged' : '') + (now < fighter.invulnerableUntil ? ' invulnerable' : '');
        const health = node.querySelector('.mini-health em');
        if (health) health.style.width = Math.max(0, fighter.hp / fighter.maxHp * 100) + '%';
        const weapon = node.querySelector('.weapon-badge');
        if (weapon) weapon.textContent = fighter.weapon ? fighter.weapon.icon : '';
    }

    function activePowerText(fighter) {
        const now = Date.now();
        if (now < fighter.doubleUntil) return '✖️2 Монеты удваиваются';
        if (now < fighter.shieldUntil) return '🛡️ Защитная крышка активна';
        if (now < fighter.speedUntil) return '⚡ Турбо-сок активен';
        if (now < fighter.rageUntil) return '🔥 Острый режим активен';
        if (now < fighter.magnetUntil) return '🧲 Магнит монет активен';
        return 'Руки готовы к шлепкам';
    }

    function resolvePlayerTarget(fighter) {
        if (fighter.target === 'pear') return { kind: 'pear' };
        const enemies = enemyFighters(fighter.side).filter(function (item) { return Date.now() >= item.knockedUntil; });
        return enemies.length ? { kind: 'fighter', fighter: nearestByX(fighter, enemies) } : { kind: 'pear' };
    }

    function chooseAttackTarget(fighter) {
        return fighter.controlled ? resolvePlayerTarget(fighter) : chooseAiTarget(fighter, Date.now());
    }

    function actionCooldown(fighter, type) {
        const base = type === 'heavy' ? 720 : type === 'weapon' ? 620 : type === 'block' ? 480 : 360;
        return Math.max(220, base - fighter.template.speed * 9);
    }

    function keepBounds() {
        allFighters().forEach(function (fighter) { fighter.x = clamp(fighter.x, 5, 95); });
    }

    function allFighters() {
        if (!battle) return [];
        return battle.teams.left.fighters.concat(battle.teams.right.fighters);
    }

    function playerFighter() {
        return battle?.teams.left.fighters.find(function (fighter) { return fighter.controlled; }) || battle?.teams.left.fighters[0] || null;
    }

    function enemyFighters(side) {
        return battle?.teams[otherSide(side)].fighters || [];
    }

    function otherSide(side) { return side === 'left' ? 'right' : 'left'; }

    function nearestByX(source, list) {
        return list.reduce(function (best, item) { return !best || Math.abs(item.x - source.x) < Math.abs(best.x - source.x) ? item : best; }, null);
    }

    function nearestPickup(fighter) {
        return battle.pickups.reduce(function (best, item) { return !best || Math.abs(item.x - fighter.x) < Math.abs(best.x - fighter.x) ? item : best; }, null);
    }

    function randomVeggie(excludeId) {
        const pool = VEGGIES.filter(function (item) { return item.id !== excludeId; });
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function randomUnusedVeggie(used) {
        const pool = VEGGIES.filter(function (item) { return !used.has(item.id); });
        return pool.length ? pool[Math.floor(Math.random() * pool.length)] : VEGGIES[Math.floor(Math.random() * VEGGIES.length)];
    }

    function setTransient(fighter, value, duration) {
        fighter.transient = value;
        later(function () { if (fighter && fighter.transient === value) fighter.transient = ''; }, duration);
    }

    function announce(text) {
        const node = document.getElementById('brawl-announcer');
        if (!node) return;
        node.textContent = text;
        node.classList.remove('hide');
        later(function () { if (node.isConnected) node.classList.add('hide'); }, 650);
    }

    function setTip(text) {
        const node = document.getElementById('brawl-tip');
        if (node) node.textContent = text;
    }

    function showSpeech(fighter, text) {
        const node = document.getElementById(fighter.id);
        if (!node) return;
        const bubble = document.createElement('span');
        bubble.className = 'veggie-speech';
        bubble.textContent = text;
        node.appendChild(bubble);
        later(function () { bubble.remove(); }, 850);
    }

    function randomExclamation() { return EXCLAMATIONS[Math.floor(Math.random() * EXCLAMATIONS.length)]; }
    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

    function later(fn, delay) {
        const id = setTimeout(function () {
            scheduled = scheduled.filter(function (item) { return item !== id; });
            fn();
        }, delay);
        scheduled.push(id);
        return id;
    }

    function stopBattle() {
        clearInterval(loop);
        loop = null;
        scheduled.forEach(clearTimeout);
        scheduled = [];
        clearInputs();
        battle = null;
        try { window.speechSynthesis?.cancel(); } catch (_) { /* optional */ }
    }

    function clearInputs() { input.left = false; input.right = false; }

    function ensureAudio() {
        if (audioContext) {
            if (audioContext.state === 'suspended') audioContext.resume().catch(function () {});
            return audioContext;
        }
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        try { audioContext = new AudioCtor(); } catch (_) { audioContext = null; }
        return audioContext;
    }

    function sound(type) {
        const ctx = ensureAudio();
        if (!ctx) return;
        const presets = {
            start: [420, 0.22, 'sawtooth', 0.09], coin: [880, 0.07, 'sine', 0.055],
            plop: [180, 0.08, 'sine', 0.05], bonk: [92, 0.13, 'square', 0.08],
            clang: [330, 0.1, 'triangle', 0.06], squeak: [620, 0.09, 'square', 0.045],
            spark: [1040, 0.16, 'sawtooth', 0.07], pickup: [720, 0.12, 'triangle', 0.055],
            spawn: [510, 0.09, 'sine', 0.035], block: [250, 0.07, 'triangle', 0.04],
            jump: [360, 0.09, 'triangle', 0.035], whiff: [760, 0.04, 'sine', 0.02],
            ko: [72, 0.3, 'sawtooth', 0.1], victory: [660, 0.42, 'triangle', 0.09],
            defeat: [90, 0.4, 'sawtooth', 0.065]
        };
        const preset = presets[type] || presets.plop;
        try {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = preset[2];
            oscillator.frequency.setValueAtTime(preset[0], ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, preset[0] * (['coin', 'spark', 'victory'].includes(type) ? 1.35 : 0.58)), ctx.currentTime + preset[1]);
            gain.gain.setValueAtTime(preset[3], ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + preset[1]);
            oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + preset[1]);
        } catch (_) { /* sound is optional */ }
    }

    function squeak(text) {
        try {
            if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU'; utterance.rate = 1.3; utterance.pitch = 1.75; utterance.volume = 0.55;
            window.speechSynthesis.speak(utterance);
        } catch (_) { /* voice is optional */ }
    }

    function haptic(type) {
        try {
            const feedback = window.Telegram?.WebApp?.HapticFeedback;
            if (feedback) feedback.impactOccurred(type || 'light');
        } catch (_) { /* Telegram is optional */ }
    }

    document.addEventListener('click', function (event) {
        const screen = document.getElementById('fight-screen');
        if (!screen?.classList.contains('active')) return;
        const modeButton = event.target.closest('[data-brawl-mode]');
        if (modeButton && !battle) {
            selectedMode = modeButton.dataset.brawlMode;
            localStorage.setItem('veggieBrawlMode', selectedMode);
            renderLobby();
            return;
        }
        const veggieButton = event.target.closest('[data-brawl-veggie]');
        if (veggieButton && !battle) {
            selectedVeggie = veggieButton.dataset.brawlVeggie;
            localStorage.setItem('veggieBrawlFighter', selectedVeggie);
            renderLobby();
            return;
        }
        if (event.target.closest('[data-brawl-start]')) { startBattle(); return; }
        if (event.target.closest('[data-brawl-rematch]')) { startBattle(); return; }
        if (event.target.closest('[data-brawl-lobby]')) { renderLobby(); return; }
        const action = event.target.closest('[data-brawl-action]');
        if (action && battle) { performPlayerAction(action.dataset.brawlAction); return; }
        const target = event.target.closest('[data-brawl-player-target]');
        if (target && battle) {
            playerFighter().target = target.dataset.brawlPlayerTarget;
            document.querySelectorAll('[data-brawl-player-target]').forEach(function (node) { node.classList.toggle('active', node === target); });
            setTip(playerFighter().target === 'pear' ? 'Цель: весёлая груша.' : 'Цель: ближайший соперник.');
            return;
        }
        const arenaTarget = event.target.closest('[data-brawl-target]');
        if (arenaTarget && battle) {
            const id = arenaTarget.dataset.brawlTarget;
            playerFighter().target = id === 'pear' ? 'pear' : 'enemy';
            setTip(id === 'pear' ? 'Груша выбрана целью.' : 'Соперник выбран целью.');
        }
    }, true);

    document.addEventListener('pointerdown', function (event) {
        const button = event.target.closest('[data-brawl-hold]');
        if (!button || !battle) return;
        event.preventDefault();
        input[button.dataset.brawlHold] = true;
    }, true);

    ['pointerup', 'pointercancel'].forEach(function (name) {
        document.addEventListener(name, function (event) {
            const button = event.target.closest?.('[data-brawl-hold]');
            if (button) input[button.dataset.brawlHold] = false;
        }, true);
    });

    document.addEventListener('keydown', function (event) {
        if (!battle || !document.getElementById('fight-screen')?.classList.contains('active')) return;
        if (event.code === 'ArrowLeft') input.left = true;
        else if (event.code === 'ArrowRight') input.right = true;
        else if (!event.repeat && (event.code === 'ArrowUp' || event.code === 'KeyW')) performPlayerAction('jump');
        else if (!event.repeat && event.code === 'KeyJ') performPlayerAction('light');
        else if (!event.repeat && event.code === 'KeyK') performPlayerAction('heavy');
        else if (!event.repeat && event.code === 'KeyL') performPlayerAction('weapon');
        else if (!event.repeat && event.code === 'KeyB') performPlayerAction('block');
    });

    document.addEventListener('keyup', function (event) {
        if (event.code === 'ArrowLeft') input.left = false;
        if (event.code === 'ArrowRight') input.right = false;
    });

    window.renderFightScreen = renderLobby;
    window.openWolfFight = function (nextMode, nextContext) {
        pendingMode = nextMode || 'training';
        fightContext = nextContext || null;
        if (typeof baseOpen === 'function') baseOpen(nextMode, nextContext);
        else window.switchScreen?.('fight');
        later(renderLobby, 0);
    };
    window.stopWolfFight = function () {
        stopBattle();
        if (typeof baseStop === 'function') baseStop();
    };
    window.VeggieBrawl = Object.freeze({
        version: VERSION,
        modes: MODE_CONFIG,
        veggies: VEGGIES,
        weapons: WEAPONS,
        powerups: POWERUPS,
        render: renderLobby,
        start: startBattle,
        stop: stopBattle
    });
})();
