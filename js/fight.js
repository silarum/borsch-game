// ================== ГОЛОДНЫЕ ВОЛКИ: ИГРОВОЙ ФАЙТИНГ ==================
(function () {
    'use strict';

    const FIGHTERS = [
        { id: 'alpha', name: 'RUMIR Alpha', role: 'Универсал', image: 'assets/fight/rumir-alpha.webp', hp: 112, attack: 78, speed: 70, special: 'Волчий разряд' },
        { id: 'luna', name: 'Luna Hash', role: 'Скорость', image: 'assets/fight/luna-hash.webp', hp: 96, attack: 70, speed: 92, special: 'Лунный хеш' },
        { id: 'fenrir', name: 'Fenrir Block', role: 'Тяжеловес', image: 'assets/club/wolves-fighter.webp', hp: 128, attack: 84, speed: 54, special: 'Разрыв блока' },
        { id: 'she-wolf', name: 'She‑Wolf TON', role: 'Контратака', image: 'assets/club/wolves-she.webp', hp: 104, attack: 75, speed: 81, special: 'TON‑цунами' }
    ];

    const CLUB_LADDER = [
        { name: 'Волчья сотня', badge: '🐺', rating: 1680 },
        { name: 'Block Raiders', badge: '⛓', rating: 1594 },
        { name: 'TON Guardians', badge: '💎', rating: 1518 },
        { name: 'Rumir Forge', badge: '🔥', rating: 1462 },
        { name: 'Crypto Kitchen', badge: '🥘', rating: 1390 }
    ];

    let selectedId = localStorage.getItem('wolfSelectedFighter') || 'alpha';
    let activeTab = 'fighters';
    let battle = null;
    let fightTimer = null;
    let enemyTimer = null;
    let pendingMode = 'training';
    let fightContext = null;
    let stats = window.readLocalJson('wolfFightStats', {
        rating: 1200,
        clubRating: 1680,
        wins: 0,
        losses: 0,
        streak: 0
    });

    function fighterById(id) {
        return FIGHTERS.find(function (fighter) { return fighter.id === id; }) || FIGHTERS[0];
    }

    function saveStats() {
        localStorage.setItem('wolfFightStats', JSON.stringify(stats));
        localStorage.setItem('wolfSelectedFighter', selectedId);
    }

    function renderFightScreen() {
        const root = document.getElementById('fight-content');
        if (!root) return;
        stopTimers();
        battle = null;
        const selected = fighterById(selectedId);
        root.innerHTML = `
            <section class="fight-hero">
                <div><small>БОЙЦОВСКИЙ КЛУБ · FGSPI</small><h1>Голодные волки</h1><p>Собери «Волчью сотню» и поднимись на вершину.</p></div>
                <div class="fight-rating"><span>RATING</span><strong>${stats.rating}</strong><small>${stats.wins}W · ${stats.losses}L</small></div>
            </section>
            <div class="fight-tabs">
                <button data-fight-tab="fighters" class="${activeTab === 'fighters' ? 'active' : ''}">Бойцы</button>
                <button data-fight-tab="ladder" class="${activeTab === 'ladder' ? 'active' : ''}">Рейтинг</button>
            </div>
            ${activeTab === 'fighters' ? renderRoster(selected) : renderLadders()}
        `;
        bindRoot(root);
    }

    function renderRoster(selected) {
        const cards = FIGHTERS.map(function (fighter) {
            return `<button class="fighter-card ${fighter.id === selected.id ? 'selected' : ''}" data-select-fighter="${fighter.id}">
                <img src="${fighter.image}" alt="${fighter.name}">
                <span><b>${fighter.name}</b><small>${fighter.role}</small></span>
                <i>${fighter.id === selected.id ? 'ВЫБРАН' : 'ВЫБРАТЬ'}</i>
            </button>`;
        }).join('');
        return `<div class="fighter-roster">${cards}</div>
            <section class="selected-fighter">
                <div class="selected-fighter-copy"><small>ТВОЙ БОЕЦ</small><h2>${selected.name}</h2><p>${selected.special}</p></div>
                <div class="fighter-stats">
                    ${statBar('HP', selected.hp, 130)}${statBar('ATK', selected.attack, 100)}${statBar('SPD', selected.speed, 100)}
                </div>
                <button class="fight-start" data-fight-action="start">⚔ НАЧАТЬ ${pendingMode === 'tournament' ? 'ТУРНИР' : 'БОЙ'}</button>
                <button class="fight-ranking-link" data-fight-tab="ladder">Посмотреть рейтинговую лестницу →</button>
            </section>`;
    }

    function statBar(label, value, max) {
        return `<span><b>${label}</b><i><em style="width:${Math.min(100, value / max * 100)}%"></em></i><strong>${value}</strong></span>`;
    }

    function renderLadders() {
        const playerName = window.escapeHtml(window.userNickname || 'Майнер');
        const fighters = [
            { name: 'NightHash', rating: 1710, icon: '🥇' },
            { name: 'RUMIR Alpha', rating: 1648, icon: '🥈' },
            { name: 'Luna Hash', rating: 1572, icon: '🥉' },
            { name: playerName, rating: stats.rating, icon: '⚔', me: true },
            { name: 'BlockCrusher', rating: 1160, icon: '◇' }
        ].sort(function (a, b) { return b.rating - a.rating; });
        const clubs = CLUB_LADDER.map(function (club) { return Object.assign({}, club); });
        clubs[0].rating = stats.clubRating;
        clubs.sort(function (a, b) { return b.rating - a.rating; });
        return `<div class="ladder-grid">
            <section class="ladder-card"><div class="ladder-title"><span>⚔</span><div><small>ЛИЧНЫЙ ЗАЧЁТ</small><h2>Бойцы Борща</h2></div></div>${renderRankRows(fighters)}</section>
            <section class="ladder-card"><div class="ladder-title"><span>🐺</span><div><small>КОМАНДНЫЙ ЗАЧЁТ</small><h2>Клубы</h2></div></div>${renderRankRows(clubs)}</section>
        </div>`;
    }

    function renderRankRows(rows) {
        return rows.map(function (row, index) {
            return `<div class="rank-row ${row.me ? 'me' : ''}"><span class="rank-position">${index + 1}</span><span class="rank-avatar">${row.icon || row.badge}</span><b>${row.name}</b><strong>${row.rating}</strong></div>`;
        }).join('');
    }

    function bindRoot(root) {
        if (root.dataset.fightBound === 'true') return;
        root.dataset.fightBound = 'true';
        root.addEventListener('click', function (event) {
            const select = event.target.closest('[data-select-fighter]');
            if (select && !battle) {
                selectedId = select.dataset.selectFighter;
                saveStats();
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
            if (action.dataset.fightAction === 'start') startFight();
            else if (action.dataset.fightAction === 'roster') renderFightScreen();
            else if (battle) playerAction(action.dataset.fightAction);
        });
    }

    function startFight() {
        const player = fighterById(selectedId);
        const opponents = FIGHTERS.filter(function (fighter) { return fighter.id !== selectedId; });
        const enemy = opponents[Math.floor(Math.random() * opponents.length)];
        battle = {
            player: Object.assign({}, player, { currentHp: player.hp, meter: 0, blocking: false }),
            enemy: Object.assign({}, enemy, { currentHp: enemy.hp, meter: 0, blocking: false }),
            seconds: 45,
            finished: false
        };
        renderBattle();
        fightTimer = setInterval(function () {
            if (!battle || battle.finished) return;
            battle.seconds -= 1;
            syncBattle();
            if (battle.seconds <= 0) finishFight(battle.player.currentHp >= battle.enemy.currentHp);
        }, 1000);
        enemyTimer = setInterval(enemyAction, 950);
    }

    function renderBattle() {
        const root = document.getElementById('fight-content');
        const player = battle.player;
        const enemy = battle.enemy;
        root.innerHTML = `<section class="wolf-arena" aria-label="Бойцовская арена">
            <div class="fight-hud">
                ${healthBlock('player', player.name, player.currentHp, player.hp)}
                <div class="fight-clock" id="fight-clock">${battle.seconds}</div>
                ${healthBlock('enemy', enemy.name, enemy.currentHp, enemy.hp)}
            </div>
            <div class="fight-announcer" id="fight-announcer">FIGHT!</div>
            <div class="combatants">
                <div class="combatant player" id="player-combatant"><img src="${player.image}" alt="${player.name}"></div>
                <div class="combatant enemy" id="enemy-combatant"><img src="${enemy.image}" alt="${enemy.name}"></div>
            </div>
            <div class="special-meter"><span id="special-fill" style="width:0%"></span><b>SPECIAL</b></div>
        </section>
        <div class="fight-controls">
            <button data-fight-action="punch"><span>👊</span>УДАР</button>
            <button data-fight-action="kick"><span>🦶</span>КИК</button>
            <button data-fight-action="block"><span>🛡</span>БЛОК</button>
            <button class="special" id="special-btn" data-fight-action="special" disabled><span>⚡</span>СУПЕР</button>
        </div>
        <p class="fight-help">Копи шкалу ударами. Блок снижает следующий урон.</p>`;
        bindRoot(root);
        setTimeout(function () {
            const announcer = document.getElementById('fight-announcer');
            if (announcer) announcer.classList.add('hide');
        }, 800);
    }

    function healthBlock(side, name, current, max) {
        return `<div class="health-block ${side}"><b>${name}</b><div><span id="${side}-health" style="width:${current / max * 100}%"></span></div></div>`;
    }

    function playerAction(type) {
        if (!battle || battle.finished) return;
        if (type === 'block') {
            battle.player.blocking = true;
            animateCombatant('player', 'blocking');
            setTimeout(function () { if (battle) battle.player.blocking = false; }, 900);
            return;
        }
        if (type === 'special' && battle.player.meter < 100) return;
        const hitChance = type === 'kick' ? 0.78 : 0.92;
        if (type === 'special') battle.player.meter = 0;
        if (Math.random() <= hitChance || type === 'special') {
            const multiplier = type === 'special' ? 2.25 : (type === 'kick' ? 1.35 : 1);
            dealDamage(battle.player, battle.enemy, multiplier, 'enemy');
            battle.player.meter = Math.min(100, battle.player.meter + (type === 'special' ? 0 : (type === 'kick' ? 23 : 16)));
            animateCombatant('player', type === 'kick' ? 'kicking' : 'attacking');
        } else {
            announce('ПРОМАХ');
        }
        syncBattle();
        if (battle.enemy.currentHp <= 0) finishFight(true);
    }

    function enemyAction() {
        if (!battle || battle.finished) return;
        if (Math.random() < 0.18) {
            battle.enemy.blocking = true;
            animateCombatant('enemy', 'blocking');
            setTimeout(function () { if (battle) battle.enemy.blocking = false; }, 700);
            return;
        }
        const multiplier = Math.random() < 0.28 ? 1.35 : 1;
        dealDamage(battle.enemy, battle.player, multiplier, 'player');
        animateCombatant('enemy', 'attacking');
        syncBattle();
        if (battle.player.currentHp <= 0) finishFight(false);
    }

    function dealDamage(attacker, defender, multiplier, targetSide) {
        let damage = Math.max(3, Math.round(attacker.attack * multiplier * (0.075 + Math.random() * 0.035)));
        if (defender.blocking) {
            damage = Math.max(1, Math.round(damage * 0.28));
            defender.blocking = false;
            announce('BLOCK');
        }
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        const target = document.getElementById(targetSide + '-combatant');
        if (target) {
            target.classList.add('hit');
            setTimeout(function () { target.classList.remove('hit'); }, 220);
        }
    }

    function animateCombatant(side, className) {
        const node = document.getElementById(side + '-combatant');
        if (!node) return;
        node.classList.remove('attacking', 'kicking', 'blocking');
        void node.offsetWidth;
        node.classList.add(className);
        setTimeout(function () { node.classList.remove(className); }, 300);
    }

    function announce(message) {
        const announcer = document.getElementById('fight-announcer');
        if (!announcer) return;
        announcer.textContent = message;
        announcer.classList.remove('hide');
        setTimeout(function () { announcer.classList.add('hide'); }, 420);
    }

    function syncBattle() {
        if (!battle) return;
        const playerHealth = document.getElementById('player-health');
        const enemyHealth = document.getElementById('enemy-health');
        const clock = document.getElementById('fight-clock');
        const meter = document.getElementById('special-fill');
        const special = document.getElementById('special-btn');
        if (playerHealth) playerHealth.style.width = (battle.player.currentHp / battle.player.hp * 100) + '%';
        if (enemyHealth) enemyHealth.style.width = (battle.enemy.currentHp / battle.enemy.hp * 100) + '%';
        if (clock) clock.textContent = battle.seconds;
        if (meter) meter.style.width = battle.player.meter + '%';
        if (special) special.disabled = battle.player.meter < 100;
    }

    function finishFight(won) {
        if (!battle || battle.finished) return;
        battle.finished = true;
        stopTimers();
        if (won) {
            stats.wins += 1;
            stats.streak += 1;
            stats.rating += 28 + Math.min(12, stats.streak * 2);
            stats.clubRating += 8;
            window.rum += pendingMode === 'tournament' ? 1000 : 250;
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
            : 'Стая становится сильнее после каждого боя.';
        let repeatLabel = 'РЕВАНШ';
        if (tournamentOutcome?.status === 'checked_in') {
            outcomeMessage = `Раунд выигран: ${Number(tournamentOutcome.roundWins)}/2. Ещё одна победа откроет приз.`;
            repeatLabel = 'СЛЕДУЮЩИЙ РАУНД';
        }
        if (tournamentOutcome?.status === 'winner') {
            outcomeMessage = `Ты выиграл турнир. Награда «${window.escapeHtml(tournamentOutcome.prize || 'приз клуба')}» оформлена в кабинете клуба.`;
            repeatLabel = 'ТУРНИР ЗАВЕРШЁН';
        }
        if (tournamentOutcome?.status === 'eliminated') {
            outcomeMessage = 'Ты выбыл из этого турнира. Тренируй бойца и возвращайся в следующий сезон.';
            repeatLabel = 'ВЫБРАТЬ БОЙЦА';
        }
        if (tournamentOutcome?.status === 'submitted') {
            outcomeMessage = 'Результат отправлен судье клуба. Рейтинг и приз изменятся только после подтверждения матча.';
            repeatLabel = 'ЖДАТЬ РЕШЕНИЯ';
        }
        const root = document.getElementById('fight-content');
        root.innerHTML = `<section class="fight-result ${won ? 'win' : 'lose'}">
            <small>${pendingMode === 'tournament' ? 'ТУРНИР ВОЛЧЬЕЙ СОТНИ' : 'РЕЙТИНГОВЫЙ БОЙ'}</small>
            <div class="result-emblem">${won ? '🏆' : '🐺'}</div>
            <h1>${won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</h1>
            <p>${outcomeMessage}</p>
            <div class="rating-change"><span>Твой рейтинг</span><strong>${stats.rating}</strong></div>
            <button class="fight-start" data-fight-action="${tournamentOutcome && ['winner', 'eliminated', 'submitted'].includes(tournamentOutcome.status) ? 'roster' : 'start'}">${repeatLabel}</button>
            <button class="fight-ranking-link" data-fight-action="roster">Выбрать другого бойца</button>
        </section>`;
        bindRoot(root);
    }

    function stopTimers() {
        clearInterval(fightTimer);
        clearInterval(enemyTimer);
        fightTimer = null;
        enemyTimer = null;
    }

    function stopWolfFight() {
        stopTimers();
        battle = null;
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

    window.renderFightScreen = renderFightScreen;
    window.openWolfFight = openWolfFight;
    window.openWolfRankings = openWolfRankings;
    window.stopWolfFight = stopWolfFight;
})();
