// ================== ТАПАЛКА И ФОНЫ ==================

// Фонтан монеток — летят вверх из кастрюли
function showCoinFountain(count) {
    count = count || 15;
    var pot = document.getElementById('pot');
    if (!pot) return;
    var potRect = pot.getBoundingClientRect();
    var container = document.getElementById('game-container');
    var containerRect = container.getBoundingClientRect();
    var cx = potRect.left + potRect.width / 2 - containerRect.left;
    var cy = potRect.top - containerRect.top;
    for (var i = 0; i < count; i++) {
        var coin = document.createElement('div');
        coin.className = 'coin-fountain';
        var coinTypes = ['💰', '🪙', '💎', '✨', '🪙'];
        coin.textContent = coinTypes[Math.floor(Math.random() * coinTypes.length)];
        coin.style.left = (cx + (Math.random() - 0.5) * 120) + 'px';
        coin.style.top = cy + 'px';
        coin.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
        coin.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
        coin.style.animationDelay = (Math.random() * 0.3) + 's';
        container.appendChild(coin);
        coin.addEventListener('animationend', function(event) { event.currentTarget.remove(); });
    }
}

// Фонтан какашек — падают вниз из кастрюли
function showPoopFountain(count) {
    count = count || 8;
    var pot = document.getElementById('pot');
    if (!pot) return;
    var potRect = pot.getBoundingClientRect();
    var container = document.getElementById('game-container');
    var containerRect = container.getBoundingClientRect();
    var cx = potRect.left + potRect.width / 2 - containerRect.left;
    var cy = potRect.top + potRect.height / 2 - containerRect.top;
    for (var i = 0; i < count; i++) {
        var poop = document.createElement('div');
        poop.className = 'poop-fountain';
        var poopTypes = ['💩', '🪱', '💨', '😤'];
        poop.textContent = poopTypes[Math.floor(Math.random() * poopTypes.length)];
        poop.style.left = (cx + (Math.random() - 0.5) * 100) + 'px';
        poop.style.top = cy + 'px';
        poop.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
        poop.style.animationDuration = (0.6 + Math.random() * 0.6) + 's';
        poop.style.animationDelay = (Math.random() * 0.2) + 's';
        container.appendChild(poop);
        poop.addEventListener('animationend', function(event) { event.currentTarget.remove(); });
    }
}

// Пути к изображениям криптоовощей
var goodImages = [
    'assets/veggies/bitcabbage.webp',
    'assets/veggies/etheronion.webp',
    'assets/veggies/tatercoin.webp',
    'assets/veggies/carrotcash.webp',
    'assets/veggies/pepperpay.webp',
    'assets/veggies/greengas.webp',
    'assets/veggies/beanbit.webp',
    'assets/veggies/garlicgold.webp',
    'assets/veggies/tomotoken.webp'
];
var badImages = [
    'assets/veggies/shitcoin.webp',
    'assets/veggies/scamworm.webp',
    'assets/veggies/rugcheese.webp',
    'assets/veggies/deadflower.webp',
    'assets/veggies/fungustoken.webp'
];

// Заполнение лунок овощами
function spawnAll() {
    var holes = document.querySelectorAll('.hole');
    if (!holes.length) return;
    for (var i = 0; i < holes.length; i++) {
        holes[i].innerHTML = '';
    }
    window.currentVeg = {};
    for (var i = 0; i < holes.length; i++) {
        var isBad = Math.random() < 0.25;
        var pool = isBad ? badImages : goodImages;
        var imgSrc = pool[Math.floor(Math.random() * pool.length)];
        holes[i].innerHTML = '<img src="' + imgSrc + '" class="veg' + (isBad ? ' rotten' : '') + '" style="width:100%;height:100%;object-fit:contain;">';
        window.currentVeg[i] = { type: isBad ? 'bad' : 'good' };
    }
}

// Обработка попадания по лунке
function processHit(hole, touch) {
    if (!window.gameActive) return;
    var holes = document.querySelectorAll('.hole');
    var num = Array.prototype.indexOf.call(holes, hole);
    if (num === -1 || !window.currentVeg || !window.currentVeg[num]) {
        window.rum = Math.max(0, (window.rum || 0) - 20);
        window.streak = 0;
        showPoopFountain();
        if (typeof updateUI === 'function') updateUI();
        return;
    }
    if (window.currentVeg[num].type === 'good') {
        window.streak = (window.streak || 0) + 1;
        var multiplier = Math.pow(2, Math.floor(((window.streak || 1) - 1) / 10));
        var gain = 10 * multiplier;
        if (window.activeBoost && window.activeBoost.endTime > Date.now()) gain *= window.activeBoost.type;
        window.rum = (window.rum || 0) + Math.floor(gain);
        var img = hole.querySelector('.veg');
        if (img) flyVegToPot(hole, img.src);
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

// Обработчик касания доски
function handleTouchStart(e) {
    e.preventDefault();
    if (!window.gameActive) return;
    var touches = e.changedTouches;
    for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        var element = document.elementFromPoint(touch.clientX, touch.clientY);
        var hole = element ? element.closest('.hole') : null;
        if (hole) {
            processHit(hole, touch);
        } else {
            window.rum = Math.max(0, (window.rum || 0) - 20);
            window.streak = 0;
            showPoopFountain();
            if (typeof updateUI === 'function') updateUI();
        }
    }
}

function handleBoardClick(e) {
    if (!window.gameActive) return;
    var hole = e.target.closest('.hole');
    if (hole) processHit(hole, e);
}

function preventDefaultMove(e) {
    e.preventDefault();
}

// Анимация полёта овоща в кастрюлю
function flyVegToPot(hole, imgSrc) {
    var pot = document.getElementById('pot');
    if (!pot || !hole || !imgSrc) return;
    var holeRect = hole.getBoundingClientRect();
    var potRect = pot.getBoundingClientRect();
    var containerRect = document.getElementById('game-container').getBoundingClientRect();
    var vegEl = document.createElement('img');
    vegEl.className = 'flying-veg';
    vegEl.src = imgSrc;
    vegEl.style.width = '40px';
    vegEl.style.height = '40px';
    vegEl.style.position = 'absolute';
    vegEl.style.left = (holeRect.left + holeRect.width / 2 - containerRect.left) + 'px';
    vegEl.style.top = (holeRect.top + holeRect.height / 2 - containerRect.top) + 'px';
    vegEl.style.setProperty('--dx', (potRect.left + potRect.width / 2 - containerRect.left - parseFloat(vegEl.style.left)) / 2 + 'px');
    vegEl.style.setProperty('--dy', '-60px');
    vegEl.style.setProperty('--ex', (potRect.left + potRect.width / 2 - containerRect.left - parseFloat(vegEl.style.left)) + 'px');
    vegEl.style.setProperty('--ey', (potRect.top - containerRect.top + 5 - parseFloat(vegEl.style.top)) + 'px');
    vegEl.style.zIndex = '20';
    vegEl.style.pointerEvents = 'none';
    document.getElementById('game-container').appendChild(vegEl);
    vegEl.addEventListener('animationend', function() { vegEl.remove(); });
}

// Ракета при большой серии
function triggerRocket() {
    var pot = document.getElementById('pot');
    if (!pot) return;
    var potRect = pot.getBoundingClientRect();
    var containerRect = document.getElementById('game-container').getBoundingClientRect();
    var startX = potRect.left + potRect.width / 2 - containerRect.left;
    var startY = potRect.top + potRect.height / 2 - containerRect.top;
    var rocket = document.createElement('div');
    rocket.className = 'rocket';
    rocket.textContent = '🚀';
    rocket.style.left = startX + 'px';
    rocket.style.top = startY + 'px';
    document.getElementById('game-container').appendChild(rocket);
    rocket.addEventListener('animationend', function() {
        rocket.remove();
        for (var i = 0; i < 15; i++) {
            var spark = document.createElement('div');
            spark.className = 'spark';
            var sparkEmojis = ['✨', '💫', '🌟', '⭐', '💥'];
            spark.textContent = sparkEmojis[Math.floor(Math.random() * sparkEmojis.length)];
            spark.style.left = startX + 'px';
            spark.style.top = startY + 'px';
            spark.style.setProperty('--sx', (Math.random() - 0.5) * 200 + 'px');
            spark.style.setProperty('--sy', (Math.random() - 0.5) * 200 + 'px');
            spark.style.fontSize = (1 + Math.random() * 2) + 'rem';
            spark.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
            document.getElementById('game-container').appendChild(spark);
            spark.addEventListener('animationend', function() { spark.remove(); });
        }
    });
}

// Начало игры
function startGame() {
    if ((window.games || 0) <= 0 || window.gameActive) return;
    window._rumBeforeGame = window.rum || 0;
    window.gameActive = true;
    window.gameTimeLeft = 60;
    window.streak = 0;
    if (typeof updateUI === 'function') updateUI();
    spawnAll();
    var interval = 1800;
    window.spawnInterval = setInterval(function() {
        if (!window.gameActive) return;
        spawnAll();
        interval = Math.max(450, interval - 80);
        clearInterval(window.spawnInterval);
        window.spawnInterval = setInterval(function() { if (window.gameActive) spawnAll(); }, interval);
    }, interval);
    window.gameTimer = setInterval(function() {
        window.gameTimeLeft--;
        if (typeof updateUI === 'function') updateUI();
        if (window.gameTimeLeft <= 0) endGame();
    }, 1000);
}

// Конец игры
function endGame() {
    window.gameActive = false;
    clearInterval(window.gameTimer);
    clearInterval(window.spawnInterval);
    var holes = document.querySelectorAll('.hole');
    for (var i = 0; i < holes.length; i++) { holes[i].innerHTML = ''; }
    window.currentVeg = {};
    window.games = Math.max(0, (window.games || 0) - 1);
    window.lastGameTime = Date.now();

    if (typeof updateUI === 'function') updateUI();
    if ((window.games || 0) < 3) startRecovery();
}

// Восстановление попыток
function startRecovery() {
    if (window.recoveryInterval) clearInterval(window.recoveryInterval);
    window.recoveryInterval = setInterval(function() {
        if ((window.games || 0) >= 3) { clearInterval(window.recoveryInterval); return; }
        if (Date.now() - (window.lastGameTime || 0) >= 600000) {
            window.games = Math.min(3, (window.games || 0) + 1);
            window.lastGameTime = Date.now();
            if (typeof updateUI === 'function') updateUI();
            if ((window.games || 0) >= 3) clearInterval(window.recoveryInterval);
        }
    }, 1000);
}

// ================== ФОНЫ ==================
var views = ['veggie', 'smile', 'matrix'];
var currentViewIndex = 0;

window.cycleView = function() {
    if (window.smileInterval) { clearInterval(window.smileInterval); window.smileInterval = null; }
    if (window.veggieInterval) { clearInterval(window.veggieInterval); window.veggieInterval = null; }
    currentViewIndex = (currentViewIndex + 1) % views.length;
    var view = views[currentViewIndex];
    var matrixBg = document.getElementById('matrix-bg');
    var smileView = document.getElementById('smile-view');
    var veggieView = document.getElementById('veggie-view');
    if (matrixBg) matrixBg.style.display = view === 'matrix' ? 'block' : 'none';
    if (smileView) smileView.style.display = view === 'smile' ? 'block' : 'none';
    if (veggieView) veggieView.style.display = view === 'veggie' ? 'block' : 'none';
    var btn = document.getElementById('view-switch');
    if (!btn) return;
    if (view === 'veggie') { btn.innerHTML = '🥬 Овощи'; startVeggieAnimation(); }
    else if (view === 'matrix') { btn.innerHTML = '🟢 Матрица'; startMatrix(); }
    else if (view === 'smile') { btn.innerHTML = '😊 Смайлы'; startSmileAnimation(); }
};

// Матрица
var matrixCanvas = document.getElementById('matrixCanvas');
var matrixCtx = matrixCanvas ? matrixCanvas.getContext('2d') : null;
var matrixParticles = [];
function startMatrix() {
    if (!matrixCanvas) return;
    matrixCanvas.width = matrixCanvas.parentElement.clientWidth;
    matrixCanvas.height = matrixCanvas.parentElement.clientHeight;
    matrixParticles = [];
    for (var i = 0; i < 150; i++) {
        matrixParticles.push({
            x: Math.random() * matrixCanvas.width,
            y: Math.random() * matrixCanvas.height,
            speed: 1 + Math.random() * 2,
            char: String.fromCharCode(0x30A0 + Math.random() * 96),
            opacity: Math.random()
        });
    }
}
function drawMatrix() {
    if (!matrixCtx || views[currentViewIndex] !== 'matrix') return;
    matrixCtx.fillStyle = 'rgba(0,0,0,0.05)';
    matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    matrixCtx.fillStyle = '#0F0';
    matrixCtx.font = '14px monospace';
    for (var i = 0; i < matrixParticles.length; i++) {
        var p = matrixParticles[i];
        matrixCtx.fillText(p.char, p.x, p.y);
        p.y -= p.speed;
        if (p.y < -20) { p.y = matrixCanvas.height + 20; p.x = Math.random() * matrixCanvas.width; }
    }
}
if (matrixCanvas) { startMatrix(); setInterval(drawMatrix, 50); window.addEventListener('resize', startMatrix); }

// Смайлы
var smileCanvas = document.getElementById('smileCanvas');
var smileCtx = smileCanvas ? smileCanvas.getContext('2d') : null;
var smileParticles = [];
var emojis = ['😊','😂','😎','🥳','😍','🤩','😇'];
function startSmileAnimation() {
    if (!smileCanvas) return;
    smileCanvas.width = smileCanvas.parentElement.clientWidth;
    smileCanvas.height = smileCanvas.parentElement.clientHeight;
    smileParticles = [];
    for (var i = 0; i < 25; i++) {
        smileParticles.push({
            x: Math.random() * smileCanvas.width,
            y: smileCanvas.height + Math.random() * 60,
            speed: 0.5 + Math.random() * 1.5,
            size: 16 + Math.random() * 14,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            opacity: 1,
            popping: false
        });
    }
    if (!window.smileInterval) window.smileInterval = setInterval(drawSmile, 50);
}
function drawSmile() {
    if (!smileCtx || views[currentViewIndex] !== 'smile') return;
    smileCtx.clearRect(0, 0, smileCanvas.width, smileCanvas.height);
    for (var i = 0; i < smileParticles.length; i++) {
        var p = smileParticles[i];
        if (!p.popping) { p.y -= p.speed; if (p.y < -20) { p.y = smileCanvas.height + 20; p.x = Math.random() * smileCanvas.width; } }
        smileCtx.font = p.size + 'px Arial';
        smileCtx.fillStyle = 'rgba(255,215,0,' + p.opacity + ')';
        smileCtx.fillText(p.emoji, p.x, p.y);
        if (p.popping) { p.opacity -= 0.02; p.size += 1; if (p.opacity <= 0) { p.y = smileCanvas.height + 20; p.x = Math.random() * smileCanvas.width; p.opacity = 1; p.size = 16 + Math.random() * 14; p.popping = false; } }
    }
    if (Math.random() < 0.02) {
        var r = smileParticles[Math.floor(Math.random() * smileParticles.length)];
        if (r && !r.popping) r.popping = true;
    }
}
window.addEventListener('resize', startSmileAnimation);

// Овощи + крипта на фоне
var veggieCanvas = document.getElementById('veggieCanvas');
var veggieCtx = veggieCanvas ? veggieCanvas.getContext('2d') : null;
var veggieParticles = [];
var veggieEmojis = ['🥬','🧅','🥔','🥕','🫑','🌿','🫘','🧄','🍅','₿','Ξ','Ł','$','♦'];
function startVeggieAnimation() {
    if (!veggieCanvas) return;
    veggieCanvas.width = veggieCanvas.parentElement.clientWidth;
    veggieCanvas.height = veggieCanvas.parentElement.clientHeight;
    veggieParticles = [];
    for (var i = 0; i < 40; i++) {
        veggieParticles.push({
            x: Math.random() * veggieCanvas.width,
            y: veggieCanvas.height + Math.random() * 60,
            speed: 0.8 + Math.random() * 2,
            size: 16 + Math.random() * 14,
            emoji: veggieEmojis[Math.floor(Math.random() * veggieEmojis.length)],
            opacity: 1
        });
    }
    if (!window.veggieInterval) window.veggieInterval = setInterval(drawVeggie, 50);
}
function drawVeggie() {
    if (!veggieCtx || views[currentViewIndex] !== 'veggie') return;
    veggieCtx.clearRect(0, 0, veggieCanvas.width, veggieCanvas.height);
    for (var i = 0; i < veggieParticles.length; i++) {
        var p = veggieParticles[i];
        p.y -= p.speed;
        if (p.y < -20) { p.y = veggieCanvas.height + 20; p.x = Math.random() * veggieCanvas.width; }
        veggieCtx.font = p.size + 'px Arial';
        veggieCtx.fillStyle = 'rgba(255,255,255,' + p.opacity + ')';
        veggieCtx.fillText(p.emoji, p.x, p.y);
    }
}
window.addEventListener('resize', startVeggieAnimation);

// ====== ПОДКЛЮЧАЕМ ОБРАБОТЧИКИ ПОСЛЕ ПОЛНОЙ ЗАГРУЗКИ ======
window.addEventListener('load', function() {
    var startBtn = document.getElementById('start-btn');
    var board = document.getElementById('board');
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (board) {
        board.addEventListener('touchstart', handleTouchStart, {passive: false});
        board.addEventListener('touchmove', preventDefaultMove, {passive: false});
        board.addEventListener('click', handleBoardClick);
    }
});
