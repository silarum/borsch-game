// ================== ГЛОБАЛЬНЫЕ ДАННЫЕ И ИНИЦИАЛИЗАЦИЯ ==================
const GOOD = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅'];
const BAD = ['💩','🪱','🧀','🥀','🍄'];
let rum = 0;
let invest = 0;
let srum = 0;
let ton = 0;
let usdt = 0;
let games = parseInt(localStorage.getItem('games'));
if (isNaN(games) || games < 0) games = 3;                 // <-- гарантируем 3 попытки
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
    localStorage.setItem('games', games);
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

// ================== АВТОРИЗАЦИЯ И ПРИВЕТСТВЕННЫЙ БОНУС ==================
let userId = null;

async function initApp() {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        const tgUser = Telegram.WebApp.initDataUnsafe.user;
        userId = tgUser.id;
        userNickname = tgUser.first_name || 'Майнер';
        startMainGame();
    } else {
        userId = 123456789;
        startMainGame();
    }
}

async function startMainGame() {
    document.getElementById('main-game').style.display = 'block';
    document.getElementById('veggie-view').style.display = 'block';
    startVeggieAnimation();   // запускаем фон сразу

    const userData = await loadUserData(userId);
    if (userData) {
        rum = userData.rum || 0;
        srum = parseFloat(userData.srum) || 0;
        ton = parseFloat(userData.ton) || 0;
        usdt = parseFloat(userData.usdt) || 0;
        userNickname = userData.nickname || userNickname;
        userStatus = userData.status || 'solo';
        miningStage = userData.mining_stage || 1;
        if (userData.boost && userData.boost !== 'null') activeBoost = JSON.parse(userData.boost);
        if (typeof userData.games !== 'undefined') games = userData.games;
    } else {
        await saveUserData(userId, {
            nickname: userNickname,
            rum: 0,
            srum: 0,
            ton: 0,
            usdt: 0,
            status: 'solo',
            mining_stage: 1,
            games: 3
        });
    }

    if (!userData || !userData.bonus_claimed) {
        showBonusStep1();
    } else {
        updateUI();
        window.lastGameTime = Date.now();
        if (games < maxGames) startRecovery();
        document.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
    }
}

function showBonusStep1() {
    const modal = document.createElement('div');
    modal.className = 'quick-duel-modal';
    modal.innerHTML = `
        <div class="quick-duel-box" style="border: none; background: transparent; padding: 0;">
            <div class="pool-cloud" style="background: radial-gradient(circle at 20% 20%, #1a5276, #0e2f44);">
                <h2>🎁 Приветственный бонус</h2>
                <p style="font-size:1.2rem;">Подпишись на наш Telegram‑канал, чтобы получить <b>1 SRUM</b>!</p>
                <a href="https://t.me/crypto_borsch_channel" target="_blank" style="display:block; background:#0088cc; color:white; padding:15px; border-radius:15px; text-decoration:none; font-size:1.2rem; margin:15px 0;">📢 Подписаться на канал</a>
                <button id="check-channel-btn" class="btn-mining-big">✅ Я подписался</button>
                <button id="skip-bonus-btn" style="background:none; color:#aaa; border:1px solid #aaa; border-radius:10px; padding:10px; margin-top:10px; width:100%;">Пропустить</button>
            </div>
        </div>
    `;
    document.getElementById('game-container').appendChild(modal);

    document.getElementById('check-channel-btn').addEventListener('click', async () => {
        const sub = await checkSubscription(userId);
        if (sub) {
            modal.remove();
            showBonusStep2();
        } else {
            alert('Вы ещё не подписались на канал. Пожалуйста, подпишитесь и нажмите кнопку снова.');
        }
    });

    document.getElementById('skip-bonus-btn').addEventListener('click', () => {
        modal.remove();
        updateUI();
        window.lastGameTime = Date.now();
        if (games < maxGames) startRecovery();
        document.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
    });
}

function showBonusStep2() {
    const modal = document.createElement('div');
    modal.className = 'quick-duel-modal';
    modal.innerHTML = `
        <div class="quick-duel-box" style="border: none; background: transparent; padding: 0;">
            <div class="pool-cloud" style="background: radial-gradient(circle at 20% 20%, #1e8449, #0b3d1f);">
                <h2>🎁 Ещё один шаг!</h2>
                <p style="font-size:1.2rem;">Вступите в нашу группу обсуждения, чтобы получить бонус!</p>
                <a href="https://t.me/criptoniany" target="_blank" style="display:block; background:#0088cc; color:white; padding:15px; border-radius:15px; text-decoration:none; font-size:1.2rem; margin:15px 0;">💬 Вступить в группу</a>
                <button id="check-group-btn" class="btn-mining-big">✅ Я вступил</button>
                <button id="skip-bonus-btn2" style="background:none; color:#aaa; border:1px solid #aaa; border-radius:10px; padding:10px; margin-top:10px; width:100%;">Пропустить</button>
            </div>
        </div>
    `;
    document.getElementById('game-container').appendChild(modal);

    document.getElementById('check-group-btn').addEventListener('click', async () => {
        const grp = await checkGroup(userId);
        if (grp) {
            modal.remove();
            const newSrum = srum + 1;
            await saveUserData(userId, { srum: newSrum, bonus_claimed: true });
            srum = newSrum;
            alert('🎁 Поздравляем! Вы получили 1 SRUM!');
            updateUI();
            window.lastGameTime = Date.now();
            if (games < maxGames) startRecovery();
            document.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
        } else {
            alert('Вы ещё не вступили в группу. Пожалуйста, вступите и нажмите кнопку снова.');
        }
    });

    document.getElementById('skip-bonus-btn2').addEventListener('click', () => {
        modal.remove();
        updateUI();
        window.lastGameTime = Date.now();
        if (games < maxGames) startRecovery();
        document.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
    });
}

initApp();

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
        const now = Date.now(), last = window.lastGameTime || now;
        const remaining = Math.max(0, gameRecoveryTime - (now - last) / 1000);
        const mins = Math.floor(remaining / 60), secs = Math.floor(remaining % 60);
        energyDisplay.textContent = `⏳ ${mins}:${secs.toString().padStart(2,'0')}`;
    }
    updateBoostDisplay();
    updateProfile();
    saveAll();
    if (userId) {
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
        }).catch(console.error);
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
