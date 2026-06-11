// ================== ГЛОБАЛЬНЫЕ ДАННЫЕ И ИНИЦИАЛИЗАЦИЯ (ГИБРИД) ==================
const GOOD = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅'];
const BAD = ['💩','🪱','🧀','🥀','🍄'];
let rum = 0;
let invest = 0;
let srum = 0;
let ton = 0;
let usdt = 0;
let games = 3;
const maxGames = 3;
const gameRecoveryTime = 600;
let gameActive = false, gameTimer, gameTimeLeft = 60, spawnInterval, currentVeg = {};
let activeBoost = null;
let streak = 0;
let duelActive = false;
let userStatus = 'solo';
let userNickname = 'Майнер';
let myClubId = localStorage.getItem('myClubId') || null;
let clubs = JSON.parse(localStorage.getItem('clubs') || '[]');
let pausedSessions = JSON.parse(localStorage.getItem('pausedSessions') || '[]');
let miningStage = 1;
let miningCurrency = 'SRUM';
let miningThreshold = 1;
let pendingMining = null;
let currentBot = null;
let bandData = null;
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
    localStorage.setItem('lastGameTime', window.lastGameTime);
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

const pot = document.getElementById('pot');
const board = document.getElementById('board');
const rumBal = document.getElementById('rum-balance');
const srumBal = document.getElementById('srum-balance');
const usdtBalTop = document.getElementById('usdt-balance-top');
const tonBalTop = document.getElementById('ton-balance-top');
const holes = document.querySelectorAll('.hole');
const viewSwitch = document.getElementById('view-switch');
const rulesBtn = document.getElementById('rules-btn-bottom');
const langBtn = document.getElementById('lang-btn-bottom');
const boostDisplay = document.getElementById('boost-display');
const energyDisplay = document.getElementById('energy-display');
const startBtn = document.getElementById('start-btn');
const quickDuelCoin = document.getElementById('quick-duel-coin');
const duelScoreboard = document.getElementById('duel-scoreboard');
const duelPlayerScoreEl = document.getElementById('duelPlayerScore');
const duelOpponentScoreEl = document.getElementById('duelOpponentScore');
const duelTimerEl = document.getElementById('duelTimer');

// ================== ГИБРИДНАЯ ИНИЦИАЛИЗАЦИЯ ==================
let userId = null;
window.lastGameTime = parseInt(localStorage.getItem('lastGameTime') || '0');

(async function initApp() {
    document.getElementById('main-game').style.display = 'block';
    document.getElementById('veggie-view').style.display = 'block';
    startVeggieAnimation();

    // Определяем userId из Telegram Web App
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        userId = Telegram.WebApp.initDataUnsafe.user.id;
        userNickname = Telegram.WebApp.initDataUnsafe.user.first_name || 'Майнер';
    } else {
        // Фолбэк — берём из localStorage или генерируем
        userId = parseInt(localStorage.getItem('userId')) || Date.now();
        localStorage.setItem('userId', userId);
    }

    // Загружаем данные из localStorage для быстрого старта
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

    // Загружаем данные из облака Supabase (перезаписывает локальные)
    if (typeof loadUserData === 'function' && userId) {
        try {
            const userData = await loadUserData(userId);
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
                
                // Приветственный бонус
                if (!userData.bonus_claimed && typeof processWelcomeBonus === 'function') {
                    processWelcomeBonus(userId, userData).then(claimed => {
                        if (claimed) {
                            srum += 1;
                            updateUI();
                        }
                    });
                }
                
                console.log('Данные загружены из облака');
            }
            updateUI();
        } catch (e) {
            console.log('Облачная загрузка отложена, работаем локально:', e.message);
        }
    }

    if (games < maxGames) startRecovery();
    document.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
})();

function updateUI() {
    rumBal.textContent = `💰 RUM: ${rum}`;
    srumBal.textContent = `💎 SRUM: ${srum.toFixed(2)}`;
    usdtBalTop.textContent = `💵 USDT: ${usdt.toFixed(2)}`;
    tonBalTop.textContent = `⚡ TON: ${ton.toFixed(2)}`;
    document.getElementById('ton-balance') && (document.getElementById('ton-balance').textContent = ton.toFixed(2));
    document.getElementById('usdt-balance') && (document.getElementById('usdt-balance').textContent = usdt.toFixed(2));

    if (games > 0 && !gameActive && !duelActive) {
        startBtn.style.display = 'inline-block';
        energyDisplay.textContent = `⚡ ${games}/${maxGames} игр`;
    } else if (gameActive) {
        startBtn.style.display = 'none';
        energyDisplay.textContent = '';
    } else if (duelActive) {
        startBtn.style.display = 'none';
        energyDisplay.textContent = '';
    } else {
        startBtn.style.display = 'none';
        const now = Date.now(), last = window.lastGameTime || 0;
        const remaining = Math.max(0, gameRecoveryTime - (now - last) / 1000);
        const mins = Math.floor(remaining / 60), secs = Math.floor(remaining % 60);
        energyDisplay.textContent = `⏳ ${mins}:${secs.toString().padStart(2,'0')}`;
    }
    updateBoostDisplay();
    updateProfile();
    saveAll();
    if (typeof saveUserData === 'function' && userId) {
        saveUserData(userId, {
            nickname: userNickname,
            rum: rum,
            srum: srum,
            ton: ton,
            usdt: usdt,
            status: userStatus,
            mining_stage: miningStage,
            boost: activeBoost ? JSON.stringify(activeBoost) : null,
            games: games
        }).catch(() => {});
    }
}

function updateBoostDisplay() {
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
setInterval(updateUI, 1000);

// ================== НАВИГАЦИЯ ==================
function hideViewSwitch() { viewSwitch.classList.add('hidden'); rulesBtn.classList.add('hidden'); langBtn.classList.add('hidden'); }
function showViewSwitch() { viewSwitch.classList.remove('hidden'); rulesBtn.classList.remove('hidden'); langBtn.classList.remove('hidden'); }
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (screenId) {
        hideViewSwitch();
        quickDuelCoin.classList.add('hidden');
        document.getElementById('user-profile').classList.add('hidden');
        startBtn.style.display = 'none';
        if (screenId === 'tasks') { document.getElementById('tasks-screen').classList.add('active'); renderAvailableTasks(); }
        else if (screenId === 'mining-club') { document.getElementById('mining-club-screen').classList.add('active'); renderMyClub(); }
        else if (screenId === 'arena') { document.getElementById('arena-screen').classList.add('active'); renderArena(); }
        else if (screenId === 'referral') { document.getElementById('referral-screen').classList.add('active'); renderReferralList(); }
        else if (screenId === 'shop') { document.getElementById('shop-screen').classList.add('active'); renderShop(); }
        else { const t = document.getElementById(screenId+'-screen'); if(t) t.classList.add('active'); }
    } else {
        showViewSwitch();
        quickDuelCoin.classList.remove('hidden');
        document.getElementById('user-profile').classList.remove('hidden');
        updateUI();
    }
}
document.getElementById('rules-btn-bottom').addEventListener('click', ()=> switchScreen('rules'));
document.querySelectorAll('.nav-btn, .menu-dropdown button[data-screen]').forEach(b => {
    b.addEventListener('click', e => switchScreen(e.currentTarget.dataset.screen));
});
document.querySelectorAll('.back-btn').forEach(b => b.addEventListener('click', (ev) => {
    ev.stopPropagation();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    showViewSwitch();
    quickDuelCoin.classList.remove('hidden');
    document.getElementById('user-profile').classList.remove('hidden');
    updateUI();
}));

function preventDefaultMove(e) { e.preventDefault(); }
