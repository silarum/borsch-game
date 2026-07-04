// ================== ГЛОБАЛЬНЫЕ ДАННЫЕ ==================
var GOOD = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅'];
var BAD = ['💩','🪱','🧀','🥀','🍄'];
var rum = 0, invest = 0, srum = 0, ton = 0, usdt = 0, games = 3;
var maxGames = 3, gameRecoveryTime = 600;
var gameActive = false, gameTimer, gameTimeLeft = 60, spawnInterval, currentVeg = {};
var activeBoost = null, streak = 0, duelActive = false;
var userStatus = 'solo', userNickname = 'Майнер';
var myClubId = localStorage.getItem('myClubId') || null;
var clubs = JSON.parse(localStorage.getItem('clubs') || '[]');
var pausedSessions = JSON.parse(localStorage.getItem('pausedSessions') || '[]');
var miningStage = 1, miningCurrency = 'SRUM', miningThreshold = 1;
var pendingMining = null, currentBot = null, bandData = null;
var spartansEnabled = JSON.parse(localStorage.getItem('spartansEnabled') || 'true');
var officialRumTasks = JSON.parse(localStorage.getItem('officialRumTasks')) || [
    { id:1, desc:'Подписаться на канал', reward:50, maxCompletions:100, completionsDone:0, checking:false },
    { id:2, desc:'Сделать репост', reward:100, maxCompletions:100, completionsDone:0, checking:false },
    { id:3, desc:'Пригласить друга', reward:200, maxCompletions:100, completionsDone:0, checking:false },
    { id:4, desc:'Сыграть 5 раундов', reward:300, maxCompletions:100, completionsDone:0, checking:false }
];
var officialSrumTasks = JSON.parse(localStorage.getItem('officialSrumTasks')) || [
    { id:101, desc:'Подпишись на Twitter', reward:0.1, maxCompletions:100, completionsDone:0, checking:false },
    { id:102, desc:'Поставь лайк проекту', reward:0.15, maxCompletions:100, completionsDone:0, checking:false }
];
var globalUserTasks = JSON.parse(localStorage.getItem('globalUserTasks') || '[]');
var userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
var referrals = JSON.parse(localStorage.getItem('referrals') || '[]');

// Проекты для инвестиций
var investProjects = JSON.parse(localStorage.getItem('investProjects')) || [
    { id: 1, name: 'iSayMobil — Интерактивная система аудио оповещения населения', icon: '🚗', desc: 'Доставка голосовых сообщений на адрес.', target: 100000, collected: 0, share: 10, endDate: Date.now() + 30 * 86400000 },
    { id: 2, name: 'Голодные Волки — FGSPI', icon: '🐺', desc: 'Спорт-гейм-клуб быстрого питания.', target: 50000, collected: 0, share: 5, endDate: Date.now() + 60 * 86400000 },
    { id: 3, name: 'WMW — Всемирная стена памяти', icon: '🕯️', desc: 'Портал памяти → Царствие небесное → Книга жизни.', target: 25000, collected: 0, share: 3, endDate: Date.now() + 45 * 86400000 }
];
var myInvestments = JSON.parse(localStorage.getItem('myInvestments')) || [];
var investHistory = JSON.parse(localStorage.getItem('investHistory')) || [];

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
        else if (screenId === 'top-tappers') { document.getElementById('top-tappers-screen').classList.add('active'); loadTopPlayers('rum'); }
        else if (screenId === 'top-miners') { document.getElementById('top-miners-screen').classList.add('active'); loadTopPlayers('srum'); }
        else if (screenId === 'invest') { document.getElementById('invest-screen').classList.add('active'); renderInvest(); }
        else if (screenId === 'admin') { document.getElementById('admin-screen').classList.add('active'); }
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
    infoCard.innerHTML = '<p style="text-align:center;color:#FFD700;">⏳ Загрузка...</p>';
    var order = type === 'rum' ? 'rum.desc' : 'srum.desc';
    fetch(SUPABASE_URL + '/rest/v1/users?select=nickname,rum,srum&order=' + order + '&limit=20', {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
    }).then(function(res) { return res.json(); }).then(function(players) {
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
                    '<span>' + medal + ' ' + (p.nickname || 'Майнер') + (isMe ? ' 👈' : '') + '</span>' +
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
    var totalInvested = myInvestments.reduce(function(sum, inv) { return sum + inv.amount; }, 0);
    var html = '<h2>📈 Инвестиции</h2><p style="color:#aaa;font-size:0.8rem;">Вкладывай RUM в проекты</p>' +
        '<div style="background:linear-gradient(145deg,#1a1a2e,#252545);border:2px solid #FFD700;border-radius:15px;padding:15px;margin-bottom:15px;text-align:center;">' +
        '<p style="color:#FFD700;font-size:1.2rem;">💰 Твой портфель</p>' +
        '<p style="font-size:2rem;font-weight:bold;color:white;">' + totalInvested.toLocaleString() + ' RUM</p>' +
        '<p style="color:#aaa;font-size:0.7rem;">' + myInvestments.length + ' проектов</p></div>';

    for (var j = 0; j < investProjects.length;
