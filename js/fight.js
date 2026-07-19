// ================== ГОЛОДНЫЕ ВОЛКИ: АРКАДНЫЙ ФАЙТИНГ ==================
(function () {
    'use strict';

    const FIGHTERS = [
        { id: 'alpha', name: 'RUMIR Alpha', title: 'Первый волк', role: 'Универсал', archetype: 'balanced', sprite: 'assets/fight/fighters/alpha.webp', color: '#4ee8ff', hp: 116, attack: 79, speed: 74, guard: 76, special: 'Разряд Румира', passive: 'Вожак: каждая серия быстрее заряжает волчью энергию.', bio: 'Сбалансированный лидер стаи. Быстро собирает комбо и прощает ошибки в защите.' },
        { id: 'luna', name: 'Luna Hash', title: 'Лунный импульс', role: 'Скорость', archetype: 'rushdown', sprite: 'assets/fight/fighters/luna.webp', color: '#b65cff', hp: 98, attack: 73, speed: 96, guard: 62, special: 'Лунный хеш', passive: 'Турбо-хеш: выносливость восстанавливается на 22% быстрее.', bio: 'Молниеносная кикбоксёрша. Давит сериями и быстрее всех восстанавливает выносливость.' },
        { id: 'fenrir', name: 'Fenrir Block', title: 'Золотая крепость', role: 'Тяжеловес', archetype: 'tank', sprite: 'assets/fight/fighters/fenrir.webp', color: '#ffbd45', hp: 138, attack: 91, speed: 51, guard: 92, special: 'Разлом Фенрира', passive: 'Броня блока: получает на 10% меньше прямого урона.', bio: 'Тяжёлый боец ближней дистанции. Медленный, но его броня и силовые удары меняют ход раунда.' },
        { id: 'she-wolf', name: 'She-Wolf TON', title: 'Кольцо прилива', role: 'Контратака', archetype: 'counter', sprite: 'assets/fight/fighters/she-wolf.webp', color: '#27d7ff', hp: 106, attack: 77, speed: 86, guard: 84, special: 'TON-цунами', passive: 'Ответ волчицы: точный блок даёт усиленный заряд энергии.', bio: 'Мастер уклонений и ответных атак. Получает больше энергии за точный блок.' },
        { id: 'khan', name: 'Khan Byte', title: 'Оранжевый клинок', role: 'Самбист', archetype: 'pressure', sprite: 'assets/fight/fighters/khan.webp', color: '#ff8b32', hp: 120, attack: 85, speed: 70, guard: 78, special: 'Укус байта', passive: 'Жёсткий прессинг: силовые атаки чаще оглушают.', bio: 'Силовой самбист с опасным прессингом. Тяжёлый удар чаще оглушает соперника.' },
        { id: 'veles', name: 'Neon Veles', title: 'Ветер сети', role: 'Капоэйра', archetype: 'trickster', sprite: 'assets/fight/fighters/veles.webp', color: '#3fe9e1', hp: 101, attack: 74, speed: 93, guard: 66, special: 'Вихрь Велеса', passive: 'Неоновый след: кики точнее, окно уклонения дольше.', bio: 'Непредсказуемый мастер движения. Его кики точнее, а уклонение длится дольше.' },
        { id: 'mara', name: 'Mara Chain', title: 'Алая цепь', role: 'Муай-тай', archetype: 'striker', sprite: 'assets/fight/fighters/mara.webp', color: '#ff4d38', hp: 110, attack: 88, speed: 80, guard: 68, special: 'Цепь Мары', passive: 'Алая серия: каждый следующий удар комбо заметно сильнее.', bio: 'Жёсткий ударник. Серии быстро разгоняют урон, но требуют контроля выносливости.' },
        { id: 'satoshi', name: 'Satoshi Ryū', title: 'Красный дракон', role: 'Карате', archetype: 'technical', sprite: 'assets/fight/fighters/satoshi.webp', color: '#ff395d', hp: 108, attack: 82, speed: 84, guard: 81, special: 'Дракон консенсуса', passive: 'Точный расчёт: атаки точнее, окно продолжения серии шире.', bio: 'Точный технарь. Хорошо наказывает промахи и дольше сохраняет серию комбо.' },
        { id: 'borz', name: 'Borz Frost', title: 'Ледяной захват', role: 'Борец', archetype: 'grappler', sprite: 'assets/fight/fighters/borz.webp', color: '#79cfff', hp: 130, attack: 87, speed: 61, guard: 88, special: 'Морозный волк', passive: 'Ледяной захват: бросок мощнее, а блок требует меньше сил.', bio: 'Выносливый борец с мощной защитой. Его блок расходует меньше энергии.' }
    ];

    const ACTIONS = {
        punch: { label: 'ДЖЕБ', hint: 'быстро', pose: 'punch', cost: 7, power: 0.78, accuracy: 0.95, meter: 11, cooldown: 300 },
        kick: { label: 'КИК', hint: 'дальше', pose: 'kick', cost: 13, power: 1.08, accuracy: 0.86, meter: 16, cooldown: 470 },
        heavy: { label: 'СИЛОВОЙ', hint: 'оглушает', pose: 'punch', cost: 20, power: 1.48, accuracy: 0.72, meter: 23, cooldown: 680, stun: 0.24 },
        uppercut: { label: 'АППЕРКОТ', hint: 'ломает блок', pose: 'punch', cost: 17, power: 1.28, accuracy: 0.8, meter: 20, cooldown: 620, stun: 0.2, guardBreak: 0.45 },
        throw: { label: 'БРОСОК', hint: 'без блока', pose: 'special', cost: 22, power: 1.55, accuracy: 0.72, meter: 24, cooldown: 820, unblockable: true },
        block: { label: 'БЛОК', hint: 'контр', pose: 'idle', cost: 5, cooldown: 360 },
        dodge: { label: 'УКЛОН', hint: 'манёвр', pose: 'kick', cost: 16, cooldown: 620 },
        special: { label: 'СУПЕР', hint: '100%', pose: 'special', cost: 24, power: 2.35, accuracy: 1, meter: 0, cooldown: 1050, stun: 0.5 }
    };

    const CLUB_LADDER = [
        { name: 'Волчья сотня', badge: '🐺', rating: 1680, district: 'Центр' },
        { name: 'Block Raiders', badge: '⛓', rating: 1594, district: 'Север' },
        { name: 'TON Guardians', badge: '◈', rating: 1518, district: 'Город' },
        { name: 'Rumir Forge', badge: '◆', rating: 1462, district: 'Юг' },
        { name: 'Crypto Kitchen', badge: '🥘', rating: 1390, district: 'Запад' }
    ];

    const FIGHT_ART_VERSION = '20260719d';
    const POSE_POSITION = {
        idle: { x: '0%', y: '0%' },
        punch: { x: '-100%', y: '0%' },
        kick: { x: '0%', y: '-100%' },
        special: { x: '-100%', y: '-100%' }
    };
    let selectedId = localStorage.getItem('wolfSelectedFighter') || 'alpha';
    let activeTab = 'fighters';
    let battle = null;
    let fightTimer = null;
    let pendingMode = 'training';
    let fightContext = null;
    let scheduled = [];
    let audioContext = null;
    let audioMuted = localStorage.getItem('wolfFightMuted') === 'true';
    let keyboardBound = false;
    let stats = window.readLocalJson('wolfFightStats', { rating: 1200, clubRating: 1680, wins: 0, losses: 0, streak: 0, bestCombo: 0 });

    function fighterById(id) {
        return FIGHTERS.find(function (fighter) { return fighter.id === id; }) || FIGHTERS[0];
    }

    function saveStats() {
        localStorage.setItem('wolfFightStats', JSON.stringify(stats));
        localStorage.setItem('wolfSelectedFighter', selectedId);
    }

    function spriteMarkup(fighter, className, pose) {
        const frame = POSE_POSITION[pose || 'idle'] || POSE_POSITION.idle;
        return `<span class="fighter-sprite ${className || ''}" style="--fighter-color:${fighter.color};--frame-x:${frame.x};--frame-y:${frame.y}" role="img" aria-label="${fighter.name}">
            <span class="fighter-fallback" aria-hidden="true">🐺</span>
            <img class="fighter-sprite-image" src="${fighter.sprite}?v=${FIGHT_ART_VERSION}" alt="" draggable="false" decoding="async">
        </span>`;
    }

    function prepareFighterImages(root) {
        root.querySelectorAll('.fighter-sprite-image').forEach(function (image) {
            const frame = image.closest('.fighter-sprite');
            if (!frame || image.dataset.fighterPrepared === 'true') return;
            image.dataset.fighterPrepared = 'true';
            const sync = function () {
                frame.classList.toggle('art-ready', image.complete && image.naturalWidth > 0);
                frame.classList.toggle('art-missing', image.complete && !image.naturalWidth);
            };
            image.addEventListener('load', sync, { once: true });
            image.addEventListener('error', sync, { once: true });
            if (image.complete) sync();
        });
    }

    function setSpritePose(sprite, pose) {
        if (!sprite) return;
        const frame = POSE_POSITION[pose] || POSE_POSITION.idle;
        sprite.style.setProperty('--frame-x', frame.x);
        sprite.style.setProperty('--frame-y', frame.y);
    }

    function renderFightScreen() {
        const root = document.getElementById('fight-content');
        if (!root) return;
        stopTimers();
        battle = null;
        const selected = fighterById(selectedId);
        root.innerHTML = `
            <section class="fight-hero-v2">
                <div class="fight-brand-copy"><small>WOLF HUNDRED · SEASON 01</small><h1>Голодные волки</h1><p>Аркадные бои клубов: выбирай стиль, читай соперника и забирай раунд серией точных решений.</p></div>
                <div class="fight-rating"><span>РЕЙТИНГ</span><strong>${Number(stats.rating)}</strong><small>${Number(stats.wins)} побед · серия ${Number(stats.streak)}</small></div>
                ${soundButton('fight-sound-toggle')}
            </section>
            <div class="fight-tabs" role="tablist" aria-label="Разделы бойцовского клуба">
                <button data-fight-tab="fighters" class="${activeTab === 'fighters' ? 'active' : ''}">9 бойцов</button>
                <button data-fight-tab="moves" class="${activeTab === 'moves' ? 'active' : ''}">Как драться</button>
                <button data-fight-tab="ladder" class="${activeTab === 'ladder' ? 'active' : ''}">Лиги</button>
            </div>
            ${activeTab === 'fighters' ? renderRoster(selected) : (activeTab === 'moves' ? renderMoves() : renderLadders())}
        `;
        bindRoot(root);
    }

    function renderRoster(selected) {
        const cards = FIGHTERS.map(function (fighter, index) {
            return `<button class="fighter-card-v2 ${fighter.id === selected.id ? 'selected' : ''}" data-select-fighter="${fighter.id}" aria-pressed="${fighter.id === selected.id}">
                <span class="fighter-number">0${index + 1}</span>
                ${spriteMarkup(fighter, 'card-sprite', 'idle')}
                <span class="fighter-card-copy"><b>${fighter.name}</b><small>${fighter.role}</small></span>
                <i>${fighter.id === selected.id ? 'В СТАЕ' : 'ВЫБРАТЬ'}</i>
            </button>`;
        }).join('');
        return `<div class="fighter-roster-v2">${cards}</div>
            <section class="selected-fighter-v2" style="--fighter-color:${selected.color}">
                <div class="selected-art">${spriteMarkup(selected, 'showcase-sprite', 'idle')}<span>${selected.title}</span></div>
                <div class="selected-fighter-copy"><small>${selected.role.toUpperCase()}</small><h2>${selected.name}</h2><p>${selected.bio}</p><b>Суперприём: ${selected.special}</b><em>${selected.passive}</em></div>
                <div class="fighter-stats">
                    ${statBar('ЖИЗНЬ', selected.hp, 140)}${statBar('АТАКА', selected.attack, 100)}${statBar('СКОРОСТЬ', selected.speed, 100)}${statBar('ЗАЩИТА', selected.guard, 100)}
                </div>
                <button class="fight-start" data-fight-action="start"><span>⚔</span>${pendingMode === 'tournament' ? 'ВОЙТИ В ТУРНИР' : 'НАЧАТЬ РЕЙТИНГОВЫЙ БОЙ'}</button>
                <button class="fight-ranking-link" data-fight-tab="moves">Сначала изучить управление</button>
            </section>`;
    }

    function statBar(label, value, max) {
        return `<span><b>${label}</b><i><em style="width:${Math.min(100, value / max * 100)}%"></em></i><strong>${value}</strong></span>`;
    }

    function renderMoves() {
        const moves = [
            ['J', 'Джеб', 'Быстрый и точный. Начинает комбо и почти не тратит выносливость.'],
            ['K', 'Кик', 'Держит дистанцию и даёт больше энергии суперприёма.'],
            ['H', 'Силовой', 'Медленный рискованный удар: высокий урон и шанс оглушения.'],
            ['U', 'Апперкот', 'Пробивает защиту: блок снижает урон заметно слабее.'],
            ['G', 'Бросок', 'Рискованный захват, который полностью игнорирует обычный блок.'],
            ['B', 'Блок', 'Снижает входящий урон. Точный блок наполняет шкалу энергии.'],
            ['D', 'Уклон', 'Полностью избегает удара в коротком окне и открывает контратаку.'],
            ['S', 'Супер', 'Доступен при 100% энергии. У каждого бойца свой эффект и анимация.']
        ];
        return `<section class="fight-manual"><div class="manual-head"><small>ПРАВИЛА АРЕНЫ</small><h2>Побеждает не тот, кто быстрее нажимает</h2><p>Следи за выносливостью, чередуй атаки и не раскрывайся после силового удара.</p></div>
            <div class="move-grid">${moves.map(function (move) { return `<article><span>${move[0]}</span><div><b>${move[1]}</b><p>${move[2]}</p></div></article>`; }).join('')}</div>
            <div class="combo-guide"><span>01</span><b>ДЖЕБ</b><i>→</i><span>02</span><b>КИК</b><i>→</i><span>03</span><b>АППЕРКОТ</b><small>Базовая серия: апперкот завершает связку и пробивает защиту.</small></div>
            <button class="fight-start" data-fight-action="start">ПОПРОБОВАТЬ В БОЮ</button>
        </section>`;
    }

    function renderLadders() {
        const playerName = window.escapeHtml(window.userNickname || 'Майнер');
        const fighters = [
            { name: 'NightHash', rating: 1810, icon: 'I' }, { name: 'RUMIR Alpha', rating: 1748, icon: 'II' },
            { name: 'Luna Hash', rating: 1662, icon: 'III' }, { name: playerName, rating: stats.rating, icon: 'YOU', me: true },
            { name: 'BlockCrusher', rating: 1160, icon: 'V' }
        ].sort(function (a, b) { return b.rating - a.rating; });
        const clubs = CLUB_LADDER.map(function (club) { return Object.assign({}, club); });
        clubs[0].rating = stats.clubRating;
        clubs.sort(function (a, b) { return b.rating - a.rating; });
        return `<section class="league-route"><small>ПУТЬ К МИРОВОЙ ЛИГЕ</small><div><span class="done">Район</span><i>→</i><span>Город</span><i>→</i><span>Мир</span></div><p>Победы приносят личный рейтинг и очки клубу. Межклубные результаты подтверждает судья турнира.</p></section>
            <div class="ladder-grid">
                <section class="ladder-card"><div class="ladder-title"><span>⚔</span><div><small>ЛИЧНЫЙ ЗАЧЁТ</small><h2>Бойцы Борща</h2></div></div>${renderRankRows(fighters)}</section>
                <section class="ladder-card"><div class="ladder-title"><span>🐺</span><div><small>КОМАНДНЫЙ ЗАЧЁТ</small><h2>Клубы</h2></div></div>${renderRankRows(clubs)}</section>
            </div>`;
    }

    function renderRankRows(rows) {
        return rows.map(function (row, index) {
            return `<div class="rank-row ${row.me ? 'me' : ''}"><span class="rank-position">${String(index + 1).padStart(2, '0')}</span><span class="rank-avatar">${row.icon || row.badge}</span><span><b>${row.name}</b><small>${row.district || (row.me ? 'Твой рейтинг' : 'Волчья лига')}</small></span><strong>${Number(row.rating)}</strong></div>`;
        }).join('');
    }

    function soundButton(className) {
        const label = audioMuted ? 'Включить звук боя' : 'Выключить звук боя';
        return `<button class="${className || 'fight-sound-toggle'} ${audioMuted ? 'muted' : ''}" data-fight-action="sound" aria-label="${label}" aria-pressed="${audioMuted}"><span>${audioMuted ? '🔇' : '🔊'}</span><small>${audioMuted ? 'ЗВУК ВЫКЛ' : 'ЗВУК ВКЛ'}</small></button>`;
    }

    function bindRoot(root) {
        prepareFighterImages(root);
        if (root.dataset.fightBound === 'true') return;
        root.dataset.fightBound = 'true';
        root.addEventListener('click', function (event) {
            const select = event.target.closest('[data-select-fighter]');
            if (select && !battle) {
                selectedId = select.dataset.selectFighter;
                saveStats();
                haptic('selection');
                renderFightScreen();
                return;
            }
            const tab = event.target.closest('[data-fight-tab]');
            if (tab && !battle) {
                activeTab = tab.dataset.fightTab;
                renderFightScreen();
                return;
            }
            const action = event.target.closest('[data-fight-action]');
            if (!action) return;
            if (action.dataset.fightAction === 'sound') toggleFightAudio();
            else if (action.dataset.fightAction === 'start') startFight();
            else if (action.dataset.fightAction === 'roster') renderFightScreen();
            else if (battle) playerAction(action.dataset.fightAction);
        });
        if (!keyboardBound) {
            keyboardBound = true;
            window.addEventListener('keydown', function (event) {
                if (!battle || !document.getElementById('fight-screen')?.classList.contains('active')) return;
                const action = { j: 'punch', k: 'kick', h: 'heavy', u: 'uppercut', g: 'throw', b: 'block', d: 'dodge', s: 'special' }[event.key.toLowerCase()];
                if (action) {
                    event.preventDefault();
                    playerAction(action);
                }
            });
        }
    }

    function combatant(fighter) {
        return Object.assign({}, fighter, { currentHp: fighter.hp, meter: 0, stamina: 100, combo: 0, lastHitAt: 0, lastActionAt: 0, blockingUntil: 0, dodgeUntil: 0, stunnedUntil: 0 });
    }

    function startFight() {
        stopTimers();
        ensureFightAudio();
        playFightSound('start');
        const player = fighterById(selectedId);
        const opponents = FIGHTERS.filter(function (fighter) { return fighter.id !== selectedId; });
        const enemy = opponents[Math.floor(Math.random() * opponents.length)];
        battle = { player: combatant(player), enemy: combatant(enemy), seconds: 60, finished: false, ready: false, startedAt: 0, endsAt: 0, nextEnemyAt: 0 };
        renderBattle();
        schedule(function () { announce('3'); playFightSound('countdown'); }, 100);
        schedule(function () { announce('2'); playFightSound('countdown'); }, 550);
        schedule(function () { announce('1'); playFightSound('countdown-high'); }, 1000);
        schedule(function () {
            if (!battle) return;
            battle.ready = true;
            battle.startedAt = Date.now();
            battle.endsAt = Date.now() + 60000;
            battle.nextEnemyAt = Date.now() + 900;
            announce('FIGHT!');
            playFightSound('fight');
            speakFight();
            syncBattle();
        }, 1450);
        fightTimer = setInterval(tickBattle, 100);
    }

    function renderBattle() {
        const root = document.getElementById('fight-content');
        const player = battle.player;
        const enemy = battle.enemy;
        root.innerHTML = `<section class="wolf-arena-v2" id="wolf-arena" aria-label="Бойцовская арена">
            <div class="arena-lights" aria-hidden="true"></div><div class="arena-crowd" aria-hidden="true"></div>
            <div class="fight-hud-v2">
                ${healthBlock('player', player)}
                <div class="round-clock"><small>ROUND 1</small><b id="fight-clock">60</b></div>
                ${healthBlock('enemy', enemy)}
            </div>
            <div class="fight-announcer-v2 hide" id="fight-announcer" aria-live="polite">FIGHT!</div>
            <div class="combo-callout" id="combo-callout"></div>
            ${soundButton('fight-battle-sound')}
            <div class="combatants-v2">
                <div class="combatant-v2 player" id="player-combatant">${spriteMarkup(player, 'battle-sprite', 'idle')}<span class="fighter-shadow"></span></div>
                <div class="combatant-v2 enemy" id="enemy-combatant">${spriteMarkup(enemy, 'battle-sprite', 'idle')}<span class="fighter-shadow"></span></div>
            </div>
            <div class="battle-floor" aria-hidden="true"></div>
        </section>
        <section class="fight-console">
            <div class="meter-row">
                <div class="stamina-meter"><small>ВЫНОСЛИВОСТЬ</small><i><span id="stamina-fill" style="width:100%"></span></i></div>
                <div class="special-meter-v2"><small>ВОЛЧЬЯ ЭНЕРГИЯ</small><i><span id="special-fill" style="width:0%"></span></i></div>
            </div>
            <div class="fight-controls-v2" aria-label="Управление бойцом">
                ${controlButton('punch', 'J', 'Джеб', 'быстро')}
                ${controlButton('kick', 'K', 'Кик', 'дистанция')}
                ${controlButton('heavy', 'H', 'Силовой', 'урон')}
                ${controlButton('uppercut', 'U', 'Апперкот', 'ломает блок')}
                ${controlButton('throw', 'G', 'Бросок', 'захват')}
                ${controlButton('block', 'B', 'Блок', 'защита')}
                ${controlButton('dodge', 'D', 'Уклон', 'манёвр')}
                ${controlButton('special', 'S', player.special, 'нужно 100%', true)}
            </div>
            <p class="fight-help"><b id="battle-tip">Комбинируй джеб, кик и апперкот.</b><span>${player.passive}</span></p>
        </section>`;
        bindRoot(root);
        syncBattle();
    }

    function healthBlock(side, fighter) {
        return `<div class="health-block-v2 ${side}"><div><b>${fighter.name}</b><small>${fighter.role}</small></div><i><span id="${side}-health" style="width:100%"></span></i></div>`;
    }

    function controlButton(action, key, label, hint, special) {
        return `<button class="fight-control ${special ? 'special' : ''}" id="${action}-btn" data-fight-action="${action}" aria-label="${label}"><span>${key}</span><b>${label}</b><small>${hint}</small></button>`;
    }

    function tickBattle() {
        if (!battle || battle.finished) return;
        const now = Date.now();
        if (battle.ready) {
            battle.seconds = Math.max(0, Math.ceil((battle.endsAt - now) / 1000));
            battle.player.stamina = Math.min(100, battle.player.stamina + staminaRecovery(battle.player));
            battle.enemy.stamina = Math.min(100, battle.enemy.stamina + staminaRecovery(battle.enemy));
            if (now >= battle.nextEnemyAt) enemyAction();
            if (battle.seconds <= 0) finishFight(battle.player.currentHp >= battle.enemy.currentHp);
        }
        syncBattle();
    }

    function staminaRecovery(fighter) {
        const base = 0.65 + fighter.speed / 240;
        return fighter.archetype === 'rushdown' ? base * 1.22 : base;
    }

    function playerAction(type) {
        if (!battle || battle.finished || !battle.ready) return;
        performAction('player', type);
    }

    function performAction(side, type) {
        const now = Date.now();
        const actor = battle[side];
        const opponentSide = side === 'player' ? 'enemy' : 'player';
        const target = battle[opponentSide];
        const action = ACTIONS[type];
        if (!action || now < actor.stunnedUntil || now - actor.lastActionAt < Math.max(170, action.cooldown - actor.speed * 1.7)) return false;
        if (type === 'special' && actor.meter < 100) return false;
        if (actor.stamina < action.cost) {
            if (side === 'player') setTip('Не хватает выносливости — отступи или поставь блок.');
            return false;
        }
        actor.stamina = Math.max(0, actor.stamina - adjustedCost(actor, type, action.cost));
        actor.lastActionAt = now;
        if (type === 'block') {
            actor.blockingUntil = now + (actor.archetype === 'counter' ? 900 : 720);
            setPose(side, 'idle', 'blocking', 520);
            playFightSound('guard');
            if (side === 'player') setTip('Блок активен: поймай удар и ответь.');
            return true;
        }
        if (type === 'dodge') {
            actor.dodgeUntil = now + (actor.archetype === 'trickster' ? 780 : 610);
            setPose(side, 'kick', 'dodging', 540);
            playFightSound('dodge');
            return true;
        }
        if (type === 'special') actor.meter = 0;
        setPose(side, action.pose, 'acting action-' + type, action.cooldown);
        playFightSound(type + '-swing');
        haptic(type === 'special' ? 'heavy' : 'light');
        schedule(function () {
            if (!battle || battle.finished) return;
            resolveAttack(side, opponentSide, type, actor, target, action);
        }, type === 'heavy' || type === 'uppercut' ? 260 : (type === 'throw' ? 330 : (type === 'special' ? 300 : 150)));
        return true;
    }

    function adjustedCost(fighter, type, cost) {
        if (fighter.archetype === 'grappler' && type === 'block') return Math.max(2, cost - 3);
        if (fighter.archetype === 'grappler' && type === 'throw') return Math.max(8, cost - 5);
        if (fighter.archetype === 'rushdown' && type === 'punch') return Math.max(2, cost - 2);
        return cost;
    }

    function resolveAttack(attackerSide, defenderSide, type, attacker, defender, action) {
        const now = Date.now();
        if (now < defender.dodgeUntil) {
            defender.meter = Math.min(100, defender.meter + 16);
            attacker.combo = 0;
            showMiss(defenderSide, 'УКЛОН');
            playFightSound('dodge-success');
            if (defenderSide === 'player') setTip('Отличный уклон! Сейчас время для контратаки.');
            return;
        }
        let accuracy = action.accuracy + (attacker.speed - defender.speed) / 500;
        if (attacker.archetype === 'trickster' && type === 'kick') accuracy += 0.08;
        if (attacker.archetype === 'technical') accuracy += 0.04;
        if (Math.random() > Math.min(1, accuracy)) {
            attacker.combo = 0;
            showMiss(defenderSide, 'ПРОМАХ');
            playFightSound('miss');
            return;
        }
        const wasBlocking = now < defender.blockingUntil && !action.unblockable;
        const chainWindow = attacker.archetype === 'technical' ? 1750 : 1350;
        attacker.combo = now - attacker.lastHitAt <= chainWindow ? attacker.combo + 1 : 1;
        attacker.lastHitAt = now;
        const comboStep = attacker.archetype === 'striker' ? 0.1 : 0.07;
        const comboBonus = 1 + Math.min(attacker.archetype === 'striker' ? 0.45 : 0.32, Math.max(0, attacker.combo - 1) * comboStep);
        let damage = Math.max(2, Math.round(attacker.attack * action.power * (0.075 + Math.random() * 0.026) * comboBonus));
        if (attacker.archetype === 'grappler' && type === 'throw') damage = Math.round(damage * 1.18);
        if (wasBlocking) {
            const reduction = 0.5 + defender.guard / 250;
            const guardCap = action.guardBreak || 0.8;
            damage = Math.max(1, Math.round(damage * (1 - Math.min(guardCap, reduction))));
            defender.blockingUntil = 0;
            defender.meter = Math.min(100, defender.meter + (defender.archetype === 'counter' ? 24 : 14));
            showMiss(defenderSide, 'БЛОК');
        }
        if (defender.archetype === 'tank') damage = Math.max(1, Math.round(damage * 0.9));
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        attacker.meter = Math.min(100, attacker.meter + (action.meter || 0) + Math.min(10, attacker.combo * 2));
        if (attacker.archetype === 'balanced' && attacker.combo >= 2) attacker.meter = Math.min(100, attacker.meter + 4);
        hitReaction(defenderSide, damage, type, wasBlocking);
        if (!wasBlocking && action.stun && Math.random() < action.stun + (attacker.archetype === 'pressure' ? 0.08 : 0)) {
            defender.stunnedUntil = now + (type === 'special' ? 950 : 620);
            setPose(defenderSide, 'idle', 'stunned', 600);
            announce('ОГЛУШЕНИЕ');
            playFightSound('stun');
        }
        stats.bestCombo = Math.max(Number(stats.bestCombo || 0), attackerSide === 'player' ? attacker.combo : 0);
        if (attackerSide === 'player' && attacker.combo >= 2) showCombo(attacker.combo);
        syncBattle();
        if (defender.currentHp <= 0) finishFight(attackerSide === 'player');
    }

    function enemyAction() {
        if (!battle || battle.finished || !battle.ready) return;
        const enemy = battle.enemy;
        const player = battle.player;
        const now = Date.now();
        let action = 'punch';
        if (enemy.meter >= 100 && enemy.stamina >= ACTIONS.special.cost && Math.random() < 0.72) action = 'special';
        else if (player.combo >= 2 && Math.random() < 0.34) action = Math.random() < 0.55 ? 'block' : 'dodge';
        else if (enemy.stamina < 20) action = 'block';
        else {
            const roll = Math.random();
            action = roll < 0.14 ? 'block' : roll < 0.24 ? 'dodge' : roll < 0.45 ? 'punch' : roll < 0.65 ? 'kick' : roll < 0.78 ? 'uppercut' : roll < 0.9 ? 'heavy' : 'throw';
            if (enemy.archetype === 'grappler' && enemy.stamina >= ACTIONS.throw.cost && Math.random() < 0.28) action = 'throw';
        }
        performAction('enemy', action);
        const tempo = 1120 - enemy.speed * 4.2 + Math.random() * 330;
        battle.nextEnemyAt = now + Math.max(560, tempo);
    }

    function setPose(side, pose, extraClass, duration) {
        const node = document.getElementById(side + '-combatant');
        if (!node) return;
        const sprite = node.querySelector('.fighter-sprite');
        setSpritePose(sprite, pose);
        node.className = 'combatant-v2 ' + side + (extraClass ? ' ' + extraClass : '');
        schedule(function () {
            if (!battle || !node.isConnected) return;
            node.className = 'combatant-v2 ' + side;
            setSpritePose(sprite, 'idle');
        }, duration || 380);
    }

    function hitReaction(side, damage, type, wasBlocking) {
        const node = document.getElementById(side + '-combatant');
        const arena = document.getElementById('wolf-arena');
        if (node) {
            node.classList.add('hit');
            schedule(function () { if (node.isConnected) node.classList.remove('hit'); }, 240);
        }
        if (arena) {
            arena.classList.remove('camera-hit', 'camera-special');
            void arena.offsetWidth;
            arena.classList.add(type === 'special' ? 'camera-special' : 'camera-hit');
        }
        spawnImpact(side, damage, type);
        playFightSound(wasBlocking ? 'block' : type + '-hit');
        haptic(type === 'special' || type === 'heavy' ? 'heavy' : 'medium');
    }

    function spawnImpact(side, damage, type) {
        const arena = document.getElementById('wolf-arena');
        if (!arena) return;
        const impact = document.createElement('span');
        impact.className = 'fight-impact ' + side + ' ' + type;
        impact.innerHTML = `<b>-${damage}</b><i></i><i></i><i></i><i></i>`;
        arena.appendChild(impact);
        schedule(function () { impact.remove(); }, 700);
    }

    function showMiss(side, message) {
        const arena = document.getElementById('wolf-arena');
        if (!arena) return;
        const note = document.createElement('span');
        note.className = 'fight-miss ' + side;
        note.textContent = message;
        arena.appendChild(note);
        schedule(function () { note.remove(); }, 650);
    }

    function showCombo(value) {
        const node = document.getElementById('combo-callout');
        if (!node) return;
        node.innerHTML = `<b>${value} HIT</b><span>COMBO</span>`;
        node.classList.remove('show');
        void node.offsetWidth;
        node.classList.add('show');
    }

    function announce(message) {
        const announcer = document.getElementById('fight-announcer');
        if (!announcer) return;
        announcer.textContent = message;
        announcer.classList.remove('hide');
        schedule(function () { if (announcer.isConnected) announcer.classList.add('hide'); }, 360);
    }

    function setTip(message) {
        const tip = document.getElementById('battle-tip');
        if (tip) tip.textContent = message;
    }

    function syncBattle() {
        if (!battle) return;
        setWidth('player-health', battle.player.currentHp / battle.player.hp * 100);
        setWidth('enemy-health', battle.enemy.currentHp / battle.enemy.hp * 100);
        setWidth('stamina-fill', battle.player.stamina);
        setWidth('special-fill', battle.player.meter);
        const clock = document.getElementById('fight-clock');
        if (clock) clock.textContent = battle.seconds;
        Object.keys(ACTIONS).forEach(function (type) {
            const button = document.getElementById(type + '-btn');
            if (!button) return;
            const action = ACTIONS[type];
            button.disabled = !battle.ready || battle.finished || battle.player.stamina < action.cost || (type === 'special' && battle.player.meter < 100);
            if (type === 'special') button.classList.toggle('ready', battle.player.meter >= 100);
        });
    }

    function setWidth(id, value) {
        const node = document.getElementById(id);
        if (node) node.style.width = Math.max(0, Math.min(100, value)) + '%';
    }

    function finishFight(won) {
        if (!battle || battle.finished) return;
        battle.finished = true;
        stopTimers(false);
        playFightSound(won ? 'victory' : 'defeat');
        if (won) {
            stats.wins += 1;
            stats.streak += 1;
            stats.rating += 28 + Math.min(12, stats.streak * 2);
            stats.clubRating += 8;
            window.rum = (window.rum || 0) + (pendingMode === 'tournament' ? 1000 : 250);
        } else {
            stats.losses += 1;
            stats.streak = 0;
            stats.rating = Math.max(100, stats.rating - 18);
            stats.clubRating = Math.max(100, stats.clubRating - 3);
        }
        saveStats();
        const tournamentOutcome = pendingMode === 'tournament' && window.ClubLeaguePlatform
            ? window.ClubLeaguePlatform.recordFightResult(won, fightContext)
            : null;
        if (typeof window.updateUI === 'function') window.updateUI();
        if (typeof window.saveAll === 'function') window.saveAll();
        let outcomeMessage = won
            ? 'Рейтинг растёт. Начислено ' + (pendingMode === 'tournament' ? '1 000' : '250') + ' тестовых RUMIR.'
            : 'Поражение записано в сезон. Смени темп, используй блок и возвращайся за реваншем.';
        let repeatLabel = 'РЕВАНШ';
        if (tournamentOutcome?.status === 'checked_in') { outcomeMessage = `Раунд выигран: ${Number(tournamentOutcome.roundWins)}/2. Ещё одна победа откроет приз.`; repeatLabel = 'СЛЕДУЮЩИЙ РАУНД'; }
        if (tournamentOutcome?.status === 'winner') { outcomeMessage = `Ты выиграл турнир. Награда «${window.escapeHtml(tournamentOutcome.prize || 'приз клуба')}» оформлена в кабинете клуба.`; repeatLabel = 'ТУРНИР ЗАВЕРШЁН'; }
        if (tournamentOutcome?.status === 'eliminated') { outcomeMessage = 'Ты выбыл из этого турнира. Тренируй бойца и возвращайся в следующий сезон.'; repeatLabel = 'ВЫБРАТЬ БОЙЦА'; }
        if (tournamentOutcome?.status === 'submitted') { outcomeMessage = 'Результат отправлен судье клуба. Рейтинг и приз изменятся только после подтверждения матча.'; repeatLabel = 'ЖДАТЬ РЕШЕНИЯ'; }
        const player = fighterById(selectedId);
        const root = document.getElementById('fight-content');
        root.innerHTML = `<section class="fight-result-v2 ${won ? 'win' : 'lose'}" style="--fighter-color:${player.color}">
            <small>${pendingMode === 'tournament' ? 'ТУРНИР ВОЛЧЬЕЙ СОТНИ' : 'РЕЙТИНГОВЫЙ БОЙ'}</small>
            ${spriteMarkup(player, 'result-sprite', won ? 'special' : 'idle')}
            <div class="result-verdict"><span>${won ? 'VICTORY' : 'DEFEAT'}</span><h1>${won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</h1></div>
            <p>${outcomeMessage}</p>
            <div class="result-stats"><span><small>Рейтинг</small><b>${Number(stats.rating)}</b></span><span><small>Лучшая серия</small><b>${Number(stats.bestCombo || 0)} HIT</b></span><span><small>Сезон</small><b>${Number(stats.wins)}–${Number(stats.losses)}</b></span></div>
            <button class="fight-start" data-fight-action="${tournamentOutcome && ['winner', 'eliminated', 'submitted'].includes(tournamentOutcome.status) ? 'roster' : 'start'}">${repeatLabel}</button>
            <button class="fight-ranking-link" data-fight-action="roster">Вернуться к девяти бойцам</button>
        </section>`;
        bindRoot(root);
    }

    function schedule(fn, delay) {
        const id = setTimeout(function () {
            scheduled = scheduled.filter(function (value) { return value !== id; });
            fn();
        }, delay);
        scheduled.push(id);
        return id;
    }

    function stopTimers(clearScheduled) {
        clearInterval(fightTimer);
        fightTimer = null;
        if (clearScheduled !== false) {
            scheduled.forEach(clearTimeout);
            scheduled = [];
        }
    }

    function stopWolfFight() {
        stopTimers();
        battle = null;
    }

    function toggleFightAudio() {
        audioMuted = !audioMuted;
        localStorage.setItem('wolfFightMuted', String(audioMuted));
        if (!audioMuted) {
            ensureFightAudio();
            playFightSound('select');
        }
        document.querySelectorAll('[data-fight-action="sound"]').forEach(function (button) {
            button.classList.toggle('muted', audioMuted);
            button.setAttribute('aria-pressed', String(audioMuted));
            button.setAttribute('aria-label', audioMuted ? 'Включить звук боя' : 'Выключить звук боя');
            const icon = button.querySelector('span');
            const label = button.querySelector('small');
            if (icon) icon.textContent = audioMuted ? '🔇' : '🔊';
            if (label) label.textContent = audioMuted ? 'ЗВУК ВЫКЛ' : 'ЗВУК ВКЛ';
        });
    }

    function ensureFightAudio() {
        if (audioMuted) return null;
        try {
            const AudioEngine = window.AudioContext || window.webkitAudioContext;
            if (!AudioEngine) return null;
            if (!audioContext) audioContext = new AudioEngine();
            if (audioContext.state === 'suspended') audioContext.resume();
            return audioContext;
        } catch (_) {
            return null;
        }
    }

    function tone(startFrequency, endFrequency, duration, volume, wave, delay) {
        const context = ensureFightAudio();
        if (!context) return;
        const start = context.currentTime + (delay || 0);
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = wave || 'sine';
        oscillator.frequency.setValueAtTime(Math.max(20, startFrequency), start);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency || startFrequency), start + duration);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume || 0.04), start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
    }

    function noise(duration, volume, delay) {
        const context = ensureFightAudio();
        if (!context) return;
        const length = Math.max(1, Math.floor(context.sampleRate * duration));
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
        const source = context.createBufferSource();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1150;
        gain.gain.value = volume || 0.025;
        source.buffer = buffer;
        source.connect(filter).connect(gain).connect(context.destination);
        source.start(context.currentTime + (delay || 0));
    }

    function playFightSound(name) {
        if (audioMuted) return;
        if (name === 'select') tone(520, 720, 0.08, 0.035, 'sine');
        else if (name === 'start') tone(80, 140, 0.32, 0.07, 'sawtooth');
        else if (name === 'countdown') tone(210, 175, 0.13, 0.055, 'square');
        else if (name === 'countdown-high') tone(320, 250, 0.16, 0.06, 'square');
        else if (name === 'fight') {
            tone(105, 240, 0.42, 0.09, 'sawtooth');
            tone(210, 640, 0.36, 0.045, 'square', 0.05);
            noise(0.22, 0.045, 0.04);
        } else if (name === 'guard') tone(560, 380, 0.09, 0.03, 'triangle');
        else if (name === 'block') {
            tone(920, 410, 0.13, 0.055, 'square');
            noise(0.08, 0.025);
        } else if (name === 'dodge' || name === 'dodge-success' || name === 'miss') {
            tone(name === 'miss' ? 430 : 780, 190, 0.12, 0.025, 'sine');
        } else if (name.endsWith('-swing')) {
            const swing = {
                'punch-swing': [330, 130, 0.08, 0.024], 'kick-swing': [240, 72, 0.13, 0.032],
                'heavy-swing': [155, 52, 0.18, 0.047], 'uppercut-swing': [190, 360, 0.16, 0.038],
                'throw-swing': [115, 42, 0.22, 0.05], 'special-swing': [420, 68, 0.28, 0.055]
            }[name] || [280, 105, 0.1, 0.026];
            tone(swing[0], swing[1], swing[2], swing[3], 'sawtooth');
            noise(swing[2] * 0.72, swing[3] * 0.52);
        } else if (name.endsWith('-hit')) {
            const impact = {
                'punch-hit': [185, 76, 0.1, 0.052], 'kick-hit': [132, 48, 0.15, 0.068],
                'heavy-hit': [88, 34, 0.23, 0.095], 'uppercut-hit': [210, 82, 0.19, 0.082],
                'throw-hit': [72, 28, 0.28, 0.1], 'special-hit': [340, 44, 0.34, 0.11]
            }[name] || [165, 70, 0.11, 0.055];
            tone(impact[0], impact[1], impact[2], impact[3], 'square');
            noise(impact[2] * 0.85, impact[3] * 0.62);
        } else if (name === 'stun') {
            tone(880, 1180, 0.22, 0.038, 'triangle');
            tone(760, 1020, 0.2, 0.026, 'triangle', 0.07);
        } else if (name === 'victory') {
            tone(330, 440, 0.22, 0.055, 'triangle');
            tone(440, 660, 0.34, 0.06, 'triangle', 0.2);
            tone(660, 990, 0.48, 0.055, 'triangle', 0.48);
        } else if (name === 'defeat') {
            tone(220, 110, 0.75, 0.065, 'sawtooth');
        }
    }

    function speakFight() {
        if (audioMuted || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
        try {
            window.speechSynthesis.cancel();
            const voice = new window.SpeechSynthesisUtterance('Fight!');
            voice.lang = 'en-US';
            voice.rate = 1.25;
            voice.pitch = 0.65;
            voice.volume = 0.85;
            window.speechSynthesis.speak(voice);
        } catch (_) { /* Voice announcement is optional in embedded browsers. */ }
    }

    function haptic(type) {
        try {
            const feedback = window.Telegram?.WebApp?.HapticFeedback;
            if (!feedback) return;
            if (type === 'selection') feedback.selectionChanged();
            else feedback.impactOccurred(type || 'light');
        } catch (_) { /* Telegram haptics are optional outside the Mini App. */ }
    }

    function openWolfFight(mode, context) {
        pendingMode = mode || 'training';
        fightContext = context || null;
        activeTab = 'fighters';
        if (typeof window.switchScreen === 'function') window.switchScreen('fight');
    }

    function openWolfRankings() {
        pendingMode = 'training';
        fightContext = null;
        activeTab = 'ladder';
        if (typeof window.switchScreen === 'function') window.switchScreen('fight');
    }

    window.WOLF_FIGHTERS = FIGHTERS;
    window.renderFightScreen = renderFightScreen;
    window.openWolfFight = openWolfFight;
    window.openWolfRankings = openWolfRankings;
    window.stopWolfFight = stopWolfFight;
})();
