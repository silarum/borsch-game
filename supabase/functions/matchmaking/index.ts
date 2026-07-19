import { createClient } from 'npm:@supabase/supabase-js@2.110.7';
import { validateTelegramInitData } from '../_shared/telegram-webapp.ts';
import { getSupabaseSecretKey } from '../_shared/supabase-key.ts';

const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://silarum.github.io';
const corsHeaders = {
    'Access-Control-Allow-Origin': appOrigin,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
};

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
}

Deno.serve(async (request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (request.headers.get('Origin') && request.headers.get('Origin') !== appOrigin) {
        return json({ error: 'Origin is not allowed' }, 403);
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const serviceRoleKey = getSupabaseSecretKey();
        const botToken = Deno.env.get('TELEGRAM_GAME_BOT_TOKEN') || '';
        if (!supabaseUrl || !serviceRoleKey || !botToken) throw new Error('Server is not configured');

        const body = await request.json();
        const user = await validateTelegramInitData(String(body.initData || ''), botToken);
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const nickname = String(user.username || user.first_name || 'Майнер').slice(0, 64);

        if (body.action === 'pools') {
            const { data, error } = await supabase.rpc('get_game_pools');
            if (error) throw error;
            return json({ pools: data || [] });
        }

        if (body.action === 'join') {
            let poolId = String(body.poolId || '');
            if (!/^[0-9a-f-]{36}$/i.test(poolId)) {
                const pools = await supabase.rpc('get_game_pools');
                if (pools.error) throw pools.error;
                poolId = String(Array.isArray(pools.data) ? pools.data[0]?.id || '' : '');
            }
            if (!/^[0-9a-f-]{36}$/i.test(poolId)) return json({ error: 'Нет активных пулов' }, 409);
            const stake = Math.max(0.01, Math.min(300, Number(body.stake) || 1));
            const sessionId = String(body.sessionId || '');
            const worker = await supabase.rpc('run_spartan_tick');
            if (worker.error) throw worker.error;
            const { data, error } = await supabase.rpc('join_game_pool', {
                p_player_telegram_id: user.id,
                p_nickname: nickname,
                p_pool_id: poolId,
                p_stake_srum: stake,
                p_session_id: /^[0-9a-f-]{36}$/i.test(sessionId) ? sessionId : null
            });
            if (error) {
                if (error.message.includes('maintenance mode')) return json({ status: 'maintenance' }, 503);
                throw error;
            }
            return json(data || { status: 'waiting' });
        }

        if (body.action === 'resolve') {
            const matchId = String(body.matchId || '');
            if (!/^[0-9a-f-]{36}$/i.test(matchId)) return json({ error: 'Invalid match id' }, 400);
            const score = Number(body.playerScore);
            if (!Number.isInteger(score) || score < 0 || score > 60) return json({ error: 'Invalid score' }, 400);
            const { data, error } = await supabase.rpc('resolve_game_pool_match_silarum', {
                p_match_id: matchId,
                p_player_telegram_id: user.id,
                p_player_score: score
            });
            if (error) throw error;
            return json(data);
        }

        if (body.action === 'result') {
            const matchId = String(body.matchId || '');
            if (!/^[0-9a-f-]{36}$/i.test(matchId)) return json({ error: 'Invalid match id' }, 400);
            const { data, error } = await supabase.rpc('get_game_pool_match_result', {
                p_match_id: matchId,
                p_player_telegram_id: user.id
            });
            if (error) throw error;
            return json(data);
        }

        if (body.action === 'cancel') {
            const matchId = String(body.matchId || '');
            if (!/^[0-9a-f-]{36}$/i.test(matchId)) return json({ error: 'Invalid match id' }, 400);
            const cancelled = await supabase.rpc('cancel_game_pool_match', {
                p_match_id: matchId,
                p_player_telegram_id: user.id
            });
            if (cancelled.error) throw cancelled.error;
            const sessionId = String(cancelled.data?.session_id || '');
            if (/^[0-9a-f-]{36}$/i.test(sessionId)) {
                const closed = await supabase.rpc('close_game_pool_session', {
                    p_player_telegram_id: user.id,
                    p_session_id: sessionId
                });
                if (closed.error) throw closed.error;
            }
            return json({ status: 'cancelled' });
        }

        if (body.action === 'close') {
            const sessionId = String(body.sessionId || '');
            if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return json({ error: 'Invalid session id' }, 400);
            const { data, error } = await supabase.rpc('close_game_pool_session', {
                p_player_telegram_id: user.id,
                p_session_id: sessionId
            });
            if (error) throw error;
            return json(data);
        }

        return json({ error: 'Unknown action' }, 400);
    } catch (error) {
        console.error('matchmaking:', error instanceof Error ? error.message : error);
        const message = error instanceof Error && error.message.startsWith('Telegram ')
            ? error.message
            : 'Matchmaking failed';
        return json({ error: message }, message.startsWith('Telegram ') ? 401 : 500);
    }
});
