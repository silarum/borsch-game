// Home V10 — exact approved-screen component composition.
(() => {
  'use strict';

  const A = window.__HOME_V10_ASSETS;
  const main = document.getElementById('main-game');
  const oldBottom = document.getElementById('bottom-panel');
  if (!A || !main || main.dataset.homeV10Ready === 'true') return;

  main.dataset.homeV10Ready = 'true';
  main.className = 'v10-home';
  main.style.display = 'block';
  oldBottom?.remove();

  const img = (cls, src, alt = '') => `<img class="v10-piece ${cls}" src="${src}" alt="${alt}" draggable="false">`;

  main.innerHTML = `
    <div class="v10-stage" id="v10-stage">
      ${img('v10-profile', A.profile, '')}
      ${img('v10-balance rumir', A.rumir, '')}
      ${img('v10-balance srum', A.srum, '')}
      ${img('v10-balance usdt', A.usdt, '')}
      ${img('v10-balance ton', A.ton, '')}
      ${img('v10-legend', A.legend, 'ETH, TON, SOL и XRP')}
      ${img('v10-rules', A.rules, 'Правила')}
      ${img('v10-language', A.language, 'Русский')}
      ${img('v10-duel', A.duel, 'Крипто Беспредел')}
      ${img('v10-kitchen', A.kitchen, 'Крипто-овощи и котёл')}
      ${img('v10-board-art', A.board, 'Треугольная игровая доска')}
      ${img('v10-nav-art', A.nav, 'Навигация')}

      <div class="user-profile v10-live-profile" id="user-profile">
        <button class="user-avatar" id="user-avatar" type="button" aria-label="Статистика игрока">😎</button>
        <div class="v10-profile-cover" aria-hidden="true"></div>
        <div class="v10-profile-text">
          <div id="user-nickname">Майнер</div>
          <div id="user-status">Одиночка</div>
          <div class="v10-gamefi">GAMEFI · TON</div>
        </div>
        <button class="user-menu-btn" id="user-menu-btn" type="button" aria-label="Меню">☰</button>
        <span class="v10-progress-value" id="v10-progress-value">0 / 12 000</span>
      </div>

      <div class="top-panel" hidden>
        <div class="balances-right">
          <div id="rum-balance">💰 RUMIR: 0</div>
          <div id="srum-balance">💎 SRUM: 0.00</div>
          <div id="usdt-balance-top">💵 USDT: OFF</div>
          <div id="ton-balance-top">⚡ TON: OFF</div>
        </div>
      </div>

      <div class="v10-balance-live rumir"><i class="v10-balance-cover"></i><span class="v10-balance-text" id="v10-rum">RUMIR: 0</span></div>
      <div class="v10-balance-live srum"><i class="v10-balance-cover"></i><span class="v10-balance-text" id="v10-srum">SRUM: 0.00</span></div>
      <div class="v10-balance-live usdt"><i class="v10-balance-cover"></i><span class="v10-balance-text" id="v10-usdt">USDT: OFF</span></div>
      <div class="v10-balance-live ton"><i class="v10-balance-cover"></i><span class="v10-balance-text" id="v10-ton">TON: OFF</span></div>

      <button id="rules-btn-bottom" class="v10-hit" type="button" aria-label="Правила"></button>
      <button id="lang-btn-bottom" class="v10-hit" type="button" aria-label="Выбрать язык"></button>
      <button id="quick-duel-coin" class="quick-duel-coin v10-hit" type="button" aria-label="Открыть Крипто Беспредел"><span>⚔</span><small>БЕСПРЕДЕЛ</small></button>
      <button id="view-switch" type="button" hidden>Крипто-овощи</button>

      <div class="pot v10-pot-target" id="pot">
        <div class="steam"><div class="steam-particle"></div><div class="steam-particle"></div><div class="steam-particle"></div></div>
        <div class="energy-display" id="energy-display"></div>
        <div class="boost-display" id="boost-display"></div>
      </div>

      <div class="v10-timer" id="v10-timer"><span>⏳</span><b>0:00</b></div>
      <div class="start-btn-container v10-start" id="start-btn-container"><button class="start-btn" id="start-btn" type="button">НАЧАТЬ</button></div>

      <div class="board v10-board" id="board">
        <div class="row"><div class="hole" data-hole="0"></div><div class="hole" data-hole="1"></div><div class="hole" data-hole="2"></div></div>
        <div class="row"><div class="hole" data-hole="3"></div><div class="hole" data-hole="4"></div><div class="hole" data-hole="5"></div><div class="hole" data-hole="6"></div></div>
        <div class="row"><div class="hole" data-hole="7"></div><div class="hole" data-hole="8"></div><div class="hole" data-hole="9"></div><div class="hole" data-hole="10"></div><div class="hole" data-hole="11"></div></div>
      </div>

      <div class="duel-scoreboard hidden" id="duel-scoreboard">
        <span>Ты: <span id="duelPlayerScore">0</span></span>
        <span><span id="duelTimer">20</span>с</span>
        <span>Соперник: <span id="duelOpponentScore">0</span></span>
      </div>

      <div class="bottom-panel v10-bottom" id="bottom-panel">
        <button class="nav-btn" data-screen="arena"><span>Арена</span></button>
        <button class="nav-btn" data-screen="mining-club"><span>Клуб</span></button>
        <button class="nav-btn nav-primary" data-screen="fight"><span>Бой</span></button>
        <button class="nav-btn" data-screen="wallet"><span>Кошелёк</span></button>
        <button class="nav-btn" data-screen="shop"><span>Магазин</span></button>
      </div>

      <div id="crypto-veg-legend" hidden></div>
      <div id="matrix-bg" class="v10-hidden-canvas"><canvas id="matrixCanvas"></canvas></div>
      <div id="smile-view" class="v10-hidden-canvas"><canvas id="smileCanvas"></canvas></div>
      <div id="veggie-view" class="v10-hidden-canvas"><canvas id="veggieCanvas"></canvas></div>
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

  const stage = document.getElementById('v10-stage');
  const timerText = document.querySelector('#v10-timer b');
  const progressText = document.getElementById('v10-progress-value');

  const sync = () => {
    const rum = Number(window.rum || 0);
    const srum = Number(window.srum || 0);
    const usdt = Number(window.usdt || 0);
    const ton = Number(window.ton || 0);
    const financeOn = Boolean(window.APP_CONFIG?.financialFeaturesEnabled);

    document.getElementById('v10-rum').textContent = `RUMIR: ${Math.floor(rum).toLocaleString('ru-RU')}`;
    document.getElementById('v10-srum').textContent = `SRUM: ${srum.toFixed(2)}`;
    document.getElementById('v10-usdt').textContent = financeOn ? `USDT: ${usdt.toFixed(2)}` : 'USDT: OFF';
    document.getElementById('v10-ton').textContent = financeOn ? `TON: ${ton.toFixed(2)}` : 'TON: OFF';
    progressText.textContent = `${Math.min(12000, Math.max(0, Math.floor(rum))).toLocaleString('ru-RU')} / 12 000`;

    const seconds = window.gameActive ? Math.max(0, Number(window.gameTimeLeft || 0)) : 0;
    timerText.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

    const hasActiveScreen = Boolean(document.querySelector('.screen.active'));
    stage.hidden = hasActiveScreen;
  };

  document.getElementById('lang-btn-bottom')?.addEventListener('click', () => {
    document.getElementById('language-modal')?.classList.remove('hidden');
  });
  document.getElementById('stats-close-btn')?.addEventListener('click', () => {
    document.getElementById('stats-modal')?.classList.remove('active');
  });

  const observer = new MutationObserver(sync);
  document.querySelectorAll('.screen').forEach((screen) => observer.observe(screen, { attributes:true, attributeFilter:['class'] }));
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.veggieInterval) { clearInterval(window.veggieInterval); window.veggieInterval = null; }
      if (window.smileInterval) { clearInterval(window.smileInterval); window.smileInterval = null; }
    }, 150);
  });
  setInterval(sync, 200);
  sync();
})();
