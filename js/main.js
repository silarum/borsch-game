// ================== ГЛОБАЛЬНЫЕ ДАННЫЕ И ИНИЦИАЛИЗАЦИЯ (ЛОКАЛЬНАЯ ВЕРСИЯ) ==================
const GOOD = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅'];
const BAD = ['💩','🪱','🧀','🥀','🍄'];
let rum = 0;
let invest = 0;
let srum = 0;
let ton = 0;
let usdt = 0;
let games = 3;                // <-- сразу 3 игры
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

// Остальные массивы для совместимости
const officialRumTasks = JSON.parse(localStorage.getItem('officialRumTasks')) || [];
const officialSrumTasks = JSON.parse(localStorage.getItem('officialSrumTasks')) || [];
let globalUserTasks = JSON.parse(localStorage.getItem('globalUserTasks') || '[]');
let userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
let referrals = JSON.parse(localStorage.getItem('referrals') || '[]');

function saveAll() {
    localStorage.setItem('games', games);
    localStorage.setItem('clubs', JSON.stringify(clubs));
    if (myClubId) localStorage.setItem('myClubId', myClubId); else localStorage.removeItem('myClubId');
    localStorage.setItem('pausedSessions', JSON.stringify(pausedSessions));
    localStorage.setItem('nickname', userNickname);
    localStorage.setItem('userStatus', userStatus);
    localStorage.setItem('referrals', JSON.stringify(referrals));
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

// ================== ИНИЦИАЛИЗАЦИЯ БЕЗ ЗАДЕРЖЕК ==================
window.lastGameTime = 0;

(function initApp() {
    document.getElementById('main-game').style.display = 'block';
    document.getElementById('veggie-view').style.display = 'block';
    startVeggieAnimation();
    updateUI();
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

// Навигация
function hideViewSwitch() { viewSwitch.classList.add('hidden'); rulesBtn.classList.add('hidden'); langBtn.classList.add('hidden'); }
function showViewSwitch() { viewSwitch.classList.remove('hidden'); rulesBtn.classList.remove('hidden'); langBtn.classList.remove('hidden'); }
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (screenId) {
        hideViewSwitch();
        quickDuelCoin.classList.add('hidden');
        document.getElementById('user-profile').classList.add('hidden');
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
    }
}
document.getElementById('rules-btn-bottom').addEventListener('click', ()=> switchScreen('rules'));
document.querySelectorAll('.nav-btn, .menu-dropdown button[data-screen]').forEach(b => {
    b.addEventListener('click', e => switchScreen(e.currentTarget.dataset.screen));
});
document.querySelectorAll('.back-btn').forEach(b => b.addEventListener('click', (ev) => {
    ev.stopPropagation();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (duelActive) { }
    showViewSwitch();
    quickDuelCoin.classList.remove('hidden');
    document.getElementById('user-profile').classList.remove('hidden');
}));

function preventDefaultMove(e) { e.preventDefault(); }
