(function () {
    'use strict';

    function addStylesheet() {
        if (document.querySelector('link[data-premium-v6]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/premium-v6.css?v=20260720a';
        link.dataset.premiumV6 = 'true';
        document.head.appendChild(link);
    }

    function installHungryWolvesHero() {
        const screen = document.getElementById('mining-club-screen');
        if (!screen || screen.querySelector('.wolves-premium-hero')) return;

        const title = screen.querySelector('.club-network-title');
        if (title) {
            const small = title.querySelector('small');
            const heading = title.querySelector('h2');
            if (small) small.textContent = 'REAL VENUES · COMMUNITY LEAGUES · SEASON 01';
            if (heading) heading.textContent = 'ГОЛОДНЫЕ ВОЛКИ';
        }

        const hero = document.createElement('section');
        hero.className = 'wolves-premium-hero';
        hero.setAttribute('aria-label', 'Пять бойцов клуба Голодные волки и пять волков');
        hero.innerHTML = `
            <img src="assets/fight/hungry-wolves-five-fighters.webp" alt="Пять разных бойцов клуба Голодные волки, включая девушку, и пять волков рядом с ними">
            <div class="wolves-premium-copy">
                <div class="wolves-premium-title">
                    <small>HUNGRY WOLVES · FOUNDER CLUB</small>
                    <strong>Сила. Честь. Стая.</strong>
                    <span>5 бойцов · 5 волков · районные, городские и мировые лиги</span>
                </div>
                <div class="wolves-premium-badge"><b>№ 01</b><small>КЛУБ СЕТИ</small></div>
            </div>`;

        const tabs = screen.querySelector('.club-hub-tabs');
        if (tabs) screen.insertBefore(hero, tabs);
        else screen.appendChild(hero);
    }

    function labelNavigation() {
        const iconMap = {
            arena: '🏟',
            'mining-club': '🐺',
            fight: '⚔',
            wallet: '▣',
            shop: '▰'
        };
        document.querySelectorAll('#bottom-panel .nav-btn').forEach(function (button) {
            const icon = button.querySelector('.nav-icon');
            if (icon && iconMap[button.dataset.screen]) icon.textContent = iconMap[button.dataset.screen];
        });
    }

    function markScreens() {
        const map = {
            'arena-screen': 'crypto-mayhem',
            'mining-club-screen': 'hungry-wolves',
            'fight-screen': 'wolf-hundred',
            'rules-screen': 'rules',
            'about-screen': 'about',
            'tasks-screen': 'tasks',
            'invest-screen': 'invest',
            'referral-screen': 'referral',
            'shop-screen': 'shop',
            'wallet-screen': 'wallet'
        };
        Object.entries(map).forEach(function ([id, value]) {
            const node = document.getElementById(id);
            if (node) node.dataset.premiumScreen = value;
        });
    }

    function polishGeneratedContent() {
        document.querySelectorAll('#arena-content .pool-cloud').forEach(function (card) {
            card.classList.add('premium-pool-card');
        });
        document.querySelectorAll('#fight-content .fighter-card').forEach(function (card, index) {
            card.style.setProperty('--fighter-index', index + 1);
        });
        document.querySelectorAll('#club-content img').forEach(function (image) {
            image.loading = 'lazy';
            image.decoding = 'async';
        });
    }

    function refreshPremiumUI() {
        installHungryWolvesHero();
        labelNavigation();
        markScreens();
        polishGeneratedContent();
    }

    function start() {
        addStylesheet();
        refreshPremiumUI();

        const observer = new MutationObserver(function () {
            window.requestAnimationFrame(refreshPremiumUI);
        });
        const root = document.getElementById('game-container') || document.body;
        observer.observe(root, { childList: true, subtree: true });

        document.addEventListener('click', function () {
            window.setTimeout(refreshPremiumUI, 40);
            window.setTimeout(refreshPremiumUI, 220);
        }, true);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
