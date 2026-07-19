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

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Game API: ${response.status}`);
    return result;
}

async function uploadClubPoster(clubId, file) {
    if (!window.APP_CONFIG.cloudSyncEnabled) return { publicUrl: URL.createObjectURL(file), localOnly: true };
    const initData = window.getTelegramInitData();
    if (!initData) throw new Error('Загрузка доступна только внутри Telegram');
    const form = new FormData();
    form.append('clubId', clubId);
    form.append('initData', initData);
    form.append('poster', file);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/club-poster-upload`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY },
        body: form
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Poster upload: ${response.status}`);
    return result;
}

async function loadUserData() {
    if (!window.APP_CONFIG.cloudSyncEnabled) return null;
    const result = await gameApi('load_player');
    if (Array.isArray(result?.tasks)) {
        const normalized = result.tasks.map((task) => ({
            id: task.id,
            desc: task.title,
            link: task.task_url,
            currency: task.reward_currency === 'SRUM' ? 'SRUM' : 'RUM',
            reward: Number(task.reward_amount || 0),
            maxCompletions: Number(task.completion_limit || 0),
            completionsDone: Number(task.completions || 0),
            checking: false
        }));
        officialRumTasks = normalized.filter((task) => task.currency === 'RUM');
        officialSrumTasks = normalized.filter((task) => task.currency === 'SRUM');
    }
    if (result?.player?.server_session_id && typeof activeServerMiningSessionId !== 'undefined') {
        activeServerMiningSessionId = result.player.server_session_id;
    }
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

async function requestTrainingMatch(stage, stake, poolId = null, sessionId = null) {
    return matchmakingApi('join', { stage, stake, poolId, sessionId });
}

async function resolveTrainingMatch(matchId, playerScore) {
    if (!matchId) return null;
    return matchmakingApi('resolve', { matchId, playerScore });
}

async function getMatchResult(matchId) {
    if (!matchId) return null;
    return matchmakingApi('result', { matchId });
}

async function cancelGameMatch(matchId) {
    if (!matchId) return null;
    return matchmakingApi('cancel', { matchId });
}

async function closeMiningSession(sessionId) {
    if (!sessionId) return null;
    return matchmakingApi('close', { sessionId });
}

async function getGamePools() {
    const result = await matchmakingApi('pools');
    return Array.isArray(result?.pools) ? result.pools : [];
}
