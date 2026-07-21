// Crypto Borsh Home V9 — component-based live screen, no full-screen mockup background.
(() => {
  'use strict';

  const main = document.getElementById('main-game');
  if (!main || main.dataset.homeV9Ready === 'true') return;
  main.dataset.homeV9Ready = 'true';
  main.classList.remove('home-v8');
  main.classList.add('home-v9');
  main.style.removeProperty('background-image');
  main.style.removeProperty('background-size');
  main.style.removeProperty('background-position');

  document.querySelectorAll('.home-v8-toolbar').forEach((node) => node.remove());

  const byId = (id) => document.getElementById(id);
  const profile = byId('user-profile');
  const topPanel = main.querySelector('.top-panel');
  const balances = main.querySelector('.balances-right');
  const legend = byId('crypto-veg-legend');
  const rules = byId('rules-btn-bottom');
  const lang = byId('lang-btn-bottom');
  const duel = byId('quick-duel-coin');
  const pot = byId('pot');
  const board = byId('board');
  const start = byId('start-btn-container');
  const menu = byId('menu-dropdown');
  const stats = byId('stats-modal');

  if (!profile || !balances || !legend || !rules || !lang || !duel || !pot || !board || !start) return;

  const app = document.createElement('div');
  app.className = 'v9-app';
  app.innerHTML = `
    <div class="v9-ambient" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <section class="v9-top" aria-label="Игрок и балансы">
      <div class="v9-profile-slot"></div>
      <div class="v9-balances-slot"></div>
    </section>
    <div class="v9-legend-slot"></div>
    <section class="v9-controls" aria-label="Управление главным экраном">
      <div class="v9-controls-left"></div>
      <div class="v9-duel-slot"></div>
    </section>
    <section class="v9-kitchen-zone" aria-label="Крипто-кухня">
      <div class="v9-coin-stream" aria-hidden="true"></div>
      <div class="v9-veggie v9-onion"><img src="assets/veggies/etheronion.webp" alt="ETH лук"></div>
      <div class="v9-veggie v9-potato"><img src="assets/veggies/tatercoin.webp" alt="TON картофель"></div>
      <div class="v9-veggie v9-pepper"><img src="assets/veggies/pepperpay.webp" alt="XRP перец"></div>
      <div class="v9-veggie v9-garlic"><img src="assets/veggies/garlicgold.webp" alt="LTC чеснок"></div>
      <div class="v9-veggie v9-tomato"><img src="assets/veggies/tomotoken.webp" alt="SOL томат"></div>
      <div class="v9-veggie v9-beans"><img src="assets/veggies/beanbit.webp" alt="BNB бобы"></div>
      <div class="v9-pot-slot"></div>
      <div class="v9-timer" id="v9-live-timer"><span>⏳</span><b>0:00</b></div>
      <div class="v9-start-slot"></div>
      <div class="v9-board-slot"></div>
    </section>`;

  main.prepend(app);

  app.querySelector('.v9-profile-slot').append(profile);
  app.querySelector('.v9-balances-slot').append(balances);
  app.querySelector('.v9-legend-slot').append(legend);
  app.querySelector('.v9-controls-left').append(rules, lang);
  app.querySelector('.v9-duel-slot').append(duel);
  app.querySelector('.v9-pot-slot').append(pot);
  app.querySelector('.v9-start-slot').append(start);
  app.querySelector('.v9-board-slot').append(board);

  if (topPanel) topPanel.remove();

  // Canvas nodes remain in DOM because the game engine queries them during startup.
  // CSS hides them completely in V9, preventing duplicate backgrounds without breaking initApp().
  const obsoleteSelectors = [
    '.crypto-kitchen-art', '.glass-wall', '.window-sill', '.flower-pot',
    '.purple-bg', '.kitchen-area', '.game-brand', '#view-switch'
  ];
  obsoleteSelectors.forEach((selector) => {
    main.querySelectorAll(selector).forEach((node) => {
      if (!node.contains(pot)) node.remove();
    });
  });

  // Create separate live coin components instead of using painted coins in a background.
  const stream = app.querySelector('.v9-coin-stream');
  for (let i = 0; i < 22; i += 1) {
    const coin = document.createElement('span');
    coin.textContent = 'R';
    coin.style.setProperty('--x', `${16 + Math.random() * 68}%`);
    coin.style.setProperty('--y', `${5 + Math.random() * 80}%`);
    coin.style.setProperty('--s', `${0.58 + Math.random() * 0.72}`);
    coin.style.setProperty('--d', `${2.2 + Math.random() * 3.8}s`);
    coin.style.setProperty('--delay', `${-Math.random() * 5}s`);
    stream.append(coin);
  }

  const timerText = app.querySelector('#v9-live-timer b');
  const syncLiveState = () => {
    const playing = Boolean(window.gameActive);
    app.classList.toggle('is-playing', playing);
    const seconds = playing ? Math.max(0, Number(window.gameTimeLeft || 0)) : 0;
    timerText.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

    const anyScreen = document.querySelector('.screen.active');
    app.hidden = Boolean(anyScreen);

    if (playing) {
      const filled = board.querySelectorAll('.hole .veg').length;
      board.classList.toggle('has-active-veggies', filled > 0);
    }
  };

  setInterval(syncLiveState, 250);
  syncLiveState();

  const screens = document.querySelectorAll('.screen');
  const observer = new MutationObserver(syncLiveState);
  screens.forEach((screen) => observer.observe(screen, { attributes: true, attributeFilter: ['class'] }));

  window.addEventListener('load', () => {
    // V9 uses its own atmospheric layer; old animated canvases remain hidden and are stopped.
    setTimeout(() => {
      if (window.veggieInterval) { clearInterval(window.veggieInterval); window.veggieInterval = null; }
      if (window.smileInterval) { clearInterval(window.smileInterval); window.smileInterval = null; }
    }, 100);
  });

  // Keep overlays above the component shell.
  if (menu) main.append(menu);
  if (stats) main.append(stats);
})();
