// ================== АРЕНА (МАЙНИНГ, БАНДА, ЗАМОРОЗКА СЕССИЙ) ==================

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

// --- Расчёт процентов ---
function getPenaltyPercent() { return [0.1, 0.2, 0.4, 0.8, 1.0][miningStage - 1]; }
function getRewardPercent() { return getPenaltyPercent() * 0.7; }

// --- Быстрая дуэль (монетка) ---
quickDuelCoin.addEventListener('click', () => {
    if (duelActive || gameActive || pendingMining) return;
    showMiningModal();
});

// --- Окно добычи SRUM ---
function showBuySRUMModal() {
    // Удаляем все предыдущие модалки, чтобы не было конфликтов
    document.querySelectorAll('.quick-duel-modal').forEach(m => m.remove());

    const modal = document.createElement('div');
    modal.className = 'quick-duel-modal';
    modal.id = 'buy-srum-modal';
    modal.innerHTML = `
        <div class="quick-duel-box" style="border: none; background: transparent; padding: 0;">
            <div class="pool-cloud" style="background: radial-gradient(circle at 20% 20%, #1a3a1a, #0d1f0d);">
                <h2>⛏️ Добыть SRUM</h2>
                <p style="color:#ccc; margin-bottom:15px;">Введите сумму и выберите валюту</p>
                <input type="number" id="buy-srum-amount" placeholder="Сумма SRUM" min="1" step="1" 
                       style="width:100%; padding:14px; margin:8px 0; border-radius:12px; border:1px solid rgba(255,215,0,0.3); 
                              background:rgba(0,0,0,0.5); color:white; font-size:1.2rem; text-align:center;">
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button id="buy-srum-ton-btn" class="buy-srum-btn" disabled
                            style="background:linear-gradient(180deg,#2196F3,#1565C0);">
                        ⚡ Добыть за<br><span id="ton-price-preview">0.00</span> TON
                    </button>
                    <button id="buy-srum-usdt-btn" class="buy-srum-btn" disabled
                            style="background:linear-gradient(180deg,#4CAF50,#2E7D32);">
                        💵 Добыть за<br><span id="usdt-price-preview">0.00</span> USDT
                    </button>
                </div>
                <p style="color:#aaa; font-size:0.75rem; margin-top:10px;">Курс: 1 SRUM = 0.5 TON | 1 SRUM = 1 USDT</p>
                <button id="cancel-buy-srum" style="background:none;color:white;border:1px solid white;border-radius:10px;padding:10px;margin-top:10px;width:100%;">Отмена</button>
            </div>
        </div>
    `;
    document.getElementById('game-container').appendChild(modal);

    if (!document.getElementById('buy-srum-style')) {
        const style = document.createElement('style');
        style.id = 'buy-srum-style';
        style.textContent = `
            .buy-srum-btn { flex:1; padding:14px 8px; border:none; border-radius:12px; font-weight:bold; font-size:0.85rem; color:white; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3); transition:transform 0.1s; line-height:1.3; }
            .buy-srum-btn:active { transform:scale(0.96); }
            .buy-srum-btn:disabled { background:#555 !important; color:#999; cursor:not-allowed; box-shadow:none; }
        `;
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
        tonBtn.disabled = !valid;
        usdtBtn.disabled = !valid;
    });

    // Добыть за TON
    tonBtn.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value) || 0;
        if (amount <= 0) return;
        const tonNeeded = amount * BUY_RATE.TON;
        if (!currentWalletAddress) { alert('Подключите TON кошелёк (раздел Кошелёк)'); return; }
        if (ton < tonNeeded) { alert(`Недостаточно TON. Нужно ${tonNeeded.toFixed(2)} TON, у вас ${ton.toFixed(2)} TON`); return; }
        if (!confirm(`Добыть ${amount} SRUM за ${tonNeeded.toFixed(2)} TON?`)) return;
        ton -= tonNeeded;
        srum += amount;
        updateUI();
        saveAll();
        if (typeof saveUserData === 'function' && userId) { saveUserData(userId, { ton, srum }).catch(() => {}); }
        modal.remove();
        alert(`✅ Добыто ${amount} SRUM! Теперь можешь начать майнинг.`);
    });

    // Добыть за USDT
    usdtBtn.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value) || 0;
        if (amount <= 0) return;
        const usdtNeeded = amount * BUY_RATE.USDT;
        if (usdt < usdtNeeded) { alert(`Недостаточно USDT. Нужно ${usdtNeeded.toFixed(2)} USDT, у вас ${usdt.toFixed(2)} USDT`); return; }
        if (!confirm(`Добыть ${amount} SRUM за ${usdtNeeded.toFixed(2)} USDT?`)) return;
        usdt -= usdtNeeded;
        srum += amount;
        updateUI();
        saveAll();
        if (typeof saveUserData === 'function' && userId) { saveUserData(userId, { usdt, srum }).catch(() => {}); }
        modal.remove();
        alert(`✅ Добыто ${amount} SRUM! Теперь можешь начать майнинг.`);
    });

    // Отмена
    document.getElementById('cancel-buy-srum').addEventListener('click', () => {
        modal.remove();
        if (pendingMining) {
            if (pendingMining.currency === 'SRUM') srum += pendingMining.threshold;
            else rum += pendingMining.threshold;
            pendingMining = null;
            updateUI();
        }
    });
}

// --- Модалка обычного майнинга ---
function showMiningModal() {
    document.querySelectorAll('.quick-duel-modal').forEach(m => m.remove());

    const modal = document.createElement('div');
    modal.className = 'quick-duel-modal';
    const poolAmount = (10000 + Math.random() * 190000).toFixed(0);
    const activePlayers = Math.floor(10 + Math.random() * 290);
    modal.innerHTML = `
        <div class="quick-duel-box" style="border: none; background: transparent; padding: 0;">
            <div class="pool-cloud">
                <h2>⛏️ Криптобеспредел</h2>
                <div class="pool-amount">💎 ${poolAmount} USDT</div>
                <div class="pool-players">🖥️ <span>${activePlayers}</span> майнеров в пуле</div>
                <div class="pool-stage">Твой этап: <b>${miningStage}</b></div>
                <select id="mining-currency" style="width:100%;padding:12px;margin-top:15px;border-radius:10px;border:none;font-size:1rem;background:rgba(255,255,255,0.15);color:white;">
                    <option value="SRUM" ${miningCurrency==='SRUM'?'selected':''}>SRUM (USDT)</option>
                    <option value="RUM" ${miningCurrency==='RUM'?'selected':''}>RUM</option>
                </select>
                <input type="range" min="0.1" max="5" step="0.1" value="${miningThreshold}" id="threshold-slider" style="width:100%;margin-top:10px;">
                <p style="color:#ccc;margin-top:5px;">Взнос: <strong id="mining-stake">${miningThreshold.toFixed(1)}</strong> ${miningCurrency}</p>
                <p style="color:#ff6666;" id="penalty-text">Штраф: ${(miningThreshold * getPenaltyPercent()).toFixed(2)} SRUM</p>
                <p style="color:#66ff66;" id="reward-text">Награда: ${(miningThreshold * getRewardPercent()).toFixed(2)} USDT</p>
                <button class="btn-mining-big" id="start-mining-search">🔍 ИСКАТЬ БЛОК</button>
                <button id="cancel-mining" style="background:none;color:white;border:1px solid white;border-radius:10px;padding:10px;margin-top:10px;width:100%;">✖ Отмена</button>
            </div>
        </div>
    `;
    document.getElementById('game-container').appendChild(modal);

    const slider = document.getElementById('threshold-slider');
    slider.addEventListener('input', function () {
        const value = parseFloat(this.value);
        document.getElementById('mining-stake').textContent = value.toFixed(1);
        document.getElementById('penalty-text').textContent = `Штраф: ${(value * getPenaltyPercent()).toFixed(2)} SRUM`;
        document.getElementById('reward-text').textContent = `Награда: ${(value * getRewardPercent()).toFixed(2)} USDT`;
    });

    document.getElementById('start-mining-search').addEventListener('click', () => {
        miningCurrency = document.getElementById('mining-currency').value;
        miningThreshold = parseFloat(slider.value);
        if (miningCurrency === 'SRUM' && srum < miningThreshold) {
            modal.remove();
            showBuySRUMModal();
            return;
        }
        if (miningCurrency === 'RUM' && rum < miningThreshold) return alert('Недостаточно RUM');
        if (miningCurrency === 'SRUM') srum -= miningThreshold;
        else rum -= miningThreshold;
        pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage };
        updateUI(); modal.remove();
        startSearch('mining');
    });

    document.getElementById('cancel-mining').addEventListener('click', () => modal.remove());
}

// --- Турнир ---
function showTournamentModal() {
    document.querySelectorAll('.quick-duel-modal').forEach(m => m.remove());

    const tourModal = document.createElement('div');
    tourModal.className = 'quick-duel-modal';
    const poolAmount = (5000 + Math.random() * 45000).toFixed(0);
    const activePlayers = Math.floor(5 + Math.random() * 95);
    tourModal.innerHTML = `
        <div class="quick-duel-box" style="border: none; background: transparent; padding: 0;">
            <div class="pool-cloud" style="background: radial-gradient(circle at 20% 20%, #8b0000, #4a0000);">
                <h2>🔒 Выжить в тюрьме</h2>
                <div class="pool-amount">💎 ${poolAmount} USDT</div>
                <div class="pool-players">🖥️ <span>${activePlayers}</span> майнеров в турнире</div>
                <div class="pool-stage">Твой этап: <b>${getTournamentStageName(miningStage)}</b></div>
                <input type="range" min="0.1" max="5" step="0.1" value="${miningThreshold}" id="tournament-threshold-slider" style="width:100%;margin-top:10px;">
                <p style="color:#ccc;margin-top:5px;">Взнос: <strong id="tournament-stake">${miningThreshold.toFixed(1)}</strong> SRUM</p>
                <p style="color:#ff6666;" id="tournament-penalty-text">Штраф: ${(miningThreshold * getPenaltyPercent()).toFixed(2)} SRUM</p>
                <p style="color:#66ff66;" id="tournament-reward-text">Награда: ${(miningThreshold * getRewardPercent()).toFixed(2)} USDT</p>
                <button class="btn-mining-big" id="start-tournament-search">🔍 НАЧАТЬ ТУРНИР</button>
                <button id="cancel-tournament" style="background:none;color:white;border:1px solid white;border-radius:10px;padding:10px;margin-top:10px;width:100%;">✖ Отмена</button>
            </div>
        </div>
    `;
    document.getElementById('game-container').appendChild(tourModal);

    const slider = document.getElementById('tournament-threshold-slider');
    slider.addEventListener('input', function () {
        const value = parseFloat(this.value);
        document.getElementById('tournament-stake').textContent = value.toFixed(1);
        document.getElementById('tournament-penalty-text').textContent = `Штраф: ${(value * getPenaltyPercent()).toFixed(2)} SRUM`;
        document.getElementById('tournament-reward-text').textContent = `Награда: ${(value * getRewardPercent()).toFixed(2)} USDT`;
    });

    document.getElementById('start-tournament-search').addEventListener('click', () => {
        miningCurrency = 'SRUM';
        miningThreshold = parseFloat(slider.value);
        if (srum < miningThreshold) { tourModal.remove(); showBuySRUMModal(); return; }
        srum -= miningThreshold;
        pendingMining = { currency: 'SRUM', threshold: miningThreshold, stage: miningStage };
        updateUI(); tourModal.remove();
        startSearch('tournament');
    });

    document.getElementById('cancel-tournament').addEventListener('click', () => tourModal.remove());
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
    cancelBtn.style.cssText = 'margin-top:20px; padding:10px 20px; font-size:1.2rem; background:#B22222; color:white; border:none; border-radius:10px; cursor:pointer;';
    cancelBtn.addEventListener('click', () => {
        cancelled = true;
        overlay.remove();
        if (pendingMining) {
            if (pendingMining.currency === 'SRUM') srum += pendingMining.threshold;
            else rum += pendingMining.threshold;
            pendingMining = null;
            updateUI();
        }
    });
    overlay.appendChild(cancelBtn);

    fetch('https://hngfpdsnjgdpazmortix.supabase.co/functions/v1/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, threshold: miningThreshold, stage: miningStage, currency: miningCurrency })
    }).then(res => res.json()).then(data => {
        if (cancelled) return;
        overlay.remove();
        if (data.found) { currentBot = { name: 'Игрок', speed: 800, botIndex: -1, shouldWin: false }; }
        else {
            let selectedBot = null;
            if (spartansEnabled) selectedBot = selectSpartanBot(miningStage);
            if (selectedBot) { currentBot = { name: selectedBot.name, speed: selectedBot.speed, botIndex: selectedBot.botIndex, shouldWin: selectedBot.shouldWin }; }
            else { let b = defaultBotPool[Math.floor(Math.random() * defaultBotPool.length)]; currentBot = { name: b.name, speed: b.speed, botIndex: -1, shouldWin: false }; }
        }
        const readyDiv = document.createElement('div');
        readyDiv.className = 'countdown-overlay';
        readyDiv.innerHTML = `<div style="text-align:center;"><p>Соперник: <b>${currentBot.name}</b></p><p>Взнос: ${miningThreshold.toFixed(1)} ${miningCurrency}</p>
            <button id="mining-ready-btn" class="start-btn" style="font-size:1.5rem;padding:15px 35px;">⛏️ Готов</button>
            <button id="cancel-ready-btn" style="margin-top:10px; padding:10px 20px; font-size:1rem; background:#B22222; color:white; border:none; border-radius:10px; cursor:pointer;">✖ Отмена</button></div>`;
        document.getElementById('game-container').appendChild(readyDiv);
        document.getElementById('cancel-ready-btn').addEventListener('click', () => { readyDiv.remove(); setTimeout(() => startSearch(mode), 500); });
        document.getElementById('mining-ready-btn').addEventListener('click', () => {
            document.getElementById('mining-ready-btn').disabled = true;
            document.getElementById('mining-ready-btn').textContent = '⏳ Ожидание...';
            setTimeout(() => {
                if (cancelled) return;
                readyDiv.innerHTML = `<div style="text-align:center;"><p>Оба готовы!</p><p id="countdown-number" style="font-size:4rem;">3</p></div>`;
                let count = 3;
                let ci = setInterval(() => { count--; if (count > 0) document.getElementById('countdown-number').textContent = count; else { clearInterval(ci); readyDiv.remove(); startDuel(); } }, 1000);
            }, 1500);
        });
    }).catch(() => { overlay.remove(); let b = defaultBotPool[Math.floor(Math.random() * defaultBotPool.length)]; currentBot = { name: b.name, speed: b.speed, botIndex: -1, shouldWin: false }; });
}

// --- Запуск дуэли ---
function startDuel() {
    duelActive = true; gameActive = false;
    clearInterval(gameTimer); clearInterval(spawnInterval);
    board.removeEventListener('touchstart', handleTouchStart);
    board.removeEventListener('touchmove', preventDefaultMove);
    duelPlayerScore = 0; duelOpponentScore = 0; duelTimeLeft = 20;
    duelScoreboard.classList.remove('hidden'); updateDuelScore(); spawnAll();
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
        if (hole) { const num = [...holes].indexOf(hole); if (num !== -1 && currentVeg[num]) { if (currentVeg[num].type === 'good') { duelPlayerScore++; flyVegToPot(hole, hole.querySelector('.veg').textContent); } else { duelPlayerScore = Math.max(0, duelPlayerScore - 2); } delete currentVeg[num]; hole.innerHTML = ''; updateDuelScore(); } }
        else { duelPlayerScore = Math.max(0, duelPlayerScore - 2); updateDuelScore(); }
    });
}

function updateDuelScore() { duelPlayerScoreEl.textContent = duelPlayerScore; duelOpponentScoreEl.textContent = duelOpponentScore; }

async function endDuel(duelTimerInterval, duelSpawnInterval, duelBotInterval) {
    duelActive = false; clearInterval(duelTimerInterval); clearInterval(duelSpawnInterval); clearInterval(duelBotInterval);
    board.removeEventListener('touchstart', duelTouchHandler); board.removeEventListener('touchmove', preventDefaultMove);
    board.addEventListener('touchstart', handleTouchStart, {passive: false}); board.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
    holes.forEach(h => h.innerHTML = ''); currentVeg = {}; duelScoreboard.classList.add('hidden');
    const win = duelPlayerScore > duelOpponentScore;
    let resultDiv = document.createElement('div'); resultDiv.className = 'result-overlay';
    try {
        const res = await fetch('https://hngfpdsnjgdpazmortix.supabase.co/functions/v1/update-balance', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, type: 'pvp_result', data: { win, threshold: miningThreshold, stage: miningStage, currency: miningCurrency } })
        });
        if (res.ok) { const data = await res.json(); if (miningCurrency === 'SRUM') { srum = data.srum; usdt = data.usdt; miningStage = data.mining_stage; } else { rum = data.rum; }
            if (win) { showCoinFountain(30); resultDiv.innerHTML = `<h2>⛏️ Блок добыт!</h2><p>+${(miningThreshold * getRewardPercent()).toFixed(2)} USDT</p><p>Этап ${miningStage}</p><button id="continue-mining">Продолжить</button><button id="pause-mining">⏸️ Пауза</button>`; }
            else { showPoopFountain(20); let phrase = cheerPhrases[Math.floor(Math.random() * cheerPhrases.length)]; resultDiv.innerHTML = `<h2>💨 Блок упущен</h2><p>${phrase}</p><p>Потеря: ${(miningThreshold * getPenaltyPercent()).toFixed(2)} SRUM</p><p>Этап 1</p><button id="continue-mining">Продолжить</button><button id="pause-mining">⏸️ Пауза</button>`; }
        }
    } catch(e) { console.error(e); }
    if (currentBot.botIndex >= 0) { updateSpartanBot(currentBot.botIndex, !win, miningStage, (miningThreshold * getPenaltyPercent()), (miningThreshold * getRewardPercent())); }
    pendingMining = null; updateUI(); document.getElementById('game-container').appendChild(resultDiv);
    document.getElementById('continue-mining')?.addEventListener('click', ()=>{ resultDiv.remove(); if (miningCurrency === 'SRUM' && srum < miningThreshold) { showBuySRUMModal(); return; } if (miningCurrency === 'SRUM') srum -= miningThreshold; else rum -= miningThreshold; pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage }; startSearch('mining'); });
    document.getElementById('pause-mining')?.addEventListener('click', ()=>{ if (pausedSessions.length >= 7) return alert('Лимит пауз (7)'); pausedSessions.push({ currency: miningCurrency, threshold: miningThreshold, stage: miningStage }); updateUI(); resultDiv.remove(); renderPausedSessions(); });
}

// --- Замороженные сессии ---
function renderPausedSessions() {
    const container = document.getElementById('paused-sessions'); if (!container) return;
    let html = '<h3>❄️ Замороженные сессии</h3>';
    pausedSessions.forEach((s, i) => { html += `<div style="background:#333;padding:5px;margin:5px;border-radius:8px;">${s.currency} порог ${s.threshold} этап ${s.stage} <button data-idx="${i}" class="resume-session">▶️</button><button data-idx="${i}" class="cancel-session">🗑️</button></div>`; });
    container.innerHTML = html;
    document.querySelectorAll('.resume-session').forEach(b => b.addEventListener('click', (e) => { let idx = e.target.dataset.idx; let session = pausedSessions[idx]; if (!session) return; if (session.currency === 'SRUM' && srum < session.threshold) return alert('Недостаточно SRUM'); if (session.currency === 'RUM' && rum < session.threshold) return alert('Недостаточно RUM'); if (session.currency === 'SRUM') srum -= session.threshold; else rum -= session.threshold; miningCurrency = session.currency; miningThreshold = session.threshold; miningStage = session.stage; pausedSessions.splice(idx, 1); updateUI(); renderPausedSessions(); pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage }; startSearch('mining'); switchScreen(null); }));
    document.querySelectorAll('.cancel-session').forEach(b => b.addEventListener('click', (e) => { let idx = e.target.dataset.idx; pausedSessions.splice(idx, 1); updateUI(); renderPausedSessions(); }));
}

function getTournamentStageName(stage) { const names = ['Новичок', 'Бывалый', 'Авторитет', 'Главарь', 'Смотрящий']; return names[stage - 1] || 'Этап ' + stage; }

// ================== АРЕНА (ВКЛАДКИ) ==================
const arenaContent = document.getElementById('arena-content');
const arenaTabs = document.getElementById('arena-tabs');
let currentArenaTab = 'mining';

function renderArena() {
    if (!arenaContent) return;
    let html = '';
    if (currentArenaTab === 'mining') {
        const penalty = (miningThreshold * getPenaltyPercent()).toFixed(2), reward = (miningThreshold * getRewardPercent()).toFixed(2);
        html = `<h2>⛏️ Личный майнинг</h2><p>Порог: <b>${miningThreshold.toFixed(1)} SRUM</b> | Этап: <b>${miningStage}</b></p><p>Штраф: ${penalty} SRUM | Награда: ${reward} USDT</p><input type="range" min="0.1" max="5" step="0.1" value="${miningThreshold}" id="threshold-slider-arena" style="width:90%;"><p>Взнос: <strong id="arena-stake">${miningThreshold.toFixed(1)}</strong> SRUM</p><button class="shop-btn" id="start-mining-btn" ${srum < miningThreshold ? 'disabled' : ''}>⛏️ Искать блок</button>`;
    } else if (currentArenaTab === 'band') { html = renderBandTab(); }
    else if (currentArenaTab === 'tournaments') { html = `<h2>🔒 Выжить в тюрьме</h2><p>Особый турнир с высокими ставками.</p><button class="shop-btn" id="start-tournament-btn">🔍 Начать турнир</button>`; }
    arenaContent.innerHTML = html;
    if (currentArenaTab === 'mining') { const slider = document.getElementById('threshold-slider-arena'); if (slider) slider.addEventListener('input', function() { miningThreshold = parseFloat(this.value); document.getElementById('arena-stake').textContent = miningThreshold.toFixed(1); }); document.getElementById('start-mining-btn')?.addEventListener('click', ()=>{ if (srum < miningThreshold) { showBuySRUMModal(); return; } srum -= miningThreshold; miningCurrency = 'SRUM'; pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage }; document.querySelector('#arena-screen').classList.remove('active'); showMainElements(); startSearch('mining'); }); }
    if (currentArenaTab === 'tournaments') { document.getElementById('start-tournament-btn')?.addEventListener('click', () => showTournamentModal()); }
    renderPausedSessions();
}

// ================== БАНДА ==================
function renderBandTab() {
    if (!bandData) { return `<div style="text-align:center;"><h2>🐺 Командный майнинг</h2><div class="info-card"><p>Собери банду из 5 бойцов!</p><p>💰 Взнос: ${miningThreshold.toFixed(1)} SRUM × 5 = ${(miningThreshold*5).toFixed(1)} SRUM</p><p>🏆 Приз: ${(miningThreshold*4).toFixed(1)} USDT</p></div><button class="shop-btn" id="create-band-btn">🐺 Создать банду</button><button class="shop-btn" id="invite-band-btn" style="background:linear-gradient(180deg,#8e44ad,#6c3483);">👥 Пригласить</button></div>`; }
    else { let fightersHtml = ''; bandData.fighters.forEach((f,i) => { fightersHtml += `<div style="background:rgba(255,255,255,0.05); padding:8px; margin:4px 0; border-radius:6px;">${i===0?'👑':'⚔️'} ${f}</div>`; }); return `<div style="text-align:center;"><h2>🐺 ${bandData.name}</h2><p>Порог: <b>${bandData.threshold.toFixed(1)} SRUM</b> × ${bandData.fighters.length}</p><div style="max-height:200px; overflow-y:auto; margin:10px 0;">${fightersHtml}</div><button class="shop-btn" id="start-band-match" ${bandData.fighters.length<5?'disabled':''}>⚔️ В бой!</button><button class="shop-btn" id="invite-band-btn" style="background:linear-gradient(180deg,#8e44ad,#6c3483);">👥 Пригласить</button><button class="shop-btn" id="leave-band-btn" style="background:linear-gradient(180deg,#e74c3c,#c0392b);">🚪 Покинуть</button><button class="shop-btn" id="disband-btn" style="background:linear-gradient(180deg,#95a5a6,#7f8c8d);">🗑️ Распустить</button></div>`; }
}

arenaContent.addEventListener('click', function(e) {
    const target = e.target;
    if (target.id === 'create-band-btn') { const name = prompt('Название банды:'); if (!name) return; bandData = { name, threshold: miningThreshold, fighters: [userNickname||'Ты'], boss: userId }; alert(`Банда "${name}" создана!`); renderArena(); }
    if (target.id === 'invite-band-btn') { if (!bandData) return; const choice = prompt('Пригласить:\n1. По никнейму\n2. Из клуба\n3. Из рефералов'); if (!choice) return; if (choice==='2'){ if(!myClubId)return alert('Вы не в клубе'); const club=clubs.find(c=>c.id==myClubId); const members=club?.members?.filter(m=>m!==userNickname&&!bandData.fighters.includes(m))||[]; if(!members.length)return alert('Некого'); const name=prompt(`Кого?\n${members.join(', ')}`); if(name&&members.includes(name)){bandData.fighters.push(name);alert(`${name} в банде!`);renderArena();}} else if(choice==='3'){const refs=referrals.filter(r=>!bandData.fighters.includes(r.code)); if(!refs.length)return alert('Некого'); const name=prompt(`Кого?\n${refs.map(r=>r.code).join(', ')}`); if(name&&refs.find(r=>r.code===name)){bandData.fighters.push(name);alert(`${name} в банде!`);renderArena();}} else {if(bandData.fighters.includes(choice))return alert('Уже в банде'); bandData.fighters.push(choice);alert(`${choice} в банде!`);renderArena();} }
    if (target.id === 'start-band-match') { if(!bandData||bandData.fighters.length<5)return alert('Нужно 5 бойцов'); const totalStake=bandData.threshold*bandData.fighters.length; if(srum<totalStake)return alert(`Недостаточно SRUM (нужно ${totalStake.toFixed(1)})`); if(!confirm(`Взнос ${totalStake.toFixed(1)} SRUM. Начать бой?`))return; srum-=totalStake; updateUI(); const overlay=document.createElement('div'); overlay.className='countdown-overlay'; overlay.innerHTML='<div style="text-align:center;"><h2>⚔️ Битва банд!</h2><p>Идёт сражение...</p></div>'; document.getElementById('game-container').appendChild(overlay); setTimeout(()=>{overlay.remove(); const win=Math.random()>0.4; const resultDiv=document.createElement('div'); resultDiv.className='result-overlay'; if(win){const reward=bandData.threshold*4; usdt+=reward; resultDiv.innerHTML=`<h2>🏆 Победа!</h2><p>+${reward.toFixed(2)} USDT</p><button id="close-band-result">ОК</button>`;}else{resultDiv.innerHTML=`<h2>💔 Поражение</h2><p>Взнос потерян.</p><button id="close-band-result">ОК</button>`;} document.getElementById('game-container').appendChild(resultDiv); document.getElementById('close-band-result').addEventListener('click',()=>{resultDiv.remove();bandData=null;updateUI();renderArena();});},3000); }
    if (target.id === 'leave-band-btn') { if(!bandData)return; bandData.fighters=bandData.fighters.filter(f=>f!==userNickname&&f!=='Ты'); if(bandData.fighters.length===0){bandData=null;alert('Банда распущена.');}else alert('Вы покинули банду.'); renderArena(); }
    if (target.id === 'disband-btn') { if(!bandData)return; if(confirm('Распустить?')){bandData=null;renderArena();} }
});

arenaTabs.querySelectorAll('button').forEach(btn => { btn.addEventListener('click', () => { arenaTabs.querySelectorAll('button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentArenaTab = btn.dataset.tab; renderArena(); }); });
