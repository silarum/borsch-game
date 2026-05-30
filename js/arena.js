
// ================== АРЕНА (МАЙНИНГ, БАНДА, ЗАМОРОЗКА СЕССИЙ) ==================
const botPool = [
    { name: 'ТокенМастер', speed: 1000 },
    { name: 'Борщехлёб', speed: 850 },
    { name: 'CryptoWhale', speed: 700 },
    { name: 'Майнер69', speed: 600 },
    { name: 'Лампа', speed: 500 }
];
const cheerPhrases = [
    "Не расстраивайся, майнер! Следующий блок будет твоим! 💪",
    "Даже после промаха можно взять реванш. Вперёд!",
    "Ошибка – это просто шаг к будущей победе!",
    "Кто не рискует, тот не пьёт шампанское… или не добывает блок! 😉",
    "Не сегодня, так завтра. Главное – не останавливаться!",
    "Ты стал сильнее! Продолжай майнинг! 💎",
    "Фартуна улыбнётся тебе, просто дай ей шанс.",
    "Помни: даже лучшие майнеры иногда теряют блоки.",
    "Не сдавайся! Твой звёздный час близок. 🚀",
    "В следующий раз обязательно повезёт!",
    "Это всего лишь одна попытка. Впереди ещё много!",
    "Упорство и труд всё перетрут. И майнинг тоже.",
    "Неудачи закаляют характер. Ты уже крут!",
    "Каждая ошибка – это инвестиция в опыт.",
    "Взбодрись! Следующий блок точно найдёшь!",
    "Даже проигрыш приносит ценный опыт. Не унывай!",
    "Ты на верном пути. Продолжай добывать!",
    "Фортуна переменчива, но ты сильнее!",
    "Майнеры не сдаются! Вперёд за новым блоком!",
    "Не вешай нос, дружище! Всё только начинается!",
    "Это всего лишь временная неудача. Ты справишься!",
    "В мире крипты за падением всегда следует рост.",
    "Просто не повезло. Попробуй ещё раз!",
    "Удача любит настойчивых. Ты обязательно добьёшься своего!",
    "Ты уже на полпути к победе!",
    "Не опускай руки! Блок ждёт тебя.",
    "Сегодня не твой день, но завтра будет лучше!",
    "Даже маленький штраф – это урок. Продолжай!",
    "Ошибки делают нас мудрее. Ты стал мудрее!",
    "Следующая попытка будет удачной. Мы верим в тебя!",
    "Никогда не сдавайся! Майнинг – это марафон.",
    "Ты проиграл битву, но не войну. Продолжай!",
    "Поверь в себя, и блок найдётся!"
];

function getPenaltyPercent() { return [0.1,0.2,0.4,0.8,1.0][miningStage-1]; }
function getRewardPercent() { return getPenaltyPercent() * 0.7; }

// Быстрая дуэль (монетка)
quickDuelCoin.addEventListener('click', () => {
    if (duelActive || gameActive || pendingMining) return;
    showMiningModal();
});

function showMiningModal() {
    const penalty = (miningThreshold * getPenaltyPercent()).toFixed(2);
    const reward = (miningThreshold * getRewardPercent()).toFixed(2);
    const modal = document.createElement('div');
    modal.className = 'quick-duel-modal';
    modal.innerHTML = `
        <div class="quick-duel-box">
            <h2>⛏️ Игровой майнинг</h2>
            <p>Этап: <b>${miningStage}</b> | Порог: <b>${miningThreshold.toFixed(1)}</b> SRUM</p>
            <select id="mining-currency"><option value="SRUM" ${miningCurrency==='SRUM'?'selected':''}>SRUM (USDT)</option><option value="RUM" ${miningCurrency==='RUM'?'selected':''}>RUM</option></select>
            <input type="range" min="0.1" max="5" step="0.1" value="${miningThreshold}" id="threshold-slider" style="width:90%;">
            <p>Взнос: <strong id="mining-stake">${miningThreshold.toFixed(1)}</strong> ${miningCurrency}</p>
            <p>Штраф: ${penalty} SRUM | Награда: ${reward} USDT</p>
            <button id="start-mining-search">🔍 Искать блок</button>
            <button id="cancel-mining">✖ Отмена</button>
        </div>
    `;
    document.getElementById('game-container').appendChild(modal);
    document.getElementById('start-mining-search').addEventListener('click', () => {
        miningCurrency = document.getElementById('mining-currency').value;
        miningThreshold = parseFloat(document.getElementById('threshold-slider').value);
        if (miningCurrency === 'SRUM' && srum < miningThreshold) return alert('Недостаточно SRUM');
        if (miningCurrency === 'RUM' && rum < miningThreshold) return alert('Недостаточно RUM');
        if (miningCurrency === 'SRUM') srum -= miningThreshold;
        else rum -= miningThreshold;
        pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage };
        updateUI(); modal.remove();
        startSearch();
    });
    document.getElementById('cancel-mining').addEventListener('click', () => modal.remove());
    document.getElementById('threshold-slider').addEventListener('input', function() {
        document.getElementById('mining-stake').textContent = parseFloat(this.value).toFixed(1);
    });
}

function startSearch() {
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    overlay.innerHTML = '<div style="font-size:1.8rem;">🔍 Поиск блока...</div>';
    document.getElementById('game-container').appendChild(overlay);
    setTimeout(() => {
        overlay.remove();
        currentBot = botPool[Math.floor(Math.random() * botPool.length)];
        const readyDiv = document.createElement('div');
        readyDiv.className = 'countdown-overlay';
        readyDiv.innerHTML = `<div style="text-align:center;">
            <p>Другой майнер: <b>${currentBot.name}</b></p>
            <p>Взнос: ${miningThreshold.toFixed(1)} ${miningCurrency}</p>
            <button id="mining-ready-btn" class="start-btn" style="font-size:1.5rem;padding:15px 35px;">⛏️ Готов</button>
        </div>`;
        document.getElementById('game-container').appendChild(readyDiv);
        document.getElementById('mining-ready-btn').addEventListener('click', () => {
            document.getElementById('mining-ready-btn').disabled = true;
            document.getElementById('mining-ready-btn').textContent = '⏳ Ожидание...';
            setTimeout(() => {
                readyDiv.innerHTML = `<div style="text-align:center;">
                    <p>Оба майнера готовы!</p>
                    <p id="countdown-number" style="font-size:4rem;">3</p>
                </div>`;
                let count = 3;
                let countInterval = setInterval(() => {
                    count--;
                    if (count > 0) document.getElementById('countdown-number').textContent = count;
                    else { clearInterval(countInterval); readyDiv.remove(); startDuel(); }
                }, 1000);
            }, 1500);
        });
    }, 2500);
}

function startDuel() {
    duelActive = true;
    gameActive = false;
    clearInterval(gameTimer); clearInterval(spawnInterval);
    board.removeEventListener('touchstart', handleTouchStart);
    board.removeEventListener('touchmove', preventDefaultMove);
    duelPlayerScore = 0; duelOpponentScore = 0;
    duelTimeLeft = 20;
    duelScoreboard.classList.remove('hidden');
    updateDuelScore();
    spawnAll();
    let duelSpawnInterval = setInterval(() => { if (duelActive) spawnAll(); }, 1500);
    let duelBotInterval = setInterval(() => { if (duelActive) { duelOpponentScore++; updateDuelScore(); } }, currentBot.speed);
    let duelTimerInterval = setInterval(() => {
        if (!duelActive) return;
        duelTimeLeft--;
        duelTimerEl.textContent = duelTimeLeft;
        if (duelTimeLeft <= 0) endDuel(duelTimerInterval, duelSpawnInterval, duelBotInterval);
    }, 1000);
    board.addEventListener('touchstart', duelTouchHandler, {passive: false});
    board.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
}

function duelTouchHandler(e) {
    e.preventDefault();
    if (!duelActive) return;
    [...e.changedTouches].forEach(touch => {
        const hole = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.hole');
        if (hole) {
            const num = [...holes].indexOf(hole);
            if (num !== -1 && currentVeg[num]) {
                const isGood = currentVeg[num].type === 'good';
                if (isGood) { duelPlayerScore++; flyVegToPot(hole, hole.querySelector('.veg').textContent); }
                else { duelPlayerScore = Math.max(0, duelPlayerScore - 2); }
                delete currentVeg[num]; hole.innerHTML = ''; updateDuelScore();
            }
        } else { duelPlayerScore = Math.max(0, duelPlayerScore - 2); updateDuelScore(); }
    });
}

function updateDuelScore() { duelPlayerScoreEl.textContent = duelPlayerScore; duelOpponentScoreEl.textContent = duelOpponentScore; }

function endDuel(duelTimerInterval, duelSpawnInterval, duelBotInterval) {
    duelActive = false;
    clearInterval(duelTimerInterval); clearInterval(duelSpawnInterval); clearInterval(duelBotInterval);
    board.removeEventListener('touchstart', duelTouchHandler);
    board.removeEventListener('touchmove', preventDefaultMove);
    board.addEventListener('touchstart', handleTouchStart, {passive: false});
    board.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
    holes.forEach(h => h.innerHTML = ''); currentVeg = {};
    duelScoreboard.classList.add('hidden');
    if (pendingMining) {
        if (miningCurrency === 'SRUM') srum += pendingMining.threshold;
        else rum += pendingMining.threshold;
    }
    pendingMining = null;
    updateUI();

    const win = duelPlayerScore > duelOpponentScore;
    let resultDiv = document.createElement('div'); resultDiv.className = 'result-overlay';
    if (miningCurrency === 'SRUM') {
        if (win) {
            let reward = miningThreshold * getRewardPercent();
            usdt += reward;
            if (miningStage < 5) miningStage++;
            localStorage.setItem('miningStage', miningStage);
            showCoinFountain(30);
            resultDiv.innerHTML = `<h2>⛏️ Блок добыт!</h2><p>+${reward.toFixed(2)} USDT</p><p>Этап ${miningStage}</p>
                <button id="continue-mining">Продолжить майнинг</button>
                <button id="pause-mining">⏸️ Пауза</button>`;
        } else {
            let penalty = miningThreshold * getPenaltyPercent();
            srum = Math.max(0, srum - penalty);
            miningStage = 1;
            localStorage.setItem('miningStage', 1);
            showPoopFountain(20);
            let phrase = cheerPhrases[Math.floor(Math.random() * cheerPhrases.length)];
            resultDiv.innerHTML = `<h2>💨 Блок упущен</h2><p>${phrase}</p><p>Потеря мощности: ${penalty.toFixed(2)} SRUM</p><p>Этап сброшен до 1</p>
                <button id="continue-mining">Продолжить</button>
                <button id="pause-mining">⏸️ Пауза</button>`;
        }
    } else {
        rum += miningThreshold;
        if (win) { let rewardRUM = Math.floor(miningThreshold * getRewardPercent()); rum += rewardRUM; showCoinFountain(15); resultDiv.innerHTML = `<h2>⛏️ Блок добыт!</h2><p>+${rewardRUM} RUM</p><button id="continue-mining">Продолжить</button><button id="pause-mining">⏸️ Пауза</button>`; }
        else { rum = Math.max(0, rum - 20); showPoopFountain(10); resultDiv.innerHTML = `<h2>💨 Блок упущен</h2><p>-20 RUM</p><button id="continue-mining">Продолжить</button><button id="pause-mining">⏸️ Пауза</button>`; }
    }
    document.getElementById('game-container').appendChild(resultDiv);
    document.getElementById('continue-mining')?.addEventListener('click', ()=>{
        resultDiv.remove();
        if (miningCurrency === 'SRUM' && srum < miningThreshold) return alert('Недостаточно SRUM для продолжения');
        if (miningCurrency === 'SRUM') srum -= miningThreshold;
        else rum -= miningThreshold;
        pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage };
        startSearch();
    });
    document.getElementById('pause-mining')?.addEventListener('click', ()=>{
        if (pausedSessions.length >= 7) return alert('Достигнут лимит замороженных сессий (7)');
        pausedSessions.push({ currency: miningCurrency, threshold: miningThreshold, stage: miningStage });
        if (miningCurrency === 'SRUM') srum += miningThreshold;
        else rum += miningThreshold;
        updateUI();
        resultDiv.remove();
        renderPausedSessions();
    });
    updateUI();
}

function renderPausedSessions() {
    const container = document.getElementById('paused-sessions');
    if (!container) return;
    let html = '<h3>❄️ Замороженные сессии</h3>';
    pausedSessions.forEach((s, i) => {
        html += `<div style="background:#333;padding:5px;margin:5px;border-radius:8px;">
            ${s.currency} порог ${s.threshold} этап ${s.stage}
            <button data-idx="${i}" class="resume-session">▶️</button>
            <button data-idx="${i}" class="cancel-session">🗑️</button>
        </div>`;
    });
    container.innerHTML = html;
    document.querySelectorAll('.resume-session').forEach(b => b.addEventListener('click', (e) => {
        let idx = e.target.dataset.idx;
        let session = pausedSessions[idx];
        if (!session) return;
        if (session.currency === 'SRUM' && srum < session.threshold) return alert('Недостаточно SRUM');
        if (session.currency === 'RUM' && rum < session.threshold) return alert('Недостаточно RUM');
        if (session.currency === 'SRUM') srum -= session.threshold;
        else rum -= session.threshold;
        miningCurrency = session.currency;
        miningThreshold = session.threshold;
        miningStage = session.stage;
        pausedSessions.splice(idx, 1);
        updateUI();
        renderPausedSessions();
        pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage };
        startSearch();
        switchScreen(null);
    }));
    document.querySelectorAll('.cancel-session').forEach(b => b.addEventListener('click', (e) => {
        let idx = e.target.dataset.idx;
        pausedSessions.splice(idx, 1);
        updateUI();
        renderPausedSessions();
    }));
}

// Арена (вкладки)
const arenaContent = document.getElementById('arena-content');
const arenaTabs = document.getElementById('arena-tabs');
let currentArenaTab = 'mining';
function renderArena() {
    if (!arenaContent) return;
    let html = '';
    if (currentArenaTab === 'mining') {
        const penalty = (miningThreshold * getPenaltyPercent()).toFixed(2);
        const reward = (miningThreshold * getRewardPercent()).toFixed(2);
        html = `<h2>⛏️ Личный майнинг</h2><p>Порог: <b>${miningThreshold.toFixed(1)} SRUM</b> | Этап: <b>${miningStage}</b></p><p>Штраф: ${penalty} SRUM | Награда: ${reward} USDT</p><input type="range" min="0.1" max="5" step="0.1" value="${miningThreshold}" id="threshold-slider-arena" style="width:90%;"><p>Взнос: <strong id="arena-stake">${miningThreshold.toFixed(1)}</strong> SRUM</p><button class="shop-btn" id="start-mining-btn" ${srum < miningThreshold ? 'disabled' : ''}>⛏️ Искать блок</button>`;
    } else if (currentArenaTab === 'band') {
        html = `<h2>🐺 Командный майнинг</h2>`;
        if (!bandData) {
            html += `<button class="shop-btn" id="create-band-btn">Создать банду</button>`;
        } else {
            html += `<h3>${bandData.name}</h3><p>Порог: ${bandData.threshold.toFixed(1)} SRUM</p><p>Бойцы:</p>`;
            bandData.fighters.forEach(f => { html += `<div class="band-member">${f}</div>`; });
            html += `<button class="shop-btn" id="start-band-match">⚔️ В бой</button><button class="shop-btn" id="disband-btn">Распустить</button>`;
        }
    } else if (currentArenaTab === 'tournaments') html = `<h2>🏆 Турниры</h2><p>В разработке</p>`;
    arenaContent.innerHTML = html;
    if (currentArenaTab === 'mining' && document.getElementById('threshold-slider-arena')) {
        document.getElementById('threshold-slider-arena').addEventListener('input', function() {
            miningThreshold = parseFloat(this.value);
            document.getElementById('arena-stake').textContent = miningThreshold.toFixed(1);
            renderArena();
        });
        document.getElementById('start-mining-btn')?.addEventListener('click', ()=>{
            if (srum < miningThreshold) return alert('Недостаточно SRUM');
            srum -= miningThreshold; miningCurrency = 'SRUM';
            pendingMining = { currency: miningCurrency, threshold: miningThreshold, stage: miningStage };
            arenaContent.innerHTML = '<h2>🔍 Поиск блока...</h2><p id="search-counter">5 сек</p>';
            let sec = 5;
            let st = setInterval(() => {
                sec--;
                if (sec <= 0) {
                    clearInterval(st);
                    currentBot = botPool[Math.floor(Math.random() * botPool.length)];
                    arenaContent.innerHTML = `<h2>⚡ Блок найден</h2><p>Майнер: <b>${currentBot.name}</b></p><button class="start-btn" id="mining-ready-arena" style="font-size:1.5rem;padding:15px 35px;">⛏️ Готов</button>`;
                    document.getElementById('mining-ready-arena').addEventListener('click', ()=>{
                        document.getElementById('mining-ready-arena').disabled = true;
                        document.getElementById('mining-ready-arena').textContent = '⏳ Ожидание...';
                        setTimeout(() => {
                            document.querySelector('#arena-screen').classList.remove('active');
                            showViewSwitch();
                            startDuel();
                        }, 1000);
                    });
                } else document.getElementById('search-counter').textContent = sec + ' сек';
            }, 1000);
        });
    }
    if (currentArenaTab === 'band') {
        document.getElementById('create-band-btn')?.addEventListener('click', ()=>{
            let name = prompt('Название банды');
            if (!name) return;
            bandData = { name, threshold: miningThreshold, fighters: ['Ты (босс)'], boss: 'Ты' };
            for (let i=0; i<4; i++) bandData.fighters.push(`Боец_${i+1}`);
            renderArena();
        });
        document.getElementById('disband-btn')?.addEventListener('click', ()=>{
            bandData = null;
            renderArena();
        });
        document.getElementById('start-band-match')?.addEventListener('click', ()=>{
            if (!bandData || bandData.fighters.length < 5) return alert('Нужно 5 бойцов');
            if (srum < bandData.threshold * 5) return alert('Недостаточно SRUM для взноса');
            srum -= bandData.threshold * 5;
            alert('Матч начался! (заглушка)');
            let win = Math.random() > 0.5;
            if (win) {
                usdt += bandData.threshold * 4;
                alert(`Победа банды! +${(bandData.threshold*4).toFixed(2)} USDT`);
            } else {
                alert('Поражение банды. Взнос потерян.');
            }
            bandData = null;
            updateUI();
            renderArena();
        });
    }
    renderPausedSessions();
}
arenaTabs.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
        arenaTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); currentArenaTab = btn.dataset.tab; renderArena();
    });
});
