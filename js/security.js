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

function loadScriptsInOrder(sources) {
    return sources.reduce((chain, source) => chain.then(() => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${source}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = source;
        script.async = false;
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', () => reject(new Error(`Не удалось загрузить ${source}`)), { once: true });
        document.body.appendChild(script);
    })), Promise.resolve());
}

// V7 и утверждённый живой Home V8 запускаются после основной логики игры.
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

    if (!document.querySelector('link[data-home-v8]')) {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = 'css/home-v8.css?v=20260721b';
        stylesheet.dataset.homeV8 = 'true';
        document.head.appendChild(stylesheet);
    }

    loadScriptsInOrder([
        'js/home-v8-art-live-1.js?v=20260721b',
        'js/home-v8-art-live-2.js?v=20260721b',
        'js/home-v8-art-live-3.js?v=20260721b',
        'js/home-v8.js?v=20260721b'
    ]).catch((error) => console.error('Home V8:', error));
});

// Единая конфигурация безопасного релизного режима.
// Реальные денежные функции включаются только после серверной валидации
// Telegram initData, TON-транзакций и атомарных операций с балансом.
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
