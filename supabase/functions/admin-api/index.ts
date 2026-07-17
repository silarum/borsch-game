import { createClient } from 'npm:@supabase/supabase-js@2.110.7';
import { validateTelegramInitData } from '../_shared/telegram-webapp.ts';
import { getTelegramWebhookSecret } from '../_shared/telegram-webhook.ts';
import { getSupabaseSecretKey } from '../_shared/supabase-key.ts';

const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://silarum.github.io';
const botToken = Deno.env.get('TELEGRAM_ADMIN_BOT_TOKEN') || '';
const configuredWebhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || '';
const adminIds = new Set(
    (Deno.env.get('ADMIN_TELEGRAM_IDS') || '')
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isSafeInteger(value) && value > 0)
);

const corsHeaders = {
    'Access-Control-Allow-Origin': appOrigin,
    'Access-Control-Allow-Headers': 'content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
};

function json(body: unknown, status = 200): Response {
    return Response.json(body, { status, headers: corsHeaders });
}

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label} must be an object`);
    }
}

Deno.serve(async (request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (request.headers.get('Origin') && request.headers.get('Origin') !== appOrigin) {
        return json({ error: 'Origin is not allowed' }, 403);
    }
    if (Number(request.headers.get('Content-Length') || 0) > 65536) {
        return json({ error: 'Request is too large' }, 413);
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const secretKey = getSupabaseSecretKey();
        const body = await request.json();
        assertObject(body, 'body');
        const action = String(body.action || 'bootstrap');
        if (action === 'health') {
            const services = {
                database: Boolean(supabaseUrl && secretKey),
                telegram: Boolean(botToken),
                adminAllowlist: adminIds.size > 0
            };
            return json({ ok: services.database && services.telegram, services }, services.database && services.telegram ? 200 : 503);
        }
        if (!supabaseUrl || !secretKey || !botToken) throw new Error('Admin server is not configured');

        const user = await validateTelegramInitData(String(body.initData || ''), botToken, 900);
        if (action === 'whoami') {
            return json({ telegramId: user.id, isAdmin: adminIds.has(user.id) });
        }
        if (!adminIds.has(user.id)) {
            return json({
                error: `Доступ не настроен. Ваш Telegram ID: ${user.id}`,
                telegramId: user.id
            }, 403);
        }

        const supabase = createClient(supabaseUrl, secretKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const payload = body.payload || {};
        assertObject(payload, 'payload');

        if (action === 'register_webhook') {
            const secretToken = await getTelegramWebhookSecret(botToken, configuredWebhookSecret);
            const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: `${supabaseUrl}/functions/v1/telegram-admin`,
                    secret_token: secretToken,
                    allowed_updates: ['message', 'callback_query'],
                    drop_pending_updates: false
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) throw new Error('Telegram webhook setup failed');
            return json({ webhook: true });
        }

        if (action === 'bootstrap') {
            const [settings, treasury, pools, poolTotals, tasks, spartans, players, sessions, activity, audit] = await Promise.all([
                supabase.from('game_settings').select('*').eq('id', true).single(),
                supabase.from('project_treasury').select('*').eq('id', true).single(),
                supabase.from('game_pools').select('*').order('priority').order('created_at'),
                supabase.rpc('get_game_pools'),
                supabase.from('game_tasks').select('*').order('created_at', { ascending: false }),
                supabase.from('spartan_bots').select('id,name,srum_balance,srum_locked,rumir_balance,energy,mining_power,state,strategy,active,wins,losses,matches_played,current_pool_id').order('id'),
                supabase.from('game_accounts').select('telegram_user_id,nickname,srum_available,srum_locked,rumir_balance,usdt_balance,ton_balance,wins,losses,is_suspended,suspension_reason,updated_at').order('updated_at', { ascending: false }).limit(500),
                supabase.from('mining_sessions').select('participant_kind,status,stake_remaining_srum,pool_id'),
                supabase.from('spartan_activity').select('id,spartan_id,action,amount,pool_id,created_at').order('created_at', { ascending: false }).limit(30),
                supabase.from('admin_audit_log').select('id,telegram_admin_id,action,created_at').order('created_at', { ascending: false }).limit(30)
            ]);
            const errors = [settings, treasury, pools, poolTotals, tasks, spartans, players, sessions, activity, audit]
                .map((result) => result.error)
                .filter(Boolean);
            if (errors.length) throw errors[0];

            return json({
                settings: settings.data,
                treasury: treasury.data,
                pools: pools.data,
                poolTotals: poolTotals.data,
                tasks: tasks.data,
                spartans: spartans.data,
                players: players.data,
                sessions: sessions.data,
                activity: activity.data,
                audit: audit.data,
                rules: {
                    stages: [10, 20, 40, 80, 100],
                    winnerSharePercent: 70,
                    treasurySharePercent: 30,
                    stageFiveRepeatsUntilLoss: true,
                    stageFiveRepeatsFor: 'human_miners_only',
                    spartanWinsAfterPreviousLoss: true,
                    spartanAlwaysWinsStageFive: true
                }
            });
        }

        if (action === 'update_settings') {
            assertObject(payload.patch, 'settings patch');
            const { data, error } = await supabase.rpc('admin_patch_game_settings', {
                p_admin_telegram_id: user.id,
                p_patch: payload.patch
            });
            if (error) throw error;
            return json({ settings: data });
        }

        if (action === 'save_pool') {
            assertObject(payload.pool, 'pool');
            const { data, error } = await supabase.rpc('admin_save_pool', {
                p_admin_telegram_id: user.id,
                p_pool: payload.pool
            });
            if (error) throw error;
            return json({ pool: data });
        }

        if (action === 'save_task') {
            assertObject(payload.task, 'task');
            const { data, error } = await supabase.rpc('admin_save_task', {
                p_admin_telegram_id: user.id,
                p_task: payload.task
            });
            if (error) throw error;
            return json({ task: data });
        }

        if (action === 'update_spartan') {
            assertObject(payload.patch, 'spartan patch');
            const spartanId = Number(payload.spartanId);
            if (!Number.isInteger(spartanId) || spartanId < 1 || spartanId > 300) {
                return json({ error: 'Invalid Spartan id' }, 400);
            }
            const { data, error } = await supabase.rpc('admin_update_spartan', {
                p_admin_telegram_id: user.id,
                p_spartan_id: spartanId,
                p_patch: payload.patch
            });
            if (error) throw error;
            return json({ spartan: data });
        }

        if (action === 'update_player_status') {
            const playerId = Number(payload.playerId);
            if (!Number.isSafeInteger(playerId) || playerId <= 0) return json({ error: 'Invalid player id' }, 400);
            const { data, error } = await supabase.rpc('admin_update_player_status', {
                p_admin_telegram_id: user.id,
                p_player_telegram_id: playerId,
                p_suspended: Boolean(payload.suspended),
                p_reason: String(payload.reason || '').slice(0, 300)
            });
            if (error) throw error;
            return json({ player: data });
        }

        if (action === 'run_spartans') {
            const { data, error } = await supabase.rpc('run_spartan_tick');
            if (error) throw error;
            return json({ worker: data });
        }

        return json({ error: 'Unknown action' }, 400);
    } catch (error) {
        console.error('admin-api:', error instanceof Error ? error.message : error);
        const message = error instanceof Error ? error.message : 'Admin request failed';
        const isTelegramError = message.startsWith('Telegram ');
        return json({ error: isTelegramError ? message : 'Admin request failed' }, isTelegramError ? 401 : 500);
    }
});
