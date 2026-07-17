import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.110.7';

type Settings = {
    id: boolean;
    bots_enabled: boolean;
    auto_fill_enabled: boolean;
    activation_threshold: number;
    target_pool_size: number;
    maintenance_mode: boolean;
    updated_at: string;
    updated_by_telegram_id: number | null;
};

type TelegramUpdate = {
    message?: { text?: string; chat: { id: number }; from?: { id: number } };
    callback_query?: {
        id: string;
        data?: string;
        from: { id: number };
        message?: { chat: { id: number } };
    };
};

const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || '';
const gameUrl = Deno.env.get('GAME_URL') || 'https://silarum.github.io/borsch-game/';
const adminIds = new Set(
    (Deno.env.get('ADMIN_TELEGRAM_IDS') || '')
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isSafeInteger(value) && value > 0)
);

async function telegram(method: string, payload: Record<string, unknown>): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Telegram API ${method}: ${response.status}`);
}

async function getSettings(supabase: SupabaseClient): Promise<Settings> {
    const { data, error } = await supabase.from('game_settings').select('*').eq('id', true).single();
    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) as Settings;
}

async function updateSettings(
    supabase: SupabaseClient,
    adminId: number,
    action: string,
    patch: Partial<Settings>
): Promise<Settings> {
    const payload: Record<string, unknown> = {
        p_admin_telegram_id: adminId,
        p_action: action
    };
    if (patch.bots_enabled !== undefined) payload.p_bots_enabled = patch.bots_enabled;
    if (patch.auto_fill_enabled !== undefined) payload.p_auto_fill_enabled = patch.auto_fill_enabled;
    if (patch.activation_threshold !== undefined) payload.p_activation_threshold = patch.activation_threshold;
    if (patch.target_pool_size !== undefined) payload.p_target_pool_size = patch.target_pool_size;
    if (patch.maintenance_mode !== undefined) payload.p_maintenance_mode = patch.maintenance_mode;
    const { data, error } = await supabase.rpc('admin_update_game_settings', payload);
    if (error) throw error;
    return data as Settings;
}

async function statusText(supabase: SupabaseClient, settings?: Settings): Promise<string> {
    const current = settings || await getSettings(supabase);
    const onlineSince = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const [playersResult, botsResult] = await Promise.all([
        supabase.from('player_presence').select('*', { count: 'exact', head: true }).gt('last_seen_at', onlineSince),
        supabase.from('training_matches').select('*', { count: 'exact', head: true })
            .eq('status', 'active').gt('expires_at', new Date().toISOString())
    ]);
    if (playersResult.error) throw playersResult.error;
    if (botsResult.error) throw botsResult.error;
    return [
        '🥘 Крипто Борщ — управление',
        '',
        `300 спартанцев: ${current.bots_enabled ? '✅ включены' : '⛔ выключены'}`,
        `Режим пула: ${current.auto_fill_enabled ? '🤖 автоматический' : '⚡ принудительное заполнение'}`,
        `Порог включения: меньше ${current.activation_threshold} реальных игроков`,
        `Целевой размер пула: ${current.target_pool_size}`,
        `Сейчас онлайн: ${playersResult.count || 0} реальных / ${botsResult.count || 0} ботов`,
        `Техработы: ${current.maintenance_mode ? '⛔ включены' : '✅ выключены'}`,
        '',
        'Боты используются только в явно обозначенных тренировочных матчах.'
    ].join('\n');
}

function adminKeyboard(settings: Settings) {
    return {
        inline_keyboard: [
            [{
                text: settings.bots_enabled ? '⛔ Выключить спартанцев' : '✅ Включить спартанцев',
                callback_data: 'toggle:bots'
            }],
            [{
                text: settings.auto_fill_enabled ? '⚡ Заполнять принудительно' : '🤖 Включить автозаполнение',
                callback_data: 'toggle:auto'
            }],
            [{
                text: settings.maintenance_mode ? '✅ Завершить техработы' : '🛠 Включить техработы',
                callback_data: 'toggle:maintenance'
            }],
            [{ text: '🔄 Обновить статус', callback_data: 'refresh:status' }]
        ]
    };
}

async function sendAdminPanel(chatId: number, supabase: SupabaseClient, settings?: Settings): Promise<void> {
    const current = settings || await getSettings(supabase);
    await telegram('sendMessage', {
        chat_id: chatId,
        text: await statusText(supabase, current),
        reply_markup: adminKeyboard(current)
    });
}

async function sendPlayerWelcome(chatId: number): Promise<void> {
    await telegram('sendMessage', {
        chat_id: chatId,
        text: '🍲 Добро пожаловать в «Крипто Борщ»! Сейчас доступна безопасная демо-игра без реальных платежей.',
        reply_markup: {
            keyboard: [[{ text: '🥘 Открыть игру', web_app: { url: gameUrl } }]],
            resize_keyboard: true
        }
    });
}

async function handleText(
    text: string,
    chatId: number,
    adminId: number,
    supabase: SupabaseClient
): Promise<void> {
    const normalized = text.trim();
    if (normalized === '/start' || normalized === '/admin' || normalized === '/status') {
        await sendAdminPanel(chatId, supabase);
        return;
    }
    if (normalized === '/bots_on' || normalized === '/bots_off') {
        const enabled = normalized === '/bots_on';
        const settings = await updateSettings(supabase, adminId, normalized.slice(1), { bots_enabled: enabled });
        await sendAdminPanel(chatId, supabase, settings);
        return;
    }
    if (normalized === '/auto_on' || normalized === '/auto_off') {
        const enabled = normalized === '/auto_on';
        const settings = await updateSettings(supabase, adminId, normalized.slice(1), { auto_fill_enabled: enabled });
        await sendAdminPanel(chatId, supabase, settings);
        return;
    }

    const thresholdMatch = normalized.match(/^\/threshold\s+(\d+)$/);
    if (thresholdMatch) {
        const value = Number(thresholdMatch[1]);
        if (value < 0 || value > 10000) {
            await telegram('sendMessage', { chat_id: chatId, text: 'Порог должен быть от 0 до 10 000.' });
            return;
        }
        const settings = await updateSettings(supabase, adminId, 'set_activation_threshold', {
            activation_threshold: value
        });
        await sendAdminPanel(chatId, supabase, settings);
        return;
    }

    const targetMatch = normalized.match(/^\/target\s+(\d+)$/);
    if (targetMatch) {
        const value = Number(targetMatch[1]);
        if (value < 1 || value > 300) {
            await telegram('sendMessage', { chat_id: chatId, text: 'Размер пула должен быть от 1 до 300.' });
            return;
        }
        const settings = await updateSettings(supabase, adminId, 'set_target_pool_size', {
            target_pool_size: value
        });
        await sendAdminPanel(chatId, supabase, settings);
        return;
    }

    await telegram('sendMessage', {
        chat_id: chatId,
        text: [
            'Команды администратора:',
            '/status — состояние проекта',
            '/bots_on и /bots_off — главный выключатель 300 спартанцев',
            '/auto_on и /auto_off — автоматический или принудительный режим',
            '/threshold 10 — включать ботов, когда реальных игроков меньше 10',
            '/target 20 — заполнять пул до 20 участников'
        ].join('\n')
    });
}

Deno.serve(async (request) => {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    if (!botToken || !webhookSecret || adminIds.size === 0) {
        console.error('telegram-admin: required secrets are missing');
        return new Response('Server is not configured', { status: 503 });
    }
    if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== webhookSecret) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase is not configured');
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const update = await request.json() as TelegramUpdate;
        const callback = update.callback_query;
        const message = update.message;
        const senderId = callback?.from.id || message?.from?.id || 0;
        const chatId = callback?.message?.chat.id || message?.chat.id || 0;
        if (!chatId || !senderId) return new Response('OK');

        if (!adminIds.has(senderId)) {
            if (message?.text?.startsWith('/start')) await sendPlayerWelcome(chatId);
            if (callback) await telegram('answerCallbackQuery', { callback_query_id: callback.id, text: 'Нет доступа' });
            return new Response('OK');
        }

        if (callback) {
            let settings = await getSettings(supabase);
            if (callback.data === 'toggle:bots') {
                settings = await updateSettings(supabase, senderId, 'toggle_bots', {
                    bots_enabled: !settings.bots_enabled
                });
            } else if (callback.data === 'toggle:auto') {
                settings = await updateSettings(supabase, senderId, 'toggle_auto_fill', {
                    auto_fill_enabled: !settings.auto_fill_enabled
                });
            } else if (callback.data === 'toggle:maintenance') {
                settings = await updateSettings(supabase, senderId, 'toggle_maintenance', {
                    maintenance_mode: !settings.maintenance_mode
                });
            }
            await telegram('answerCallbackQuery', { callback_query_id: callback.id, text: 'Готово' });
            await sendAdminPanel(chatId, supabase, settings);
            return new Response('OK');
        }

        await handleText(message?.text || '', chatId, senderId, supabase);
        return new Response('OK');
    } catch (error) {
        console.error('telegram-admin:', error instanceof Error ? error.message : error);
        return new Response('Internal error', { status: 500 });
    }
});
