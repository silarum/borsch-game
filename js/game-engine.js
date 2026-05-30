// ================== ТАПАЛКА И ФОНЫ ==================

// Вспомогательные функции анимаций
function showCoinFountain(count = 10) {
    const potRect = pot.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const cx = potRect.left + potRect.width/2 - containerRect.left;
    const cy = potRect.top - containerRect.top + 8;
    for (let i=0; i<count; i++) {
        const coin = document.createElement('div'); coin.className = 'coin-fountain'; coin.textContent = '💰';
        coin.style.left = (cx + (Math.random()-0.5)*80) + 'px';
        coin.style.top = cy + 'px';
        coin.style.animationDuration = (0.7 + Math.random()*0.5) + 's';
        document.getElementById('game-container').appendChild(coin);
        coin.addEventListener('animationend', () => coin.remove());
    }
}
function showPoopFountain(count = 5) {
    const potRect = pot.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const cx = potRect.left + potRect.width/2 - containerRect.left;
    const cy = potRect.top - containerRect.top + 8;
    for (let i=0; i<count; i++) {
        const poop = document.createElement('div'); poop.className = 'poop-fountain'; poop.textContent = '💩';
        poop.style.left = (cx + (Math.random()-0.5)*80) + 'px';
        poop.style.top = cy + 'px';
        poop.style.animationDuration = (0.6 + Math.random()*0.5) + 's';
        document.getElementById('game-container').appendChild(poop);
        poop.addEventListener('animationend', () => poop.remove());
    }
}

function spawnAll() {
    holes.forEach(h => h.innerHTML = '');
    currentVeg = {};
    for (let i=0; i<holes.length; i++) {
        const isBad = Math.random() < 0.25;
        const pool = isBad ? BAD : GOOD;
        holes[i].innerHTML = `<span class="veg${isBad ? ' rotten' : ''}">${pool[Math.floor(Math.random() * pool.length)]}</span>`;
        currentVeg[i] = { type: isBad ? 'bad' : 'good' };
    }
}

function processHit(hole, touch) {
    if (!gameActive) return;
    const num = [...holes].indexOf(hole);
    if (num === -1 || !currentVeg[num]) { rum = Math.max(0, rum - 20); streak = 0; showPoopFountain(); updateUI(); return; }
    if (currentVeg[num].type === 'good') {
        streak++;
        let multiplier = Math.pow(2, Math.floor((streak-1) / 10));
        let gain = 10 * multiplier;
        if (activeBoost && activeBoost.endTime > Date.now()) gain *= activeBoost.type;
        rum += Math.floor(gain);
        flyVegToPot(hole, hole.querySelector('.veg').textContent);
        showCoinFountain();
        if (streak % 20 === 0) triggerRocket();
    } else { rum = Math.max(0, rum - 20); streak = 0; showPoopFountain(); }
    delete currentVeg[num]; hole.innerHTML = ''; updateUI();
}

function handleTouchStart(e) {
    e.preventDefault();
    if (!gameActive) return;
    [...e.changedTouches].forEach(touch => {
        const hole = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.hole');
        if (hole) processHit(hole, touch);
        else { rum = Math.max(0, rum - 20); streak = 0; showPoopFountain(); updateUI(); }
    });
}

function flyVegToPot(hole, emoji) {
    const holeRect = hole.getBoundingClientRect();
    const potRect = pot.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const vegEl = document.createElement('div'); vegEl.className = 'flying-veg'; vegEl.textContent = emoji;
    vegEl.style.left = (holeRect.left + holeRect.width/2 - containerRect.left) + 'px';
    vegEl.style.top = (holeRect.top + holeRect.height/2 - containerRect.top) + 'px';
    vegEl.style.setProperty('--dx', (potRect.left + potRect.width/2 - containerRect.left - parseFloat(vegEl.style.left)) / 2 + 'px');
    vegEl.style.setProperty('--dy', '-60px');
    vegEl.style.setProperty('--ex', (potRect.left + potRect.width/2 - containerRect.left - parseFloat(vegEl.style.left)) + 'px');
    vegEl.style.setProperty('--ey', (potRect.top - containerRect.top + 5 - parseFloat(vegEl.style.top)) + 'px');
    document.getElementById('game-container').appendChild(vegEl);
    vegEl.addEventListener('animationend', () => vegEl.remove());
}

function triggerRocket() {
    const potRect = pot.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const startX = potRect.left + potRect.width/2 - containerRect.left;
    const startY = potRect.top + potRect.height/2 - containerRect.top;
    const rocket = document.createElement('div'); rocket.className = 'rocket'; rocket.textContent = '🚀';
    rocket.style.left = startX + 'px'; rocket.style.top = startY + 'px';
    document.getElementById('game-container').appendChild(rocket);
    rocket.addEventListener('animationend', () => {
        rocket.remove();
        for (let i = 0; i < 12; i++) {
            const spark = document.createElement('div'); spark.className = 'spark'; spark.textContent = '✨';
            spark.style.left = startX + 'px'; spark.style.top = startY + 'px';
            spark.style.setProperty('--sx', (Math.random() - 0.5) * 150 + 'px');
            spark.style.setProperty('--sy', (Math.random() - 0.5) * 150 + 'px');
            document.getElementById('game-container').appendChild(spark);
            spark.addEventListener('animationend', () => spark.remove());
        }
    });
}

function startGame() {
    if (games <= 0 || gameActive) return;
    gameActive = true; gameTimeLeft = 60; streak = 0;
    updateUI(); spawnAll();
    let interval = 1800;
    spawnInterval = setInterval(() => {
        if (!gameActive) return;
        spawnAll();
        interval = Math.max(450, interval-80);
        clearInterval(spawnInterval);
        spawnInterval = setInterval(() => { if (gameActive) spawnAll(); }, interval);
    }, interval);
    gameTimer = setInterval(() => { gameTimeLeft--; updateUI(); if (gameTimeLeft <= 0) endGame(); }, 1000);
}
function endGame() {
    gameActive = false;
    clearInterval(gameTimer); clearInterval(spawnInterval);
    holes.forEach(h => h.innerHTML = '');
    currentVeg = {};
    games = Math.max(0, games - 1);
    window.lastGameTime = Date.now();
    updateUI();
    if (games < maxGames) startRecovery();
}
function startRecovery() {
    if (window.recoveryInterval) clearInterval(window.recoveryInterval);
    window.recoveryInterval = setInterval(() => {
        if (games >= maxGames) { clearInterval(window.recoveryInterval); return; }
        if (Date.now() - (window.lastGameTime || 0) >= gameRecoveryTime * 1000) {
            games = Math.min(maxGames, games + 1);
            window.lastGameTime = Date.now();
            updateUI();
            if (games >= maxGames) clearInterval(window.recoveryInterval);
        }
    }, 1000);
}

// Фоны
const views = ['matrix', 'smile', 'veggie'];
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
    if (view === 'matrix') { btn.innerHTML = '🟢 Матрица'; startMatrix(); }
    else if (view === 'smile') { btn.innerHTML = '😊 Смайлы'; startSmileAnimation(); }
    else if (view === 'veggie') { btn.innerHTML = '🥬 Овощи'; startVeggieAnimation(); }
};

const matrixCanvas = document.getElementById('matrixCanvas');
const matrixCtx = matrixCanvas.getContext('2d');
let matrixParticles = [];
function startMatrix() {
    matrixCanvas.width = matrixCanvas.parentElement.clientWidth;
    matrixCanvas.height = matrixCanvas.parentElement.clientHeight;
    matrixParticles = [];
    for (let i=0; i<150; i++) matrixParticles.push({ x: Math.random()*matrixCanvas.width, y: Math.random()*matrixCanvas.height, speed: 1+Math.random()*2, char: String.fromCharCode(0x30A0+Math.random()*96), opacity: Math.random() });
}
function drawMatrix() {
    if (views[currentViewIndex] !== 'matrix') return;
    matrixCtx.fillStyle = 'rgba(0,0,0,0.05)'; matrixCtx.fillRect(0,0,matrixCanvas.width,matrixCanvas.height);
    matrixCtx.fillStyle = '#0F0'; matrixCtx.font = '14px monospace';
    matrixParticles.forEach(p => { matrixCtx.fillText(p.char,p.x,p.y); p.y -= p.speed; if(p.y<-20){ p.y=matrixCanvas.height+20; p.x=Math.random()*matrixCanvas.width; } });
}
startMatrix(); setInterval(drawMatrix, 50); window.addEventListener('resize', startMatrix);

const smileCanvas = document.getElementById('smileCanvas');
const smileCtx = smileCanvas.getContext('2d');
let smileParticles = [];
const emojis = ['😊','😂','😎','🥳','😍','🤩','😇'];
function startSmileAnimation() {
    smileCanvas.width = smileCanvas.parentElement.clientWidth;
    smileCanvas.height = smileCanvas.parentElement.clientHeight;
    smileParticles = [];
    for (let i = 0; i < 25; i++) {
        smileParticles.push({ x: Math.random()*smileCanvas.width, y: smileCanvas.height+Math.random()*100, speed: 0.5+Math.random()*1.5, size: 16+Math.random()*14, emoji: emojis[Math.floor(Math.random()*emojis.length)], opacity: 1, popping: false });
    }
    if (!window.smileInterval) window.smileInterval = setInterval(drawSmile, 50);
}
function drawSmile() {
    if (views[currentViewIndex] !== 'smile') return;
    smileCtx.clearRect(0,0,smileCanvas.width,smileCanvas.height);
    smileParticles.forEach(p => {
        if (!p.popping) { p.y -= p.speed; if(p.y<-20){ p.y=smileCanvas.height+20; p.x=Math.random()*smileCanvas.width; } }
        smileCtx.font = `${p.size}px Arial`;
        smileCtx.fillStyle = `rgba(255,215,0,${p.opacity})`;
        smileCtx.fillText(p.emoji, p.x, p.y);
        if (p.popping) { p.opacity -= 0.02; p.size += 1; if(p.opacity<=0){ p.y=smileCanvas.height+20; p.x=Math.random()*smileCanvas.width; p.opacity=1; p.size=16+Math.random()*14; p.popping=false; } }
    });
    if (Math.random() < 0.02) { const r = smileParticles[Math.floor(Math.random()*smileParticles.length)]; if(r&&!r.popping) r.popping = true; }
}
window.addEventListener('resize', startSmileAnimation);

const veggieCanvas = document.getElementById('veggieCanvas');
const veggieCtx = veggieCanvas.getContext('2d');
let veggieParticles = [];
const veggieEmojis = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅'];
function startVeggieAnimation() {
    veggieCanvas.width = veggieCanvas.parentElement.clientWidth;
    veggieCanvas.height = veggieCanvas.parentElement.clientHeight;
    veggieParticles = [];
    for (let i = 0; i < 40; i++) {
        veggieParticles.push({ x: Math.random()*veggieCanvas.width, y: veggieCanvas.height+Math.random()*100, speed: 0.8+Math.random()*2, size: 16+Math.random()*14, emoji: veggieEmojis[Math.floor(Math.random()*veggieEmojis.length)], opacity: 1 });
    }
    if (!window.veggieInterval) window.veggieInterval = setInterval(drawVeggie, 50);
}
function drawVeggie() {
    if (views[currentViewIndex] !== 'veggie') return;
    veggieCtx.clearRect(0,0,veggieCanvas.width,veggieCanvas.height);
    veggieParticles.forEach(p => {
        p.y -= p.speed;
        if (p.y < -20) { p.y = veggieCanvas.height + 20; p.x = Math.random() * veggieCanvas.width; }
        veggieCtx.font = `${p.size}px Arial`;
        veggieCtx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        veggieCtx.fillText(p.emoji, p.x, p.y);
    });
}
window.addEventListener('resize', startVeggieAnimation);

// Обработчики
startBtn.addEventListener('click', startGame);
board.addEventListener('touchstart', handleTouchStart, {passive: false});
board.addEventListener('touchmove', e => e.preventDefault(), {passive: false});
