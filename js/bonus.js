// ================== ПРИВЕТСТВЕННЫЕ БОНУСЫ ==================
// Проверяет подписку на канал (день 1) и группу (день 2), начисляет по 1 SRUM

const BOT_TOKEN = '8531213531:AAEF_ltCYocN4IBGuuJZbHtPSxOlNeKjKkM';
const CHANNEL_USERNAME = '@crypto_borsch_channel';
const GROUP_USERNAME = '@criptoniany';

// Проверка подписки на канал
async function checkChannelSubscription(userId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_USERNAME}&user_id=${userId}`);
        const data = await response.json();
        if (data.ok && data.result && data.result.status !== 'left' && data.result.status !== 'kicked') {
            return true;
        }
        return false;
    } catch (e) {
        console.error('Ошибка проверки канала:', e);
        return false;
    }
}

// Проверка подписки на группу
async function checkGroupSubscription(userId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_USERNAME}&user_id=${userId}`);
        const data = await response.json();
        if (data.ok && data.result && data.result.status !== 'left' && data.result.status !== 'kicked') {
            return true;
        }
        return false;
    } catch (e) {
        console.error('Ошибка проверки группы:', e);
        return false;
    }
}

// Главная функция — вызывается при старте игры
async function processWelcomeBonus(userId, userData) {
    let bonusGiven = false;

    // Проверяем бонус за канал (если ещё не получен)
    if (!userData.channel_bonus) {
        const isSubscribed = await checkChannelSubscription(userId);
        if (isSubscribed) {
            const newSrum = parseFloat(userData.srum || 0) + 1;
            // Сохраняем в облако
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ srum: newSrum, channel_bonus: true })
                });
            } catch(e) {}
            
            window.srum = newSrum;
            userData.srum = newSrum;
            userData.channel_bonus = true;
            bonusGiven = true;
            alert('✅ +1 SRUM за подписку на канал @crypto_borsch_channel!');
        }
    }

    // Проверяем бонус за группу (если уже получен бонус за канал и ещё не получен за группу)
    if (userData.channel_bonus && !userData.group_bonus) {
        const isInGroup = await checkGroupSubscription(userId);
        if (isInGroup) {
            const newSrum = parseFloat(userData.srum || 0) + 1;
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ srum: newSrum, group_bonus: true })
                });
            } catch(e) {}
            
            window.srum = newSrum;
            userData.group_bonus = true;
            bonusGiven = true;
            alert('✅ +1 SRUM за подписку на группу @criptoniany!');
        }
    }

    return bonusGiven;
}
