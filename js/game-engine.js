// ================== ТАПАЛКА И ФОНЫ ==================

// Фонтан монеток — летят вверх из кастрюли
function showCoinFountain(count = 15) {
    const pot = document.getElementById('pot');
    if (!pot) return;
    const potRect = pot.getBoundingClientRect();
    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    const cx = potRect.left + potRect.width / 2 - containerRect.left;
    const cy = potRect.top - containerRect.top;
    for (let i = 0; i < count; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin-fountain';
        const coinTypes = ['💰', '🪙', '💎', '✨', '🪙'];
        coin.textContent = coinTypes[Math.floor(Math.random() * coinTypes.length)];
        coin.style.left = (cx + (Math.random() - 0.5) * 120) + 'px';
        coin.style.top = cy + 'px';
        coin.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
        coin.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
        coin.style.animationDelay = (Math.random() * 0.3) + 's';
        container.appendChild(coin);
        coin.addEventListener('animationend', () => coin.remove());
    }
}

// Фонтан какашек — падают вниз из кастрюли
function showPoopFountain(count = 8) {
    const pot = document.getElementById('pot');
    if (!pot) return;
    const potRect = pot.getBoundingClientRect();
    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    const cx = potRect.left + potRect.width / 2 - containerRect.left;
    const cy = potRect.top + potRect.height / 2 - containerRect.top;
    for (let i = 0; i < count; i++) {
        const poop = document.createElement('div');
        poop.className = 'poop-fountain';
        const poopTypes = ['💩', '🪱', '💨', '😤'];
        poop.textContent = poopTypes[Math.floor(Math.random() * poopTypes.length)];
        poop.style.left = (cx + (Math.random() - 0.5) * 100) + 'px';
        poop.style.top = cy + 'px';
        poop.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
        poop.style.animationDuration = (0.6 + Math.random() * 0.6) + 's';
        poop.style.animationDelay = (Math.random() * 0.2) + 's';
        container.appendChild(poop);
        poop.addEventListener('animationend', () => poop.remove());
    }
}

// Пути к изображениям криптоовощей
const goodImages = [
    'assets/veggies/bitcabbage.png',
    'assets/veggies/etheronion.png',
    'assets/veggies/tatercoin.png',
    'assets/veggies/carrotcash.png',
    'assets/veggies/pepperpay.png',
    'assets/veggies/greengas.png',
    'assets/veggies/beanbit.png',
    'assets/veggies/garlicgold.png',
    'assets/veggies/tomotoken.png'
];
const badImages = [
    'assets/veggies/shitcoin.png',
    'assets/veggies/scamworm.png',
    'assets/veggies/rugcheese.png',
    'assets/veggies/deadflower.png',
    'assets/veggies/fungustoken.png'
];

function spawnAll() {
    const holes = document.querySelectorAll('.hole');
    if (!holes.length) return;
    holes.forEach(h => h.innerHTML = '');
    window.currentVeg = {};
    for (let i = 0; i < holes.length; i++) {
        const isBad = Math.random() < 0.25;
        const pool = isBad ? badImages : goodImages;
        const imgSrc = pool[Math.floor(Math.random() * pool.length)];
        holes[i].innerHTML = `<img src="${imgSrc}" class="veg${isBad ? ' rotten' : ''}" style="width:100%;height:100%;object-fit:contain;">`;
        window.currentVeg[i] = { type: isBad ? 'bad' : 'good' };
    }
}

function processHit(hole, touch) {
    if (!window.gameActive) return;
    const holes = document.querySelectorAll('.hole');
    const num = [...holes].indexOf(hole);
    if (num === -1 || !window.currentVeg || !window.currentVeg[num]) {
        window.rum = Math.max(0, (window.rum || 0) - 20);
        window.streak = 0;
        showPoopFountain();
        if (typeof updateUI === 'function') updateUI();
        return;
    }
    if (window.currentVeg[num].type === 'good') {
        window.streak = (window.streak || 0) + 1;
        let multiplier = Math.pow(2, Math.floor(((window.streak || 1) - 1) / 10));
        let gain = 10 * multiplier;
        if (window.activeBoost && window.activeBoost.endTime > Date.now()) gain *= window.activeBoost.type;
        window.rum = (window.rum || 0) + Math.floor(gain);
        flyVegToPot(hole, hole.querySelector('.veg').src);
        showCoinFountain();
        if (window.streak % 20 === 0) triggerRocket();
    } else {
        window.rum = Math.max(0, (window.rum || 0) - 20);
        window.streak = 0;
        showPoopFountain();
    }
    delete window.currentVeg[num];
    hole.innerHTML = '';
    if (typeof updateUI === 'function') updateUI();
}

function handleTouchStart(e) {
    e.preventDefault();
    if (!window.gameActive) return;
    [...e.changedTouches].forEach(touch => {
        const hole = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.hole');
        if (hole) processHit(hole, touch);
        else {
            window.rum = Math.max(0, (window.rum || 0) - 20);
            window.streak = 0;
            showPoopFountain();
            if (typeof updateUI === 'function') updateUI();
        }
    });
}

function flyVegToPot(hole, imgSrc) {
    const pot = document.getElementById('pot');
    if (!pot || !hole || !imgSrc) return;
    const holeRect = hole.getBoundingClientRect();
    const potRect = pot.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const vegEl = document.createElement('img');
    vegEl.className = 'flying-veg';
    vegEl.src = imgSrc;
    vegEl.style.width = '40px';
    vegEl.style.height = '40px';
    vegEl.style.left = (holeRect.left + holeRect.width / 2 - containerRect.left) + 'px';
    vegEl.style.top = (holeRect.top + holeRect.height / 2 - containerRect.top) + 'px';
    vegEl.style.setProperty('--dx', (potRect.left + potRect.width / 2 - containerRect.left - parseFloat(vegEl.style.left)) / 2 + 'px');
    vegEl.style.setProperty('--dy', '-60px');
    vegEl.style.setProperty('--ex', (potRect.left + potRect.width / 2 - containerRect.left - parseFloat(vegEl.style.left)) + 'px');
    vegEl.style.setProperty('--ey', (potRect.top - containerRect.top + 5 - parseFloat(vegEl.style.top)) + 'px');
    document.getElementById('game-container').appendChild(vegEl);
    vegEl.addEventListener('animationend', () => vegEl.remove());
}

function triggerRocket() {
    const pot = document.getElementById('pot');
    if (!pot) return;
    const potRect = pot.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const startX = potRect.left + potRect.width / 2 - containerRect.left;
    const startY = potRect.top + potRect.height / 2 - containerRect.top;
    const rocket = document.createElement('div');
    rocket.className = 'rocket';
    rocket.textContent = '🚀';
    rocket.style.left = startX + 'px';
    rocket.style.top = startY + 'px';
    document.getElementById('game-container').appendChild(rocket);
    rocket.addEventListener('animationend', () => {
        rocket.remove();
        for (let i = 0; i < 15; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark';
            const sparkEmojis = ['✨', '💫', '🌟', '⭐', '💥'];
            spark.textContent = sparkEmojis[Math.floor(Math.random() * sparkEmojis.length)];
            spark.style.left = startX + 'px';
            spark.style.top = startY + 'px';
            spark.style.setProperty('--sx', (Math.random() - 0.5) * 200 + 'px');
            spark.style.setProperty('--sy', (Math.random() - 0.5) * 200 + 'px');
            spark.style.fontSize = (1 + Math.random() * 2) + 'rem';
            spark.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
            document.getElementById('game-container').appendChild(spark);
            spark.addEventListener('animationend', () => spark.remove());
        }
    });
}

function startGame() {
    if ((window.games || 0) <= 0 || window.gameActive) return;
    window._rumBeforeGame = window.rum || 0;
    window.gameActive = true;
    window.gameTimeLeft = 60;
    window.streak = 0;
    if (typeof updateUI === 'function') updateUI();
    spawnAll();
    let interval = 1800;
    window.spawnInterval = setInterval(() => {
        if (!window.gameActive) return;
        spawnAll();
        interval = Math.max(450, interval - 80);
        clearInterval(window.spawnInterval);
        window.spawnInterval = setInterval(() => { if (window.gameActive) spawnAll(); }, interval);
    }, interval);
    window.gameTimer = setInterval(() => {
        window.gameTimeLeft--;
        if (typeof updateUI === 'function') updateUI();
        if (window.gameTimeLeft <= 0) endGame();
    }, 1000);
}

async function endGame() {
    window.gameActive = false;
    clearInterval(window.gameTimer);
    clearInterval(window.spawnInterval);
    document.querySelectorAll('.hole').forEach(h => h.innerHTML = '');
    window.currentVeg = {};
    window.games = Math.max(0, (window.games || 0) - 1);
    window.lastGameTime = Date.now();

    try {
        const res = await fetch('https://hngfpdsnjgdpazmortix.supabase.co/functions/v1/update-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: window.userId,
                type: 'rum_mining',
                data: {
                    rum_earned: (window.rum || 0) - (window._rumBeforeGame || 0),
                    games_used: window.games,
                    streak: window.streak
                }
            })
        });
        if (res.ok) {
            const data = await res.json();
            window.rum = data.rum;
        }
    } catch (e) {
        console.error('Ошибка синхронизации RUM:', e);
    }

    if (typeof updateUI === 'function') updateUI();
    if ((window.games || 0) < maxGames) startRecovery();
}

function startRecovery() {
    if (window.recoveryInterval) clearInterval(window.recoveryInterval);
    window.recoveryInterval = setInterval(() => {
        if ((window.games || 0) >= maxGames) { clearInterval(window.recoveryInterval); return; }
        if (Date.now() - (window.lastGameTime || 0) >= gameRecoveryTime * 1000) {
            window.games = Math.min(maxGames, (window.games || 0) + 1);
            window.lastGameTime = Date.now();
            if (typeof updateUI === 'function') updateUI();
            if ((window.games || 0) >= maxGames) clearInterval(window.recoveryInterval);
        }
    }, 1000);
}

// ================== ФОНЫ ==================
const views = ['veggie', 'smile', 'matrix'];
let currentViewIndex = 0;
window.cycleView = function() {
    if (window.smileInterval) { clearInterval(window.smileInterval); window.smileInterval = null; }
    if (window.veggieInterval) { clearInterval(window.veggieInterval); window.veggieInterval = null; }
    currentViewIndex = (currentViewIndex + 1) % views.length;
    const view = views[currentViewIndex];
    document.getElementById('matrix-bg').style.display = view === 'matrix' ? 'block' : 'none';
    document.getElementById('smile-view').style.display = view === 'smile' ? 'block' : 'none';
    document.getElementById('veggie-view').style.display = view === 'veggie' ? 'block' : 'none';
    const btn = document.getElementById('view-switch');
    if (!btn) return;
    if (view === 'veggie') { btn.innerHTML = '🥬 Овощи'; startVeggieAnimation(); }
    else if (view === 'matrix') { btn.innerHTML = '🟢 Матрица'; startMatrix(); }
    else if (view === 'smile') { btn.innerHTML = '😊 Смайлы'; startSmileAnimation(); }
};

const matrixCanvas = document.getElementById('matrixCanvas');
const matrixCtx = matrixCanvas ? matrixCanvas.getContext('2d') : null;
let matrixParticles = [];
function startMatrix() {
    if (!matrixCanvas) return;
    matrixCanvas.width = matrixCanvas.parentElement.clientWidth;
    matrixCanvas.height = matrixCanvas.parentElement.clientHeight;
    matrixParticles = [];
    for (let i = 0; i < 150; i++) matrixParticles.push({ x: Math.random() * matrixCanvas.width, y: Math.random() * matrixCanvas.height, speed: 1 + Math.random() * 2, char: String.fromCharCode(0x30A0 + Math.random() * 96), opacity: Math.random() });
}
function drawMatrix() {
    if (!matrixCtx || views[currentViewIndex] !== 'matrix') return;
    matrixCtx.fillStyle = 'rgba(0,0,0,0.05)'; matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    matrixCtx.fillStyle = '#0F0'; matrixCtx.font = '14px monospace';
    matrixParticles.forEach(p => { matrixCtx.fillText(p.char, p.x, p.y); p.y -= p.speed; if (p.y < -20) { p.y = matrixCanvas.height + 20; p.x = Math.random() * matrixCanvas.width; } });
}
if (matrixCanvas) { startMatrix(); setInterval(drawMatrix, 50); window.addEventListener('resize', startMatrix); }

const smileCanvas = document.getElementById('smileCanvas');
const smileCtx = smileCanvas ? smileCanvas.getContext('2d') : null;
let smileParticles = [];
const emojis = ['😊','😂','😎','🥳','😍','🤩','😇'];
function startSmileAnimation() {
    if (!smileCanvas) return;
    smileCanvas.width = smileCanvas.parentElement.clientWidth;
    smileCanvas.height = smileCanvas.parentElement.clientHeight;
    smileParticles = [];
    for (let i = 0; i < 25; i++) {
        smileParticles.push({ x: Math.random() * smileCanvas.width, y: smileCanvas.height + Math.random() * 60, speed: 0.5 + Math.random() * 1.5, size: 16 + Math.random() * 14, emoji: emojis[Math.floor(Math.random() * emojis.length)], opacity: 1, popping: false });
    }
    if (!window.smileInterval) window.smileInterval = setInterval(drawSmile, 50);
}
function drawSmile() {
    if (!smileCtx || views[currentViewIndex] !== 'smile') return;
    smileCtx.clearRect(0, 0, smileCanvas.width, smileCanvas.height);
    smileParticles.forEach(p => {
        if (!p.popping) { p.y -= p.speed; if (p.y < -20) { p.y = smileCanvas.height + 20; p.x = Math.random() * smileCanvas.width; } }
        smileCtx.font = `${p.size}px Arial`;
        smileCtx.fillStyle = `rgba(255,215,0,${p.opacity})`;
        smileCtx.fillText(p.emoji, p.x, p.y);
        if (p.popping) { p.opacity -= 0.02; p.size += 1; if (p.opacity <= 0) { p.y = smileCanvas.height + 20; p.x = Math.random() * smileCanvas.width; p.opacity = 1; p.size = 16 + Math.random() * 14; p.popping = false; } }
    });
    if (Math.random() < 0.02) { const r = smileParticles[Math.floor(Math.random() * smileParticles.length)]; if (r && !r.popping) r.popping = true; }
}
window.addEventListener('resize', startSmileAnimation);

const veggieCanvas = document.getElementById('veggieCanvas');
const veggieCtx = veggieCanvas ? veggieCanvas.getContext('2d') : null;
let veggieParticles = [];
const veggieEmojis = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅','₿','Ξ','Ł','$','♦'];
function startVeggieAnimation() {
    if (!veggieCanvas) return;
    veggieCanvas.width = veggieCanvas.parentElement.clientWidth;
    veggieCanvas.height = veggieCanvas.parentElement.clientHeight;
    veggieParticles = [];
    for (let i = 0; i < 40; i++) {
        veggieParticles.push({ x: Math.random() * veggieCanvas.width, y: veggieCanvas.height + Math.random() * 60, speed: 0.8 + Math.random() * 2, size: 16 + Math.random() * 14, emoji: veggieEmojis[Math.floor(Math.random() * veggieEmojis.length)], opacity: 1 });
    }
    if (!window.veggieInterval) window.veggieInterval = setInterval(drawVeggie, 50);
}
function drawVeggie() {
    if (!veggieCtx || views[currentViewIndex] !== 'veggie') return;
    veggieCtx.clearRect(0, 0, veggieCanvas.width, veggieCanvas.height);
    veggieParticles.forEach(p => {
        p.y -= p.speed;
        if (p.y < -20) { p.y = veggieCanvas.height + 20; p.x = Math.random() * veggieCanvas.width; }
        veggieCtx.font = `${p.size}px Arial`;
        veggieCtx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        veggieCtx.fillText(p.emoji, p.x, p.y);
    });
}
window.addEventListener('resize', startVeggieAnimation);

// ====== ПОДКЛЮЧАЕМ ОБРАБОТЧИКИ ======
function attachGameEvents() {
    const startBtn = document.getElementById('start-btn');
    const board = document.getElementById('board');
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (board) {
        board.addEventListener('touchstart', handleTouchStart, {passive: false});
        board.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachGameEvents);
} else {
    attachGameEvents();
}
