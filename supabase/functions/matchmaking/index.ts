import { createClient } from 'npm:@supabase/supabase-js@2.110.7';
import { validateTelegramInitData } from '../_shared/telegram-webapp.ts';

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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
        if (!supabaseUrl || !serviceRoleKey || !botToken) throw new Error('Server is not configured');

        const body = await request.json();
        const user = await validateTelegramInitData(String(body.initData || ''), botToken);
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const nickname = String(user.username || user.first_name || 'Майнер').slice(0, 64);

        const { error: presenceError } = await supabase.from('player_presence').upsert({
            telegram_user_id: user.id,
            nickname,
            last_seen_at: new Date().toISOString()
        });
        if (presenceError) throw presenceError;

        if (body.action === 'join') {
            const stage = Math.max(1, Math.min(5, Number(body.stage) || 1));
            const stake = Math.max(0.01, Math.min(5, Number(body.stake) || 1));
            const { data, error } = await supabase.rpc('claim_training_spartan', {
                p_player_telegram_id: user.id,
                p_stage: stage,
                p_stake_demo_srum: stake
            });
            if (error) {
                if (error.message.includes('maintenance mode')) return json({ status: 'maintenance' }, 503);
                throw error;
            }
            const match = Array.isArray(data) ? data[0] : data;
            if (!match) return json({ status: 'waiting', training: false });

            return json({
                status: 'matched',
                training: true,
                disclosure: 'Тренировочный соперник из пула 300 спартанцев. Денежные награды не используются.',
                matchId: match.match_id,
                realPlayers: Number(match.real_players) || 0,
                botsInPool: Number(match.bots_in_pool) || 0,
                bot: {
                    id: Number(match.bot_id),
                    name: String(match.bot_name),
                    speed: Number(match.bot_speed_ms),
                    behavior: String(match.bot_behavior)
                }
            });
        }

        if (body.action === 'resolve') {
            const matchId = String(body.matchId || '');
            if (!/^[0-9a-f-]{36}$/i.test(matchId)) return json({ error: 'Invalid match id' }, 400);
            const { data, error } = await supabase.rpc('resolve_training_spartan', {
                p_match_id: matchId,
                p_player_telegram_id: user.id,
                p_player_won: Boolean(body.playerWon)
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
