// ================== ПРИВЕТСТВЕННЫЙ БОНУС ==================
// Проверяет подписку на канал и группу, начисляет 1 SRUM

const BOT_TOKEN = '8531213531:AAEF_ltCYocN4IBGuuJZbHtPSxOlNeKjKkM';
const CHANNEL_USERNAME = '@crypto_borsch_channel';
const GROUP_USERNAME = '@criptoniany';

async function checkSubscription(userId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_USERNAME}&user_id=${userId}`);
        const data = await response.json();
        if (!data.ok || data.result.status === 'left' || data.result.status === 'kicked') return false;
        return true;
    } catch (e) {
        console.error('Ошибка проверки подписки на канал:', e);
        return false;
    }
}

async function checkGroup(userId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_USERNAME}&user_id=${userId}`);
        const data = await response.json();
        if (!data.ok || data.result.status === 'left' || data.result.status === 'kicked') return false;
        return true;
    } catch (e) {
        console.error('Ошибка проверки подписки на группу:', e);
        return false;
    }
}

async function processWelcomeBonus(userId, userData) {
    if (userData.bonus_claimed) return false; // уже получил

    const [subscribed, inGroup] = await Promise.all([
        checkSubscription(userId),
        checkGroup(userId)
    ]);

    if (subscribed && inGroup) {
        // Начисляем 1 SRUM
        const newSrum = parseFloat(userData.srum || 0) + 1;
        await saveUserData(userId, { srum: newSrum, bonus_claimed: true });
        // Обновляем глобальную переменную, чтобы интерфейс сразу увидел
        window.srum = newSrum;
        return true;
    }
    return false;
}
