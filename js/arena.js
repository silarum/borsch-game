// ================== АРЕНА (МАЙНИНГ, БАНДА, ГРУППОВОЙ, КЛУБНЫЙ, ЗАМОРОЗКА) ==================

// --- Пул обычных ботов ---
const defaultBotPool = [
    { name: 'ТокенМастер', speed: 1000 },
    { name: 'Борщехлёб', speed: 850 },
    { name: 'CryptoWhale', speed: 700 },
    { name: 'Майнер69', speed: 600 },
    { name: 'Лампа', speed: 500 }
];

// --- Ободряющие фразы ---
const cheerPhrases = [
    "Не расстраивайся, майнер! Следующий блок будет твоим! 💪",
    "Ошибка – это просто шаг к будущей победе!",
    "Кто не рискует, тот не пьёт шампанское… или не добывает блок! 😉",
    "Ты стал сильнее! Продолжай майнинг! 💎",
    "Фортуна улыбнётся тебе, просто дай ей шанс.",
    "Не сдавайся! Твой звёздный час близок. 🚀",
    "Это всего лишь одна попытка. Впереди ещё много!"
];

// ================== ЖЕЛЕЗНАЯ МАТЕМАТИКА ==================
const PENALTY_RATES = [0.10, 0.20, 0.40, 0.80, 1.00];
const REWARD_RATES = [0.07, 0.14, 0.28, 0.56, 0.70];

function getPenaltyRate(stage) { return PENALTY_RATES[stage - 1] || 0.10; }
function getRewardRate(stage) { return REWARD_RATES[stage - 1] || 0.07; }

// Обратная совместимость
function getPenaltyPercent() { return getPenaltyRate(miningStage); }
function getRewardPercent() { return getRewardRate(miningStage); }

// --- Данные группового майнинга ---
let groupSession = null;

// --- Курс TON к USDT (только реальный) ---
let tonUsdtRate = null;

async function fetchTonRate() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        const data = await response.json();
        if (data?.['the-open-network']?.usd) {
            tonUsdtRate = data['the-open-network'].usd;
            console.log('Курс TON/USDT:', tonUsdtRate);
            return;
        }
    } catch (e) { console.warn('CoinGecko не ответил.'); }
    try {
        const response = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd');
        const data = await response.json();
        if (data?.rates?.TON?.prices?.USD) {
            tonUsdtRate = data.rates.TON.prices.USD;
            console.log('Курс TON/USDT:', tonUsdtRate);
            return;
        }
    } catch (e) { console.warn('TON API не ответил.'); }
    console.error('Курс TON не получен. Награда только в USDT.');
}
fetchTonRate();
setInterval(fetchTonRate, 120000);

// --- Начисление награды (50% USDT, 50% TON) ---
function awardReward(usdtAmount) {
    if (!tonUsdtRate || tonUsdtRate <= 0) {
        usdt += usdtAmount;
        return { currency: 'USDT', amount: usdtAmount };
    }
    if (Math.random() < 0.5) {
        usdt += usdtAmount;
        return { currency: 'USDT', amount: usdtAmount };
    } else {
        const tonAmount = usdtAmount / tonUsdtRate;
        ton += tonAmount;
        return { currency: 'TON', amount: tonAmount };
    }
}

// Проверка, хватает ли на штраф этапа
function canAffordStage(stake, stage) {
    if (stake <= 0) return false;
    const penalty = stake * getPenaltyRate(stage);
    return stake >= penalty && penalty > 0;
}

// Максимальный доступный этап для остатка
function getMaxAvailableStage(stake) {
    for (let s = 5; s >= 1; s--) {
        if (canAffordStage(stake, s)) return s;
    }
    return 1;
}

// --- Быстрая дуэль ---
quickDuelCoin.addEventListener('click', () => {
    if (duelActive || gameActive || pendingMining) return;
    showMiningModal();
});

// --- Окно добычи SRUM ---
function showBuySRUMModal() {
    document.querySelectorAll('.quick-duel-modal').forEach(m => m.remove());
    const modal = document.createElement('div');
    modal.className = 'quick-duel-modal';
    modal.innerHTML = `
        <div class="quick-duel-box" style="border:none;background:transparent;padding:0;">
            <div class="pool-cloud" style="background:radial-gradient(circle at 20% 20%,#1a3a1a,#0d1f0d);">
                <h2>⛏️ Добыть SRUM</h2>
                <p style="color:#ccc;margin-bottom:15px;">Введите сумму и выберите валюту</p>
                <input type="number" id="buy-srum-amount" placeholder="Сумма SRUM" min="1" step="1" style="width:100%;padding:14px;margin:8px 0;border-radius:12px;border:1px solid rgba(255,215,0,0.3);background:rgba(0,0,0,0.5);color:white;font-size:1.2rem;text-align:center;">
                <div style="display:flex;gap:10px;margin-top:15px;">
                    <button id="buy-srum-ton-btn" class="buy-srum-btn" disabled style="background:linear-gradient(180deg,#2196F3,#1565C0);">⚡ Добыть за<br><span id="ton-price-preview">0.00</span> TON</button>
                    <button id="buy-srum-usdt-btn" class="buy-srum-btn" disabled style="background:linear-gradient(180deg,#4CAF50,#2E7D32);">💵 Добыть за<br><span id="usdt-price-preview">0.00</span> USDT</button>
                </div>
                <p style="color:#aaa;font-size:0.75rem;margin-top:10px;">Курс: 1 SRUM = 0.5 TON | 1 SRUM = 1 USDT</p>
                <button id="cancel-buy-srum" style="background:none;color:white;border:1px solid white;border-radius:10px;padding:10px;margin-top:10px;width:100%;">Отмена</button>
            </div>
        </div>
    `;
    document.getElementById('game-container').appendChild(modal);
    if (!document.getElementById('buy-srum-style')) {
        const style = document.createElement('style'); style.id = 'buy-srum-style';
        style.textContent = `.buy-srum-btn{flex:1;padding:14px 8px;border:none;border-radius:12px;font-weight:bold;font-size:0.85rem;color:white;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.3);transition:transform 0.1s;line-height:1.3;}.buy-srum-btn:active{transform:scale(0.96);}.buy-srum-btn:disabled{background:#555!important;color:#999;cursor:not-allowed;box-shadow:none;}`;
        document.head.appendChild(style);
    }
    const amountInput = document.getElementById('buy-srum-amount');
    const tonPrice = document.getElementById('ton-price-preview');
    const usdtPrice = document.getElementById('usdt-price-preview');
    const tonBtn = document.getElementById('buy-srum-ton-btn');
    const usdtBtn = document.getElementById('buy-srum-usdt-btn');
    const BUY_RATE = { TON: 0.5, USDT: 1 };
    amountInput.addEventListener('input', () => {
        const amount = parseFloat(amountInput.value) || 0;
        const valid = amount > 0;
        tonPrice.textContent = (amount * BUY_RATE.TON).toFixed(2);
        usdtPrice.textContent = (amount * BUY_RATE.USDT).toFixed(2);
        tonBtn.disabled = !valid; usdtBtn.disabled = !valid;
    });
    tonBtn.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value) || 0;
        if (amount <= 0) return;
        const tonNeeded = amount * BUY_RATE.TON;
        if (!currentWalletAddress) { alert('Подключите TON кошелёк'); return; }
        if (ton < tonNeeded) { alert(`Недостаточно TON. Нужно ${tonNeeded.toFixed(2)}`); return; }
        if (!confirm(`Добыть ${amount} SRUM за ${tonNeeded.toFixed(2)} TON?`)) return;
        ton -= tonNeeded; srum += amount; updateUI(); saveAll();
        if (typeof saveUserData === 'function' && userId) { saveUserData(userId, { ton, srum }).catch(() => {}); }
        modal.remove(); alert(`✅ Добыто ${amount} SRUM!`);
    });
    usdtBtn.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value) || 0;
        if (amount <= 0) return;
        const usdtNeeded = amount * BUY_RATE.USDT;
        if (usdt < usdtNeeded) { alert(`Недостаточно USDT. Нужно ${usdtNeeded.toFixed(2)}`); return; }
        if (!confirm(`Добыть ${amount} SRUM за ${usdtNeeded.toFixed(2)} USDT?`)) return;
        usdt -= usdtNeeded; srum += amount; updateUI(); saveAll();
        if (typeof saveUserData === 'function' && userId) { saveUserData(userId, { usdt, srum }).catch(() => {}); }
        modal.remove(); alert(`✅ Добыто ${amount} SRUM!`);
    });
    document.getElementById('cancel-buy-srum').addEventListener('click', () => { 
        modal.remove(); 
        if (pendingMining) { 
            srum += pendingMining.threshold; 
            pendingMining = null; 
            updateUI(); 
        } 
    });
}

// --- Модалка Криптобеспредела ---
function showMiningModal() {
    document.querySelectorAll('.quick-duel-modal').forEach(m => m.remove());
    const modal = document.createElement('div');
    modal.className = 'quick-duel-modal';
    const poolAmount = (10000 + Math.random() * 190000).toFixed(0);
    const activePlayers = Math.floor(10 + Math.random() * 290);
    modal.innerHTML = `
        <div class="quick-duel-box" style="border:none;background:transparent;padding:0;">
            <div class="pool-cloud">
                <h2>⛏️ Криптобеспредел</h2>
                <div class="pool-amount">💎 ${poolAmount} USDT</div>
                <div class="pool-players">🖥️ <span>${activePlayers}</span> майнеров в пуле</div>
                <div class="pool-stage">Твой этап: <b>${miningStage}</b></div>
                <div style="display:flex;gap:8px;margin-top:15px;">
                    <button id="mode-solo" class="mining-mode-btn active" style="flex:1;">⚡ Соло</button>
                    <button id="mode-group" class="mining-mode-btn" style="flex:1;">👥 Групповой</button>
                </div>
                <div id="mining-mode-content"></div>
                <button id="cancel-mining" style="background:none;color:white;border:1px solid white;border-radius:10px;padding:10px;margin-top:10px;width:100%;">✖ Отмена</button>
            </div>
        </div>
    `;
    document.getElementById('game-container').appendChild(modal);

    if (!document.getElementById('mining-mode-style')) {
        const style = document.createElement('style'); style.id = 'mining-mode-style';
        style.textContent = `.mining-mode-btn{padding:10px;border:1px solid rgba(255,215,0,0.3);border-radius:10px;font-weight:bold;font-size:0.85rem;cursor:pointer;background:rgba(255,255,255,0.05);color:#aaa;}.mining-mode-btn.active{background:rgba(255,215,0,0.2);color:#FFD700;border-color:#FFD700;}`;
        document.head.appendChild(style);
    }

    let currentMode = 'solo';
    renderSoloMode();

    document.getElementById('mode-solo').addEventListener('click', () => {
        currentMode = 'solo';
        document.getElementById('mode-solo').classList.add('active');
        document.getElementById('mode-group').classList.remove('active');
        renderSoloMode();
    });
    document.getElementById('mode-group').addEventListener('click', () => {
        currentMode = 'group';
        document.getElementById('mode-group').classList.add('active');
        document.getElementById('mode-solo').classList.remove('active');
        renderGroupMode();
    });
    document.getElementById('cancel-mining').addEventListener('click', () => modal.remove());

    function renderSoloMode() {
        const container = document.getElementById('mining-mode-content');
        container.innerHTML = `
            <select id="mining-currency" style="width:100%;padding:12px;margin-top:10px;border-radius:10px;border:none;font-size:1rem;background:rgba(255,255,255,0.15);color:white;">
                <option value="SRUM" ${miningCurrency==='SRUM'?'selected':''}>SRUM</option>
                <option value="RUM" ${miningCurrency==='RUM'?'selected':''}>RUM</option>
            </select>
            <input type="range" min="0.01" max="5" step="0.01" value="${miningThreshold}" id="threshold-slider" style="width:100%;margin-top:10px;">
            <p style="color:#ccc;margin-top:5px;">Ставка: <strong id="mining-stake">${miningThreshold.toFixed(2)}</strong> <span id="stake-currency">${miningCurrency}</span></p>
            <p style="color:#ff6666;" id="penalty-text">Штраф при поражении: ${(miningThreshold * getPenaltyPercent()).toFixed(4)} SRUM</p>
            <p style="color:#66ff66;" id="reward-text">Награда при победе: ${(miningThreshold * getRewardPercent()).toFixed(4)} USDT</p>
            <button class="btn-mining-big" id="start-solo-mining">🔍 ИСКАТЬ БЛОК</button>
        `;
        const slider = document.getElementById('threshold-slider');
        slider.addEventListener('input', function () {
            const value = parseFloat(this.value);
            document.getElementById('mining-stake').textContent = value.toFixed(2);
            document.getElementById('penalty-text').textContent = `Штраф при поражении: ${(value * getPenaltyPercent()).toFixed(4)} SRUM`;
            document.getElementById('reward-text').textContent = `Награда при победе: ${(value * getRewardPercent()).toFixed(4)} USDT`;
        });
        document.getElementById('start-solo-mining').addEventListener('click', () => {
            miningCurrency = document.getElementById('mining-currency').value;
            miningThreshold = parseFloat(slider.value);
            if (miningCurrency === 'SRUM' && srum < miningThreshold) { modal.remove(); showBuySRUMModal(); return; }
            if (miningCurrency === 'RUM' && rum < miningThreshold) return alert('Недостаточно RUM');
            // Замораживаем ставку
            if (miningCurrency === 'SRUM') { srum -= miningThreshold; frozenStake = miningThreshold; }
            else { rum -= miningThreshold; frozenStake = miningThreshold; }
            pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage };
            updateUI(); modal.remove(); startSearch('mining');
        });
    }

    function renderGroupMode() {
        const container = document.getElementById('mining-mode-content');
        if (groupSession && groupSession.fighters.length >= 2) {
            let fightersHtml = groupSession.fighters.map((f, i) => `<div style="font-size:0.8rem;padding:4px 0;">${i+1}. ${f.name} ${f.ready ? '✅' : '⏳'}</div>`).join('');
            const allReady = groupSession.fighters.every(f => f.ready);
            container.innerHTML = `
                <p style="color:#FFD700;margin-top:10px;">👥 Группа (${groupSession.fighters.length}/5)</p>
                <div style="background:rgba(0,0,0,0.3);border-radius:10px;padding:10px;margin:10px 0;max-height:150px;overflow-y:auto;">${fightersHtml}</div>
                <p style="color:#ccc;font-size:0.8rem;">Режим: ${groupSession.mode === 'boss_pay' ? '💰 Платит создатель' : '💸 Каждый за себя'}</p>
                <p style="color:#ccc;font-size:0.8rem;">Ставка: ${groupSession.threshold.toFixed(2)} SRUM × ${groupSession.fighters.length} = ${groupSession.totalStake.toFixed(2)} SRUM</p>
                <p style="color:#66ff66;font-size:0.75rem;">Награда при победе: ${(groupSession.totalStake * getRewardPercent()).toFixed(4)} USDT</p>
                <p style="color:#ff6666;font-size:0.75rem;">Штраф при поражении: ${(groupSession.totalStake * getPenaltyPercent()).toFixed(4)} SRUM</p>
                ${groupSession.bossId === userId ? '<button class="btn-mining-big" id="start-group-mining" style="margin-top:10px;">⚔️ НАЧАТЬ БОЙ</button>' : 
                  `<button class="btn-mining-big" id="ready-group-btn" style="margin-top:10px;">✅ Готов</button>`}
                <button class="btn-mining-big" id="leave-group-btn" style="background:#e74c3c;box-shadow:0 4px 0 #c0392b;margin-top:5px;">🚪 Выйти</button>
            `;
            document.getElementById('ready-group-btn')?.addEventListener('click', () => {
                const fighter = groupSession.fighters.find(f => f.id === userId);
                if (fighter) { fighter.ready = true; renderGroupMode(); }
            });
            document.getElementById('start-group-mining')?.addEventListener('click', () => {
                if (!allReady) return alert('Не все готовы');
                if (groupSession.mode === 'boss_pay') {
                    if (srum < groupSession.totalStake) { modal.remove(); showBuySRUMModal(); return; }
                    srum -= groupSession.totalStake;
                    frozenStake = groupSession.totalStake;
                } else {
                    const myStake = groupSession.threshold;
                    if (srum < myStake) { modal.remove(); showBuySRUMModal(); return; }
                    srum -= myStake;
                    frozenStake = myStake;
                }
                pendingMining = { currency: 'SRUM', threshold: groupSession.threshold, stage: miningStage, group: true, groupSession };
                updateUI(); modal.remove(); startSearch('mining');
            });
            document.getElementById('leave-group-btn')?.addEventListener('click', () => { groupSession = null; renderGroupMode(); });
        } else {
            container.innerHTML = `
                <p style="color:#FFD700;margin-top:10px;">👥 Создать группу (до 5 чел)</p>
                <input type="range" min="0.01" max="5" step="0.01" value="${miningThreshold}" id="group-threshold-slider" style="width:100%;margin-top:10px;">
                <p style="color:#ccc;margin-top:5px;">Ставка на человека: <strong id="group-stake">${miningThreshold.toFixed(2)}</strong> SRUM</p>
                <div style="display:flex;gap:8px;margin-top:10px;">
                    <button id="mode-boss-pay" class="mining-mode-btn active" style="flex:1;">💰 Плачу за всех</button>
                    <button id="mode-split" class="mining-mode-btn" style="flex:1;">💸 Каждый за себя</button>
                </div>
                <p id="group-total-text" style="color:#FFD700;font-size:0.8rem;margin-top:8px;">Общий взнос: ${miningThreshold.toFixed(2)} SRUM (×5 макс = ${(miningThreshold*5).toFixed(2)})</p>
                <button class="btn-mining-big" id="create-group-btn">🐺 Создать группу</button>
            `;
            let groupMode = 'boss_pay';
            const slider = document.getElementById('group-threshold-slider');
            slider.addEventListener('input', () => {
                const val = parseFloat(slider.value);
                document.getElementById('group-stake').textContent = val.toFixed(2);
                document.getElementById('group-total-text').textContent = `Общий взнос: ${val.toFixed(2)} SRUM (×5 макс = ${(val*5).toFixed(2)})`;
            });
            document.getElementById('mode-boss-pay').addEventListener('click', () => { groupMode = 'boss_pay'; document.getElementById('mode-boss-pay').classList.add('active'); document.getElementById('mode-split').classList.remove('active'); });
            document.getElementById('mode-split').addEventListener('click', () => { groupMode = 'split'; document.getElementById('mode-split').classList.add('active'); document.getElementById('mode-boss-pay').classList.remove('active'); });
            document.getElementById('create-group-btn').addEventListener('click', () => {
                const threshold = parseFloat(slider.value);
                groupSession = {
                    bossId: userId,
                    fighters: [{ id: userId, name: userNickname || 'Ты', ready: true }],
                    threshold,
                    currency: 'SRUM',
                    mode: groupMode,
                    totalStake: threshold * 1
                };
                renderGroupMode();
                alert(`Группа создана! Ставка: ${threshold.toFixed(2)} SRUM. Пригласите ещё 4 участников.`);
            });
        }
    }
}

// --- Поиск соперника ---
function startSearch(mode = 'mining') {
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    overlay.innerHTML = '<div style="font-size:1.8rem;">🔍 Поиск блока...</div>';
    document.getElementById('game-container').appendChild(overlay);
    let cancelled = false;
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✖ Отмена';
    cancelBtn.style.cssText = 'margin-top:20px;padding:10px 20px;font-size:1.2rem;background:#B22222;color:white;border:none;border-radius:10px;cursor:pointer;';
    cancelBtn.addEventListener('click', () => { 
        cancelled = true; overlay.remove(); 
        if (pendingMining) { 
            srum += frozenStake; frozenStake = 0;
            pendingMining = null; updateUI(); 
        } 
    });
    overlay.appendChild(cancelBtn);

    fetch('https://hngfpdsnjgdpazmortix.supabase.co/functions/v1/matchmaking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, threshold: pendingMining?.threshold || miningThreshold, stage: miningStage, currency: miningCurrency })
    }).then(res => res.json()).then(data => {
        if (cancelled) return; overlay.remove();
        if (data.found) { currentBot = { name: 'Игрок', speed: 800, botIndex: -1, shouldWin: false }; }
        else { let selectedBot = null; if (spartansEnabled) selectedBot = selectSpartanBot(miningStage); if (selectedBot) { currentBot = { name: selectedBot.name, speed: selectedBot.speed, botIndex: selectedBot.botIndex, shouldWin: selectedBot.shouldWin }; } else { let b = defaultBotPool[Math.floor(Math.random() * defaultBotPool.length)]; currentBot = { name: b.name, speed: b.speed, botIndex: -1, shouldWin: false }; } }
        const readyDiv = document.createElement('div'); readyDiv.className = 'countdown-overlay';
        readyDiv.innerHTML = `<div style="text-align:center;"><p>Соперник: <b>${currentBot.name}</b></p><p>Ставка: ${(pendingMining?.threshold || miningThreshold).toFixed(2)} ${miningCurrency}</p><button id="mining-ready-btn" class="start-btn" style="font-size:1.5rem;padding:15px 35px;">⛏️ Готов</button><button id="cancel-ready-btn" style="margin-top:10px;padding:10px 20px;font-size:1rem;background:#B22222;color:white;border:none;border-radius:10px;cursor:pointer;">✖ Отмена</button></div>`;
        document.getElementById('game-container').appendChild(readyDiv);
        document.getElementById('cancel-ready-btn').addEventListener('click', () => { 
            readyDiv.remove(); 
            srum += frozenStake; frozenStake = 0;
            pendingMining = null; updateUI();
            setTimeout(() => startSearch(mode), 500); 
        });
        document.getElementById('mining-ready-btn').addEventListener('click', () => { 
            document.getElementById('mining-ready-btn').disabled = true; 
            document.getElementById('mining-ready-btn').textContent = '⏳ Ожидание...'; 
            setTimeout(() => { 
                if (cancelled) return; 
                readyDiv.innerHTML = `<div style="text-align:center;"><p>Оба готовы!</p><p id="countdown-number" style="font-size:4rem;">3</p></div>`; 
                let count = 3; 
                let ci = setInterval(() => { 
                    count--; 
                    if (count > 0) document.getElementById('countdown-number').textContent = count; 
                    else { clearInterval(ci); readyDiv.remove(); startDuel(); } 
                }, 1000); 
            }, 1500); 
        });
    }).catch(() => { 
        overlay.remove(); 
        srum += frozenStake; frozenStake = 0;
        pendingMining = null; updateUI();
        let b = defaultBotPool[Math.floor(Math.random() * defaultBotPool.length)]; 
        currentBot = { name: b.name, speed: b.speed, botIndex: -1, shouldWin: false }; 
    });
}

// --- Запуск дуэли ---
function startDuel() { 
    duelActive = true; gameActive = false; clearInterval(gameTimer); clearInterval(spawnInterval); 
    board.removeEventListener('touchstart', handleTouchStart); board.removeEventListener('touchmove', preventDefaultMove); 
    duelPlayerScore = 0; duelOpponentScore = 0; duelTimeLeft = 20; duelScoreboard.classList.remove('hidden'); 
    updateDuelScore(); spawnAll(); 
    let duelSpawnInterval = setInterval(() => { if (duelActive) spawnAll(); }, 1500); 
    let duelBotInterval = setInterval(() => { if (duelActive) { duelOpponentScore++; updateDuelScore(); } }, currentBot.speed); 
    let duelTimerInterval = setInterval(() => { if (!duelActive) return; duelTimeLeft--; duelTimerEl.textContent = duelTimeLeft; if (duelTimeLeft <= 0) endDuel(duelTimerInterval, duelSpawnInterval, duelBotInterval); }, 1000); 
    board.addEventListener('touchstart', duelTouchHandler, {passive: false}); 
    board.addEventListener('touchmove', e => e.preventDefault(), {passive: false}); 
}

function duelTouchHandler(e) { 
    e.preventDefault(); if (!duelActive) return; 
    [...e.changedTouches].forEach(touch => { 
        const hole = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.hole'); 
        if (hole) { 
            const num = [...holes].indexOf(hole); 
            if (num !== -1 && currentVeg[num]) { 
                if (currentVeg[num].type === 'good') { duelPlayerScore++; flyVegToPot(hole, hole.querySelector('.veg').textContent); } 
                else { duelPlayerScore = Math.max(0, duelPlayerScore - 2); } 
                delete currentVeg[num]; hole.innerHTML = ''; updateDuelScore(); 
            } 
        } else { duelPlayerScore = Math.max(0, duelPlayerScore - 2); updateDuelScore(); } 
    }); 
}

function updateDuelScore() { duelPlayerScoreEl.textContent = duelPlayerScore; duelOpponentScoreEl.textContent = duelOpponentScore; }

// --- Завершение дуэли (ЖЕЛЕЗНАЯ МАТЕМАТИКА) ---
async function endDuel(duelTimerInterval, duelSpawnInterval, duelBotInterval) {
    duelActive = false; clearInterval(duelTimerInterval); clearInterval(duelSpawnInterval); clearInterval(duelBotInterval);
    board.removeEventListener('touchstart', duelTouchHandler); board.removeEventListener('touchmove', preventDefaultMove);
    board.addEventListener('touchstart', handleTouchStart, {passive: false}); 
    board.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
    holes.forEach(h => h.innerHTML = ''); currentVeg = {}; duelScoreboard.classList.add('hidden');
    
    const win = duelPlayerScore > duelOpponentScore;
    let resultDiv = document.createElement('div'); resultDiv.className = 'result-overlay';

    const threshold = pendingMining?.threshold || miningThreshold;
    const currentStage = pendingMining?.stage || miningStage;
    const penaltyRate = getPenaltyRate(currentStage);
    const rewardRate = getRewardRate(currentStage);
    
    let penaltySRUM = threshold * penaltyRate;
    let rewardUSDT = threshold * rewardRate;
    const stake = frozenStake || threshold;

    // Обновляем спартанца
    if (currentBot && currentBot.botIndex !== undefined && currentBot.botIndex >= 0) {
        updateSpartanBot(currentBot.botIndex, !win, currentStage, penaltySRUM, rewardUSDT);
    }

    if (pendingMining?.group) {
        const gs = pendingMining.groupSession;
        const fightersCount = gs.fighters.length;
        const totalStake = gs.totalStake || (threshold * fightersCount);
        
        if (gs.mode === 'boss_pay') {
            if (win) {
                srum += totalStake;
                frozenStake = totalStake;
                const totalRewardUSDT = totalStake * rewardRate;
                const award = awardReward(totalRewardUSDT);
                if (miningStage < 5) miningStage++;
                resultDiv.innerHTML = `<h2>⛏️ Группа победила!</h2>
                    <p>🏆 Награда: +${award.amount.toFixed(4)} ${award.currency}</p>
                    <p>📈 Этап повышен до ${miningStage}</p>
                    <p>Бойцы: ${gs.fighters.map(f=>f.name).join(', ')}</p>
                    <button id="continue-mining">Продолжить</button>
                    <button id="pause-mining">⏸️ Пауза</button>`;
            } else {
                const refund = totalStake - (totalStake * penaltyRate);
                srum += refund;
                frozenStake = 0;
                miningStage = 1;
                resultDiv.innerHTML = `<h2>💨 Группа проиграла</h2>
                    <p>↩️ Возврат: ${refund.toFixed(4)} SRUM</p>
                    <p>📉 Этап сброшен до 1</p>
                    <button id="continue-mining">Продолжить</button>
                    <button id="pause-mining">⏸️ Пауза</button>`;
            }
        } else {
            if (win) {
                srum += threshold;
                frozenStake = threshold;
                const myRewardUSDT = (totalStake * rewardRate) / fightersCount;
                const award = awardReward(myRewardUSDT);
                if (miningStage < 5) miningStage++;
                resultDiv.innerHTML = `<h2>⛏️ Ты победил в группе!</h2>
                    <p>🏆 Награда: +${award.amount.toFixed(4)} ${award.currency}</p>
                    <p>📈 Этап повышен до ${miningStage}</p>
                    <button id="continue-mining">Продолжить</button>
                    <button id="pause-mining">⏸️ Пауза</button>`;
            } else {
                const refund = threshold - penaltySRUM;
                srum += refund;
                frozenStake = 0;
                miningStage = 1;
                resultDiv.innerHTML = `<h2>💨 Поражение</h2>
                    <p>↩️ Возврат: ${refund.toFixed(4)} SRUM</p>
                    <p>📉 Этап сброшен до 1</p>
                    <button id="continue-mining">Продолжить</button>
                    <button id="pause-mining">⏸️ Пауза</button>`;
            }
        }
        groupSession = null;
    } else {
        if (win) {
            srum += stake;
            frozenStake = stake;
            showCoinFountain(30);
            const award = awardReward(rewardUSDT);
            if (miningStage < 5) miningStage++;
            resultDiv.innerHTML = `<h2>⛏️ Блок добыт!</h2>
                <p>🏆 Награда: +${award.amount.toFixed(4)} ${award.currency}</p>
                <p>📈 Этап повышен до ${miningStage}</p>
                <button id="continue-mining">Продолжить</button>
                <button id="pause-mining">⏸️ Пауза</button>`;
        } else {
            showPoopFountain(20);
            const refund = stake - penaltySRUM;
            srum += Math.max(0, refund);
            frozenStake = Math.max(0, refund);
            miningStage = 1;
            let phrase = cheerPhrases[Math.floor(Math.random() * cheerPhrases.length)];
            resultDiv.innerHTML = `<h2>💨 Блок упущен</h2>
                <p>${phrase}</p>
                <p>↩️ Возврат остатка: ${Math.max(0, refund).toFixed(4)} SRUM</p>
                <p>📉 Этап сброшен до 1</p>
                <button id="continue-mining">Продолжить</button>
                <button id="pause-mining">⏸️ Пауза</button>`;
        }
    }

    // Сохраняем
    if (typeof saveUserData === 'function' && userId) {
        saveUserData(userId, { usdt, ton, srum, miningStage, frozen_stake: frozenStake }).catch(() => {});
    }

    pendingMining = null; updateUI(); document.getElementById('game-container').appendChild(resultDiv);
    
    document.getElementById('continue-mining')?.addEventListener('click', () => { 
        resultDiv.remove();
        if (frozenStake <= 0) { showBuySRUMModal(); return; }
        // Проверяем, на какой этап хватает остатка
        const maxStage = getMaxAvailableStage(frozenStake);
        if (miningStage > maxStage) miningStage = maxStage;
        miningThreshold = frozenStake;
        pendingMining = { currency: 'SRUM', threshold: miningThreshold, stage: miningStage };
        startSearch('mining'); 
    });
    
    document.getElementById('pause-mining')?.addEventListener('click', () => { 
        if (pausedSessions.length >= 7) return alert('Лимит пауз (7)'); 
        pausedSessions.push({ currency: 'SRUM', threshold: frozenStake, stage: miningStage, frozenStake: frozenStake }); 
        frozenStake = 0;
        updateUI(); resultDiv.remove(); renderPausedSessions(); 
    });
}

// --- Замороженные сессии ---
function renderPausedSessions() { 
    const container = document.getElementById('paused-sessions'); 
    if (!container) return; 
    let html = '<h3>❄️ Замороженные сессии</h3>'; 
    pausedSessions.forEach((s, i) => { 
        html += `<div style="background:#333;padding:5px;margin:5px;border-radius:8px;">
            SRUM ставка ${s.threshold.toFixed(2)} этап ${s.stage} 
            <button data-idx="${i}" class="resume-session">▶️</button>
            <button data-idx="${i}" class="cancel-session">🗑️</button>
        </div>`; 
    }); 
    container.innerHTML = html; 
    document.querySelectorAll('.resume-session').forEach(b => b.addEventListener('click', (e) => { 
        let idx = e.target.dataset.idx; 
        let session = pausedSessions[idx]; 
        if (!session) return; 
        frozenStake = session.frozenStake || session.threshold;
        miningCurrency = 'SRUM'; 
        miningThreshold = session.threshold; 
        miningStage = session.stage; 
        pausedSessions.splice(idx, 1); 
        updateUI(); renderPausedSessions(); 
        pendingMining = { currency: 'SRUM', threshold: miningThreshold, stage: miningStage }; 
        startSearch('mining'); 
        switchScreen(null); 
    })); 
    document.querySelectorAll('.cancel-session').forEach(b => b.addEventListener('click', (e) => { 
        let idx = e.target.dataset.idx; 
        const session = pausedSessions[idx];
        if (session) { srum += session.frozenStake || session.threshold; }
        pausedSessions.splice(idx, 1); 
        updateUI(); renderPausedSessions(); 
    })); 
}

function getTournamentStageName(stage) { 
    const names = ['Новичок', 'Бывалый', 'Авторитет', 'Главарь', 'Смотрящий']; 
    return names[stage - 1] || 'Этап ' + stage; 
}

// ================== АРЕНА (ВКЛАДКИ) ==================
const arenaContent = document.getElementById('arena-content');
const arenaTabs = document.getElementById('arena-tabs');
let currentArenaTab = 'mining';

function renderArena() { 
    if (!arenaContent) return; 
    let html = ''; 
    if (currentArenaTab === 'mining') { 
        const penalty = (miningThreshold * getPenaltyPercent()).toFixed(4); 
        const reward = (miningThreshold * getRewardPercent()).toFixed(4);
        html = `<h2>⛏️ Личный майнинг</h2>
            <p>Ставка: <b>${miningThreshold.toFixed(2)} SRUM</b> | Этап: <b>${miningStage}</b></p>
            <p>Штраф при поражении: ${penalty} SRUM</p>
            <p>Награда при победе: ${reward} USDT</p>
            ${frozenStake > 0 ? `<p style="color:#FFD700;">🔒 Заморожено: ${frozenStake.toFixed(4)} SRUM</p>` : ''}
            <input type="range" min="0.01" max="5" step="0.01" value="${miningThreshold}" id="threshold-slider-arena" style="width:90%;">
            <p>Ставка: <strong id="arena-stake">${miningThreshold.toFixed(2)}</strong> SRUM</p>
            <button class="shop-btn" id="start-mining-btn" ${srum < miningThreshold ? 'disabled' : ''}>⛏️ Искать блок</button>`; 
    } else if (currentArenaTab === 'band') { 
        html = renderBandTab(); 
    } else if (currentArenaTab === 'tournaments') { 
        html = `<h2>🔒 Выжить в тюрьме</h2><p>Особый турнир с высокими ставками.</p><button class="shop-btn" id="start-tournament-btn">🔍 Начать турнир</button>`; 
    } 
    arenaContent.innerHTML = html; 
    if (currentArenaTab === 'mining') { 
        const slider = document.getElementById('threshold-slider-arena'); 
        if (slider) slider.addEventListener('input', function() { 
            miningThreshold = parseFloat(this.value); 
            document.getElementById('arena-stake').textContent = miningThreshold.toFixed(2); 
        }); 
        document.getElementById('start-mining-btn')?.addEventListener('click', () => { 
            if (srum < miningThreshold) { showBuySRUMModal(); return; } 
            srum -= miningThreshold; 
            frozenStake = miningThreshold;
            miningCurrency = 'SRUM'; 
            pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage }; 
            document.querySelector('#arena-screen').classList.remove('active'); 
            showMainElements(); 
            startSearch('mining'); 
        }); 
    } 
    if (currentArenaTab === 'tournaments') { 
        document.getElementById('start-tournament-btn')?.addEventListener('click', () => showTournamentModal()); 
    } 
    renderPausedSessions(); 
}

// --- Турнир ---
function showTournamentModal() { 
    document.querySelectorAll('.quick-duel-modal').forEach(m => m.remove()); 
    const tourModal = document.createElement('div'); 
    tourModal.className = 'quick-duel-modal'; 
    const poolAmount = (5000 + Math.random() * 45000).toFixed(0); 
    const activePlayers = Math.floor(5 + Math.random() * 95); 
    tourModal.innerHTML = `<div class="quick-duel-box" style="border:none;background:transparent;padding:0;">
        <div class="pool-cloud" style="background:radial-gradient(circle at 20% 20%,#8b0000,#4a0000);">
            <h2>🔒 Выжить в тюрьме</h2>
            <div class="pool-amount">💎 ${poolAmount} USDT</div>
            <div class="pool-players">🖥️ <span>${activePlayers}</span> майнеров</div>
            <div class="pool-stage">Твой этап: <b>${getTournamentStageName(miningStage)}</b></div>
            <input type="range" min="0.01" max="5" step="0.01" value="${miningThreshold}" id="tournament-threshold-slider" style="width:100%;margin-top:10px;">
            <p style="color:#ccc;">Ставка: <strong id="tournament-stake">${miningThreshold.toFixed(2)}</strong> SRUM</p>
            <p style="color:#ff6666;">Штраф: ${(miningThreshold*getPenaltyPercent()).toFixed(4)} SRUM</p>
            <p style="color:#66ff66;">Награда: ${(miningThreshold*getRewardPercent()).toFixed(4)} USDT</p>
            <button class="btn-mining-big" id="start-tournament-search">🔍 НАЧАТЬ</button>
            <button id="cancel-tournament" style="background:none;color:white;border:1px solid white;border-radius:10px;padding:10px;margin-top:10px;width:100%;">✖ Отмена</button>
        </div></div>`; 
    document.getElementById('game-container').appendChild(tourModal); 
    const slider = document.getElementById('tournament-threshold-slider'); 
    slider.addEventListener('input', function() { 
        const v = parseFloat(this.value); 
        document.getElementById('tournament-stake').textContent = v.toFixed(2); 
    }); 
    document.getElementById('start-tournament-search').addEventListener('click', () => { 
        miningCurrency = 'SRUM'; 
        miningThreshold = parseFloat(slider.value); 
        if (srum < miningThreshold) { tourModal.remove(); showBuySRUMModal(); return; } 
        srum -= miningThreshold; 
        frozenStake = miningThreshold;
        pendingMining = { currency: 'SRUM', threshold: miningThreshold, stage: miningStage }; 
        updateUI(); tourModal.remove(); startSearch('tournament'); 
    }); 
    document.getElementById('cancel-tournament').addEventListener('click', () => tourModal.remove()); 
}

// ================== БАНДА ==================
function renderBandTab() { 
    if (!bandData) { 
        return `<div style="text-align:center;">
            <h2>🐺 Командный майнинг</h2>
            <div class="info-card">
                <p>Собери банду из 5 бойцов!</p>
                <p>💰 Взнос: ${miningThreshold.toFixed(2)} SRUM × 5 = ${(miningThreshold*5).toFixed(2)} SRUM</p>
                <p>🏆 Приз: ${(miningThreshold*5*getRewardPercent()).toFixed(4)} USDT</p>
            </div>
            <button class="shop-btn" id="create-band-btn">🐺 Создать банду</button>
            <button class="shop-btn" id="invite-band-btn" style="background:linear-gradient(180deg,#8e44ad,#6c3483);">👥 Пригласить</button>
        </div>`; 
    } else { 
        let f = ''; 
        bandData.fighters.forEach((ff, i) => { 
            f += `<div style="background:rgba(255,255,255,0.05);padding:8px;margin:4px 0;border-radius:6px;">${i===0?'👑':'⚔️'} ${ff}</div>`; 
        }); 
        const totalStake = bandData.threshold * bandData.fighters.length;
        const totalReward = totalStake * getRewardPercent();
        const totalPenalty = totalStake * getPenaltyPercent();
        return `<div style="text-align:center;">
            <h2>🐺 ${bandData.name}</h2>
            <p>Ставка: <b>${bandData.threshold.toFixed(2)} SRUM</b> × ${bandData.fighters.length} = ${totalStake.toFixed(2)} SRUM</p>
            <p style="color:#66ff66;">Награда при победе: ${totalReward.toFixed(4)} USDT</p>
            <p style="color:#ff6666;">Штраф при поражении: ${totalPenalty.toFixed(4)} SRUM</p>
            <div style="max-height:200px;overflow-y:auto;margin:10px 0;">${f}</div>
            <button class="shop-btn" id="start-band-match" ${bandData.fighters.length<5?'disabled':''}>⚔️ В бой!</button>
            <button class="shop-btn" id="invite-band-btn" style="background:linear-gradient(180deg,#8e44ad,#6c3483);">👥 Пригласить</button>
            <button class="shop-btn" id="leave-band-btn" style="background:linear-gradient(180deg,#e74c3c,#c0392b);">🚪 Покинуть</button>
            <button class="shop-btn" id="disband-btn" style="background:linear-gradient(180deg,#95a5a6,#7f8c8d);">🗑️ Распустить</button>
        </div>`; 
    } 
}

arenaContent.addEventListener('click', function(e) { 
    const t = e.target; 
    if (t.id === 'create-band-btn') { 
        const n = prompt('Название:'); 
        if (!n) return; 
        bandData = { name: n, threshold: miningThreshold, fighters: [userNickname || 'Ты'], boss: userId }; 
        alert(`Банда "${n}" создана!`); 
        renderArena(); 
    } 
    if (t.id === 'invite-band-btn') { 
        if (!bandData) return; 
        const c = prompt('1.Ник\n2.Клуб\n3.Рефералы'); 
        if (!c) return; 
        if (c === '2') { 
            if (!myClubId) return alert('Не в клубе'); 
            const cl = clubs.find(x => x.id == myClubId); 
            const m = cl?.members?.filter(x => x !== userNickname && !bandData.fighters.includes(x)) || []; 
            if (!m.length) return alert('Некого'); 
            const n = prompt(`Кого?\n${m.join(',')}`); 
            if (n && m.includes(n)) { bandData.fighters.push(n); renderArena(); } 
        } else if (c === '3') { 
            const r = referrals.filter(x => !bandData.fighters.includes(x.code)); 
            if (!r.length) return alert('Некого'); 
            const n = prompt(`Кого?\n${r.map(x => x.code).join(',')}`); 
            if (n && r.find(x => x.code === n)) { bandData.fighters.push(n); renderArena(); } 
        } else { 
            if (bandData.fighters.includes(c)) return alert('Уже в банде'); 
            bandData.fighters.push(c); renderArena(); 
        } 
    } 
    if (t.id === 'start-band-match') { 
        if (!bandData || bandData.fighters.length < 5) return alert('Нужно 5'); 
        const totalStake = bandData.threshold * bandData.fighters.length; 
        if (srum < totalStake) return alert(`Нужно ${totalStake.toFixed(2)} SRUM`); 
        if (!confirm(`Взнос ${totalStake.toFixed(2)} SRUM. Бой?`)) return; 
        srum -= totalStake; 
        frozenStake = totalStake;
        updateUI(); 
        const o = document.createElement('div'); 
        o.className = 'countdown-overlay'; 
        o.innerHTML = '<h2>⚔️ Битва!</h2>'; 
        document.getElementById('game-container').appendChild(o); 
        setTimeout(() => { 
            o.remove(); 
            const win = Math.random() > 0.4; 
            const rd = document.createElement('div'); 
            rd.className = 'result-overlay'; 
            if (win) { 
                srum += totalStake;
                frozenStake = totalStake;
                const rwUSDT = totalStake * getRewardPercent(); 
                const award = awardReward(rwUSDT); 
                if (miningStage < 5) miningStage++;
                rd.innerHTML = `<h2>🏆 Победа!</h2>
                    <p>🏆 Награда: +${award.amount.toFixed(4)} ${award.currency}</p>
                    <p>📈 Этап повышен до ${miningStage}</p>
                    <button id="cb">ОК</button>`; 
            } else { 
                const refund = totalStake - (totalStake * getPenaltyPercent()); 
                srum += Math.max(0, refund);
                frozenStake = Math.max(0, refund);
                miningStage = 1;
                rd.innerHTML = `<h2>💔 Поражение</h2>
                    <p>↩️ Возврат остатка: ${Math.max(0, refund).toFixed(4)} SRUM</p>
                    <p>📉 Этап сброшен до 1</p>
                    <button id="cb">ОК</button>`; 
            } 
            document.getElementById('game-container').appendChild(rd); 
            document.getElementById('cb').addEventListener('click', () => { 
                rd.remove(); bandData = null; updateUI(); renderArena(); 
            }); 
        }, 3000); 
    } 
    if (t.id === 'leave-band-btn') { 
        bandData.fighters = bandData.fighters.filter(f => f !== userNickname); 
        if (!bandData.fighters.length) { bandData = null; } 
        renderArena(); 
    } 
    if (t.id === 'disband-btn') { 
        if (confirm('Распустить?')) { bandData = null; renderArena(); } 
    } 
});

arenaTabs.querySelectorAll('button').forEach(btn => { 
    btn.addEventListener('click', () => { 
        arenaTabs.querySelectorAll('button').forEach(b => b.classList.remove('active')); 
        btn.classList.add('active'); 
        currentArenaTab = btn.dataset.tab; 
        renderArena(); 
    }); 
});
