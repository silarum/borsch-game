// ================== ГЛОБАЛЬНЫЕ ДАННЫЕ ==================
const GOOD = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅'];
const BAD = ['💩','🪱','🧀','🥀','🍄'];
let rum = 0, invest = 0, srum = 0, ton = 0, usdt = 0, games = 3;
const maxGames = 3, gameRecoveryTime = 600;
let gameActive = false, gameTimer, gameTimeLeft = 60, spawnInterval, currentVeg = {};
let activeBoost = null, streak = 0, duelActive = false;
let userStatus = 'solo', userNickname = 'Майнер';
let myClubId = localStorage.getItem('myClubId') || null;
let clubs = JSON.parse(localStorage.getItem('clubs') || '[]');
let pausedSessions = JSON.parse(localStorage.getItem('pausedSessions') || '[]');
let miningStage = 1, miningCurrency = 'SRUM', miningThreshold = 1;
let pendingMining = null, currentBot = null, bandData = null;
let spartansEnabled = JSON.parse(localStorage.getItem('spartansEnabled') || 'true');

const officialRumTasks = JSON.parse(localStorage.getItem('officialRumTasks')) || [
    { id:1, desc:'Подписаться на канал', reward:50, maxCompletions:100, completionsDone:0, checking:false },
    { id:2, desc:'Сделать репост', reward:100, maxCompletions:100, completionsDone:0, checking:false },
    { id:3, desc:'Пригласить друга', reward:200, maxCompletions:100, completionsDone:0, checking:false },
    { id:4, desc:'Сыграть 5 раундов', reward:300, maxCompletions:100, completionsDone:0, checking:false }
];
const officialSrumTasks = JSON.parse(localStorage.getItem('officialSrumTasks')) || [
    { id:101, desc:'Подпишись на Twitter', reward:0.1, maxCompletions:100, completionsDone:0, checking:false },
    { id:102, desc:'Поставь лайк проекту', reward:0.15, maxCompletions:100, completionsDone:0, checking:false }
];
let globalUserTasks = JSON.parse(localStorage.getItem('globalUserTasks') || '[]');
let userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
let referrals = JSON.parse(localStorage.getItem('referrals') || '[]');

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
}

// ================== DOM-ЭЛЕМЕНТЫ ==================
let pot, board, rumBal, srumBal, usdtBalTop, tonBalTop, holes;
let viewSwitch, rulesBtn, langBtn, boostDisplay, energyDisplay;
let startBtn, startBtnContainer, quickDuelCoin;
let duelScoreboard, duelPlayerScoreEl, duelOpponentScoreEl, duelTimerEl;
let userProfile, bottomPanel;

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

// ================== УПРАВЛЕНИЕ ГЛАВНЫМ ЭКРАНОМ ==================
function hideMainElements() {
    [viewSwitch, rulesBtn, langBtn, quickDuelCoin, startBtnContainer, board, userProfile, bottomPanel].forEach(el => {
        if (el) el.style.display = 'none';
    });
}

function showMainElements() {
    [viewSwitch, rulesBtn, langBtn, quickDuelCoin, startBtnContainer, board, userProfile, bottomPanel].forEach(el => {
        if (el) el.style.display = '';
    });
    updateUI();
}

// ================== НАВИГАЦИЯ ==================
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    if (screenId) {
        hideMainElements();

        if (screenId === 'tasks') {
            document.getElementById('tasks-screen').classList.add('active');
            if (typeof renderAvailableTasks === 'function') renderAvailableTasks();
        } else if (screenId === 'mining-club') {
            document.getElementById('mining-club-screen').classList.add('active');
            if (typeof renderMyClub === 'function') renderMyClub();
        } else if (screenId === 'arena') {
            document.getElementById('arena-screen').classList.add('active');
            if (typeof renderArena === 'function') renderArena();
        } else if (screenId === 'referral') {
            document.getElementById('referral-screen').classList.add('active');
            if (typeof renderReferralList === 'function') renderReferralList();
        } else if (screenId === 'shop') {
            document.getElementById('shop-screen').classList.add('active');
            if (typeof renderShop === 'function') renderShop();
        } else if (screenId === 'wallet') {
            document.getElementById('wallet-screen').classList.add('active');
        } else {
            const target = document.getElementById(screenId + '-screen');
            if (target) target.classList.add('active');
        }
    } else {
        showMainElements();
    }
}

// ================== ИНИЦИАЛИЗАЦИЯ ==================
let userId = null;
window.lastGameTime = parseInt(localStorage.getItem('lastGameTime') || '0');

function initApp() {
    cacheDom();

    document.getElementById('main-game').style.display = 'block';
    document.getElementById('veggie-view').style.display = 'block';
    if (typeof startVeggieAnimation === 'function') startVeggieAnimation();

    // Telegram ID
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        userId = Telegram.WebApp.initDataUnsafe.user.id;
        userNickname = Telegram.WebApp.initDataUnsafe.user.first_name || 'Майнер';
    } else {
        userId = parseInt(localStorage.getItem('userId')) || Date.now();
        localStorage.setItem('userId', userId);
    }

    // Локальные данные
    const savedRum = parseInt(localStorage.getItem('rum'));
    const savedSrum = parseFloat(localStorage.getItem('srum'));
    const savedTon = parseFloat(localStorage.getItem('ton'));
    const savedUsdt = parseFloat(localStorage.getItem('usdt'));
    const savedGames = parseInt(localStorage.getItem('games'));
    const savedNickname = localStorage.getItem('nickname');
    const savedStatus = localStorage.getItem('userStatus');
    const savedStage = parseInt(localStorage.getItem('miningStage'));
    const savedBoost = localStorage.getItem('activeBoost');
    if (!isNaN(savedRum)) rum = savedRum;
    if (!isNaN(savedSrum)) srum = savedSrum;
    if (!isNaN(savedTon)) ton = savedTon;
    if (!isNaN(savedUsdt)) usdt = savedUsdt;
    if (!isNaN(savedGames) && savedGames >= 0 && savedGames <= maxGames) games = savedGames;
    if (savedNickname) userNickname = savedNickname;
    if (savedStatus) userStatus = savedStatus;
    if (!isNaN(savedStage) && savedStage >= 1 && savedStage <= 5) miningStage = savedStage;
    if (savedBoost && savedBoost !== 'null') {
        try { activeBoost = JSON.parse(savedBoost); } catch(e) { activeBoost = null; }
    }

    updateUI();

    // Supabase
    if (typeof loadUserData === 'function' && userId) {
        loadUserData(userId).then(userData => {
            if (userData) {
                rum = userData.rum || rum;
                srum = parseFloat(userData.srum) || srum;
                ton = parseFloat(userData.ton) || ton;
                usdt = parseFloat(userData.usdt) || usdt;
                userNickname = userData.nickname || userNickname;
                userStatus = userData.status || userStatus;
                miningStage = userData.mining_stage || miningStage;
                if (typeof userData.games === 'number' && userData.games >= 0) games = userData.games;
                if (userData.boost && userData.boost !== 'null') {
                    try { activeBoost = JSON.parse(userData.boost); } catch(e) { activeBoost = null; }
                }
                if (!userData.bonus_claimed && typeof processWelcomeBonus === 'function') {
                    processWelcomeBonus(userId, userData).then(claimed => {
                        if (claimed) { srum += 1; updateUI(); }
                    });
                }
            }
            updateUI();
        }).catch(e => console.log('Облако отложено:', e.message));
    }

    if (games < maxGames && typeof startRecovery === 'function') startRecovery();

    // Обработчики
    if (rulesBtn) rulesBtn.addEventListener('click', () => switchScreen('rules'));

    const bp = document.getElementById('bottom-panel');
    if (bp) {
        bp.addEventListener('click', function(e) {
            let target = e.target;
            while (target && target !== bp) {
                if (target.classList.contains('nav-btn') && target.dataset.screen) {
                    switchScreen(target.dataset.screen);
                    return;
                }
                target = target.parentElement;
            }
        });
    }

    const menu = document.getElementById('menu-dropdown');
    if (menu) {
        menu.addEventListener('click', function(e) {
            let target = e.target;
            while (target && target !== menu) {
                if (target.tagName === 'BUTTON' && target.dataset.screen) {
                    switchScreen(target.dataset.screen);
                    menu.classList.remove('active');
                    return;
                }
                target = target.parentElement;
            }
        });
    }

    document.getElementById('game-container').addEventListener('click', function(e) {
        let target = e.target;
        while (target) {
            if (target.classList.contains('back-btn')) {
                e.stopPropagation();
                switchScreen(null);
                return;
            }
            if (target === this) break;
            target = target.parentElement;
        }
    });

    document.addEventListener('touchmove', e => e.preventDefault(), {passive: false});

    // Запускаем game-engine после инициализации DOM
    if (typeof window.initGameEngine === 'function') {
        setTimeout(window.initGameEngine, 300);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ================== UI ==================
function updateUI() {
    if (!rumBal) return;
    rumBal.textContent = `💰 RUM: ${rum}`;
    srumBal.textContent = `💎 SRUM: ${srum.toFixed(2)}`;
    usdtBalTop.textContent = `💵 USDT: ${usdt.toFixed(2)}`;
    tonBalTop.textContent = `⚡ TON: ${ton.toFixed(2)}`;
    const tonBal = document.getElementById('ton-balance');
    const usdtBal = document.getElementById('usdt-balance');
    if (tonBal) tonBal.textContent = ton.toFixed(2);
    if (usdtBal) usdtBal.textContent = usdt.toFixed(2);

    if (games > 0 && !gameActive && !duelActive) {
        if (startBtn) startBtn.style.display = 'inline-block';
        if (energyDisplay) energyDisplay.textContent = `⚡ ${games}/${maxGames} игр`;
    } else {
        if (startBtn) startBtn.style.display = 'none';
        if (energyDisplay) {
            if (gameActive || duelActive) {
                energyDisplay.textContent = '';
            } else {
                const now = Date.now(), last = window.lastGameTime || 0;
                const remaining = Math.max(0, gameRecoveryTime - (now - last) / 1000);
                const mins = Math.floor(remaining / 60), secs = Math.floor(remaining % 60);
                energyDisplay.textContent = `⏳ ${mins}:${secs.toString().padStart(2,'0')}`;
            }
        }
    }
    updateBoostDisplay();
    if (typeof updateProfile === 'function') updateProfile();
    saveAll();
    if (typeof saveUserData === 'function' && userId) {
        saveUserData(userId, {
            nickname: userNickname, rum, srum, ton, usdt,
            status: userStatus, mining_stage: miningStage,
            boost: activeBoost ? JSON.stringify(activeBoost) : null, games
        }).catch(() => {});
    }
}

function updateBoostDisplay() {
    if (!boostDisplay) return;
    if (activeBoost && activeBoost.endTime > Date.now()) {
        const remain = Math.max(0, Math.ceil((activeBoost.endTime - Date.now()) / 1000));
        const h = Math.floor(remain/3600), m = Math.floor((remain%3600)/60), s = remain%60;
        boostDisplay.textContent = `🚀 x${activeBoost.type} ${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        boostDisplay.style.display = 'block';
    } else {
        boostDisplay.textContent = '';
        boostDisplay.style.display = 'none';
        if (activeBoost && activeBoost.endTime <= Date.now()) activeBoost = null;
    }
}
setInterval(updateBoostDisplay, 1000);
setInterval(updateUI, 5000);
