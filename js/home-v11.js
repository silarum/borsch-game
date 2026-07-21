// Home V11 — approved art split into independent live DOM components.
(() => {
  'use strict';

  const ART = window.__HOME_V8_ART;
  const main = document.getElementById('main-game');
  const oldBottom = document.getElementById('bottom-panel');
  if (!ART || !main || main.dataset.homeV11Ready === 'true') return;

  const ART_W = 941;
  const ART_H = 1518;

  function createArtBlobUrl(base64) {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
    } catch (error) {
      console.error('Home V11 artwork decode failed', error);
      return '';
    }
  }

  const artUrl = createArtBlobUrl(ART);
  if (!artUrl) return;
  window.addEventListener('beforeunload', () => URL.revokeObjectURL(artUrl), { once: true });

  const crops = {
    profile: [14, 8, 438, 236],
    rumir: [462, 8, 222, 114],
    srum: [687, 8, 237, 114],
    usdt: [462, 128, 222, 116],
    ton: [687, 128, 237, 116],
    legend: [14, 256, 910, 78],
    rules: [14, 342, 184, 83],
    language: [14, 424, 184, 84],
    duel: [748, 336, 176, 176],
    kitchen: [0, 334, 941, 700],
    board: [14, 1008, 913, 325],
    nav: [14, 1324, 913, 189]
  };

  function sprite(name, extraClass = '') {
    const [x, y, w, h] = crops[name];
    const left = x / ART_W * 100;
    const top = y / ART_H * 100;
    const width = w / ART_W * 100;
    const height = h / ART_H * 100;
    const imageWidth = ART_W / w * 100;
    const imageLeft = -x / w * 100;
    const imageTop = -y / h * 100;
    return `<div class="v11-sprite v11-${name} ${extraClass}" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" aria-hidden="true"><img src="${artUrl}" alt="" draggable="false" style="width:${imageWidth}%;left:${imageLeft}%;top:${imageTop}%"></div>`;
  }

  main.dataset.homeV11Ready = 'true';
  main.className = 'home-v11';
  main.style.display = 'block';
  oldBottom?.remove();

  main.innerHTML = `
    <div class="v11-stage" id="v11-stage">
      ${sprite('kitchen')}
      ${sprite('profile')}
      ${sprite('rumir')}
      ${sprite('srum')}
      ${sprite('usdt')}
      ${sprite('ton')}
      ${sprite('legend')}
      ${sprite('rules')}
      ${sprite('language')}
      ${sprite('duel')}
      ${sprite('board')}
      ${sprite('nav')}

      <div class="user-profile v11-live-profile" id="user-profile">
        <button class="user-avatar" id="user-avatar" type="button" aria-label="Статистика игрока">😎</button>
        <i class="v11-profile-mask" aria-hidden="true"></i>
        <div class="v11-profile-copy">
          <strong id="user-nickname">Майнер</strong>
          <span id="user-status">Одиночка</span>
          <small>GAMEFI · TON</small>
        </div>
        <button class="user-menu-btn" id="user-menu-btn" type="button" aria-label="Меню">☰</button>
        <b class="v11-level">12</b>
        <div class="v11-progress"><i id="v11-progress-fill"></i><span id="v11-progress-value">0 / 12 000</span></div>
      </div>

      <div class="top-panel" hidden>
        <div class="balances-right">
          <div id="rum-balance">💰 RUMIR: 0</div>
          <div id="srum-balance">💎 SRUM: 0.00</div>
          <div id="usdt-balance-top">💵 USDT: OFF</div>
          <div id="ton-balance-top">⚡ TON: OFF</div>
        </div>
      </div>

      <div class="v11-live-balance rumir"><i></i><span id="v11-rum">RUMIR: 0</span></div>
      <div class="v11-live-balance srum"><i></i><span id="v11-srum">SRUM: 0.00</span></div>
      <div class="v11-live-balance usdt"><i></i><span id="v11-usdt">USDT: OFF</span></div>
      <div class="v11-live-balance ton"><i></i><span id="v11-ton">TON: OFF</span></div>

      <button id="rules-btn-bottom" class="v11-hit rules" type="button" aria-label="Правила"></button>
      <button id="lang-btn-bottom" class="v11-hit language" type="button" aria-label="Выбрать язык"></button>
      <button id="quick-duel-coin" class="quick-duel-coin v11-hit duel" type="button" aria-label="Открыть Крипто Беспредел"><span>⚔</span><small>БЕСПРЕДЕЛ</small></button>
      <button id="view-switch" type="button" hidden>Крипто-овощи</button>

      <div class="pot v11-pot-target" id="pot">
        <div class="steam"><div class="steam-particle"></div><div class="steam-particle"></div><div class="steam-particle"></div></div>
        <div class="energy-display" id="energy-display"></div>
        <div class="boost-display" id="boost-display"></div>
      </div>

      <div class="v11-timer" id="v11-timer"><span>⏳</span><b>0:00</b></div>
      <div class="start-btn-container v11-start" id="start-btn-container"><button class="start-btn" id="start-btn" type="button">НАЧАТЬ</button></div>

      <div class="board v11-board" id="board">
        <div class="row"><div class="hole" data-hole="0"></div><div class="hole" data-hole="1"></div><div class="hole" data-hole="2"></div></div>
        <div class="row"><div class="hole" data-hole="3"></div><div class="hole" data-hole="4"></div><div class="hole" data-hole="5"></div><div class="hole" data-hole="6"></div></div>
        <div class="row"><div class="hole" data-hole="7"></div><div class="hole" data-hole="8"></div><div class="hole" data-hole="9"></div><div class="hole" data-hole="10"></div><div class="hole" data-hole="11"></div></div>
      </div>

      <div class="duel-scoreboard hidden" id="duel-scoreboard">
        <span>Ты: <span id="duelPlayerScore">0</span></span>
        <span><span id="duelTimer">20</span>с</span>
        <span>Соперник: <span id="duelOpponentScore">0</span></span>
      </div>

      <div class="bottom-panel v11-bottom" id="bottom-panel">
        <button class="nav-btn" data-screen="arena" aria-label="Арена"><span>Арена</span></button>
        <button class="nav-btn" data-screen="mining-club" aria-label="Клуб"><span>Клуб</span></button>
        <button class="nav-btn nav-primary" data-screen="fight" aria-label="Бой"><span>Бой</span></button>
        <button class="nav-btn" data-screen="wallet" aria-label="Кошелёк"><span>Кошелёк</span></button>
        <button class="nav-btn" data-screen="shop" aria-label="Магазин"><span>Магазин</span></button>
      </div>

      <div id="crypto-veg-legend" hidden></div>
      <div id="matrix-bg" class="v11-hidden-canvas"><canvas id="matrixCanvas"></canvas></div>
      <div id="smile-view" class="v11-hidden-canvas"><canvas id="smileCanvas"></canvas></div>
      <div id="veggie-view" class="v11-hidden-canvas"><canvas id="veggieCanvas"></canvas></div>
    </div>

    <div class="menu-dropdown" id="menu-dropdown">
      <button data-screen="tasks">📋 Задания</button>
      <button data-screen="about">📖 О проекте</button>
      <button data-screen="top-tappers">🏆 Топ игроков</button>
      <button data-screen="top-miners">⛏️ Топ майнеров</button>
      <button data-screen="invest">📈 Инвестиции</button>
      <button data-screen="referral">👥 Рефералы</button>
    </div>

    <div class="stats-modal" id="stats-modal">
      <div class="stats-box">
        <h3>📊 Статистика игрока</h3>
        <p><b>Ник:</b> <span id="stats-nickname"></span></p>
        <p><b>RUMIR:</b> <span id="stats-rum"></span></p>
        <p><b>SRUM:</b> <span id="stats-srum"></span></p>
        <p><b>USDT:</b> <span id="stats-usdt"></span></p>
        <p><b>TON:</b> <span id="stats-ton"></span></p>
        <button id="stats-close-btn" type="button">Закрыть</button>
      </div>
    </div>`;

  const stage = document.getElementById('v11-stage');
  const timerText = document.querySelector('#v11-timer b');
  const progressText = document.getElementById('v11-progress-value');
  const progressFill = document.getElementById('v11-progress-fill');

  function sync() {
    const rumValue = Number(window.rum || localStorage.getItem('rum') || 0);
    const srumValue = Number(window.srum || localStorage.getItem('srum') || 0);
    const usdtValue = Number(window.usdt || localStorage.getItem('usdt') || 0);
    const tonValue = Number(window.ton || localStorage.getItem('ton') || 0);
    const financeOn = Boolean(window.APP_CONFIG?.financialFeaturesEnabled);

    document.getElementById('v11-rum').textContent = `RUMIR: ${Math.floor(rumValue).toLocaleString('ru-RU')}`;
    document.getElementById('v11-srum').textContent = `SRUM: ${srumValue.toFixed(2)}`;
    document.getElementById('v11-usdt').textContent = financeOn ? `USDT: ${usdtValue.toFixed(2)}` : 'USDT: OFF';
    document.getElementById('v11-ton').textContent = financeOn ? `TON: ${tonValue.toFixed(2)}` : 'TON: OFF';

    const progress = Math.min(12000, Math.max(0, Math.floor(rumValue)));
    progressText.textContent = `${progress.toLocaleString('ru-RU')} / 12 000`;
    progressFill.style.width = `${Math.max(4, progress / 12000 * 100)}%`;

    const seconds = window.gameActive ? Math.max(0, Number(window.gameTimeLeft || 0)) : 0;
    timerText.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

    const hasActiveScreen = Boolean(document.querySelector('.screen.active'));
    stage.hidden = hasActiveScreen;
    document.body.classList.toggle('home-v11-main', !hasActiveScreen);
  }

  document.getElementById('lang-btn-bottom')?.addEventListener('click', () => document.getElementById('language-modal')?.classList.remove('hidden'));
  document.getElementById('stats-close-btn')?.addEventListener('click', () => document.getElementById('stats-modal')?.classList.remove('active'));

  const observer = new MutationObserver(sync);
  document.querySelectorAll('.screen').forEach((screen) => observer.observe(screen, { attributes: true, attributeFilter: ['class'] }));
  setInterval(sync, 200);
  sync();
})();
