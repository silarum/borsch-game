// ================== ГЛОБАЛЬНЫЕ ДАННЫЕ ==================
var GOOD = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅'];
var BAD = ['💩','🪱','🧀','🥀','🍄'];
var rum = 0, invest = 0, srum = 0, ton = 0, usdt = 0, games = 3;
var maxGames = 3, gameRecoveryTime = 600;
var gameActive = false, gameTimer, gameTimeLeft = 60, spawnInterval, currentVeg = {};
var activeBoost = null, streak = 0, duelActive = false;
var userStatus = 'solo', userNickname = 'Майнер';
var myClubId = localStorage.getItem('myClubId') || null;
var clubs = window.readLocalArray('clubs');
var pausedSessions = window.readLocalArray('pausedSessions');
var miningStage = 1, miningCurrency = 'SRUM', miningThreshold = 1;
var pendingMining = null, currentBot = null, bandData = null;
var frozenStake = 0; // Замороженная ставка в пуле
var spartansEnabled = window.readLocalJson('spartansEnabled', true);
var officialRumTasks = window.readLocalArray('officialRumTasks', null) || [
    { id:1, desc:'Подписаться на канал', reward:50, maxCompletions:100, completionsDone:0, checking:false },
    { id:2, desc:'Сделать репост', reward:100, maxCompletions:100, completionsDone:0, checking:false },
    { id:3, desc:'Пригласить друга', reward:200, maxCompletions:100, completionsDone:0, checking:false },
    { id:4, desc:'Сыграть 5 раундов', reward:300, maxCompletions:100, completionsDone:0, checking:false }
];
var officialSrumTasks = window.readLocalArray('officialSrumTasks', null) || [
    { id:101, desc:'Подпишись на Twitter', reward:0.1, maxCompletions:100, completionsDone:0, checking:false },
    { id:102, desc:'Поставь лайк проекту', reward:0.15, maxCompletions:100, completionsDone:0, checking:false }
];
var globalUserTasks = window.readLocalArray('globalUserTasks');
var userTasks = window.readLocalArray('userTasks');
var referrals = window.readLocalArray('referrals');

var SILARUM_TO_RUMIR = 10000;
var investProjects = window.readLocalArray('investProjects', null) || [
    { id: 1, name: 'iSayMobil', icon: '🚗', desc: 'Интерактивная система аудиооповещения.', collectedSrum: 0, share: 10 },
    { id: 2, name: 'Голодные Волки — FGSPI', icon: '🐺', desc: 'Игровой и спортивный клуб «Волчья сотня».', collectedSrum: 0, share: 5 },
    { id: 3, name: 'WMW — Всемирная стена памяти', icon: '🕯️', desc: 'Портал памяти и цифровая Книга жизни.', collectedSrum: 0, share: 3 }
];
var myInvestments = window.readLocalArray('myInvestments');
var investHistory = window.readLocalArray('investHistory');

// Миграция старых тестовых вкладов RUM в новую модель SILARUM.
investProjects.forEach(function(project) {
    if (!Number.isFinite(Number(project.collectedSrum))) project.collectedSrum = Number(project.collected || 0) / SILARUM_TO_RUMIR;
});
myInvestments.forEach(function(item) {
    if (!Number.isFinite(Number(item.srumAmount))) item.srumAmount = Number(item.amount || 0) / SILARUM_TO_RUMIR;
});

function saveAll() {
    localStorage.setItem('rum', rum);
    localStorage.setItem('srum', srum);
    localStorage.setItem('ton', ton);
    localStorage.setItem('usdt', usdt);
    localStorage.setItem('games', games);
    localStorage.setItem('lastGameTime', window.lastGameTime || 0);
    localStorage.setItem('clubs', JSON.stringify(clubs));
    if (myClubId) localStorage.setItem('myClubId', myClubId); else localStorage.removeItem('myClubId');
    localStorage.setItem('pausedSessions', JSON.stringify(pausedSessions));
    localStorage.setItem('nickname', userNickname);
    localStorage.setItem('userStatus', userStatus);
    localStorage.setItem('referrals', JSON.stringify(referrals));
    localStorage.setItem('officialRumTasks', JSON.stringify(officialRumTasks));
    localStorage.setItem('officialSrumTasks', JSON.stringify(officialSrumTasks));
    localStorage.setItem('globalUserTasks', JSON.stringify(globalUserTasks));
    localStorage.setItem('userTasks', JSON.stringify(userTasks));
    localStorage.setItem('miningStage', miningStage);
    localStorage.setItem('frozenStake', frozenStake);
    localStorage.setItem('activeBoost', activeBoost ? JSON.stringify(activeBoost) : null);
    localStorage.setItem('investProjects', JSON.stringify(investProjects));
    localStorage.setItem('myInvestments', JSON.stringify(myInvestments));
    localStorage.setItem('investHistory', JSON.stringify(investHistory));
}

// ================== DOM-ЭЛЕМЕНТЫ ==================
var pot, board, rumBal, srumBal, usdtBalTop, tonBalTop, holes;
var viewSwitch, rulesBtn, langBtn, boostDisplay, energyDisplay;
var startBtn, startBtnContainer, quickDuelCoin;
var duelScoreboard, duelPlayerScoreEl, duelOpponentScoreEl, duelTimerEl;
var userProfile, bottomPanel;

function cacheDom() {
    pot = document.getElementById('pot');
    board = document.getElementById('board');
    rumBal = document.getElementById('rum-balance');
    srumBal = document.getElementById('srum-balance');
    usdtBalTop = document.getElementById('usdt-balance-top');
    tonBalTop = document.getElementById('ton-balance-top');
    holes = document.querySelectorAll('.hole');
    viewSwitch = document.getElementById('view-switch');
    rulesBtn = document.getElementById('rules-btn-bottom');
    langBtn = document.getElementById('lang-btn-bottom');
    boostDisplay = document.getElementById('boost-display');
    energyDisplay = document.getElementById('energy-display');
    startBtn = document.getElementById('start-btn');
    startBtnContainer = document.getElementById('start-btn-container');
    quickDuelCoin = document.getElementById('quick-duel-coin');
    duelScoreboard = document.getElementById('duel-scoreboard');
    duelPlayerScoreEl = document.getElementById('duelPlayerScore');
    duelOpponentScoreEl = document.getElementById('duelOpponentScore');
    duelTimerEl = document.getElementById('duelTimer');
    userProfile = document.getElementById('user-profile');
    bottomPanel = document.getElementById('bottom-panel');
}

// ================== ГЛАВНЫЙ ЭКРАН ==================
function getMainElements() {
    return [viewSwitch, rulesBtn, langBtn, quickDuelCoin, startBtnContainer, board, userProfile, bottomPanel].filter(function(el) { return el; });
}

function hideMainElements() {
    var elements = getMainElements();
    for (var i = 0; i < elements.length; i++) { elements[i].style.display = 'none'; }
}

function showMainElements() {
    var elements = getMainElements();
    for (var i = 0; i < elements.length; i++) { elements[i].style.display = ''; }
    updateUI();
}

// ================== НАВИГАЦИЯ ==================
function switchScreen(screenId) {
    if (screenId !== 'fight' && typeof window.stopWolfFight === 'function') window.stopWolfFight();
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) { screens[i].classList.remove('active'); }
    if (screenId) {
        hideMainElements();
        if (screenId === 'tasks') { document.getElementById('tasks-screen').classList.add('active'); if (typeof renderAvailableTasks === 'function') renderAvailableTasks(); }
        else if (screenId === 'mining-club') { document.getElementById('mining-club-screen').classList.add('active'); if (typeof renderMyClub === 'function') renderMyClub(); }
        else if (screenId === 'arena') { document.getElementById('arena-screen').classList.add('active'); if (typeof renderArena === 'function') renderArena(); }
        else if (screenId === 'referral') { document.getElementById('referral-screen').classList.add('active'); if (typeof renderReferralList === 'function') renderReferralList(); }
        else if (screenId === 'shop') { document.getElementById('shop-screen').classList.add('active'); if (typeof renderShop === 'function') renderShop(); }
        else if (screenId === 'wallet') { document.getElementById('wallet-screen').classList.add('active'); if (typeof renderWallet === 'function') renderWallet(); }
        else if (screenId === 'fight') { document.getElementById('fight-screen').classList.add('active'); if (typeof renderFightScreen === 'function') renderFightScreen(); }
        else if (screenId === 'top-tappers') { document.getElementById('top-tappers-screen').classList.add('active'); loadTopPlayers('rum'); }
        else if (screenId === 'top-miners') { document.getElementById('top-miners-screen').classList.add('active'); loadTopPlayers('srum'); }
        else if (screenId === 'invest') { document.getElementById('invest-screen').classList.add('active'); renderInvest(); }
        else { var target = document.getElementById(screenId + '-screen'); if (target) target.classList.add('active'); }
    } else {
        showMainElements();
    }
}

// ================== ТОПЫ ==================
function loadTopPlayers(type) {
    var screenId = type === 'rum' ? 'top-tappers-screen' : 'top-miners-screen';
    var screen = document.getElementById(screenId);
    if (!screen) return;
    var infoCard = screen.querySelector('.info-card');
    if (!infoCard) return;
    if (!window.APP_CONFIG.cloudSyncEnabled) {
        infoCard.innerHTML = '<p style="color:#aaa;text-align:center;">Рейтинг появится после запуска защищённого сервера.</p>';
        return;
    }
    infoCard.innerHTML = '<p style="text-align:center;color:#FFD700;">⏳ Загрузка...</p>';
    gameApi('leaderboard', { type: type }).then(function(players) {
        players = Array.isArray(players) ? players : [];
        var html = '';
        if (!players.length) { html = '<p style="color:#aaa;">Нет данных</p>'; }
        else {
            var medals = ['🥇', '🥈', '🥉'];
            for (var i = 0; i < players.length; i++) {
                var p = players[i];
                var medal = i < 3 ? medals[i] : (i + 1) + '.';
                var value = type === 'rum' ? (p.rum || 0).toLocaleString() : parseFloat(p.srum || 0).toFixed(2);
                var currency = type === 'rum' ? 'RUM' : 'SRUM';
                var isMe = p.nickname === userNickname;
                html += '<div style="background:' + (isMe ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)') + ';padding:10px;margin:5px 0;border-radius:8px;display:flex;justify-content:space-between;' + (isMe ? 'border:1px solid gold;' : '') + '">' +
                    '<span>' + medal + ' ' + window.escapeHtml(p.nickname || 'Майнер') + (isMe ? ' 👈' : '') + '</span>' +
                    '<span style="color:#FFD700;font-weight:bold;">' + value + ' ' + currency + '</span></div>';
            }
        }
        infoCard.innerHTML = html;
    }).catch(function() { infoCard.innerHTML = '<p style="color:#e74c3c;">Ошибка</p>'; });
}

// ================== ИНВЕСТИЦИИ ==================
function renderInvest() {
    var screen = document.getElementById('invest-screen');
    if (!screen) return;
    var totalInvested = myInvestments.reduce(function(sum, inv) { return sum + Number(inv.srumAmount || 0); }, 0);
    var html = '<button class="back-btn" id="invest-back-btn">← Назад</button>' +
        '<div class="invest-hero"><span class="invest-hero-icon">◈</span><div><small>ОТКРЫТОЕ УЧАСТИЕ</small><h2>Инвестиции</h2><p>Любая сумма без минимального порога</p></div></div>' +
        '<div class="conversion-card"><span>Фиксированный игровой курс</span><strong>1 SILARUM = 10 000 RUMIR</strong><small>Тестовые игровые активы · реальные платежи отключены</small></div>' +
        '<div class="portfolio-card"><span>Твой портфель</span><strong>' + totalInvested.toFixed(4) + ' SILARUM</strong><small>Эквивалент ' + Math.round(totalInvested * SILARUM_TO_RUMIR).toLocaleString() + ' RUMIR · ' + myInvestments.length + ' проектов</small></div>';

    for (var j = 0; j < investProjects.length; j++) {
        var project = investProjects[j];
        var projectId = Number(project.id);
        var myInv = myInvestments.find(function(i) { return i.projectId === project.id; });
        var myAmount = myInv ? Number(myInv.srumAmount || 0) : 0;
        var collected = Number(project.collectedSrum || 0);
        var investorShare = collected > 0 ? (myAmount / collected) * 100 : 0;
        html += '<div class="info-card invest-project-card">' +
            (myAmount > 0 ? '<div class="invest-badge">Ты участвуешь</div>' : '') +
            '<div class="invest-project-head"><span>' + window.escapeHtml(project.icon) + '</span><div><strong>' + window.escapeHtml(project.name) + '</strong><p>' + window.escapeHtml(project.desc) + '</p></div></div>' +
            '<div class="invest-metrics"><span>Собрано<strong>' + collected.toFixed(4) + ' SILARUM</strong></span><span>RUMIR‑экв.<strong>' + Math.round(collected * SILARUM_TO_RUMIR).toLocaleString() + '</strong></span></div>' +
            '<p class="open-round">● Раунд открыт · порога входа нет</p>';
        if (myAmount > 0) {
            html += '<div class="my-investment"><span>Твой вклад <b>' + myAmount.toFixed(4) + ' SILARUM</b></span><span>Доля тестового пула <b>' + investorShare.toFixed(2) + '%</b></span></div>';
        }
        html += '<div class="invest-action"><input type="number" min="0.0001" step="0.0001" max="' + srum + '" id="invest-amount-' + projectId + '" placeholder="Любая сумма SILARUM"><button id="invest-btn-' + projectId + '">Вложить</button></div>';
        if (myAmount > 0) html += '<button class="withdraw-invest" id="withdraw-btn-' + projectId + '">Забрать игровые SILARUM (штраф 10%)</button>';
        html += '</div>';
    }
    screen.innerHTML = html;
    document.getElementById('invest-back-btn').addEventListener('click', function() { switchScreen(null); });

    for (var k = 0; k < investProjects.length; k++) {
        (function(project) {
            var btn = document.getElementById('invest-btn-' + project.id);
            if (btn) btn.addEventListener('click', function() {
                var input = document.getElementById('invest-amount-' + project.id);
                var amount = Number(input.value) || 0;
                if (amount <= 0) return alert('Введите сумму');
                if (amount > srum) return alert('Недостаточно SILARUM');
                if (!confirm('Вложить ' + amount.toFixed(4) + ' SILARUM?')) return;
                srum -= amount; invest += amount * SILARUM_TO_RUMIR; project.collectedSrum += amount;
                var myInv = myInvestments.find(function(i) { return i.projectId === project.id; });
                if (myInv) { myInv.srumAmount += amount; } else { myInvestments.push({ projectId: project.id, srumAmount: amount }); }
                investHistory.push({ projectId: project.id, srumAmount: amount, rumirEquivalent: amount * SILARUM_TO_RUMIR, date: Date.now() });
                updateUI(); saveAll();
                renderInvest();
            });
            var wb = document.getElementById('withdraw-btn-' + project.id);
            if (wb) wb.addEventListener('click', function() {
                var myInv = myInvestments.find(function(i) { return i.projectId === project.id; });
                if (!myInv) return;
                var penalty = myInv.srumAmount * 0.1;
                var ret = myInv.srumAmount - penalty;
                if (!confirm('Вывести ' + myInv.srumAmount.toFixed(4) + ' SILARUM? К возврату ' + ret.toFixed(4))) return;
                srum += ret; project.collectedSrum = Math.max(0, project.collectedSrum - myInv.srumAmount);
                myInvestments = myInvestments.filter(function(i) { return i.projectId !== project.id; });
                updateUI(); saveAll(); renderInvest();
            });
        })(investProjects[k]);
    }
}

// ================== ИНИЦИАЛИЗАЦИЯ ==================
var userId = null;
window.lastGameTime = parseInt(localStorage.getItem('lastGameTime') || '0');

function initApp() {
    cacheDom();
    document.getElementById('main-game').style.display = 'block';
    document.getElementById('veggie-view').style.display = 'block';
    if (typeof startVeggieAnimation === 'function') startVeggieAnimation();

    if (!window.APP_CONFIG.cloudSyncEnabled && localStorage.getItem('demoStarterVersion') !== '2') {
        srum = Math.max(srum, 30);
        localStorage.setItem('srum', srum);
        localStorage.setItem('demoStarterVersion', '2');
    }

    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        userId = Telegram.WebApp.initDataUnsafe.user.id;
        userNickname = Telegram.WebApp.initDataUnsafe.user.first_name || 'Майнер';
    } else {
        userId = parseInt(localStorage.getItem('userId')) || Date.now();
        localStorage.setItem('userId', userId);
    }

    if (typeof loadUserData === 'function' && userId) {
        loadUserData(userId).then(function(userData) {
            if (userData) {
                rum = userData.rum || 0; srum = parseFloat(userData.srum) || 0;
                ton = parseFloat(userData.ton) || 0; usdt = parseFloat(userData.usdt) || 0;
                invest = userData.invest || 0;
                userNickname = userData.nickname || userNickname;
                userStatus = userData.status || 'solo';
                miningStage = userData.mining_stage || 1;
                frozenStake = parseFloat(userData.frozen_stake) || 0;
                if (typeof userData.games === 'number') games = userData.games;
                if (userData.boost && userData.boost !== 'null') { try { activeBoost = JSON.parse(userData.boost); } catch(e) {} }
                saveAll();
                if (typeof processWelcomeBonus === 'function') {
                    processWelcomeBonus(userId, userData).then(function(claimed) { if (claimed) { srum = window.srum; saveAll(); } updateUI(); });
                }
            } else { loadFromLocalStorage(); }
            updateUI();
        }).catch(function(e) { console.log('Облако:', e.message); loadFromLocalStorage(); updateUI(); });
    } else { loadFromLocalStorage(); updateUI(); }

    if (games < maxGames && typeof startRecovery === 'function') startRecovery();
    if (rulesBtn) rulesBtn.addEventListener('click', function() { switchScreen('rules'); });
    var navBtns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].addEventListener('click', function() {
            var id = this.getAttribute('data-screen');
            for (var n = 0; n < navBtns.length; n++) navBtns[n].classList.remove('active');
            this.classList.add('active');
            if (id) switchScreen(id);
        });
    }
    var menuBtns = document.querySelectorAll('.menu-dropdown button[data-screen]');
    for (var j = 0; j < menuBtns.length; j++) {
        menuBtns[j].addEventListener('click', function() { var id = this.getAttribute('data-screen'); if (id) { switchScreen(id); document.getElementById('menu-dropdown').classList.remove('active'); } });
    }
    var backBtns = document.querySelectorAll('.back-btn');
    for (var k = 0; k < backBtns.length; k++) {
        backBtns[k].addEventListener('click', function(ev) { ev.stopPropagation(); switchScreen(null); });
    }
}

function loadFromLocalStorage() {
    var savedRum = parseInt(localStorage.getItem('rum'));
    var savedSrum = parseFloat(localStorage.getItem('srum'));
    var savedTon = parseFloat(localStorage.getItem('ton'));
    var savedUsdt = parseFloat(localStorage.getItem('usdt'));
    var savedInvest = parseInt(localStorage.getItem('invest'));
    var savedGames = parseInt(localStorage.getItem('games'));
    if (!isNaN(savedRum)) rum = savedRum;
    if (!isNaN(savedSrum)) srum = savedSrum;
    if (window.APP_CONFIG.financialFeaturesEnabled && !isNaN(savedTon)) ton = savedTon;
    if (window.APP_CONFIG.financialFeaturesEnabled && !isNaN(savedUsdt)) usdt = savedUsdt;
    if (!isNaN(savedInvest)) invest = savedInvest;
    if (!isNaN(savedGames) && savedGames >= 0 && savedGames <= maxGames) games = savedGames;
    var nn = localStorage.getItem('nickname'); if (nn) userNickname = nn;
    var ns = localStorage.getItem('userStatus'); if (ns) userStatus = ns;
    var ms = parseInt(localStorage.getItem('miningStage')); if (!isNaN(ms)) miningStage = ms;
    var fs = parseFloat(localStorage.getItem('frozenStake')); if (!isNaN(fs) && fs >= 0) frozenStake = fs;
    var sb = localStorage.getItem('activeBoost'); if (sb && sb !== 'null') { try { activeBoost = JSON.parse(sb); } catch(e) {} }
}

window.addEventListener('load', function() {
    window.rum = rum;
    window.srum = srum;
    window.ton = ton;
    window.usdt = usdt;
    window.games = games;
    window.gameActive = gameActive;
    window.activeBoost = activeBoost;
    window.streak = streak;
    window.duelActive = duelActive;
    window.userStatus = userStatus;
    window.userNickname = userNickname;
    window.miningStage = miningStage;
    window.miningCurrency = miningCurrency;
    window.miningThreshold = miningThreshold;
    window.pendingMining = pendingMining;
    window.currentBot = currentBot;
    window.userId = userId;
    window.spartansEnabled = spartansEnabled;
    window.frozenStake = frozenStake;

    initApp();
});

// ================== UI ==================
function updateUI() {
    if (!rumBal) return;
    rumBal.textContent = '💰 RUMIR: ' + rum;
    srumBal.textContent = '💎 SRUM: ' + srum.toFixed(2);
    usdtBalTop.textContent = window.APP_CONFIG.financialFeaturesEnabled ? '💵 USDT: ' + usdt.toFixed(2) : '💵 USDT: OFF';
    tonBalTop.textContent = window.APP_CONFIG.financialFeaturesEnabled ? '⚡ TON: ' + ton.toFixed(2) : '⚡ TON: OFF';
    var tb = document.getElementById('ton-balance'); if (tb) tb.textContent = ton.toFixed(2);
    var ub = document.getElementById('usdt-balance'); if (ub) ub.textContent = usdt.toFixed(2);
    if (games > 0 && !gameActive && !duelActive) {
        if (startBtn) startBtn.style.display = 'inline-block';
        if (energyDisplay) energyDisplay.textContent = '⚡ ' + games + '/' + maxGames + ' игр';
    } else {
        if (startBtn) startBtn.style.display = 'none';
        if (energyDisplay && !gameActive && !duelActive) {
            var now = Date.now(), last = window.lastGameTime || 0;
            var rem = Math.max(0, gameRecoveryTime - (now - last) / 1000);
            energyDisplay.textContent = '⏳ ' + Math.floor(rem/60) + ':' + String(Math.floor(rem%60)).padStart(2,'0');
        }
    }
    updateBoostDisplay();
    if (typeof updateProfile === 'function') updateProfile();
    saveAll();
    if (typeof saveUserData === 'function' && userId) {
        saveUserData(userId, { nickname: userNickname, rum: rum, srum: srum, ton: ton, usdt: usdt, invest: invest, status: userStatus, mining_stage: miningStage, frozen_stake: frozenStake, boost: activeBoost ? JSON.stringify(activeBoost) : null, games: games }).catch(function(){});
    }
}

function updateBoostDisplay() {
    if (!boostDisplay) return;
    if (activeBoost && activeBoost.endTime > Date.now()) {
        var rem = Math.max(0, Math.ceil((activeBoost.endTime - Date.now()) / 1000));
        boostDisplay.textContent = '🚀 x' + activeBoost.type + ' ' + Math.floor(rem/3600) + ':' + String(Math.floor((rem%3600)/60)).padStart(2,'0') + ':' + String(Math.floor(rem%60)).padStart(2,'0');
        boostDisplay.style.display = 'block';
    } else { boostDisplay.textContent = ''; boostDisplay.style.display = 'none'; if (activeBoost) activeBoost = null; }
}
setInterval(updateBoostDisplay, 1000);
setInterval(updateUI, 5000);
