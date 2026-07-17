// Серверный шлюз. Прямые записи из браузера в таблицы Supabase запрещены.
const SUPABASE_URL = window.APP_CONFIG.supabaseUrl;
const SUPABASE_ANON_KEY = window.APP_CONFIG.supabasePublishableKey;

async function gameApi(action, payload = {}) {
    if (!window.APP_CONFIG.cloudSyncEnabled) return null;

    const initData = window.getTelegramInitData();
    if (!initData) throw new Error('Telegram initData отсутствует');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/game-api`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ action, payload, initData })
    });

    if (!response.ok) throw new Error(`Game API: ${response.status}`);
    return response.json();
}

async function loadUserData() {
    if (!window.APP_CONFIG.cloudSyncEnabled) return null;
    const result = await gameApi('load_player');
    return result?.player || null;
}

async function saveUserData(_userId, data) {
    if (!window.APP_CONFIG.cloudSyncEnabled) return false;
    await gameApi('save_profile', {
        nickname: data.nickname,
        status: data.status
    });
    return true;
}
