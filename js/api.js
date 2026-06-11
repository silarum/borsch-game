// ================== ОБЛАЧНОЕ ХРАНЕНИЕ SUPABASE ==================
const SUPABASE_URL = 'https://hngfpdsnjgdpazmortix.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JZOPRsRfMx2l6rsc4QfeBg_s5hf6QRg';

async function supabaseRequest(method, table, body = null, params = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}${params}`;
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (!response.ok) {
        console.error('Supabase error:', response.status, await response.text());
    }
    return response;
}

async function loadUserData(userId) {
    if (!userId) {
        console.warn('loadUserData: userId не указан');
        return null;
    }
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (response.ok) {
            const users = await response.json();
            if (users.length > 0) {
                return users[0];
            }
        }
        await supabaseRequest('POST', 'users', {
            id: userId,
            nickname: 'Майнер',
            rum: 0,
            srum: 10000,
            ton: 0,
            usdt: 0,
            status: 'solo',
            mining_stage: 1,
            games: 3
        });
        return {
            id: userId,
            nickname: 'Майнер',
            rum: 0,
            srum: 10000,
            ton: 0,
            usdt: 0,
            status: 'solo',
            mining_stage: 1,
            games: 3,
            bonus_claimed: false
        };
    } catch (e) {
        console.error('Ошибка загрузки из Supabase:', e);
        return null;
    }
}

async function saveUserData(userId, data) {
    if (!userId) {
        console.warn('saveUserData: userId не указан');
        return;
    }
    try {
        const body = {
            ...data,
            updated_at: new Date().toISOString()
        };
        await supabaseRequest('PATCH', `users?id=eq.${userId}`, body);
    } catch (e) {
        console.error('Ошибка сохранения в Supabase:', e);
    }
}
