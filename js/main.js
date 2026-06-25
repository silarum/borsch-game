// ================== ГЛОБАЛЬНЫЕ ДАННЫЕ ==================
const GOOD = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅'];
const BAD = ['💩','🪱','🧀','🥀','🍄'];
var rum = 0, invest = 0, srum = 0, ton = 0, usdt = 0, games = 3;
const maxGames = 3, gameRecoveryTime = 600;
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
const startBtnContainer = document.getElementById('start-btn-container');
const quickDuelCoin = document.getElementById('quick-duel-coin');
const duelScoreboard = document.getElementById('duel-scoreboard');
const duelPlayerScoreEl = document.getElementById('duelPlayerScore');
const duelOpponentScoreEl = document.getElementById('duelOpponentScore');
const duelTimerEl = document.getElementById('duelTimer');
const userProfile = document.getElementById('user-profile');
const bottomPanel = document.getElementById('bottom-panel');

// ================== ГЛАВНЫЙ ЭКРАН ==================
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

// ================== ТОПЫ ИГРОКОВ ==================
async function loadTopPlayers(type) {
    const screenId = type === 'rum' ? 'top-tappers-screen' : 'top-miners-screen';
    const screen = document.getElementById(screenId);
    if (!screen) return;
    
    screen.querySelector('.info-card').innerHTML = '<p style="text-align:center;color:#FFD700;">⏳ Загрузка...</p>';
    
    try {
        const order = type === 'rum' ? 'rum.desc' : 'srum.desc';
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=nickname,rum,srum&order=${order}&limit=20`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const players = await res.json();
        
        let html = '';
        if (!players.length) {
            html = '<p style="color:#aaa;">Нет данных</p>';
        } else {
            const medals = ['🥇', '🥈', '🥉'];
            players.forEach((p, i) => {
                const medal = i < 3 ? medals[i] : `${i+1}.`;
                const value = type === 'rum' ? (p.rum || 0).toLocaleString() : parseFloat(p.srum || 0).toFixed(2);
                const currency = type === 'rum' ? 'RUM' : 'SRUM';
                const isMe = p.nickname === userNickname;
                html += `<div style="background:${isMe ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)'}; padding:10px; margin:5px 0; border-radius:8px; display:flex; justify-content:space-between; align-items:center; ${isMe ? 'border:1px solid gold;' : ''}">
                    <span>${medal} ${p.nickname || 'Майнер'} ${isMe ? '👈' : ''}</span>
                    <span style="color:#FFD700; font-weight:bold;">${value} ${currency}</span>
                </div>`;
            });
        }
        screen.querySelector('.info-card').innerHTML = html;
    } catch(e) {
        console.error('Ошибка загрузки топов:', e);
        screen.querySelector('.info-card').innerHTML = '<p style="color:#e74c3c;">Ошибка загрузки</p>';
    }
}

// ================== НАВИГАЦИЯ ==================
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (screenId) {
        hideMainElements();
        const screenMap = {
            'tasks': () => { document.getElementById('tasks-screen').classList.add('active'); if (typeof renderAvailableTasks === 'function') renderAvailableTasks(); },
            'mining-club': () => { document.getElementById('mining-club-screen').classList.add('active'); if (typeof renderMyClub === 'function') renderMyClub(); },
            'arena': () => { document.getElementById('arena-screen').classList.add('active'); if (typeof renderArena === 'function') renderArena(); },
            'referral': () => { document.getElementById('referral-screen').classList.add('active'); if (typeof renderReferralList === 'function') renderReferralList(); },
            'shop': () => { document.getElementById('shop-screen').classList.add('active'); if (typeof renderShop === 'function') renderShop(); },
            'wallet': () => { document.getElementById('wallet-screen').classList.add('active'); if (typeof renderWallet === 'function') renderWallet(); },
            'top-tappers': () => { document.getElementById('top-tappers-screen').classList.add('active'); loadTopPlayers('rum'); },
            'top-miners': () => { document.getElementById('top-miners-screen').classList.add('active'); loadTopPlayers('srum'); }
        };
        if (screenMap[screenId]) screenMap[screenId]();
        else {
            const target = document.getElementById(screenId + '-screen');
            if (target) target.classList.add('active');
        }
    } else {
        showMainElements();
    }
}

// ================== ИНИЦИАЛИЗАЦИЯ ==================
var userId = null;
window.lastGameTime = parseInt(localStorage.getItem('lastGameTime') || '0');

function initApp() {
    document.getElementById('main-game').style.display = 'block';
    document.getElementById('veggie-view').style.display = 'block';
    if (typeof startVeggieAnimation === 'function') startVeggieAnimation();

    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        userId = Telegram.WebApp.initDataUnsafe.user.id;
        userNickname = Telegram.WebApp.initDataUnsafe.user.first_name || 'Майнер';
    } else {
        userId = parseInt(localStorage.getItem('userId')) || Date.now();
        localStorage.setItem('userId', userId);
    }

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
                    processWelcomeBonus(userId, userData).then(claimed => { if (claimed) { srum += 1; updateUI(); } });
                }
            }
            updateUI();
        }).catch(e => console.log('Облако отложено:', e.message));
    }

    if (games < maxGames && typeof startRecovery === 'function') startRecovery();
    document.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
}

window.addEventListener('load', function() {
    initApp();

    if (rulesBtn) rulesBtn.addEventListener('click', () => switchScreen('rules'));

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const screenId = this.getAttribute('data-screen');
            if (screenId) switchScreen(screenId);
        });
    });

    document.querySelectorAll('.menu-dropdown button[data-screen]').forEach(btn => {
        btn.addEventListener('click', function() {
            const screenId = this.getAttribute('data-screen');
            if (screenId) {
                switchScreen(screenId);
                document.getElementById('menu-dropdown').classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', function(ev) {
            ev.stopPropagation();
            switchScreen(null);
        });
    });
});

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
            if (gameActive || duelActive) energyDisplay.textContent = '';
            else {
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
