// ================== ГОЛОДНЫЕ ВОЛКИ: АРКАДНЫЙ ФАЙТИНГ ==================
(function () {
    'use strict';

    const FIGHTERS = [
        { id: 'alpha', name: 'RUMIR Alpha', title: 'Первый волк', role: 'Универсал', martialArt: 'Бокс · боевое самбо', stance: 'Левша', archetype: 'balanced', sprite: 'assets/fight/fighters/alpha.webp', color: '#4ee8ff', hp: 116, attack: 79, speed: 74, guard: 76, special: 'Разряд Румира', signature: { sequence: ['punch', 'punch', 'kick'], name: 'Клык Альфы', multiplier: 1.24 }, moves: ['Грозовой джеб', 'Подсечка стаи', 'Бросок вожака'], bio: 'Капитан Волчьей сотни. Сочетает точный бокс с бросками самбо и подходит для освоения всей системы боя.' },
        { id: 'luna', name: 'Luna Hash', title: 'Лунный импульс', role: 'Скорость', martialArt: 'Тхэквондо · кикбоксинг', stance: 'Правша', archetype: 'rushdown', sprite: 'assets/fight/fighters/luna.webp', color: '#b65cff', hp: 98, attack: 73, speed: 96, guard: 62, special: 'Лунный хеш', signature: { sequence: ['kick', 'kick', 'punch'], name: 'Лунная орбита', multiplier: 1.3 }, moves: ['Вертушка луны', 'Двойной доллио', 'Падающая звезда'], bio: 'Самая быстрая участница лиги. Ведёт бой ногами, меняет уровни атаки и душит соперника непрерывным темпом.' },
        { id: 'fenrir', name: 'Fenrir Block', title: 'Золотая крепость', role: 'Тяжеловес', martialArt: 'Кёкусинкай', stance: 'Силовая', archetype: 'tank', sprite: 'assets/fight/fighters/fenrir.webp', color: '#ffbd45', hp: 138, attack: 91, speed: 51, guard: 92, special: 'Разлом Фенрира', signature: { sequence: ['heavy', 'punch', 'heavy'], name: 'Разлом блока', multiplier: 1.34 }, moves: ['Лоу-кик гранита', 'Удар молота', 'Золотая стена'], bio: 'Тяжёлый каратист, способный принимать урон и ломать защиту сериями силовых ударов. Опаснее всего у стены.' },
        { id: 'she-wolf', name: 'She-Wolf TON', title: 'Кольцо прилива', role: 'Контратака', martialArt: 'Вин-чун · саньда', stance: 'Закрытая', archetype: 'counter', sprite: 'assets/fight/fighters/she-wolf.webp', color: '#27d7ff', hp: 106, attack: 77, speed: 86, guard: 84, special: 'TON-цунами', signature: { sequence: ['block', 'punch', 'kick'], name: 'Кольцо прилива', multiplier: 1.28 }, moves: ['Цепные кулаки', 'Боковой сброс', 'Встречная волна'], bio: 'Специалист по чтению атаки. Точный блок превращает давление соперника в её энергию и открывает быструю контрсерию.' },
        { id: 'khan', name: 'Khan Byte', title: 'Оранжевый клинок', role: 'Захваты', martialArt: 'Боевое самбо', stance: 'Борцовская', archetype: 'pressure', sprite: 'assets/fight/fighters/khan.webp', color: '#ff8b32', hp: 120, attack: 85, speed: 70, guard: 78, special: 'Укус байта', signature: { sequence: ['punch', 'heavy', 'kick'], name: 'Бросок Хана', multiplier: 1.31 }, moves: ['Захват байта', 'Подхват бедром', 'Рычаг стаи'], bio: 'Давит на ближней дистанции, сбивает стойку и завершает серии бросками. Не даёт техничным бойцам спокойно работать.' },
        { id: 'veles', name: 'Neon Veles', title: 'Ветер сети', role: 'Трикстер', martialArt: 'Капоэйра', stance: 'Джинга', archetype: 'trickster', sprite: 'assets/fight/fighters/veles.webp', color: '#3fe9e1', hp: 101, attack: 74, speed: 93, guard: 66, special: 'Вихрь Велеса', signature: { sequence: ['kick', 'punch', 'kick'], name: 'Неоновая жинга', multiplier: 1.3 }, moves: ['Мея-луа', 'Армада сети', 'Неоновая эскива'], bio: 'Непредсказуемый мастер ритма. Уходит с линии атаки, меняет угол и наказывает промах вращающимися ударами ног.' },
        { id: 'mara', name: 'Mara Chain', title: 'Алая цепь', role: 'Ударник', martialArt: 'Муай-тай', stance: 'Тайская', archetype: 'striker', sprite: 'assets/fight/fighters/mara.webp', color: '#ff4d38', hp: 110, attack: 88, speed: 80, guard: 68, special: 'Цепь Мары', signature: { sequence: ['punch', 'kick', 'heavy'], name: 'Восемь клинков', multiplier: 1.33 }, moves: ['Локоть цепи', 'Тайский клинч', 'Колено Мары'], bio: 'Жёсткая ударница восьми конечностей. Разгоняет урон локтями, коленями и тяжёлыми лоу-киками, но требует точного темпа.' },
        { id: 'satoshi', name: 'Satoshi Ryū', title: 'Красный дракон', role: 'Техник', martialArt: 'Карате сётокан', stance: 'Киба-дачи', archetype: 'technical', sprite: 'assets/fight/fighters/satoshi.webp', color: '#ff395d', hp: 106, attack: 77, speed: 78, guard: 80, special: 'Дракон консенсуса', signature: { sequence: ['punch', 'kick', 'punch'], name: 'Три блока дракона', multiplier: 1.26 }, moves: ['Гяку-цуки', 'Ура-маваши', 'Красный кизами'], bio: 'Точный контрпанчер дальней линии. Наказывает промахи прямыми входами и дольше остальных сохраняет окно комбинации.' },
        { id: 'borz', name: 'Borz Frost', title: 'Ледяной захват', role: 'Борец', martialArt: 'Вольная борьба · грэпплинг', stance: 'Низкая', archetype: 'grappler', sprite: 'assets/fight/fighters/borz.webp', color: '#79cfff', hp: 132, attack: 90, speed: 70, guard: 89, special: 'Морозный волк', signature: { sequence: ['block', 'heavy', 'heavy'], name: 'Ледяной захват', multiplier: 1.35 }, moves: ['Проход в ноги', 'Северный суплес', 'Морозный контроль'], bio: 'Выносливый борец контроля. Терпит давление в блоке, сокращает дистанцию и переворачивает раунд одним мощным захватом.' }
    ];

    const ACTIONS = {
        punch: { label: 'УДАР', hint: 'быстро', pose: 'punch', cost: 6, power: 0.76, accuracy: 0.97, meter: 10, cooldown: 300, range: 24, hitAt: 0.55 },
        kick: { label: 'НОГА', hint: 'дальше', pose: 'kick', cost: 12, power: 1.06, accuracy: 0.9, meter: 15, cooldown: 470, range: 30, hitAt: 0.55 },
        heavy: { label: 'СИЛА', hint: 'оглушает', pose: 'punch', cost: 19, power: 1.46, accuracy: 0.78, meter: 22, cooldown: 690, range: 26, stun: 0.25, hitAt: 0.55 },
        block: { label: 'БЛОК', hint: 'держать', pose: 'idle', cost: 4, cooldown: 260 },
        dodge: { label: 'РЫВОК', hint: 'назад', pose: 'kick', cost: 14, cooldown: 610 },
        special: { label: 'ЯРОСТЬ', hint: '100%', pose: 'special', cost: 22, power: 2.3, accuracy: 1, meter: 0, cooldown: 1100, range: 44, stun: 0.52, hitAt: 0.55 }
    };

    function fourFrames(name) {
        return [0, 1, 2, 3].map(function (index) { return name + '-0' + index + '.png'; });
    }

    function standardAnimationSet() {
        return {
            punch: fourFrames('punch'), kick: fourFrames('kick'), heavy: fourFrames('heavy'),
            block: fourFrames('block'), hit: fourFrames('hit'), idle: fourFrames('idle'),
            walk: fourFrames('walk'), jump: fourFrames('jump'), crouch: fourFrames('crouch'),
            dodge: fourFrames('dodge'), knockdown: fourFrames('knockdown'), special: fourFrames('special')
        };
    }

    const FIGHTER_ANIMATIONS = {
        alpha: {
            punch: ['jab-00.png', 'jab-01.png', 'jab-02.png', 'jab-03.png'],
            kick: ['kick-00.png', 'kick-01.png', 'kick-02.png', 'kick-03.png'],
            heavy: ['heavy-00.png', 'heavy-01.png', 'heavy-02.png', 'heavy-03.png'],
            block: ['block-00.png', 'block-01.png', 'block-02.png', 'block-03.png'],
            hit: ['hit-00.png', 'hit-01.png', 'hit-02.png', 'hit-03.png'],
            walk: ['walk-00.png', 'walk-01.png', 'walk-02.png', 'walk-03.png'],
            jump: ['jump-00.png', 'jump-01.png', 'jump-02.png', 'jump-03.png'],
            crouch: ['crouch-00.png', 'crouch-01.png', 'crouch-02.png', 'crouch-03.png'],
            dodge: ['dodge-00.png', 'dodge-01.png', 'dodge-02.png', 'dodge-03.png'],
            knockdown: ['knockdown-00.png', 'knockdown-01.png', 'knockdown-02.png', 'knockdown-03.png'],
            special: ['special-00.png', 'special-01.png', 'special-02.png', 'special-03.png']
        },
        luna: {
            punch: ['punch-00.png', 'punch-01.png', 'punch-02.png', 'punch-03.png'],
            kick: ['kick-00.png', 'kick-01.png', 'kick-02.png', 'kick-03.png'],
            heavy: ['heavy-00.png', 'heavy-01.png', 'heavy-02.png', 'heavy-03.png'],
            block: ['block-00.png', 'block-01.png', 'block-02.png', 'block-03.png'],
            hit: ['hit-00.png', 'hit-01.png', 'hit-02.png', 'hit-03.png'],
            idle: ['idle-00.png', 'idle-01.png', 'idle-02.png', 'idle-03.png'],
            walk: ['walk-00.png', 'walk-01.png', 'walk-02.png', 'walk-03.png'],
            jump: ['jump-00.png', 'jump-01.png', 'jump-02.png', 'jump-03.png'],
            crouch: ['crouch-00.png', 'crouch-01.png', 'crouch-02.png', 'crouch-03.png'],
            dodge: ['dodge-00.png', 'dodge-01.png', 'dodge-02.png', 'dodge-03.png'],
            knockdown: ['knockdown-00.png', 'knockdown-01.png', 'knockdown-02.png', 'knockdown-03.png'],
            special: ['special-00.png', 'special-01.png', 'special-02.png', 'special-03.png']
        },
        fenrir: Object.assign(standardAnimationSet(), { intro: fourFrames('intro'), victory: fourFrames('victory') }),
        'she-wolf': standardAnimationSet(),
        khan: standardAnimationSet(),
        veles: standardAnimationSet(),
        mara: standardAnimationSet(),
        satoshi: standardAnimationSet(),
        borz: standardAnimationSet()
    };

    const AI_STYLES = {
        balanced: { ideal: [20, 30], read: 0.28, retreat: 0.12, weights: { punch: 31, kick: 25, heavy: 16, block: 18, dodge: 10 } },
        rushdown: { ideal: [15, 25], read: 0.18, retreat: 0.05, weights: { punch: 34, kick: 34, heavy: 10, block: 12, dodge: 10 } },
        tank: { ideal: [18, 27], read: 0.24, retreat: 0.04, weights: { punch: 17, kick: 18, heavy: 31, block: 27, dodge: 7 } },
        counter: { ideal: [23, 32], read: 0.44, retreat: 0.22, weights: { punch: 22, kick: 17, heavy: 10, block: 31, dodge: 20 } },
        pressure: { ideal: [14, 23], read: 0.25, retreat: 0.04, weights: { punch: 32, kick: 18, heavy: 27, block: 14, dodge: 9 } },
        trickster: { ideal: [22, 33], read: 0.36, retreat: 0.27, weights: { punch: 17, kick: 31, heavy: 10, block: 14, dodge: 28 } },
        striker: { ideal: [20, 31], read: 0.25, retreat: 0.1, weights: { punch: 27, kick: 34, heavy: 22, block: 11, dodge: 6 } },
        technical: { ideal: [24, 34], read: 0.4, retreat: 0.2, weights: { punch: 32, kick: 20, heavy: 11, block: 25, dodge: 12 } },
        grappler: { ideal: [12, 21], read: 0.27, retreat: 0.03, weights: { punch: 20, kick: 10, heavy: 36, block: 27, dodge: 7 } }
    };

    const INPUT_KEYS = {
        ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
        ArrowUp: 'jump', KeyW: 'jump', ArrowDown: 'crouch', KeyS: 'crouch',
        KeyJ: 'punch', KeyK: 'kick', KeyL: 'heavy', Space: 'block', KeyI: 'special'
    };

    const COMBOS = [
        { sequence: ['punch', 'punch', 'kick'], name: 'КЛЫК СТАИ', multiplier: 1.22 },
        { sequence: ['kick', 'heavy'], name: 'ЛУННЫЙ РАЗЛОМ', multiplier: 1.16 },
        { sequence: ['punch', 'kick', 'heavy'], name: 'ВОЛЧЬЯ СОТНЯ', multiplier: 1.3 }
    ];

    const CLUB_LADDER = [
        { name: 'Волчья сотня', badge: '🐺', rating: 1680, district: 'Центр' },
        { name: 'Block Raiders', badge: '⛓', rating: 1594, district: 'Север' },
        { name: 'TON Guardians', badge: '◈', rating: 1518, district: 'Город' },
        { name: 'Rumir Forge', badge: '◆', rating: 1462, district: 'Юг' },
        { name: 'Crypto Kitchen', badge: '🥘', rating: 1390, district: 'Запад' }
    ];

    const POSE_POSITION = { idle: '0% 0%', punch: '100% 0%', kick: '0% 100%', special: '100% 100%' };
    let selectedId = localStorage.getItem('wolfSelectedFighter') || 'alpha';
    let activeTab = 'fighters';
    let battle = null;
    let fightTimer = null;
    let pendingMode = 'training';
    let fightContext = null;
    let scheduled = [];
    let inputBound = false;
    let audioMuted = localStorage.getItem('wolfFightMuted') === 'true';
    let audioContext = null;
    let stats = window.readLocalJson('wolfFightStats', { rating: 1200, clubRating: 1680, wins: 0, losses: 0, streak: 0, bestCombo: 0 });
    let learnedTendencies = window.readLocalJson('wolfFightTendencies', { punch: 1, kick: 1, heavy: 1, block: 1, special: 1, total: 5 });

    function fighterById(id) {
        return FIGHTERS.find(function (fighter) { return fighter.id === id; }) || FIGHTERS[0];
    }

    function saveStats() {
        localStorage.setItem('wolfFightStats', JSON.stringify(stats));
        localStorage.setItem('wolfSelectedFighter', selectedId);
    }

    function spriteMarkup(fighter, className, pose) {
        const spriteUrl = new URL(fighter.sprite, document.baseURI).href;
        return `<span class="fighter-sprite ${className || ''}" data-fighter-id="${fighter.id}" style="--fighter-art:url('${spriteUrl}');--fighter-color:${fighter.color};--pose:${POSE_POSITION[pose || 'idle']}" role="img" aria-label="${fighter.name}"></span>`;
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
                <span class="fighter-card-copy"><b>${fighter.name}</b><small>${fighter.martialArt}</small></span>
                <i>${fighter.id === selected.id ? 'В СТАЕ' : 'ВЫБРАТЬ'}</i>
            </button>`;
        }).join('');
        return `<div class="fighter-roster-v2">${cards}</div>
            <section class="selected-fighter-v2" style="--fighter-color:${selected.color}">
                <div class="selected-art">${spriteMarkup(selected, 'showcase-sprite', 'idle')}<span>${selected.title}</span></div>
                <div class="selected-fighter-copy"><small>${selected.role.toUpperCase()} · ${selected.stance.toUpperCase()}</small><h2>${selected.name}</h2><b class="fighter-school">${selected.martialArt}</b><p>${selected.bio}</p><b>Суперприём: ${selected.special}</b></div>
                <div class="fighter-move-list">${selected.moves.map(function (move) { return `<span>${move}</span>`; }).join('')}<strong>Комбо: ${selected.signature.name}</strong></div>
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
            ['✚', 'Крестовина', 'Ходи по арене, сокращай дистанцию, прыгай и приседай под верхними ударами.'],
            ['X', 'Удар рукой', 'Быстрый и точный. Начинает серии и почти не тратит выносливость.'],
            ['Y', 'Удар ногой', 'Работает с большей дистанции и наполняет шкалу ярости.'],
            ['Z', 'Силовой', 'Медленный рискованный удар: высокий урон, отбрасывание и оглушение.'],
            ['B', 'Блок', 'Удерживай кнопку. Точный блок режет урон и наполняет ярость.'],
            ['R', 'Ярость', 'Уникальный суперприём бойца становится доступен при 100% энергии.']
        ];
        return `<section class="fight-manual"><div class="manual-head"><small>АРКАДНОЕ УПРАВЛЕНИЕ</small><h2>Два выигранных раунда решают бой</h2><p>Управляй дистанцией, следи за выносливостью и собирай комбинации, как в классическом консольном файтинге.</p></div>
            <div class="move-grid">${moves.map(function (move) { return `<article><span>${move[0]}</span><div><b>${move[1]}</b><p>${move[2]}</p></div></article>`; }).join('')}</div>
            <div class="combo-guide"><span>X</span><b>УДАР</b><i>→</i><span>X</span><b>УДАР</b><i>→</i><span>Y</span><b>НОГА</b><small>Комбо «Клык стаи»: третий удар получает усиление.</small></div>
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

    function bindRoot(root) {
        if (root.dataset.fightBound === 'true') {
            bindBattleInput(root);
            return;
        }
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
            if (action.dataset.fightAction === 'start') startFight();
            else if (action.dataset.fightAction === 'roster') renderFightScreen();
            else if (action.dataset.fightAction === 'mute') toggleAudio();
            else if (action.dataset.hold === 'true') return;
            else if (battle) playerAction(action.dataset.fightAction);
        });
        bindBattleInput(root);
    }

    function bindBattleInput(root) {
        if (root.dataset.arcadeInputBound !== 'true') {
            root.dataset.arcadeInputBound = 'true';
            root.addEventListener('pointerdown', function (event) {
                if (!battle) return;
                const stick = event.target.closest('[data-fight-stick]');
                if (stick) {
                    event.preventDefault();
                    beginJoystick(event, stick);
                    stick.setPointerCapture?.(event.pointerId);
                    return;
                }
                const direction = event.target.closest('[data-fight-move]');
                if (direction) {
                    event.preventDefault();
                    const move = direction.dataset.fightMove;
                    if (move === 'jump' || move === 'crouch') triggerMove(move);
                    else battle.input.add(move);
                    direction.setPointerCapture?.(event.pointerId);
                    return;
                }
                const hold = event.target.closest('[data-hold="true"]');
                if (hold?.dataset.fightAction === 'block') {
                    event.preventDefault();
                    battle.input.add('block');
                    playerAction('block');
                    hold.setPointerCapture?.(event.pointerId);
                }
            });
            root.addEventListener('pointermove', function (event) {
                if (!battle || battle.joystickPointer !== event.pointerId) return;
                const stick = root.querySelector('[data-fight-stick]');
                if (stick) updateJoystick(event, stick);
            });
            root.addEventListener('pointerup', releasePointerInput);
            root.addEventListener('pointercancel', releasePointerInput);
            root.addEventListener('contextmenu', function (event) {
                if (event.target.closest('.arcade-gamepad')) event.preventDefault();
            });
        }
        if (inputBound) return;
        inputBound = true;
        document.addEventListener('keydown', function (event) {
            if (!battle || battle.finished || !INPUT_KEYS[event.code]) return;
            const action = INPUT_KEYS[event.code];
            event.preventDefault();
            if (['left', 'right'].includes(action)) battle.input.add(action);
            else if (action === 'jump' || action === 'crouch') {
                if (!event.repeat) triggerMove(action);
            } else if (action === 'block') {
                battle.input.add('block');
                if (!event.repeat) playerAction('block');
            } else if (!event.repeat) playerAction(action);
        });
        document.addEventListener('keyup', function (event) {
            if (!battle || !INPUT_KEYS[event.code]) return;
            battle.input.delete(INPUT_KEYS[event.code]);
        });
        document.addEventListener('pointerup', function (event) {
            if (!battle) return;
            battle.input.delete('left');
            battle.input.delete('right');
            battle.input.delete('block');
            endJoystick(event.pointerId);
        });
    }

    function releasePointerInput(event) {
        if (!battle) return;
        endJoystick(event.pointerId);
        const direction = event.target.closest?.('[data-fight-move]');
        if (direction) battle.input.delete(direction.dataset.fightMove);
        const hold = event.target.closest?.('[data-hold="true"]');
        if (hold?.dataset.fightAction === 'block') battle.input.delete('block');
    }

    function beginJoystick(event, stick) {
        if (!battle || battle.joystickPointer !== null) return;
        battle.joystickPointer = event.pointerId;
        battle.joystickJumped = false;
        battle.joystickCrouched = false;
        stick.classList.add('active');
        updateJoystick(event, stick);
    }

    function updateJoystick(event, stick) {
        if (!battle) return;
        const base = stick.querySelector('.joystick-base');
        const thumb = stick.querySelector('.joystick-thumb');
        if (!base || !thumb) return;
        const rect = base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const max = rect.width * 0.29;
        const rawX = event.clientX - centerX;
        const rawY = event.clientY - centerY;
        const distance = Math.hypot(rawX, rawY) || 1;
        const scale = Math.min(1, max / distance);
        const x = rawX * scale;
        const y = rawY * scale;
        const normalizedX = x / max;
        const normalizedY = y / max;
        thumb.style.transform = `translate(${x}px, ${y}px)`;
        battle.joystickX = Math.abs(normalizedX) > 0.16 ? normalizedX : 0;
        if (normalizedY < -0.58 && !battle.joystickJumped) {
            battle.joystickJumped = true;
            triggerMove('jump');
        } else if (normalizedY > -0.3) {
            battle.joystickJumped = false;
        }
        if (normalizedY > 0.48 && battle.ready) {
            if (!battle.joystickCrouched) {
                battle.joystickCrouched = true;
                triggerMove('crouch');
            } else {
                battle.player.duckingUntil = Date.now() + 150;
            }
        } else if (normalizedY < 0.3) {
            battle.joystickCrouched = false;
        }
    }

    function endJoystick(pointerId) {
        if (!battle || battle.joystickPointer !== pointerId) return;
        battle.joystickPointer = null;
        battle.joystickX = 0;
        battle.joystickJumped = false;
        battle.joystickCrouched = false;
        const stick = document.querySelector('[data-fight-stick]');
        const thumb = stick?.querySelector('.joystick-thumb');
        stick?.classList.remove('active');
        if (thumb) thumb.style.transform = 'translate(0, 0)';
    }

    function combatant(fighter) {
        return Object.assign({}, fighter, {
            currentHp: fighter.hp,
            meter: 0,
            stamina: 100,
            combo: 0,
            lastHitAt: 0,
            lastActionAt: 0,
            blockingUntil: 0,
            dodgeUntil: 0,
            stunnedUntil: 0,
            actionLockUntil: 0,
            duckingUntil: 0,
            airborneUntil: 0,
            airborneStarted: 0,
            moveIntent: 0,
            moveUntil: 0,
            inputBuffer: [],
            animationId: 0,
            x: 50
        });
    }

    function startFight() {
        stopTimers();
        ensureAudio();
        try { window.Telegram?.WebApp?.expand?.(); } catch (_) { /* Full height is optional. */ }
        const player = fighterById(selectedId);
        const opponents = FIGHTERS.filter(function (fighter) { return fighter.id !== selectedId; });
        const enemy = opponents[Math.floor(Math.random() * opponents.length)];
        battle = {
            player: combatant(player), enemy: combatant(enemy), seconds: 60, round: 1,
            roundWins: { player: 0, enemy: 0 }, finished: false, roundOver: false, ready: false,
            startedAt: 0, endsAt: 0, nextEnemyAt: 0, lastTickAt: Date.now(), input: new Set(),
            joystickX: 0, joystickPointer: null, joystickJumped: false, joystickCrouched: false,
            ai: { recentPlayerActions: [], successfulReads: 0, decisions: 0 }
        };
        renderBattle();
        resetRound(true);
        fightTimer = setInterval(tickBattle, 50);
    }

    function resetRound(firstRound) {
        if (!battle || battle.finished) return;
        battle.ready = false;
        battle.roundOver = false;
        battle.seconds = 60;
        battle.player.currentHp = battle.player.hp;
        battle.enemy.currentHp = battle.enemy.hp;
        battle.player.stamina = 100;
        battle.enemy.stamina = 100;
        battle.player.combo = 0;
        battle.enemy.combo = 0;
        battle.player.x = 22;
        battle.enemy.x = 78;
        battle.player.moveIntent = 0;
        battle.enemy.moveIntent = 0;
        battle.player.inputBuffer = [];
        battle.enemy.inputBuffer = [];
        ['player', 'enemy'].forEach(function (side) {
            battle[side].blockingUntil = 0;
            battle[side].dodgeUntil = 0;
            battle[side].stunnedUntil = 0;
            battle[side].actionLockUntil = 0;
            battle[side].duckingUntil = 0;
            battle[side].airborneUntil = 0;
            battle[side].airborneStarted = 0;
        });
        battle.input.clear();
        battle.joystickX = 0;
        battle.joystickPointer = null;
        battle.joystickJumped = false;
        battle.joystickCrouched = false;
        clearCombatantState('player');
        clearCombatantState('enemy');
        syncBattle();
        if (firstRound) {
            setPose('player', 'idle', 'action-intro', 1150);
            setPose('enemy', 'idle', 'action-intro', 1150);
        }
        schedule(function () { announce('3'); }, 100);
        schedule(function () { announce('2'); }, 550);
        schedule(function () { announce('1'); }, 1000);
        schedule(function () {
            if (!battle || battle.finished || battle.roundOver) return;
            battle.ready = true;
            battle.startedAt = Date.now();
            battle.endsAt = Date.now() + 60000;
            battle.lastTickAt = Date.now();
            battle.nextEnemyAt = Date.now() + 900;
            announce('FIGHT!');
            playFightVoice();
            playTone('start');
            syncBattle();
        }, 1450);
        if (!firstRound) setTip('Раунд ' + battle.round + '. Держи дистанцию и не отдавай угол.');
    }

    function renderBattle() {
        const root = document.getElementById('fight-content');
        const player = battle.player;
        const enemy = battle.enemy;
        root.innerHTML = `<section class="wolf-arena-v2" id="wolf-arena" aria-label="Бойцовская арена">
            <div class="arena-lights" aria-hidden="true"></div><div class="arena-crowd" aria-hidden="true"></div>
            <div class="fight-hud-v2">
                ${healthBlock('player', player)}
                <div class="round-clock"><small id="fight-round-label">ROUND 1</small><b id="fight-clock">60</b><button id="fight-audio" data-fight-action="mute" aria-label="Включить или выключить звук">${audioMuted ? '🔇' : '🔊'}</button></div>
                ${healthBlock('enemy', enemy)}
            </div>
            <div class="fight-announcer-v2 hide" id="fight-announcer" aria-live="polite">FIGHT!</div>
            <div class="combo-callout" id="combo-callout"></div>
            <div class="combatants-v2">
                <div class="combatant-v2 player" id="player-combatant"><div class="fighter-body">${spriteMarkup(player, 'battle-sprite', 'idle')}<span class="fighter-shadow"></span></div></div>
                <div class="combatant-v2 enemy" id="enemy-combatant"><div class="fighter-body">${spriteMarkup(enemy, 'battle-sprite', 'idle')}<span class="fighter-shadow"></span></div></div>
            </div>
            <div class="battle-floor" aria-hidden="true"></div>
        </section>
        <section class="fight-console">
            <div class="meter-row">
                <div class="stamina-meter"><small>ВЫНОСЛИВОСТЬ</small><i><span id="stamina-fill" style="width:100%"></span></i></div>
                <div class="special-meter-v2"><small>ВОЛЧЬЯ ЭНЕРГИЯ</small><i><span id="special-fill" style="width:0%"></span></i></div>
            </div>
            <div class="arcade-gamepad" aria-label="Аркадное управление бойцом">
                <div class="fight-joystick" data-fight-stick aria-label="Виртуальный джойстик">
                    <div class="joystick-base"><span class="joystick-ring"></span><button class="joystick-thumb" type="button" aria-label="Двигай пальцем для управления">W</button></div>
                    <small>ДВИЖЕНИЕ · ПРЫЖОК · ПРИСЕД</small>
                </div>
                <div class="fight-controls-v2" aria-label="Кнопки удара">
                    ${controlButton('punch', 'X', 'Удар', 'быстро')}
                    ${controlButton('kick', 'Y', 'Нога', 'дистанция')}
                    ${controlButton('heavy', 'Z', 'Сила', 'урон')}
                    ${controlButton('block', 'B', 'Блок', 'держать', false, true)}
                    ${controlButton('special', 'R', player.special, 'ярость 100%', true)}
                </div>
            </div>
            <p class="fight-help"><b id="battle-tip">Подойди к сопернику и собери X → X → Y.</b><span>Клавиатура: WASD · J/K/L · пробел · I</span></p>
        </section>`;
        bindRoot(root);
        bindBattleInput(root);
        syncBattle();
    }

    function healthBlock(side, fighter) {
        return `<div class="health-block-v2 ${side}"><div><b>${fighter.name}</b><small>${fighter.role}</small></div><i><span id="${side}-health" style="width:100%"></span></i><div class="round-wins" id="${side}-round-wins"><em></em><em></em></div></div>`;
    }

    function controlButton(action, key, label, hint, special, hold) {
        return `<button class="fight-control ${special ? 'special' : ''} action-${action}" id="${action}-btn" data-fight-action="${action}" ${hold ? 'data-hold="true"' : ''} aria-label="${label}"><span>${key}</span><b>${label}</b><small>${hint}</small></button>`;
    }

    function tickBattle() {
        if (!battle || battle.finished) return;
        const now = Date.now();
        const delta = Math.min(0.1, Math.max(0.01, (now - battle.lastTickAt) / 1000));
        battle.lastTickAt = now;
        if (battle.ready && !battle.roundOver) {
            battle.seconds = Math.max(0, Math.ceil((battle.endsAt - now) / 1000));
            battle.player.stamina = Math.min(100, battle.player.stamina + staminaRecovery(battle.player) * delta);
            battle.enemy.stamina = Math.min(100, battle.enemy.stamina + staminaRecovery(battle.enemy) * delta);
            updateMovement(now, delta);
            updateHeldBlock(now, delta);
            if (now >= battle.nextEnemyAt) enemyAction();
            if (battle.seconds <= 0) finishRound(battle.player.currentHp / battle.player.hp >= battle.enemy.currentHp / battle.enemy.hp);
        }
        syncBattle();
    }

    function staminaRecovery(fighter) {
        const base = 7.5 + fighter.speed / 17;
        return fighter.archetype === 'rushdown' ? base * 1.22 : base;
    }

    function playerAction(type) {
        if (!battle || battle.finished || battle.roundOver || !battle.ready) return;
        performAction('player', type);
    }

    function triggerMove(type) {
        if (!battle || !battle.ready || battle.roundOver || battle.finished) return;
        const fighter = battle.player;
        const now = Date.now();
        if (now < fighter.stunnedUntil || now < fighter.actionLockUntil) return;
        if (type === 'jump' && now >= fighter.airborneUntil) {
            fighter.airborneStarted = now;
            fighter.airborneUntil = now + 720;
            fighter.duckingUntil = 0;
            setPose('player', 'idle', 'action-jump', 720);
            playTone('jump');
        } else if (type === 'crouch') {
            fighter.duckingUntil = now + 520;
            fighter.airborneUntil = 0;
            setPose('player', 'idle', 'action-crouch', 320);
        }
    }

    function updateMovement(now, delta) {
        const player = battle.player;
        const enemy = battle.enemy;
        let playerDirection = Number(battle.joystickX || 0);
        if (!battle.input.has('block') && now >= player.stunnedUntil && now >= player.actionLockUntil) {
            if (battle.input.has('left')) playerDirection -= 1;
            if (battle.input.has('right')) playerDirection += 1;
            playerDirection = Math.max(-1, Math.min(1, playerDirection));
        } else {
            playerDirection = 0;
        }
        const enemyDirection = now < enemy.moveUntil && now >= enemy.stunnedUntil && now >= enemy.actionLockUntil ? enemy.moveIntent : 0;
        player.x += playerDirection * (13 + player.speed / 5.2) * delta;
        enemy.x += enemyDirection * (13 + enemy.speed / 5.2) * delta;
        player.x = Math.max(11, Math.min(66, player.x));
        enemy.x = Math.max(34, Math.min(89, enemy.x));
        const gap = 22;
        if (enemy.x - player.x < gap) {
            const center = (enemy.x + player.x) / 2;
            player.x = center - gap / 2;
            enemy.x = center + gap / 2;
        }
        setWalking('player', playerDirection !== 0);
        setWalking('enemy', enemyDirection !== 0);
        syncCombatantState('player', now);
        syncCombatantState('enemy', now);
    }

    function updateHeldBlock(now, delta) {
        const player = battle.player;
        if (!battle.input.has('block')) return;
        if (player.stamina <= 1 || now < player.stunnedUntil || now < player.actionLockUntil) {
            battle.input.delete('block');
            return;
        }
        player.blockingUntil = now + 130;
        player.stamina = Math.max(0, player.stamina - 5 * delta);
    }

    function performAction(side, type) {
        const now = Date.now();
        const actor = battle[side];
        const opponentSide = side === 'player' ? 'enemy' : 'player';
        const target = battle[opponentSide];
        const baseAction = ACTIONS[type];
        const action = baseAction ? styledAction(actor, type, baseAction, now) : null;
        if (!action || battle.roundOver || now < actor.stunnedUntil || now < actor.actionLockUntil || now - actor.lastActionAt < Math.max(170, action.cooldown - actor.speed * 1.7)) return false;
        if (type === 'special' && actor.meter < 100) return false;
        if (actor.stamina < action.cost) {
            if (side === 'player') setTip('Не хватает выносливости — отступи или поставь блок.');
            return false;
        }
        actor.stamina = Math.max(0, actor.stamina - adjustedCost(actor, type, action.cost));
        actor.lastActionAt = now;
        registerInput(actor, type, now);
        if (side === 'player') learnPlayerAction(type, now);
        if (type === 'block') {
            actor.blockingUntil = now + (actor.archetype === 'counter' ? 1000 : 820);
            setPose(side, 'idle', 'blocking action-block', 360);
            if (side === 'player') setTip('Блок активен: поймай удар и сразу ответь.');
            return true;
        }
        if (type === 'dodge') {
            actor.dodgeUntil = now + (actor.archetype === 'trickster' ? 780 : 610);
            actor.x += side === 'player' ? -5 : 5;
            setPose(side, 'kick', 'dodging action-dodge', 540);
            return true;
        }
        if (type === 'special') actor.meter = 0;
        actor.actionLockUntil = now + Math.max(190, action.cooldown - actor.speed * 1.5);
        setPose(side, action.pose, 'acting action-' + type, action.cooldown);
        haptic(type === 'special' ? 'heavy' : 'light');
        playTone(type === 'special' ? 'special' : 'swing');
        schedule(function () {
            if (!battle || battle.finished || battle.roundOver) return;
            resolveAttack(side, opponentSide, type, actor, target, action);
        }, Math.round(action.cooldown * (action.hitAt || 0.5)));
        return true;
    }

    function learnPlayerAction(type, now) {
        if (!battle?.ai || !Object.prototype.hasOwnProperty.call(learnedTendencies, type)) return;
        battle.ai.recentPlayerActions.push({ type: type, at: now });
        battle.ai.recentPlayerActions = battle.ai.recentPlayerActions.filter(function (entry) { return now - entry.at < 4200; }).slice(-7);
        learnedTendencies[type] = Number(learnedTendencies[type] || 0) + 1;
        learnedTendencies.total = Number(learnedTendencies.total || 0) + 1;
        if (learnedTendencies.total > 240) {
            ['punch', 'kick', 'heavy', 'block', 'special'].forEach(function (action) {
                learnedTendencies[action] = Math.max(1, Math.round(learnedTendencies[action] / 2));
            });
            learnedTendencies.total = ['punch', 'kick', 'heavy', 'block', 'special'].reduce(function (sum, action) { return sum + learnedTendencies[action]; }, 0);
        }
        localStorage.setItem('wolfFightTendencies', JSON.stringify(learnedTendencies));
    }

    function adjustedCost(fighter, type, cost) {
        if (fighter.archetype === 'grappler' && type === 'block') return Math.max(2, cost - 3);
        if (fighter.archetype === 'rushdown' && type === 'punch') return Math.max(2, cost - 2);
        return cost;
    }

    function styledAction(fighter, type, baseAction, now) {
        const action = Object.assign({}, baseAction);
        if (fighter.archetype === 'rushdown' && type === 'kick') { action.cooldown -= 55; action.range += 2; }
        if (fighter.archetype === 'tank' && type === 'heavy') action.power += 0.16;
        if (fighter.archetype === 'counter' && type === 'block') action.cost = Math.max(2, action.cost - 1);
        if (fighter.archetype === 'pressure' && type === 'heavy') action.stun = (action.stun || 0) + 0.09;
        if (fighter.archetype === 'trickster' && type === 'kick') action.accuracy += 0.07;
        if (fighter.archetype === 'striker' && (type === 'kick' || type === 'punch')) action.power += 0.09;
        if (fighter.archetype === 'technical' && type === 'punch') action.accuracy += 0.05;
        if (fighter.archetype === 'grappler' && type === 'heavy') { action.power += 0.11; action.range += 2; }
        if (type === 'kick' && now < fighter.airborneUntil) { action.power *= 1.18; action.range += 3; }
        if (type === 'kick' && now < fighter.duckingUntil) { action.power *= 1.1; action.stun = Math.max(action.stun || 0, 0.16); }
        return action;
    }

    function resolveAttack(attackerSide, defenderSide, type, attacker, defender, action) {
        const now = Date.now();
        const distance = Math.abs(defender.x - attacker.x);
        if (distance > action.range) {
            attacker.combo = 0;
            showMiss(defenderSide, 'ДАЛЕКО');
            if (attackerSide === 'player') setTip('Удар не достал. Подойди ближе крестовиной.');
            playTone('miss');
            return;
        }
        if (now < defender.dodgeUntil) {
            defender.meter = Math.min(100, defender.meter + 16);
            attacker.combo = 0;
            showMiss(defenderSide, 'УКЛОН');
            if (defenderSide === 'player') setTip('Отличный уклон! Сейчас время для контратаки.');
            playTone('miss');
            return;
        }
        if (now < defender.duckingUntil && type === 'punch') {
            attacker.combo = 0;
            showMiss(defenderSide, 'НИЖЕ УДАРА');
            playTone('miss');
            return;
        }
        let accuracy = action.accuracy + (attacker.speed - defender.speed) / 500;
        if (attacker.archetype === 'trickster' && type === 'kick') accuracy += 0.08;
        if (Math.random() > Math.min(1, accuracy)) {
            attacker.combo = 0;
            showMiss(defenderSide, 'ПРОМАХ');
            playTone('miss');
            return;
        }
        const wasBlocking = now < defender.blockingUntil;
        const chainWindow = attacker.archetype === 'technical' ? 1750 : 1350;
        attacker.combo = now - attacker.lastHitAt <= chainWindow ? attacker.combo + 1 : 1;
        attacker.lastHitAt = now;
        const combo = matchedCombo(attacker);
        const comboBonus = (1 + Math.min(0.32, Math.max(0, attacker.combo - 1) * 0.07)) * (combo?.multiplier || 1);
        let damage = Math.max(2, Math.round(attacker.attack * action.power * (0.075 + Math.random() * 0.026) * comboBonus));
        if (wasBlocking) {
            const reduction = 0.5 + defender.guard / 250;
            damage = Math.max(1, Math.round(damage * (1 - Math.min(0.8, reduction))));
            defender.blockingUntil = 0;
            defender.meter = Math.min(100, defender.meter + (defender.archetype === 'counter' ? 24 : 14));
            showMiss(defenderSide, 'БЛОК');
            playTone('block');
        }
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        attacker.meter = Math.min(100, attacker.meter + (action.meter || 0) + Math.min(10, attacker.combo * 2));
        knockBack(attackerSide, defender, type, wasBlocking);
        if (!wasBlocking && action.stun && Math.random() < action.stun + (attacker.archetype === 'pressure' ? 0.08 : 0)) {
            defender.stunnedUntil = now + (type === 'special' ? 950 : 620);
            setPose(defenderSide, 'idle', 'stunned', 600);
            announce('ОГЛУШЕНИЕ');
        } else {
            hitReaction(defenderSide, damage, type);
        }
        stats.bestCombo = Math.max(Number(stats.bestCombo || 0), attackerSide === 'player' ? attacker.combo : 0);
        if (attackerSide === 'player' && attacker.combo >= 2) showCombo(attacker.combo, combo?.name);
        syncBattle();
        if (defender.currentHp <= 0) finishRound(attackerSide === 'player');
    }

    function enemyAction() {
        if (!battle || battle.finished || battle.roundOver || !battle.ready) return;
        const enemy = battle.enemy;
        const player = battle.player;
        const now = Date.now();
        const profile = AI_STYLES[enemy.archetype] || AI_STYLES.balanced;
        const distance = Math.abs(player.x - enemy.x);
        if (distance > profile.ideal[1]) {
            enemy.moveIntent = -1;
            enemy.moveUntil = now + 420 + Math.random() * 420;
            if (distance > 44 && Math.random() < 0.12) {
                enemy.airborneStarted = now;
                enemy.airborneUntil = now + 700;
            }
            battle.nextEnemyAt = now + 440 + Math.random() * 240;
            return;
        }
        if (distance < profile.ideal[0] && Math.random() < profile.retreat) {
            enemy.moveIntent = 1;
            enemy.moveUntil = now + 260 + Math.random() * 220;
            battle.nextEnemyAt = now + 360 + Math.random() * 220;
            return;
        }
        enemy.moveIntent = Math.random() < profile.retreat ? 1 : 0;
        enemy.moveUntil = now + 260;
        let action = chooseEnemyAction(enemy, player, profile, now);
        if (enemy.meter >= 100 && enemy.stamina >= ACTIONS.special.cost && Math.random() < 0.72) action = 'special';
        performAction('enemy', action);
        battle.ai.decisions += 1;
        const ratingPressure = Math.min(120, Math.max(0, (Number(stats.rating) - 1200) / 5));
        const tempo = 1120 - enemy.speed * 4.2 - ratingPressure + Math.random() * 330;
        battle.nextEnemyAt = now + Math.max(560, tempo);
    }

    function chooseEnemyAction(enemy, player, profile, now) {
        if (enemy.stamina < 20) return 'block';
        if (player.combo >= 2 && Math.random() < profile.read + 0.12) return Math.random() < 0.56 ? 'block' : 'dodge';
        const signatureAction = nextSignatureAction(enemy, now);
        const signatureChance = enemy.archetype === 'rushdown' ? 0.42 : (enemy.archetype === 'technical' ? 0.34 : 0.25);
        if (signatureAction && Math.random() < signatureChance && enemy.stamina >= (ACTIONS[signatureAction]?.cost || 0)) return signatureAction;
        const recent = battle.ai.recentPlayerActions.filter(function (entry) { return now - entry.at < 2100; });
        const repeated = dominantAction(recent.map(function (entry) { return entry.type; }));
        const historic = dominantTendency();
        const readChance = Math.min(0.72, profile.read + recent.length * 0.025 + battle.round * 0.025);
        if (Math.random() < readChance) {
            const predicted = repeated || historic;
            if (predicted === 'punch') return enemy.archetype === 'counter' || enemy.archetype === 'trickster' ? 'dodge' : 'block';
            if (predicted === 'kick') return Math.random() < 0.7 ? 'block' : 'dodge';
            if (predicted === 'heavy') return enemy.speed >= 78 ? 'dodge' : 'punch';
            if (predicted === 'block') return enemy.archetype === 'grappler' || enemy.archetype === 'tank' ? 'heavy' : 'kick';
            if (predicted === 'special') return 'dodge';
        }
        return weightedAction(profile.weights);
    }

    function nextSignatureAction(fighter, now) {
        const sequence = fighter.signature?.sequence;
        if (!Array.isArray(sequence) || !sequence.length) return null;
        const recent = fighter.inputBuffer.filter(function (entry) { return now - entry.at < 1900; }).map(function (entry) { return entry.type; });
        const maxProgress = Math.min(recent.length, sequence.length - 1);
        for (let progress = maxProgress; progress > 0; progress -= 1) {
            const suffix = recent.slice(-progress);
            if (suffix.every(function (action, index) { return action === sequence[index]; })) return sequence[progress];
        }
        return sequence[0];
    }

    function dominantAction(actions) {
        if (actions.length < 2) return null;
        const counts = actions.reduce(function (result, action) {
            result[action] = (result[action] || 0) + 1;
            return result;
        }, {});
        const winner = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
        return counts[winner] >= 2 ? winner : null;
    }

    function dominantTendency() {
        const actions = ['punch', 'kick', 'heavy', 'block', 'special'];
        return actions.sort(function (a, b) { return Number(learnedTendencies[b] || 0) - Number(learnedTendencies[a] || 0); })[0];
    }

    function weightedAction(weights) {
        const entries = Object.entries(weights);
        const total = entries.reduce(function (sum, entry) { return sum + entry[1]; }, 0);
        let roll = Math.random() * total;
        for (const entry of entries) {
            roll -= entry[1];
            if (roll <= 0) return entry[0];
        }
        return 'punch';
    }

    function registerInput(fighter, type, now) {
        fighter.inputBuffer.push({ type: type, at: now });
        fighter.inputBuffer = fighter.inputBuffer.filter(function (entry) { return now - entry.at < 2200; }).slice(-5);
    }

    function matchedCombo(fighter) {
        const values = fighter.inputBuffer.map(function (entry) { return entry.type; });
        const combos = fighter.signature ? [fighter.signature].concat(COMBOS) : COMBOS;
        return combos.find(function (combo) {
            if (values.length < combo.sequence.length) return false;
            return combo.sequence.every(function (value, index) { return values[values.length - combo.sequence.length + index] === value; });
        }) || null;
    }

    function knockBack(attackerSide, defender, type, blocked) {
        const force = blocked ? 1 : (type === 'special' ? 7 : type === 'heavy' ? 4.5 : 2.2);
        defender.x += attackerSide === 'player' ? force : -force;
        defender.x = Math.max(9, Math.min(91, defender.x));
    }

    function setPose(side, pose, extraClass, duration) {
        const node = document.getElementById(side + '-combatant');
        const fighter = battle?.[side];
        if (!node || !fighter) return;
        fighter.animationId += 1;
        const animationId = fighter.animationId;
        const sprite = node.querySelector('.fighter-sprite');
        const actionType = ['punch', 'kick', 'heavy', 'special', 'block', 'hit', 'walk', 'jump', 'crouch', 'dodge', 'knockdown', 'intro', 'victory'].find(function (action) { return extraClass?.includes('action-' + action); });
        if (sprite) activateFrameAnimation(sprite, fighter, actionType, duration || 380);
        if (sprite && !sprite.classList.contains('sprite-sequence')) sprite.style.setProperty('--pose', POSE_POSITION[pose] || POSE_POSITION.idle);
        ['acting', 'action-punch', 'action-kick', 'action-heavy', 'action-special', 'action-block', 'action-hit', 'action-jump', 'action-crouch', 'action-dodge', 'action-knockdown', 'action-intro', 'action-victory', 'hit', 'dodging', 'knockdown', 'stunned'].forEach(function (name) { node.classList.remove(name); });
        if (extraClass) extraClass.split(' ').forEach(function (name) { node.classList.add(name); });
        schedule(function () {
            if (!battle || !node.isConnected || battle[side].animationId !== animationId) return;
            ['acting', 'action-punch', 'action-kick', 'action-heavy', 'action-special', 'action-block', 'action-hit', 'action-jump', 'action-crouch', 'action-dodge', 'action-knockdown', 'action-intro', 'action-victory', 'hit', 'dodging', 'knockdown', 'stunned'].forEach(function (name) { node.classList.remove(name); });
            if (sprite && actionType === 'block' && Date.now() < fighter.blockingUntil) holdAnimationFrame(sprite, fighter, 'block', 2);
            else if (sprite && actionType === 'crouch' && Date.now() < fighter.duckingUntil) holdAnimationFrame(sprite, fighter, 'crouch', 2);
            else if (sprite) restoreFighterSprite(sprite, fighter);
        }, duration || 380);
    }

    function activateFrameAnimation(sprite, fighter, actionType, duration, loop) {
        const files = FIGHTER_ANIMATIONS[fighter.id]?.[actionType];
        if (!files) {
            restoreFighterSprite(sprite, fighter);
            return;
        }
        files.forEach(function (file, index) {
            const frameUrl = new URL('assets/fight/animation/' + fighter.id + '-v1/' + file, document.baseURI).href;
            sprite.style.setProperty('--fighter-frame-' + index, `url('${frameUrl}')`);
        });
        sprite.style.setProperty('--fighter-bg-size', 'contain');
        sprite.style.setProperty('--pose', 'center');
        sprite.style.setProperty('--sequence-duration', Math.max(220, duration) + 'ms');
        delete sprite.dataset.heldFrame;
        if (loop) sprite.dataset.loopAnimation = actionType;
        else delete sprite.dataset.loopAnimation;
        sprite.classList.remove('sprite-sequence', 'looping');
        void sprite.offsetWidth;
        sprite.classList.add('sprite-sequence');
        if (loop) sprite.classList.add('looping');
    }

    function restoreFighterSprite(sprite, fighter) {
        delete sprite.dataset.heldFrame;
        delete sprite.dataset.loopAnimation;
        sprite.classList.remove('sprite-sequence', 'looping');
        if (FIGHTER_ANIMATIONS[fighter.id]?.idle) {
            const idleDuration = Math.max(820, Math.min(1280, 1450 - fighter.speed * 4.5));
            activateFrameAnimation(sprite, fighter, 'idle', idleDuration, true);
            return;
        }
        const spriteUrl = new URL(fighter.sprite, document.baseURI).href;
        sprite.style.setProperty('--fighter-art', `url('${spriteUrl}')`);
        sprite.style.removeProperty('--fighter-bg-size');
        sprite.style.removeProperty('--sequence-duration');
        sprite.style.setProperty('--pose', POSE_POSITION.idle);
    }

    function holdAnimationFrame(sprite, fighter, actionType, frameIndex) {
        const file = FIGHTER_ANIMATIONS[fighter.id]?.[actionType]?.[frameIndex];
        if (!file) {
            restoreFighterSprite(sprite, fighter);
            return;
        }
        const frameUrl = new URL('assets/fight/animation/' + fighter.id + '-v1/' + file, document.baseURI).href;
        delete sprite.dataset.loopAnimation;
        sprite.classList.remove('sprite-sequence', 'looping');
        sprite.style.setProperty('--fighter-art', `url('${frameUrl}')`);
        sprite.style.setProperty('--fighter-bg-size', 'contain');
        sprite.style.setProperty('--pose', 'center');
        sprite.dataset.heldFrame = actionType;
    }

    function clearCombatantState(side) {
        const node = document.getElementById(side + '-combatant');
        if (!node) return;
        node.className = 'combatant-v2 ' + side;
        node.style.setProperty('--fighter-y', '0px');
        const sprite = node.querySelector('.fighter-sprite');
        if (sprite && battle?.[side]) restoreFighterSprite(sprite, battle[side]);
    }

    function syncCombatantState(side, now) {
        const node = document.getElementById(side + '-combatant');
        const fighter = battle?.[side];
        if (!node || !fighter) return;
        node.style.left = fighter.x + '%';
        let jumpY = 0;
        if (now < fighter.airborneUntil) {
            const duration = Math.max(1, fighter.airborneUntil - fighter.airborneStarted);
            const progress = Math.max(0, Math.min(1, (now - fighter.airborneStarted) / duration));
            jumpY = -Math.sin(progress * Math.PI) * 92;
        }
        node.style.setProperty('--fighter-y', jumpY + 'px');
        node.classList.toggle('jumping', now < fighter.airborneUntil);
        node.classList.toggle('crouching', now < fighter.duckingUntil);
        node.classList.toggle('frame-walk', Boolean(FIGHTER_ANIMATIONS[fighter.id]?.walk));
        node.classList.toggle('frame-crouch', Boolean(FIGHTER_ANIMATIONS[fighter.id]?.crouch));
        const wasBlocking = node.classList.contains('blocking');
        const isBlocking = now < fighter.blockingUntil;
        node.classList.toggle('blocking', isBlocking);
        const sprite = node.querySelector('.fighter-sprite');
        if (wasBlocking && !isBlocking && sprite?.dataset.heldFrame === 'block') {
            delete sprite.dataset.heldFrame;
            restoreFighterSprite(sprite, fighter);
        }
        if (sprite?.dataset.heldFrame === 'crouch' && now >= fighter.duckingUntil) restoreFighterSprite(sprite, fighter);
    }

    function setWalking(side, walking) {
        const node = document.getElementById(side + '-combatant');
        const fighter = battle?.[side];
        if (!node || !fighter) return;
        node.classList.toggle('walking', walking);
        const sprite = node.querySelector('.fighter-sprite');
        if (!sprite || !FIGHTER_ANIMATIONS[fighter.id]?.walk) return;
        const now = Date.now();
        const blockedByState = now < fighter.airborneUntil || now < fighter.duckingUntil || node.classList.contains('acting') || node.classList.contains('dodging') || node.classList.contains('jumping') || node.classList.contains('crouching') || node.classList.contains('blocking') || node.classList.contains('hit') || node.classList.contains('knockdown') || node.classList.contains('action-jump') || node.classList.contains('action-crouch');
        if (walking && !blockedByState && sprite.dataset.loopAnimation !== 'walk') activateFrameAnimation(sprite, fighter, 'walk', 520, true);
        if (!walking && sprite.dataset.loopAnimation === 'walk') restoreFighterSprite(sprite, fighter);
    }

    function hitReaction(side, damage, type) {
        const arena = document.getElementById('wolf-arena');
        setPose(side, 'idle', 'hit action-hit', type === 'special' ? 520 : (type === 'heavy' ? 430 : 340));
        if (arena) {
            arena.classList.remove('camera-hit', 'camera-special');
            void arena.offsetWidth;
            arena.classList.add(type === 'special' ? 'camera-special' : 'camera-hit');
        }
        spawnImpact(side, damage, type);
        playTone(type === 'special' ? 'specialHit' : 'hit');
        haptic(type === 'special' || type === 'heavy' ? 'heavy' : 'medium');
    }

    function spawnImpact(side, damage, type) {
        const arena = document.getElementById('wolf-arena');
        if (!arena) return;
        const impact = document.createElement('span');
        impact.className = 'fight-impact ' + side + ' ' + type;
        impact.style.left = (battle?.[side]?.x || 50) + '%';
        impact.innerHTML = `<b>-${damage}</b><i></i><i></i><i></i><i></i>`;
        arena.appendChild(impact);
        schedule(function () { impact.remove(); }, 700);
    }

    function showMiss(side, message) {
        const arena = document.getElementById('wolf-arena');
        if (!arena) return;
        const note = document.createElement('span');
        note.className = 'fight-miss ' + side;
        note.style.left = (battle?.[side]?.x || 50) + '%';
        note.textContent = message;
        arena.appendChild(note);
        schedule(function () { note.remove(); }, 650);
    }

    function showCombo(value, comboName) {
        const node = document.getElementById('combo-callout');
        if (!node) return;
        node.innerHTML = `<b>${value} HIT</b><span>${comboName || 'COMBO'}</span>`;
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
        const roundLabel = document.getElementById('fight-round-label');
        if (roundLabel) roundLabel.textContent = 'ROUND ' + battle.round;
        syncRoundWins('player');
        syncRoundWins('enemy');
        syncCombatantState('player', Date.now());
        syncCombatantState('enemy', Date.now());
        Object.keys(ACTIONS).forEach(function (type) {
            const button = document.getElementById(type + '-btn');
            if (!button) return;
            const action = ACTIONS[type];
            button.disabled = !battle.ready || battle.finished || battle.player.stamina < action.cost || (type === 'special' && battle.player.meter < 100);
            if (type === 'special') button.classList.toggle('ready', battle.player.meter >= 100);
        });
    }

    function syncRoundWins(side) {
        const node = document.getElementById(side + '-round-wins');
        if (!node) return;
        Array.from(node.children).forEach(function (pip, index) {
            pip.classList.toggle('won', index < battle.roundWins[side]);
        });
    }

    function setWidth(id, value) {
        const node = document.getElementById(id);
        if (node) node.style.width = Math.max(0, Math.min(100, value)) + '%';
    }

    function finishRound(playerWon) {
        if (!battle || battle.finished || battle.roundOver) return;
        battle.roundOver = true;
        battle.ready = false;
        battle.input.clear();
        const winnerSide = playerWon ? 'player' : 'enemy';
        const loserSide = playerWon ? 'enemy' : 'player';
        battle.roundWins[winnerSide] += 1;
        if (battle.seconds > 0) setPose(loserSide, 'idle', 'knockdown action-knockdown', 1150);
        syncBattle();
        announce(battle.seconds <= 0 ? 'TIME!' : 'K.O.!');
        playTone('ko');
        haptic('heavy');
        if (battle.roundWins[winnerSide] >= 2) {
            setPose(winnerSide, 'idle', 'action-victory', 1100);
            schedule(function () { finishFight(playerWon); }, 1250);
            return;
        }
        battle.round += 1;
        schedule(function () { resetRound(false); }, 1350);
    }

    function ensureAudio() {
        if (audioMuted) return null;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return null;
            if (!audioContext) audioContext = new AudioContextClass();
            if (audioContext.state === 'suspended') audioContext.resume();
            return audioContext;
        } catch (_) { return null; }
    }

    function playTone(kind) {
        if (audioMuted) return;
        const context = ensureAudio();
        if (!context) return;
        const tones = {
            start: [180, 0.16, 'square'], swing: [120, 0.055, 'sawtooth'], miss: [80, 0.06, 'sine'],
            jump: [260, 0.08, 'sine'], block: [420, 0.07, 'square'], hit: [68, 0.09, 'square'],
            special: [150, 0.28, 'sawtooth'], specialHit: [48, 0.32, 'square'], ko: [72, 0.48, 'sawtooth']
        };
        const settings = tones[kind] || tones.hit;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = settings[2];
        oscillator.frequency.setValueAtTime(settings[0], now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(28, settings[0] * (kind === 'jump' ? 1.8 : 0.55)), now + settings[1]);
        gain.gain.setValueAtTime(kind === 'specialHit' || kind === 'ko' ? 0.2 : 0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + settings[1]);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + settings[1]);
    }

    function playFightVoice() {
        if (audioMuted || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
        try {
            window.speechSynthesis.cancel();
            const voice = new SpeechSynthesisUtterance('Fight!');
            voice.rate = 0.72;
            voice.pitch = 0.55;
            voice.volume = 0.86;
            window.speechSynthesis.speak(voice);
        } catch (_) { /* Voice is optional in restricted browsers. */ }
    }

    function toggleAudio() {
        audioMuted = !audioMuted;
        localStorage.setItem('wolfFightMuted', String(audioMuted));
        const button = document.getElementById('fight-audio');
        if (button) button.textContent = audioMuted ? '🔇' : '🔊';
        if (!audioMuted) {
            ensureAudio();
            playTone('start');
        }
    }

    function finishFight(won) {
        if (!battle || battle.finished) return;
        const matchScore = battle.roundWins.player + ':' + battle.roundWins.enemy;
        battle.finished = true;
        stopTimers();
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
            <div class="result-stats"><span><small>Раунды</small><b>${matchScore}</b></span><span><small>Рейтинг</small><b>${Number(stats.rating)}</b></span><span><small>Лучшая серия</small><b>${Number(stats.bestCombo || 0)} HIT</b></span><span><small>Сезон</small><b>${Number(stats.wins)}–${Number(stats.losses)}</b></span></div>
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
