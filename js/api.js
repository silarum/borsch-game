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

async function loadUserData() {
    const userId = 123456789;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    if (response.ok) {
        const users = await response.json();
        if (users.length > 0) {
            const user = users[0];
            window.rum = user.rum || 0;
            window.srum = parseFloat(user.srum) || 10000;
            window.ton = parseFloat(user.ton) || 0;
            window.usdt = parseFloat(user.usdt) || 0;
            window.userNickname = user.nickname || 'Майнер';
            window.userStatus = user.status || 'solo';
            window.miningStage = user.mining_stage || 1;
            if (user.boost && user.boost !== 'null') {
                window.activeBoost = user.boost;
            }
            return true;
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
        mining_stage: 1
    });
    return false;
}

async function saveUserData() {
    const userId = 123456789;
    const body = {
        nickname: window.userNickname,
        rum: window.rum,
        srum: window.srum,
        ton: window.ton,
        usdt: window.usdt,
        status: window.userStatus,
        mining_stage: window.miningStage,
        boost: window.activeBoost ? JSON.stringify(window.activeBoost) : null,
        updated_at: new Date().toISOString()
    };
    await supabaseRequest('PATCH', `users?id=eq.${userId}`, body);
}
