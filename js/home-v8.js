// Crypto Borsh Home V8 — live interface over the approved art.
(() => {
  'use strict';

  const main = document.getElementById('main-game');
  const container = document.getElementById('game-container');
  const dock = document.getElementById('bottom-panel');
  if (!main || !container || !dock || main.dataset.homeV8Ready === 'true') return;
  main.dataset.homeV8Ready = 'true';
  main.classList.add('home-v8');
  if (window.__HOME_V8_ART) {
    main.style.setProperty('background-image', `url("data:image/webp;base64,${window.__HOME_V8_ART}")`, 'important');
  }

  function addToolbar() {
    if (main.querySelector('.home-v8-toolbar')) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'home-v8-toolbar';
    toolbar.innerHTML = `
      <button type="button" data-v8-close aria-label="Закрыть приложение">×</button>
      <div class="v8-toolbar-right">
        <button type="button" data-v8-stats aria-label="Открыть статистику">⌄</button>
        <button type="button" data-v8-menu aria-label="Открыть меню">⋮</button>
      </div>`;
    main.appendChild(toolbar);
    toolbar.querySelector('[data-v8-close]').addEventListener('click', () => {
      try { window.Telegram?.WebApp?.close(); } catch (_) { /* browser preview */ }
    });
    toolbar.querySelector('[data-v8-stats]').addEventListener('click', () => {
      document.getElementById('stats-modal')?.classList.add('active');
      try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); } catch (_) {}
    });
    toolbar.querySelector('[data-v8-menu]').addEventListener('click', () => {
      document.getElementById('user-menu-btn')?.click();
    });
  }

  function addProfileDetails() {
    const profile = document.getElementById('user-profile');
    if (!profile) return;
    if (!profile.querySelector('.home-v8-level')) {
      const level = document.createElement('div');
      level.className = 'home-v8-level';
      level.innerHTML = '<b>12</b><i><span></span></i><small></small>';
      profile.appendChild(level);
    }
    if (!profile.querySelector('.home-v8-rank')) {
      const rank = document.createElement('div');
      rank.className = 'home-v8-rank';
      rank.textContent = '💎';
      profile.appendChild(rank);
    }
  }

  function addTimer() {
    if (main.querySelector('.home-v8-timer')) return;
    const timer = document.createElement('button');
    timer.type = 'button';
    timer.className = 'home-v8-timer';
    timer.setAttribute('aria-label', 'Начать игру или показать оставшееся время');
    timer.addEventListener('click', () => {
      if (!window.gameActive && !window.duelActive) document.getElementById('start-btn')?.click();
    });
    main.appendChild(timer);
  }

  function addParticles() {
    if (main.querySelector('.home-v8-fx')) return;
    const fx = document.createElement('div');
    fx.className = 'home-v8-fx';
    for (let index = 0; index < 22; index += 1) {
      const spark = document.createElement('span');
      spark.style.left = `${8 + Math.random() * 84}%`;
      spark.style.top = `${12 + Math.random() * 82}%`;
      spark.style.setProperty('--d', `${3.2 + Math.random() * 4.2}s`);
      spark.style.setProperty('--delay', `${-Math.random() * 5}s`);
      fx.appendChild(spark);
    }
    main.appendChild(fx);
  }

  function formatClock(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safe / 60);
    return `${minutes}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
  }

  function syncTimer() {
    const timer = main.querySelector('.home-v8-timer');
    if (!timer) return;
    if (window.duelActive) {
      timer.classList.add('running');
      timer.textContent = `⚔ ${formatClock(window.duelTimeLeft)}`;
    } else if (window.gameActive) {
      timer.classList.add('running');
      timer.textContent = `⏳ ${formatClock(window.gameTimeLeft)}`;
    } else {
      timer.classList.remove('running');
      timer.textContent = '▶ НАЧАТЬ';
    }
  }

  function syncLevel() {
    const level = main.querySelector('.home-v8-level');
    if (!level) return;
    const currentRum = Math.max(0, Number(window.rum) || Number(localStorage.getItem('rum')) || 0);
    const target = 12000;
    const progress = Math.min(target, currentRum % target);
    level.querySelector('span').style.width = `${Math.max(6, progress / target * 100)}%`;
    level.querySelector('small').textContent = `${Math.round(progress).toLocaleString('ru-RU')} / ${target.toLocaleString('ru-RU')}`;
  }

  function syncMode() {
    const activeScreen = document.querySelector('.screen.active');
    const visible = getComputedStyle(main).display !== 'none' && !activeScreen;
    document.body.classList.toggle('home-v8-main', visible);
  }

  function watchBalances() {
    ['rum-balance', 'srum-balance', 'usdt-balance-top', 'ton-balance-top'].forEach((id) => {
      const node = document.getElementById(id);
      if (!node || node.dataset.v8Observed === 'true') return;
      node.dataset.v8Observed = 'true';
      let previous = node.textContent;
      new MutationObserver(() => {
        if (node.textContent === previous) return;
        previous = node.textContent;
        node.classList.remove('v8-balance-pop');
        void node.offsetWidth;
        node.classList.add('v8-balance-pop');
        window.setTimeout(() => node.classList.remove('v8-balance-pop'), 520);
      }).observe(node, { childList: true, characterData: true, subtree: true });
    });
  }

  function upgradeLanguageButton() {
    const language = document.getElementById('lang-btn-bottom');
    if (!language) return;
    const locale = localStorage.getItem('language') || 'ru';
    const labels = { ru: '🌐 Русский', en: '🌐 English', zh: '🌐 中文' };
    if (!language.textContent.trim() || language.textContent.trim() === '🌐') language.textContent = labels[locale] || labels.ru;
  }

  addToolbar();
  addProfileDetails();
  addTimer();
  addParticles();
  watchBalances();
  upgradeLanguageButton();
  syncMode();
  syncTimer();
  syncLevel();

  const modeObserver = new MutationObserver(syncMode);
  modeObserver.observe(container, { attributes: true, childList: true, subtree: true, attributeFilter: ['class', 'style'] });
  window.addEventListener('resize', syncMode, { passive: true });
  window.setInterval(() => {
    syncMode();
    syncTimer();
    syncLevel();
  }, 250);
})();
