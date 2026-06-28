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
var frozenStake = 0; // Замороженная ставка в пуле
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
    {
        id: 1, name: 'iSayMobil — Интерактивная система аудио оповещения населения', icon: '🚗',
        desc: 'Доставка голосовых сообщений на адрес. Поздравь с днём рождения красиво — машина подъезжает и передаёт аудиообращение адресату.',
        target: 100000, collected: 0, share: 10, endDate: Date.now() + 30 * 86400000
    },
    {
        id: 2, name: 'Голодные Волки — FGSPI (Food Game Sport People Interactive)', icon: '🐺',
        desc: 'Спорт-гейм-клуб быстрого питания. Сражайся с противниками, получай бесплатную еду. Битвы между фастфуд-клубами.',
        target: 50000, collected: 0, share: 5, endDate: Date.now() + 60 * 86400000
    },
    {
        id: 3, name: 'WMW — Всемирная стена памяти (World Memory Wall)', icon: '🕯️',
        desc: 'Портал памяти → Царствие небесное → Книга жизни. Каждый лист — история прожитой жизни. Важно, что память чтят.',
        target: 25000, collected: 0, share: 3, endDate: Date.now() + 45 * 86400000
    }
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
    localStorage.setItem('frozenStake', frozenStake);
    localStorage.setItem('activeBoost', activeBoost ? JSON.stringify(activeBoost) : null);
    localStorage.setItem('investProjects', JSON.stringify(investProjects));
    localStorage.setItem('myInvestments', JSON.stringify(myInvestments));
    localStorage.setItem('investHistory', JSON.stringify(investHistory));
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

// ================== ТОПЫ ==================
async function loadTopPlayers(type) {
    const screenId = type === 'rum' ? 'top-tappers-screen' : 'top-miners-screen';
    const screen = document.getElementById(screenId);
    if (!screen) return;
    screen.querySelector('.info-card').innerHTML = '<p style="text-align:center;color:#FFD700;">⏳ Загрузка...</p>';
    try {
        const order = type === 'rum' ? 'rum.desc' : 'srum.desc';
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=nickname,rum,srum&order=${order}&limit=20`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
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
        screen.querySelector('.info-card').innerHTML = '<p style="color:#e74c3c;">Ошибка загрузки</p>';
    }
}

// ================== ИНВЕСТИЦИИ ==================
function renderInvest() {
    const screen = document.getElementById('invest-screen');
    if (!screen) return;

    const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amount, 0);

    let html = `
        <h2>📈 Инвестиции</h2>
        <p style="color:#aaa; font-size:0.8rem; margin-bottom:10px;">Вкладывай RUM в реальные проекты и получай долю от будущей прибыли</p>
        <div style="background:linear-gradient(145deg,#1a1a2e,#252545); border:2px solid #FFD700; border-radius:15px; padding:15px; margin-bottom:15px; text-align:center;">
            <p style="color:#FFD700; font-size:1.2rem; margin:0;">💰 Твой портфель</p>
            <p style="font-size:2rem; font-weight:bold; color:white; margin:5px 0;">${totalInvested.toLocaleString()} RUM</p>
            <p style="color:#aaa; font-size:0.7rem;">Инвестировано в ${myInvestments.length} проектов</p>
        </div>
    `;

    investProjects.forEach(project => {
        const myInv = myInvestments.find(i => i.projectId === project.id);
        const myAmount = myInv ? myInv.amount : 0;
        const progress = Math.min(100, (project.collected / project.target) * 100);
        const daysLeft = Math.max(0, Math.ceil((project.endDate - Date.now()) / 86400000));
        const investorShare = project.target > 0 ? (myAmount / project.target) * 100 : 0;
        const projectedProfit = (project.target * (project.share / 100)) * (investorShare / 100);

        html += `
        <div class="info-card" style="text-align:left; position:relative; overflow:hidden;">
            ${myAmount > 0 ? `<div style="position:absolute; top:0; right:0; background:#FFD700; color:#000; padding:3px 10px; border-radius:0 0 0 10px; font-size:0.65rem; font-weight:bold;">Ты в деле!</div>` : ''}
            <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:10px;">
                <span style="font-size:2.5rem;">${project.icon}</span>
                <div>
                    <strong style="color:#FFD700;">${project.name}</strong>
                    <p style="font-size:0.7rem; color:#ccc; margin-top:4px; line-height:1.4;">${project.desc}</p>
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.05); border-radius:10px; height:14px; margin:10px 0; overflow:hidden;">
                <div style="background:linear-gradient(90deg,#FFD700,#FFA500,#FF6347); height:100%; border-radius:10px; width:${progress}%; transition:width 0.8s ease; position:relative;">
                    ${progress > 10 ? `<span style="position:absolute; right:5px; top:0; font-size:0.55rem; color:#000; font-weight:bold;">${progress.toFixed(0)}%</span>` : ''}
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#aaa;">
                <span>Собрано: ${project.collected.toLocaleString()} / ${project.target.toLocaleString()} RUM</span>
                <span>Доля от прибыли: ${project.share}%</span>
            </div>
            <p style="font-size:0.7rem; color:#aaa;">⏳ ${daysLeft} дн. до конца</p>
            ${myAmount > 0 ? `
                <div style="background:rgba(76,175,80,0.1); border:1px solid rgba(76,175,80,0.3); border-radius:10px; padding:10px; margin:10px 0;">
                    <p style="color:#4CAF50; font-size:0.8rem; margin:0;">✅ Твой вклад: <b>${myAmount.toLocaleString()} RUM</b></p>
                    <p style="color:#4CAF50; font-size:0.7rem; margin:3px 0;">Твоя доля в проекте: <b>${investorShare.toFixed(2)}%</b></p>
                    <p style="color:#FFD700; font-size:0.75rem; margin:3px 0;">📈 Прогноз прибыли: <b>~${projectedProfit.toFixed(0)} RUM</b></p>
                </div>
            ` : ''}
            <div style="display:flex; gap:8px; margin-top:10px;">
                <input type="number" id="invest-amount-${project.id}" placeholder="Сумма RUM" min="1" step="100" 
                       style="flex:2; padding:10px; border-radius:8px; border:1px solid rgba(255,215,0,0.3); background:rgba(0,0,0,0.5); color:white; font-size:0.85rem;">
                <button id="invest-btn-${project.id}" style="flex:1; padding:10px; border:none; border-radius:8px; 
                        background:linear-gradient(180deg,#FFD700,#FFA500); color:#000; font-weight:bold; font-size:0.85rem; cursor:pointer;">💰 Вложить</button>
            </div>
            ${myAmount > 0 ? `<button id="withdraw-btn-${project.id}" style="width:100%; margin-top:8px; padding:8px; 
                    border:1px solid #e74c3c; border-radius:8px; background:transparent; color:#e74c3c; font-size:0.75rem; cursor:pointer;">📤 Вывести (штраф 10%)</button>` : ''}
        </div>`;
    });

    if (investHistory.length > 0) {
        html += `<div class="info-card" style="text-align:left;">
            <strong style="color:#FFD700;">📋 История вкладов</strong>
            <div style="max-height:150px; overflow-y:auto; margin-top:8px;">`;
        investHistory.slice(-10).reverse().forEach(h => {
            const project = investProjects.find(p => p.id === h.projectId);
            html += `<div style="font-size:0.7rem; color:#aaa; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                ${new Date(h.date).toLocaleDateString()} — ${project ? project.icon : '💡'} ${h.amount.toLocaleString()} RUM
            </div>`;
        });
        html += `</div></div>`;
    }

    html += `
        <div class="info-card" style="text-align:center;">
            <p style="color:#aaa; font-size:0.8rem;">Есть идея проекта?</p>
            <button id="suggest-project-btn" style="padding:12px 20px; border:1px dashed #FFD700; border-radius:10px; 
                    background:transparent; color:#FFD700; font-size:0.9rem; cursor:pointer;">💡 Предложить проект</button>
        </div>
    `;

    screen.innerHTML = html;

    investProjects.forEach(project => {
        document.getElementById(`invest-btn-${project.id}`).addEventListener('click', () => {
            const input = document.getElementById(`invest-amount-${project.id}`);
            const amount = parseInt(input?.value) || 0;
            if (amount <= 0) return alert('Введите сумму');
            if (amount > rum) return alert('Недостаточно RUM');
            if (!confirm(`Вложить ${amount.toLocaleString()} RUM в «${project.name}»?\nТвоя доля от прибыли: ${project.share}%`)) return;
            rum -= amount;
            invest += amount;
            project.collected += amount;
            let myInv = myInvestments.find(i => i.projectId === project.id);
            if (myInv) { myInv.amount += amount; }
            else { myInvestments.push({ projectId: project.id, amount }); }
            investHistory.push({ projectId: project.id, amount, date: Date.now() });
            updateUI();
            saveAll();
            if (typeof saveUserData === 'function' && userId) { saveUserData(userId, { rum, invest }).catch(() => {}); }
            renderInvest();
            alert(`✅ Вложено ${amount.toLocaleString()} RUM!`);
        });

        const withdrawBtn = document.getElementById(`withdraw-btn-${project.id}`);
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => {
                const myInv = myInvestments.find(i => i.projectId === project.id);
                if (!myInv || myInv.amount <= 0) return;
                const penalty = Math.floor(myInv.amount * 0.1);
                const returnAmount = myInv.amount - penalty;
                if (!confirm(`Вывести вклад из «${project.name}»?\n\nСумма: ${myInv.amount.toLocaleString()} RUM\nШтраф 10%: -${penalty.toLocaleString()} RUM\nК получению: ${returnAmount.toLocaleString()} RUM`)) return;
                rum += returnAmount;
                project.collected = Math.max(0, project.collected - myInv.amount);
                myInvestments = myInvestments.filter(i => i.projectId !== project.id);
                updateUI();
                saveAll();
                if (typeof saveUserData === 'function' && userId) { saveUserData(userId, { rum }).catch(() => {}); }
                renderInvest();
                alert(`✅ Возвращено ${returnAmount.toLocaleString()} RUM`);
            });
        }
    });

    document.getElementById('suggest-project-btn').addEventListener('click', () => {
        const name = prompt('Название проекта:');
        if (!name) return;
        const desc = prompt('Краткое описание:');
        if (!desc) return;
        const target = prompt('Целевая сумма (RUM):', '10000');
        if (!target || isNaN(target)) return;
        investProjects.push({ id: Date.now(), name, icon: '💡', desc, target: parseInt(target), collected: 0, share: 1, endDate: Date.now() + 90 * 86400000 });
        saveAll();
        renderInvest();
        alert('✅ Проект предложен!');
    });
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
            'top-miners': () => { document.getElementById('top-miners-screen').classList.add('active'); loadTopPlayers('srum'); },
            'invest': () => { document.getElementById('invest-screen').classList.add('active'); renderInvest(); }
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

    if (typeof loadUserData === 'function' && userId) {
        loadUserData(userId).then(userData => {
            if (userData) {
                rum = userData.rum || 0;
                srum = parseFloat(userData.srum) || 0;
                ton = parseFloat(userData.ton) || 0;
                usdt = parseFloat(userData.usdt) || 0;
                invest = userData.invest || 0;
                userNickname = userData.nickname || userNickname;
                userStatus = userData.status || 'solo';
                miningStage = userData.mining_stage || 1;
                frozenStake = parseFloat(userData.frozen_stake) || 0;
                if (typeof userData.games === 'number' && userData.games >= 0) games = userData.games;
                if (userData.boost && userData.boost !== 'null') {
                    try { activeBoost = JSON.parse(userData.boost); } catch(e) { activeBoost = null; }
                }
                saveAll();

                if (typeof processWelcomeBonus === 'function') {
                    processWelcomeBonus(userId, userData).then(claimed => {
                        if (claimed) {
                            srum = window.srum;
                            saveAll();
                            updateUI();
                        }
                    });
                }
            } else {
                loadFromLocalStorage();
            }
            updateUI();
        }).catch(e => {
            console.log('Облако недоступно:', e.message);
            loadFromLocalStorage();
            updateUI();
        });
    } else {
        loadFromLocalStorage();
        updateUI();
    }

    if (games < maxGames && typeof startRecovery === 'function') startRecovery();
    document.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
}

function loadFromLocalStorage() {
    const savedRum = parseInt(localStorage.getItem('rum'));
    const savedSrum = parseFloat(localStorage.getItem('srum'));
    const savedTon = parseFloat(localStorage.getItem('ton'));
    const savedUsdt = parseFloat(localStorage.getItem('usdt'));
    const savedInvest = parseInt(localStorage.getItem('invest'));
    const savedGames = parseInt(localStorage.getItem('games'));
    const savedNickname = localStorage.getItem('nickname');
    const savedStatus = localStorage.getItem('userStatus');
    const savedStage = parseInt(localStorage.getItem('miningStage'));
    const savedFrozenStake = parseFloat(localStorage.getItem('frozenStake'));
    const savedBoost = localStorage.getItem('activeBoost');
    if (!isNaN(savedRum)) rum = savedRum;
    if (!isNaN(savedSrum)) srum = savedSrum;
    if (!isNaN(savedTon)) ton = savedTon;
    if (!isNaN(savedUsdt)) usdt = savedUsdt;
    if (!isNaN(savedInvest)) invest = savedInvest;
    if (!isNaN(savedGames) && savedGames >= 0 && savedGames <= maxGames) games = savedGames;
    if (savedNickname) userNickname = savedNickname;
    if (savedStatus) userStatus = savedStatus;
    if (!isNaN(savedStage) && savedStage >= 1 && savedStage <= 5) miningStage = savedStage;
    if (!isNaN(savedFrozenStake) && savedFrozenStake >= 0) frozenStake = savedFrozenStake;
    if (savedBoost && savedBoost !== 'null') {
        try { activeBoost = JSON.parse(savedBoost); } catch(e) { activeBoost = null; }
    }
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
            if (screenId) { switchScreen(screenId); document.getElementById('menu-dropdown').classList.remove('active'); }
        });
    });
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', function(ev) { ev.stopPropagation(); switchScreen(null); });
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
        saveUserData(userId, { nickname: userNickname, rum, srum, ton, usdt, invest, status: userStatus, mining_stage: miningStage, frozen_stake: frozenStake, boost: activeBoost ? JSON.stringify(activeBoost) : null, games }).catch(() => {});
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
