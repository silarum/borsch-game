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

async function matchmakingApi(action, payload = {}) {
    if (!window.APP_CONFIG.matchmakingEnabled) return null;
    const initData = window.getTelegramInitData();
    if (!initData) throw new Error('Matchmaking доступен только внутри Telegram');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/matchmaking`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ action, initData, ...payload })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Matchmaking: ${response.status}`);
    return result;
}

async function requestTrainingMatch(stage, stake) {
    return matchmakingApi('join', { stage, stake });
}

async function resolveTrainingMatch(matchId, playerWon) {
    if (!matchId) return null;
    return matchmakingApi('resolve', { matchId, playerWon });
}
