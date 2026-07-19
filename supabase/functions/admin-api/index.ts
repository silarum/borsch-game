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

function isOptionalFightTableError(error: { code?: string } | null): boolean {
    return Boolean(error && ['42P01', 'PGRST205'].includes(String(error.code || '')));
}

function isUuid(value: unknown): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
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
            const [settings, treasury, pools, poolTotals, tasks, spartans, players, sessions, activity, audit, fightClubs, fightTournaments, fightLeagues, fightChallenges, exchangeRequests, submittedMatches, clubTreasuries, contributionCampaigns, clubContributions] = await Promise.all([
                supabase.from('game_settings').select('*').eq('id', true).single(),
                supabase.from('project_treasury').select('*').eq('id', true).single(),
                supabase.from('game_pools').select('*').order('priority').order('created_at'),
                supabase.rpc('get_game_pools'),
                supabase.from('game_tasks').select('*').order('created_at', { ascending: false }),
                supabase.from('spartan_bots').select('id,name,srum_balance,srum_locked,rumir_balance,energy,mining_power,state,strategy,active,wins,losses,matches_played,current_pool_id').order('id'),
                supabase.from('game_accounts').select('telegram_user_id,nickname,srum_available,srum_locked,rumir_balance,usdt_balance,ton_balance,wins,losses,is_suspended,suspension_reason,updated_at').order('updated_at', { ascending: false }).limit(500),
                supabase.from('mining_sessions').select('participant_kind,status,stake_remaining_srum,pool_id'),
                supabase.from('spartan_activity').select('id,spartan_id,action,amount,pool_id,created_at').order('created_at', { ascending: false }).limit(30),
                supabase.from('admin_audit_log').select('id,telegram_admin_id,action,created_at').order('created_at', { ascending: false }).limit(30),
                supabase.from('fight_clubs').select('*').order('created_at', { ascending: false }).limit(500),
                supabase.from('fight_tournaments').select('*').order('created_at', { ascending: false }).limit(500),
                supabase.from('fight_leagues').select('*').order('tier').order('created_at', { ascending: false }).limit(500),
                supabase.from('fight_club_challenges').select('*').order('created_at', { ascending: false }).limit(500),
                supabase.from('silarum_exchange_requests').select('*').order('created_at', { ascending: false }).limit(500),
                supabase.from('fight_tournament_matches').select('*').eq('status', 'submitted').order('updated_at', { ascending: false }).limit(500),
                supabase.from('fight_club_treasuries').select('*').limit(500),
                supabase.from('fight_club_contribution_campaigns').select('*').order('month_start', { ascending: false }).limit(500),
                supabase.from('fight_club_contributions').select('*').order('created_at', { ascending: false }).limit(500)
            ]);
            const errors = [settings, treasury, pools, poolTotals, tasks, spartans, players, sessions, activity, audit]
                .map((result) => result.error)
                .filter(Boolean);
            for (const optionalResult of [fightClubs, fightTournaments, fightLeagues, fightChallenges, exchangeRequests, submittedMatches, clubTreasuries, contributionCampaigns, clubContributions]) {
                if (optionalResult.error && !isOptionalFightTableError(optionalResult.error)) errors.push(optionalResult.error);
            }
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
                fightClubs: fightClubs.error ? [] : fightClubs.data,
                fightTournaments: fightTournaments.error ? [] : fightTournaments.data,
                fightLeagues: fightLeagues.error ? [] : fightLeagues.data,
                fightChallenges: fightChallenges.error ? [] : fightChallenges.data,
                exchangeRequests: exchangeRequests.error ? [] : exchangeRequests.data,
                submittedMatches: submittedMatches.error ? [] : submittedMatches.data,
                clubTreasuries: clubTreasuries.error ? [] : clubTreasuries.data,
                contributionCampaigns: contributionCampaigns.error ? [] : contributionCampaigns.data,
                clubContributions: clubContributions.error ? [] : clubContributions.data,
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

        if (action === 'review_fight_club') {
            const clubId = String(payload.clubId || '');
            const status = String(payload.status || '');
            if (!isUuid(clubId) || !['pending', 'verified', 'suspended', 'rejected'].includes(status)) {
                return json({ error: 'Invalid club review' }, 400);
            }
            const previous = await supabase.from('fight_clubs').select('*').eq('id', clubId).single();
            if (previous.error) throw previous.error;
            const patch: Record<string, unknown> = {
                status,
                verification_note: String(payload.note || '').trim().slice(0, 500),
                updated_at: new Date().toISOString(),
                verified_at: status === 'verified' ? new Date().toISOString() : null,
                verified_by_telegram_id: status === 'verified' ? user.id : null
            };
            const result = await supabase.from('fight_clubs').update(patch).eq('id', clubId).select('*').single();
            if (result.error) throw result.error;
            if (status === 'rejected') {
                const members = await supabase.from('fight_club_members').update({ status: 'left', updated_at: new Date().toISOString() })
                    .eq('club_id', clubId).in('status', ['invited', 'active', 'suspended']);
                if (members.error) throw members.error;
            } else if (status === 'suspended') {
                const members = await supabase.from('fight_club_members').update({ status: 'suspended', updated_at: new Date().toISOString() })
                    .eq('club_id', clubId).in('status', ['invited', 'active']);
                if (members.error) throw members.error;
            } else if (previous.data.status === 'suspended') {
                const members = await supabase.from('fight_club_members').update({ status: 'active', updated_at: new Date().toISOString() })
                    .eq('club_id', clubId).eq('status', 'suspended');
                if (members.error) throw members.error;
            }
            const auditResult = await supabase.from('admin_audit_log').insert({
                telegram_admin_id: user.id,
                action: 'review_fight_club',
                old_value: previous.data,
                new_value: result.data
            });
            if (auditResult.error) throw auditResult.error;
            return json({ club: result.data });
        }

        if (action === 'review_fight_tournament') {
            const tournamentId = String(payload.tournamentId || '');
            const approvalStatus = String(payload.approvalStatus || '');
            if (!isUuid(tournamentId) || !['approved', 'rejected'].includes(approvalStatus)) {
                return json({ error: 'Invalid tournament review' }, 400);
            }
            const previous = await supabase.from('fight_tournaments').select('*').eq('id', tournamentId).single();
            if (previous.error) throw previous.error;
            const result = await supabase.rpc('server_review_fight_tournament', {
                p_tournament_id: tournamentId,
                p_admin_telegram_user_id: user.id,
                p_approval_status: approvalStatus
            });
            if (result.error) throw result.error;
            const auditResult = await supabase.from('admin_audit_log').insert({
                telegram_admin_id: user.id,
                action: 'review_fight_tournament',
                old_value: previous.data,
                new_value: result.data
            });
            if (auditResult.error) throw auditResult.error;
            return json({ tournament: result.data });
        }

        if (action === 'verify_tournament_match_result') {
            const matchId = String(payload.matchId || '');
            const winnerId = Number(payload.winnerTelegramUserId);
            if (!isUuid(matchId) || !Number.isSafeInteger(winnerId) || winnerId <= 0) return json({ error: 'Invalid match result' }, 400);
            const previous = await supabase.from('fight_tournament_matches').select('*').eq('id', matchId).single();
            if (previous.error) throw previous.error;
            const result = await supabase.rpc('server_verify_tournament_result', {
                p_match_id: matchId, p_verifier_telegram_user_id: user.id,
                p_winner_telegram_user_id: winnerId, p_platform_admin: true
            });
            if (result.error) throw result.error;
            const auditResult = await supabase.from('admin_audit_log').insert({
                telegram_admin_id: user.id, action: 'verify_tournament_match_result',
                old_value: previous.data, new_value: result.data
            });
            if (auditResult.error) throw auditResult.error;
            return json({ verification: result.data });
        }

        if (action === 'verify_club_challenge') {
            const challengeId = String(payload.challengeId || '');
            const winnerClubId = String(payload.winnerClubId || '');
            if (!isUuid(challengeId) || !isUuid(winnerClubId)) return json({ error: 'Invalid challenge result' }, 400);
            const previous = await supabase.from('fight_club_challenges').select('*').eq('id', challengeId).single();
            if (previous.error) throw previous.error;
            const result = await supabase.rpc('server_verify_club_challenge', {
                p_challenge_id: challengeId, p_admin_telegram_user_id: user.id, p_winner_club_id: winnerClubId
            });
            if (result.error) throw result.error;
            const auditResult = await supabase.from('admin_audit_log').insert({
                telegram_admin_id: user.id, action: 'verify_club_challenge', old_value: previous.data, new_value: result.data
            });
            if (auditResult.error) throw auditResult.error;
            return json({ challenge: result.data });
        }

        if (action === 'set_club_exchange_enabled') {
            const clubId = String(payload.clubId || '');
            if (!isUuid(clubId)) return json({ error: 'Invalid club id' }, 400);
            const club = await supabase.from('fight_clubs').select('id,status').eq('id', clubId).single();
            if (club.error) throw club.error;
            if (club.data.status !== 'verified' && Boolean(payload.enabled)) return json({ error: 'Verify club before enabling exchange requests' }, 409);
            const result = await supabase.from('fight_club_treasuries').upsert({
                club_id: clubId, exchange_enabled: Boolean(payload.enabled), updated_at: new Date().toISOString()
            }, { onConflict: 'club_id' }).select('*').single();
            if (result.error) throw result.error;
            const auditResult = await supabase.from('admin_audit_log').insert({
                telegram_admin_id: user.id, action: 'set_club_exchange_enabled', new_value: result.data
            });
            if (auditResult.error) throw auditResult.error;
            return json({ treasury: result.data });
        }

        if (action === 'review_silarum_exchange') {
            const requestId = String(payload.requestId || '');
            if (!isUuid(requestId)) return json({ error: 'Invalid exchange request' }, 400);
            const previous = await supabase.from('silarum_exchange_requests').select('*').eq('id', requestId).single();
            if (previous.error) throw previous.error;
            const result = await supabase.rpc('server_review_silarum_exchange', {
                p_request_id: requestId, p_admin_telegram_user_id: user.id, p_approved: Boolean(payload.approved)
            });
            if (result.error) throw result.error;
            const auditResult = await supabase.from('admin_audit_log').insert({
                telegram_admin_id: user.id, action: 'review_silarum_exchange', old_value: previous.data, new_value: result.data
            });
            if (auditResult.error) throw auditResult.error;
            return json({ exchange: result.data });
        }

        if (action === 'complete_silarum_exchange') {
            if (Deno.env.get('SILARUM_EXCHANGE_SETTLEMENT_ENABLED') !== 'true') {
                return json({ error: 'Exchange settlement is disabled until wallet verification is configured' }, 503);
            }
            const requestId = String(payload.requestId || '');
            const txHash = String(payload.txHash || '').trim();
            if (!isUuid(requestId) || txHash.length < 10 || txHash.length > 200) return json({ error: 'Invalid exchange transaction' }, 400);
            const previous = await supabase.from('silarum_exchange_requests').select('*').eq('id', requestId).single();
            if (previous.error) throw previous.error;
            const result = await supabase.rpc('server_complete_silarum_exchange', {
                p_request_id: requestId, p_admin_telegram_user_id: user.id, p_tx_hash: txHash
            });
            if (result.error) throw result.error;
            const auditResult = await supabase.from('admin_audit_log').insert({
                telegram_admin_id: user.id, action: 'complete_silarum_exchange', old_value: previous.data, new_value: result.data
            });
            if (auditResult.error) throw auditResult.error;
            return json({ exchange: result.data });
        }

        if (action === 'save_global_tournament') {
            assertObject(payload.tournament, 'tournament');
            const input = payload.tournament;
            const title = String(input.title || '').trim().slice(0, 120);
            const rulesText = String(input.rules_text || '').trim().slice(0, 5000);
            const discipline = String(input.discipline || 'fight');
            const format = String(input.format || 'knockout');
            const prizeType = String(input.prize_type || 'physical');
            const prizeCurrency = 'SILARUM';
            const startsAt = new Date(String(input.starts_at || ''));
            const registrationEndsAt = new Date(String(input.registration_ends_at || ''));
            if (title.length < 3 || !rulesText || Number.isNaN(startsAt.getTime()) || Number.isNaN(registrationEndsAt.getTime()) || registrationEndsAt > startsAt) {
                return json({ error: 'Invalid title, rules or dates' }, 400);
            }
            if (!['fight', 'borsch', 'mixed'].includes(discipline) || !['knockout', 'round_robin', 'groups_knockout'].includes(format)) {
                return json({ error: 'Invalid tournament discipline or format' }, 400);
            }
            if (!['food', 'silarum', 'physical', 'digital', 'mixed'].includes(prizeType) || prizeCurrency !== 'SILARUM') {
                return json({ error: 'Invalid prize' }, 400);
            }
            const worldLeague = await supabase.from('fight_leagues').select('id').eq('tier', 'world').eq('status', 'active').order('created_at').limit(1).maybeSingle();
            if (worldLeague.error && !isOptionalFightTableError(worldLeague.error)) throw worldLeague.error;
            const tournament = {
                organizer_type: 'platform', created_by_telegram_id: user.id, league_id: worldLeague.data?.id || null,
                league_tier: 'world', country_code: null, city: '', district: '', title,
                description: String(input.description || '').trim().slice(0, 2000), discipline, format,
                status: 'registration', approval_status: 'approved',
                max_participants: Math.max(2, Math.min(100000, Number(input.max_participants || 128))),
                min_rating: Math.max(0, Math.min(1000000, Number(input.min_rating || 0))), entry_silarum: 0,
                rules_text: rulesText, eligibility: { requires_qualification: true, qualifying_tier: 'city' }, prize_type: prizeType,
                prize_title: String(input.prize_title || '').trim().slice(0, 200),
                prize_fund_amount: Math.max(0, Number(input.prize_fund_amount || 0)), prize_currency: prizeCurrency,
                prize_fulfillment: 'manual_review', financial_payout_enabled: false,
                registration_ends_at: registrationEndsAt.toISOString(), starts_at: startsAt.toISOString(),
                min_age: Math.max(0, Math.min(99, Number(input.min_age || 18))), is_test_mode: true,
                reviewed_at: new Date().toISOString(), reviewed_by_telegram_id: user.id
            };
            if (!tournament.prize_title) return json({ error: 'Prize title is required' }, 400);
            const result = await supabase.from('fight_tournaments').insert(tournament).select('*').single();
            if (result.error) throw result.error;
            const auditResult = await supabase.from('admin_audit_log').insert({
                telegram_admin_id: user.id, action: 'save_global_tournament', new_value: result.data
            });
            if (auditResult.error) throw auditResult.error;
            return json({ tournament: result.data });
        }

        return json({ error: 'Unknown action' }, 400);
    } catch (error) {
        console.error('admin-api:', error instanceof Error ? error.message : error);
        const message = error instanceof Error ? error.message : 'Admin request failed';
        const isTelegramError = message.startsWith('Telegram ');
        return json({ error: isTelegramError ? message : 'Admin request failed' }, isTelegramError ? 401 : 500);
    }
});
