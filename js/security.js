// Подключаем единый премиальный визуальный слой до запуска приложения.
(() => {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/premium-v5.css?v=20260720a';
    document.head.appendChild(stylesheet);

    const premiumScript = document.createElement('script');
    premiumScript.src = 'js/premium-v6.js?v=20260720a';
    premiumScript.defer = true;
    document.head.appendChild(premiumScript);
})();

// V7 и игровые боевые слои запускаются после загрузки основной логики.
// Home V8/V9/V10 временно отключены: основная версия возвращена к стабильному экрану.
window.addEventListener('load', () => {
    if (!document.querySelector('link[data-premium-v7]')) {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = 'css/premium-v7.css?v=20260721a';
        stylesheet.dataset.premiumV7 = 'true';
        document.head.appendChild(stylesheet);
    }
    if (!document.querySelector('script[data-premium-v7]')) {
        const script = document.createElement('script');
        script.src = 'js/premium-v7.js?v=20260721a';
        script.dataset.premiumV7 = 'true';
        document.body.appendChild(script);
    }
    if (!document.querySelector('link[data-fight-v3]')) {
        const fightStylesheet = document.createElement('link');
        fightStylesheet.rel = 'stylesheet';
        fightStylesheet.href = 'css/fight-v3.css?v=20260723a';
        fightStylesheet.dataset.fightV3 = 'true';
        document.head.appendChild(fightStylesheet);
    }

    const loadTopDown = () => {
        [['css/veggie-brawl-topdown-lobby.css?v=20260724a', 'lobby'], ['css/veggie-brawl-topdown-arena.css?v=20260724a', 'arena']].forEach(([href, key]) => {
            if (document.querySelector(`link[data-veggie-topdown-${key}]`)) return;
            const stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            stylesheet.href = href;
            stylesheet.dataset[`veggieTopdown${key[0].toUpperCase()}${key.slice(1)}`] = 'true';
            document.head.appendChild(stylesheet);
        });
        const loadScript = (src, key, next) => {
            const selector = `script[data-veggie-topdown-${key}]`;
            const existing = document.querySelector(selector);
            if (existing) {
                if (next) existing.addEventListener('load', next, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.dataset[`veggieTopdown${key[0].toUpperCase()}${key.slice(1)}`] = 'true';
            if (next) script.addEventListener('load', next, { once: true });
            document.body.appendChild(script);
        };
        loadScript('js/veggie-brawl-topdown-core.js?v=20260724a', 'core', () => {
            loadScript('js/veggie-brawl-topdown-engine.js?v=20260724a', 'engine', () => {
                loadScript('js/veggie-brawl-topdown-ui.js?v=20260724a', 'ui');
            });
        });
    };

    const loadVeggieBrawl = () => {
        if (!document.querySelector('link[data-veggie-brawl]')) {
            const brawlStylesheet = document.createElement('link');
            brawlStylesheet.rel = 'stylesheet';
            brawlStylesheet.href = 'css/veggie-brawl.css?v=20260723b';
            brawlStylesheet.dataset.veggieBrawl = 'true';
            document.head.appendChild(brawlStylesheet);
        }
        const existing = document.querySelector('script[data-veggie-brawl]');
        if (!existing) {
            const script = document.createElement('script');
            script.src = 'js/veggie-brawl.js?v=20260723b';
            script.dataset.veggieBrawl = 'true';
            script.addEventListener('load', loadTopDown, { once: true });
            document.body.appendChild(script);
        } else if (window.VeggieBrawl) {
            loadTopDown();
        } else {
            existing.addEventListener('load', loadTopDown, { once: true });
        }
    };

    const existingFightScript = document.querySelector('script[data-fight-v3]');
    if (!existingFightScript) {
        const fightScript = document.createElement('script');
        fightScript.src = 'js/fight-v3-patch.js?v=20260723a';
        fightScript.dataset.fightV3 = 'true';
        fightScript.addEventListener('load', loadVeggieBrawl, { once: true });
        document.body.appendChild(fightScript);
    } else if (window.WolfFightV3) {
        loadVeggieBrawl();
    } else {
        existingFightScript.addEventListener('load', loadVeggieBrawl, { once: true });
    }
});

window.APP_CONFIG = Object.freeze({
    cloudSyncEnabled: false,
    financialFeaturesEnabled: false,
    telegramBonusesEnabled: false,
    matchmakingEnabled: false,
    supabaseUrl: 'https://hngfpdsnjgdpazmortix.supabase.co',
    supabasePublishableKey: 'sb_publishable_JZOPRsRfMx2l6rsc4QfeBg_s5hf6QRg'
});

window.escapeHtml = function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
};

window.getTelegramInitData = function getTelegramInitData() {
    return window.Telegram?.WebApp?.initData || '';
};

window.readLocalJson = function readLocalJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (_) {
        localStorage.removeItem(key);
        return fallback;
    }
};

window.readLocalArray = function readLocalArray(key, fallback = []) {
    const value = window.readLocalJson(key, fallback);
    return Array.isArray(value) ? value : fallback;
};

window.showSafeModeNotice = function showSafeModeNotice() {
    alert('Функция временно отключена: сначала требуется безопасный сервер с проверкой Telegram и блокчейна. Игровой режим продолжает работать.');
};

document.getElementById('stats-close-btn')?.addEventListener('click', () => {
    document.getElementById('stats-modal')?.classList.remove('active');
});
document.getElementById('view-switch')?.addEventListener('click', () => window.cycleView?.());
document.getElementById('lang-btn-bottom')?.addEventListener('click', () => {
    document.getElementById('language-modal')?.classList.remove('hidden');
});
document.getElementById('withdrawal-disabled-btn')?.addEventListener('click', () => window.showSafeModeNotice());
document.getElementById('copy-ref-btn')?.addEventListener('click', () => window.copyRef?.());
document.getElementById('apply-ref-btn')?.addEventListener('click', () => window.applyRefCode?.());
document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => window.setLanguage?.(button.dataset.language));
});
document.getElementById('language-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('language-modal')?.classList.add('hidden');
});
