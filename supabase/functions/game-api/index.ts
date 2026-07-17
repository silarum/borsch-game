import { createClient } from 'npm:@supabase/supabase-js@2.110.7';
import { validateTelegramInitData } from '../_shared/telegram-webapp.ts';
import { getSupabaseSecretKey } from '../_shared/supabase-key.ts';

const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://silarum.github.io';
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

Deno.serve(async (request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (request.headers.get('Origin') && request.headers.get('Origin') !== appOrigin) {
        return json({ error: 'Origin is not allowed' }, 403);
    }

    try {
        const body = await request.json();
        const botToken = Deno.env.get('TELEGRAM_GAME_BOT_TOKEN') || '';
        const user = await validateTelegramInitData(String(body.initData || ''), botToken);
        const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', getSupabaseSecretKey(), {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const nickname = String(user.username || user.first_name || 'Майнер').slice(0, 64);
        const action = String(body.action || 'load_player');
        const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};

        await supabase.from('player_presence').upsert({
            telegram_user_id: user.id,
            nickname,
            last_seen_at: new Date().toISOString()
        });
        const accountResult = await supabase.from('game_accounts').upsert({
            telegram_user_id: user.id,
            nickname
        }, { onConflict: 'telegram_user_id' }).select('*').single();
        if (accountResult.error) throw accountResult.error;

        if (action === 'load_player') {
            const [sessionResult, tasksResult] = await Promise.all([
                supabase.from('mining_sessions').select('id,pool_id,stage,stake_remaining_srum,status')
                    .eq('player_telegram_id', user.id).in('status', ['queued', 'matched', 'paused'])
                    .order('updated_at', { ascending: false }).limit(7),
                supabase.from('game_tasks').select('id,title,description,task_url,reward_currency,reward_amount,completion_limit,completions')
                    .eq('enabled', true).order('created_at', { ascending: false })
            ]);
            if (sessionResult.error) throw sessionResult.error;
            if (tasksResult.error) throw tasksResult.error;
            const account = accountResult.data;
            const currentSession = sessionResult.data?.[0];
            return json({
                player: {
                    nickname: account.nickname,
                    rum: Number(account.rumir_balance || 0),
                    srum: Number(account.srum_available || 0),
                    usdt: Number(account.usdt_balance || 0),
                    ton: Number(account.ton_balance || 0),
                    mining_stage: Number(currentSession?.stage || 1),
                    frozen_stake: Number(currentSession?.stake_remaining_srum || 0),
                    server_session_id: currentSession?.id || null,
                    games: 3,
                    status: 'solo'
                },
                sessions: sessionResult.data || [],
                tasks: tasksResult.data || []
            });
        }

        if (action === 'save_profile') {
            const requestedNickname = String(payload.nickname || nickname).trim().slice(0, 64);
            if (!requestedNickname) return json({ error: 'Nickname is required' }, 400);
            const { error } = await supabase.from('game_accounts')
                .update({ nickname: requestedNickname, updated_at: new Date().toISOString() })
                .eq('telegram_user_id', user.id);
            if (error) throw error;
            return json({ saved: true });
        }

        if (action === 'leaderboard') {
            const type = payload.type === 'srum' ? 'srum' : 'rum';
            const column = type === 'srum' ? 'srum_available' : 'rumir_balance';
            const { data, error } = await supabase.from('game_accounts')
                .select(`nickname,${column}`).order(column, { ascending: false }).limit(100);
            if (error) throw error;
            return json((data || []).map((row) => ({
                nickname: row.nickname,
                rum: type === 'rum' ? Number(row.rumir_balance || 0) : undefined,
                srum: type === 'srum' ? Number(row.srum_available || 0) : undefined
            })));
        }

        if (action === 'heartbeat') return json({ ok: true });
        return json({ error: 'Unknown action' }, 400);
    } catch (error) {
        console.error('game-api:', error instanceof Error ? error.message : error);
        const message = error instanceof Error ? error.message : '';
        return json({ error: message.startsWith('Telegram ') ? message : 'Game API failed' }, message.startsWith('Telegram ') ? 401 : 500);
    }
});
