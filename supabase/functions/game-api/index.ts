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
        const body = await request.json();
        const botToken = Deno.env.get('TELEGRAM_GAME_BOT_TOKEN') || '';
        const user = await validateTelegramInitData(String(body.initData || ''), botToken);
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabase = createClient(supabaseUrl, getSupabaseSecretKey(), {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const nickname = String(user.username || user.first_name || 'Майнер').slice(0, 64);
        const action = String(body.action || 'load_player');
        const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
        const hasClubPermission = async (clubId: string, permission: string, ownerOnly = false): Promise<boolean> => {
            if (!isUuid(clubId)) return false;
            const clubResult = await supabase.from('fight_clubs').select('owner_telegram_user_id').eq('id', clubId).maybeSingle();
            if (clubResult.error) throw clubResult.error;
            if (Number(clubResult.data?.owner_telegram_user_id) === user.id) return true;
            if (ownerOnly) return false;
            const memberResult = await supabase.from('fight_club_members').select('role,permissions').eq('club_id', clubId)
                .eq('telegram_user_id', user.id).eq('status', 'active').maybeSingle();
            if (memberResult.error) throw memberResult.error;
            const permissions = memberResult.data?.permissions && typeof memberResult.data.permissions === 'object'
                ? memberResult.data.permissions as Record<string, unknown> : {};
            return permissions[permission] === true;
        };

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

        if (action === 'fight_hub') {
            const [clubs, tournaments, membership, ownedClub, registrations] = await Promise.all([
                supabase.from('fight_clubs').select('id,name,venue_name,venue_type,country_code,region,city,district,address,description,status,rating,member_count').eq('status', 'verified').order('rating', { ascending: false }).limit(500),
                supabase.from('fight_tournaments').select('*').in('status', ['registration', 'live', 'finished']).order('starts_at').limit(500),
                supabase.from('fight_club_members').select('*').eq('telegram_user_id', user.id).in('status', ['invited', 'active']).maybeSingle(),
                supabase.from('fight_clubs').select('*').eq('owner_telegram_user_id', user.id).in('status', ['pending', 'verified', 'suspended']).maybeSingle(),
                supabase.from('fight_tournament_registrations').select('*').eq('telegram_user_id', user.id).order('registered_at', { ascending: false }).limit(100)
            ]);
            const error = [clubs, tournaments, membership, ownedClub, registrations].map((result) => result.error).find(Boolean);
            if (error) throw error;
            const memberPermissions = membership.data?.permissions && typeof membership.data.permissions === 'object' ? membership.data.permissions : {};
            const ownsClub = Boolean(ownedClub.data);
            const canManageSection = (permission: string): boolean => ownsClub || memberPermissions[permission] === true;
            const canManageClub = Boolean(ownsClub || (membership.data && Object.values(memberPermissions).some((value) => value === true)));
            let managedClub = ownedClub.data || null;
            if (!managedClub && canManageClub && membership.data?.club_id) {
                const managedClubResult = await supabase.from('fight_clubs').select('*').eq('id', membership.data.club_id).maybeSingle();
                if (managedClubResult.error) throw managedClubResult.error;
                managedClub = managedClubResult.data;
            }
            let tournamentRows = tournaments.data || [];
            if (managedClub && canManageSection('manage_tournaments')) {
                const managedTournamentResult = await supabase.from('fight_tournaments').select('*')
                    .eq('organizer_club_id', managedClub.id).order('created_at', { ascending: false }).limit(500);
                if (managedTournamentResult.error) throw managedTournamentResult.error;
                const byId = new Map(tournamentRows.map((item) => [item.id, item]));
                for (const item of managedTournamentResult.data || []) byId.set(item.id, item);
                tournamentRows = Array.from(byId.values());
            }
            const tournamentIds = tournamentRows.map((item) => item.id);
            let registrationCounts: Record<string, number> = {};
            let playerMatches: Array<Record<string, unknown>> = [];
            let managedMatches: Array<Record<string, unknown>> = [];
            let managedRegistrations: Array<Record<string, unknown>> = [];
            const winnerVoucherResult = await supabase.from('club_reward_vouchers').select('*')
                .eq('winner_telegram_user_id', user.id).order('created_at', { ascending: false }).limit(100);
            if (winnerVoucherResult.error) throw winnerVoucherResult.error;
            let managedVouchers: Array<Record<string, unknown>> = [];
            if (tournamentIds.length) {
                const countRows = await supabase.from('fight_tournament_registrations')
                    .select('tournament_id').in('tournament_id', tournamentIds).neq('status', 'withdrawn').limit(10000);
                if (countRows.error) throw countRows.error;
                registrationCounts = (countRows.data || []).reduce((counts: Record<string, number>, row) => {
                    counts[row.tournament_id] = Number(counts[row.tournament_id] || 0) + 1;
                    return counts;
                }, {});
                const playerMatchResult = await supabase.from('fight_tournament_matches').select('*')
                    .in('tournament_id', tournamentIds)
                    .or(`player_one_telegram_id.eq.${user.id},player_two_telegram_id.eq.${user.id}`)
                    .order('round_number').order('match_number');
                if (playerMatchResult.error) throw playerMatchResult.error;
                playerMatches = playerMatchResult.data || [];
                if (managedClub && canManageSection('manage_tournaments')) {
                    const managedTournamentIds = tournamentRows
                        .filter((item) => item.organizer_club_id === managedClub.id).map((item) => item.id);
                    if (managedTournamentIds.length) {
                        const [managedMatchResult, managedRegistrationResult] = await Promise.all([
                            supabase.from('fight_tournament_matches').select('*').in('tournament_id', managedTournamentIds).order('round_number').order('match_number'),
                            supabase.from('fight_tournament_registrations').select('tournament_id,telegram_user_id,nickname,fighter_key,status').in('tournament_id', managedTournamentIds)
                        ]);
                        if (managedMatchResult.error) throw managedMatchResult.error;
                        if (managedRegistrationResult.error) throw managedRegistrationResult.error;
                        managedMatches = managedMatchResult.data || [];
                        managedRegistrations = managedRegistrationResult.data || [];
                    }
                }
            }
            let clubRoster: Array<Record<string, unknown>> = [];
            let clubNews: Array<Record<string, unknown>> = [];
            let clubChallenges: Array<Record<string, unknown>> = [];
            let clubMiningOrders: Array<Record<string, unknown>> = [];
            let clubPrizeCatalog: Array<Record<string, unknown>> = [];
            let clubExchangeRequests: Array<Record<string, unknown>> = [];
            let clubContributions: Array<Record<string, unknown>> = [];
            let clubTreasury = null;
            let clubTreasuryLedger: Array<Record<string, unknown>> = [];
            if (managedClub) {
                if (canManageSection('manage_tournaments') || canManageSection('redeem_rewards')) {
                    const voucherResult = await supabase.from('club_reward_vouchers').select('*')
                        .eq('club_id', managedClub.id).order('created_at', { ascending: false }).limit(500);
                    if (voucherResult.error) throw voucherResult.error;
                    managedVouchers = voucherResult.data || [];
                }
                const canSeeRoster = canManageSection('manage_roster') || canManageSection('manage_mining');
                const canSeeTreasury = canManageSection('manage_treasury');
                const [rosterResult, newsResult, challengeResult, miningResult, catalogResult, exchangeResult, treasuryResult, ledgerResult, contributionResult] = await Promise.all([
                    canSeeRoster ? supabase.from('fight_club_members').select('*').eq('club_id', managedClub.id).neq('status', 'left').order('role').order('rating', { ascending: false }) : Promise.resolve({ data: [], error: null }),
                    canManageSection('manage_news') ? supabase.from('fight_club_news_posts').select('*').eq('club_id', managedClub.id).neq('status', 'archived').order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
                    canManageSection('manage_challenges') ? supabase.from('fight_club_challenges').select('*').or(`challenger_club_id.eq.${managedClub.id},defender_club_id.eq.${managedClub.id}`).order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
                    canManageSection('manage_mining') ? supabase.from('fight_club_mining_orders').select('*').eq('club_id', managedClub.id).order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
                    (canManageSection('manage_tournaments') || canManageSection('redeem_rewards')) ? supabase.from('fight_club_prize_catalog').select('*').eq('club_id', managedClub.id).neq('status', 'archived').order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
                    canSeeTreasury ? supabase.from('silarum_exchange_requests').select('*').eq('source_type', 'club').eq('source_club_id', managedClub.id).order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
                    canSeeTreasury ? supabase.from('fight_club_treasuries').select('*').eq('club_id', managedClub.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
                    canSeeTreasury ? supabase.from('fight_club_treasury_ledger').select('*').eq('club_id', managedClub.id).order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
                    canSeeTreasury ? supabase.from('fight_club_contributions').select('*').eq('club_id', managedClub.id).order('created_at', { ascending: false }).limit(500) : Promise.resolve({ data: [], error: null })
                ]);
                const managedError = [rosterResult, newsResult, challengeResult, miningResult, catalogResult, exchangeResult, treasuryResult, ledgerResult, contributionResult]
                    .map((result) => result.error).find(Boolean);
                if (managedError) throw managedError;
                clubRoster = rosterResult.data || [];
                clubNews = newsResult.data || [];
                clubChallenges = challengeResult.data || [];
                clubMiningOrders = miningResult.data || [];
                clubPrizeCatalog = catalogResult.data || [];
                clubExchangeRequests = exchangeResult.data || [];
                clubTreasury = treasuryResult.data;
                clubTreasuryLedger = ledgerResult.data || [];
                clubContributions = contributionResult.data || [];
            }
            const [publicNewsResult, publicChallengesResult, poolsResult, fighterMiningOrdersResult] = await Promise.all([
                supabase.from('fight_club_news_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(500),
                supabase.from('fight_club_challenges').select('*').in('status', ['accepted', 'live', 'finished']).order('proposed_starts_at', { ascending: false }).limit(500),
                supabase.from('game_pools').select('id,name,entry_srum_min,entry_srum_max,entry_srum_default,enabled').eq('enabled', true).order('priority'),
                supabase.from('fight_club_mining_orders').select('*').eq('fighter_telegram_user_id', user.id).in('status', ['pending_consent', 'queued', 'active']).order('created_at', { ascending: false }).limit(100)
            ]);
            const publicError = [publicNewsResult, publicChallengesResult, poolsResult, fighterMiningOrdersResult].map((result) => result.error).find(Boolean);
            if (publicError) throw publicError;
            let contributionCampaign = null;
            if (membership.data?.club_id && membership.data.status === 'active') {
                const monthStart = new Date();
                monthStart.setUTCDate(1);
                const campaignResult = await supabase.from('fight_club_contribution_campaigns').select('*')
                    .eq('club_id', membership.data.club_id).eq('month_start', monthStart.toISOString().slice(0, 10))
                    .maybeSingle();
                if (campaignResult.error) throw campaignResult.error;
                contributionCampaign = campaignResult.data;
            }
            return json({
                clubs: clubs.data || [], tournaments: tournamentRows, membership: membership.data,
                ownedClub: ownedClub.data, managedClub, canManageClub, memberPermissions, registrations: registrations.data || [], registrationCounts,
                playerMatches, managedMatches, managedRegistrations,
                winnerVouchers: winnerVoucherResult.data || [], managedVouchers,
                clubRoster, clubNews, clubChallenges, clubMiningOrders, clubPrizeCatalog, clubExchangeRequests,
                clubTreasury, clubTreasuryLedger, clubContributions, contributionCampaign,
                publicNews: publicNewsResult.data || [], publicChallenges: publicChallengesResult.data || [], pools: poolsResult.data || [],
                fighterMiningOrders: fighterMiningOrdersResult.data || []
            });
        }

        if (action === 'create_fight_club') {
            const input = payload.club && typeof payload.club === 'object' ? payload.club as Record<string, unknown> : {};
            const club = {
                owner_telegram_user_id: user.id, owner_nickname: nickname,
                name: String(input.name || '').trim().slice(0, 80),
                venue_name: String(input.venueName || '').trim().slice(0, 120),
                venue_type: String(input.venueType || 'fast_food'),
                country_code: String(input.countryCode || '').trim().toUpperCase().slice(0, 2),
                region: String(input.region || '').trim().slice(0, 100),
                city: String(input.city || '').trim().slice(0, 100),
                district: String(input.district || '').trim().slice(0, 100),
                address: String(input.address || '').trim().slice(0, 240),
                description: String(input.description || '').trim().slice(0, 1000),
                status: 'pending'
            };
            if (club.name.length < 2 || club.venue_name.length < 2 || !/^[A-Z]{2}$/.test(club.country_code) || !club.city) {
                return json({ error: 'Invalid club application' }, 400);
            }
            if (!['fast_food', 'cafe', 'restaurant', 'food_court', 'other'].includes(club.venue_type)) {
                return json({ error: 'Invalid venue type' }, 400);
            }
            const result = await supabase.from('fight_clubs').insert(club).select('*').single();
            if (result.error) throw result.error;
            const memberResult = await supabase.from('fight_club_members').insert({
                club_id: result.data.id, telegram_user_id: user.id, nickname, role: 'owner', status: 'active'
            });
            if (memberResult.error) {
                await supabase.from('fight_clubs').delete().eq('id', result.data.id).eq('owner_telegram_user_id', user.id);
                throw memberResult.error;
            }
            const treasuryResult = await supabase.from('fight_club_treasuries').insert({ club_id: result.data.id });
            if (treasuryResult.error) {
                await supabase.from('fight_clubs').delete().eq('id', result.data.id).eq('owner_telegram_user_id', user.id);
                throw treasuryResult.error;
            }
            return json({ club: result.data });
        }

        if (action === 'update_fight_club') {
            const input = payload.club && typeof payload.club === 'object' ? payload.club as Record<string, unknown> : {};
            const clubId = String(input.id || '');
            if (!isUuid(clubId)) return json({ error: 'Invalid club id' }, 400);
            const patch = {
                name: String(input.name || '').trim().slice(0, 80),
                description: String(input.description || '').trim().slice(0, 1000),
                address: String(input.address || '').trim().slice(0, 240),
                updated_at: new Date().toISOString()
            };
            if (patch.name.length < 2) return json({ error: 'Invalid club name' }, 400);
            if (!await hasClubPermission(clubId, 'manage_profile')) return json({ error: 'Club profile access required' }, 403);
            const result = await supabase.from('fight_clubs').update(patch)
                .eq('id', clubId).select('*').maybeSingle();
            if (result.error) throw result.error;
            if (!result.data) return json({ error: 'Club not found or access denied' }, 404);
            return json({ club: result.data });
        }

        if (action === 'join_fight_club') {
            const clubId = String(payload.clubId || '');
            if (!isUuid(clubId)) return json({ error: 'Invalid club id' }, 400);
            const fighterKey = String(payload.fighterKey || 'alpha').trim().slice(0, 50) || 'alpha';
            const result = await supabase.rpc('server_join_fight_club', {
                p_club_id: clubId, p_telegram_user_id: user.id, p_nickname: nickname, p_fighter_key: fighterKey
            });
            if (result.error) throw result.error;
            return json({ membership: result.data });
        }

        if (action === 'leave_fight_club') {
            const clubId = String(payload.clubId || '');
            if (!isUuid(clubId)) return json({ error: 'Invalid club id' }, 400);
            const result = await supabase.rpc('server_leave_fight_club', {
                p_club_id: clubId, p_telegram_user_id: user.id
            });
            if (result.error) throw result.error;
            return json({ membership: result.data });
        }

        if (action === 'update_club_member_permissions') {
            const clubId = String(payload.clubId || '');
            const memberId = Number(payload.memberTelegramUserId);
            if (!isUuid(clubId) || !Number.isSafeInteger(memberId) || memberId <= 0 || !await hasClubPermission(clubId, 'delegate_permissions', true)) {
                return json({ error: 'Club owner access required' }, 403);
            }
            const role = ['fighter', 'manager', 'section_manager', 'referee'].includes(String(payload.role)) ? String(payload.role) : 'fighter';
            const allowed = ['manage_profile', 'manage_tournaments', 'manage_news', 'manage_roster', 'manage_mining', 'manage_treasury', 'manage_challenges', 'redeem_rewards', 'referee'];
            const requested = payload.permissions && typeof payload.permissions === 'object' ? payload.permissions as Record<string, unknown> : {};
            const permissions = Object.fromEntries(allowed.map((key) => [key, requested[key] === true]));
            const result = await supabase.from('fight_club_members').update({ role, permissions, updated_at: new Date().toISOString() })
                .eq('club_id', clubId).eq('telegram_user_id', memberId).neq('role', 'owner').select('*').maybeSingle();
            if (result.error) throw result.error;
            if (!result.data) return json({ error: 'Member not found' }, 404);
            return json({ member: result.data });
        }

        if (action === 'fund_club_treasury') {
            const clubId = String(payload.clubId || '');
            const amount = Number(payload.amountSilarum);
            if (!isUuid(clubId) || !Number.isFinite(amount) || amount <= 0 || !await hasClubPermission(clubId, 'manage_treasury')) {
                return json({ error: 'Treasury access required' }, 403);
            }
            const result = await supabase.rpc('server_fund_club_treasury', {
                p_club_id: clubId, p_actor_telegram_user_id: user.id, p_amount_silarum: amount
            });
            if (result.error) throw result.error;
            return json({ treasury: result.data });
        }

        if (action === 'save_club_contribution_campaign') {
            const clubId = String(payload.clubId || '');
            const suggested = Number(payload.suggestedSilarum);
            if (!isUuid(clubId) || !Number.isFinite(suggested) || suggested <= 0 || !await hasClubPermission(clubId, 'manage_treasury')) {
                return json({ error: 'Treasury access required' }, 403);
            }
            const current = new Date();
            const monthStart = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1)).toISOString().slice(0, 10);
            const result = await supabase.from('fight_club_contribution_campaigns').upsert({
                club_id: clubId, month_start: monthStart,
                suggested_silarum: Math.min(1000000, suggested),
                message: String(payload.message || '').trim().slice(0, 500),
                enabled: Boolean(payload.enabled), created_by_telegram_user_id: user.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'club_id,month_start' }).select('*').single();
            if (result.error) throw result.error;
            return json({ campaign: result.data });
        }

        if (action === 'contribute_club_monthly') {
            const requestId = String(payload.requestId || '');
            const campaignId = String(payload.campaignId || '');
            const amount = Number(payload.amountSilarum);
            if (!isUuid(requestId) || !isUuid(campaignId) || !Number.isFinite(amount) || amount <= 0) return json({ error: 'Invalid contribution' }, 400);
            const result = await supabase.rpc('server_contribute_club_monthly', {
                p_request_id: requestId,
                p_campaign_id: campaignId, p_telegram_user_id: user.id, p_nickname: nickname,
                p_amount_silarum: amount, p_publish_on_wall: payload.publishOnWall !== false
            });
            if (result.error) throw result.error;
            return json({ contribution: result.data });
        }

        if (action === 'save_club_news') {
            const clubId = String(payload.clubId || '');
            if (!isUuid(clubId) || !await hasClubPermission(clubId, 'manage_news')) return json({ error: 'News access required' }, 403);
            const postType = ['news', 'tournament', 'challenge', 'result'].includes(String(payload.postType)) ? String(payload.postType) : 'news';
            const title = String(payload.title || '').trim().slice(0, 160);
            const bodyText = String(payload.body || '').trim().slice(0, 5000);
            const posterUrl = String(payload.posterUrl || '').trim();
            if (title.length < 2 || (posterUrl && (!posterUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/club-posters/`) || posterUrl.length > 500))) {
                return json({ error: 'Invalid news post' }, 400);
            }
            const result = await supabase.from('fight_club_news_posts').insert({
                club_id: clubId, author_telegram_user_id: user.id, post_type: postType,
                title, body: bodyText, poster_url: posterUrl || null, status: 'published', published_at: new Date().toISOString()
            }).select('*').single();
            if (result.error) throw result.error;
            return json({ post: result.data });
        }

        if (action === 'save_club_prize') {
            const clubId = String(payload.clubId || '');
            if (!isUuid(clubId) || !await hasClubPermission(clubId, 'manage_tournaments')) return json({ error: 'Prize catalog access required' }, 403);
            const prizeType = ['food', 'coupon', 'physical', 'digital', 'silarum'].includes(String(payload.prizeType)) ? String(payload.prizeType) : 'food';
            const title = String(payload.title || '').trim().slice(0, 200);
            const price = Number(payload.priceSilarum);
            const stock = Math.max(0, Math.min(1000000, Number(payload.stock || 0)));
            if (title.length < 2 || !Number.isFinite(price) || price <= 0) return json({ error: 'Invalid prize' }, 400);
            const result = await supabase.from('fight_club_prize_catalog').insert({
                club_id: clubId, title, description: String(payload.description || '').trim().slice(0, 1000),
                prize_type: prizeType, price_silarum: price, stock, status: 'active'
            }).select('*').single();
            if (result.error) throw result.error;
            return json({ prize: result.data });
        }

        if (action === 'create_club_challenge') {
            const challengerClubId = String(payload.challengerClubId || '');
            const defenderClubId = String(payload.defenderClubId || '');
            if (!isUuid(challengerClubId) || !isUuid(defenderClubId) || challengerClubId === defenderClubId || !await hasClubPermission(challengerClubId, 'manage_challenges')) {
                return json({ error: 'Challenge access required' }, 403);
            }
            const defender = await supabase.from('fight_clubs').select('id').eq('id', defenderClubId).eq('status', 'verified').maybeSingle();
            if (defender.error) throw defender.error;
            if (!defender.data) return json({ error: 'Defender club is unavailable' }, 404);
            const startsAt = new Date(String(payload.proposedStartsAt || ''));
            if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) return json({ error: 'Invalid challenge date' }, 400);
            const result = await supabase.from('fight_club_challenges').insert({
                challenger_club_id: challengerClubId, defender_club_id: defenderClubId,
                created_by_telegram_user_id: user.id, title: String(payload.title || '').trim().slice(0, 160),
                message: String(payload.message || '').trim().slice(0, 2000), proposed_starts_at: startsAt.toISOString(),
                format: ['single', 'best_of_3', 'team_5x5'].includes(String(payload.format)) ? String(payload.format) : 'best_of_3',
                rating_points: Math.max(0, Math.min(1000, Number(payload.ratingPoints || 25)))
            }).select('*').single();
            if (result.error) throw result.error;
            return json({ challenge: result.data });
        }

        if (action === 'respond_club_challenge') {
            const challengeId = String(payload.challengeId || '');
            if (!isUuid(challengeId)) return json({ error: 'Invalid challenge id' }, 400);
            const challenge = await supabase.from('fight_club_challenges').select('*').eq('id', challengeId).eq('status', 'pending').single();
            if (challenge.error) throw challenge.error;
            if (!await hasClubPermission(challenge.data.defender_club_id, 'manage_challenges')) return json({ error: 'Challenge access required' }, 403);
            const accepted = Boolean(payload.accepted);
            const result = await supabase.from('fight_club_challenges').update({
                status: accepted ? 'accepted' : 'declined', accepted_by_telegram_user_id: user.id, updated_at: new Date().toISOString()
            }).eq('id', challengeId).eq('status', 'pending').select('*').single();
            if (result.error) throw result.error;
            return json({ challenge: result.data });
        }

        if (action === 'create_club_mining_order') {
            const clubId = String(payload.clubId || '');
            const fighterId = Number(payload.fighterTelegramUserId);
            const poolId = String(payload.poolId || '');
            const entry = Number(payload.entrySilarum);
            const clubPercent = Math.max(0, Math.min(100, Number(payload.rewardToClubPercent ?? 100)));
            if (!isUuid(clubId) || !isUuid(poolId) || !Number.isSafeInteger(fighterId) || fighterId <= 0 || !Number.isFinite(entry) || entry <= 0 || !await hasClubPermission(clubId, 'manage_mining')) {
                return json({ error: 'Mining management access required' }, 403);
            }
            const [fighter, pool] = await Promise.all([
                supabase.from('fight_club_members').select('telegram_user_id').eq('club_id', clubId).eq('telegram_user_id', fighterId).eq('status', 'active').maybeSingle(),
                supabase.from('game_pools').select('id,entry_srum_min,entry_srum_max').eq('id', poolId).eq('enabled', true).maybeSingle()
            ]);
            if (fighter.error) throw fighter.error;
            if (pool.error) throw pool.error;
            if (!fighter.data || !pool.data || entry < Number(pool.data.entry_srum_min) || entry > Number(pool.data.entry_srum_max)) return json({ error: 'Invalid fighter, pool or entry' }, 400);
            const result = await supabase.from('fight_club_mining_orders').insert({
                club_id: clubId, created_by_telegram_user_id: user.id, fighter_telegram_user_id: fighterId,
                pool_id: poolId, entry_silarum: entry, reward_to_club_percent: clubPercent
            }).select('*').single();
            if (result.error) throw result.error;
            return json({ order: result.data });
        }

        if (action === 'respond_club_mining_order') {
            const orderId = String(payload.orderId || '');
            if (!isUuid(orderId)) return json({ error: 'Invalid mining order' }, 400);
            if (!Boolean(payload.accepted)) {
                const declined = await supabase.from('fight_club_mining_orders').update({
                    fighter_consent_status: 'declined', status: 'cancelled', updated_at: new Date().toISOString()
                }).eq('id', orderId).eq('fighter_telegram_user_id', user.id).eq('fighter_consent_status', 'pending').select('*').single();
                if (declined.error) throw declined.error;
                return json({ order: declined.data });
            }
            const result = await supabase.rpc('server_accept_club_mining_order', {
                p_order_id: orderId, p_fighter_telegram_user_id: user.id, p_fighter_nickname: nickname
            });
            if (result.error) throw result.error;
            return json({ order: result.data });
        }

        if (action === 'close_club_mining_order') {
            const orderId = String(payload.orderId || '');
            if (!isUuid(orderId)) return json({ error: 'Invalid mining order' }, 400);
            const order = await supabase.from('fight_club_mining_orders').select('*').eq('id', orderId)
                .in('status', ['queued', 'active']).maybeSingle();
            if (order.error) throw order.error;
            if (!order.data || !order.data.server_session_id || !await hasClubPermission(order.data.club_id, 'manage_mining')) {
                return json({ error: 'Mining order cannot be closed' }, 403);
            }
            const result = await supabase.rpc('close_game_pool_session', {
                p_player_telegram_id: order.data.fighter_telegram_user_id,
                p_session_id: order.data.server_session_id
            });
            if (result.error) throw result.error;
            return json({ order: result.data });
        }

        if (action === 'player_exchange_hub') {
            const requests = await supabase.from('silarum_exchange_requests').select('*')
                .eq('source_type', 'player').eq('requester_telegram_user_id', user.id)
                .order('created_at', { ascending: false }).limit(100);
            if (requests.error) throw requests.error;
            return json({ requests: requests.data || [] });
        }

        if (action === 'request_player_exchange') {
            const targetAsset = payload.targetAsset === 'USDT' ? 'USDT' : 'TON';
            const amount = Number(payload.amountSilarum);
            const destinationAddress = String(payload.destinationAddress || '').trim().slice(0, 200);
            if (!Number.isFinite(amount) || amount <= 0 || destinationAddress.length < 20) return json({ error: 'Invalid exchange request' }, 400);
            if (Deno.env.get('SILARUM_EXCHANGE_REQUESTS_ENABLED') !== 'true') return json({ error: 'SILARUM exchange is not enabled yet' }, 503);
            const rate = Number(Deno.env.get(targetAsset === 'TON' ? 'SILARUM_TON_RATE' : 'SILARUM_USDT_RATE') || 0);
            const commissionBps = Math.max(0, Math.min(10000, Number(Deno.env.get('SILARUM_EXCHANGE_COMMISSION_BPS') || 0)));
            const gas = Math.max(0, Number(Deno.env.get(targetAsset === 'TON' ? 'TON_ESTIMATED_GAS' : 'USDT_ESTIMATED_GAS') || 0));
            const commission = Number((amount * commissionBps / 10000).toFixed(4));
            const net = Math.max(0, Number(((amount - commission) * rate - gas).toFixed(12)));
            if (!Number.isFinite(rate) || rate <= 0 || net <= 0) return json({ error: 'Exchange quote is unavailable' }, 503);
            const requestResult = await supabase.from('silarum_exchange_requests').insert({
                requester_telegram_user_id: user.id, source_type: 'player', source_club_id: null,
                amount_silarum: amount, target_asset: targetAsset, quote_rate: rate,
                service_commission_silarum: commission, estimated_gas_target: gas, net_target_amount: net,
                destination_address: destinationAddress, quote_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            }).select('*').single();
            if (requestResult.error) throw requestResult.error;
            const budget = await supabase.rpc('server_lock_player_exchange', {
                p_request_id: requestResult.data.id, p_telegram_user_id: user.id, p_amount_silarum: amount
            });
            if (budget.error) {
                await supabase.from('silarum_exchange_requests').delete().eq('id', requestResult.data.id).eq('status', 'pending_review');
                throw budget.error;
            }
            return json({ exchange: requestResult.data, balances: budget.data });
        }

        if (action === 'cancel_player_exchange') {
            const requestId = String(payload.requestId || '');
            if (!isUuid(requestId)) return json({ error: 'Invalid exchange request' }, 400);
            const owned = await supabase.from('silarum_exchange_requests').select('id').eq('id', requestId)
                .eq('source_type', 'player').eq('requester_telegram_user_id', user.id).eq('status', 'pending_review').maybeSingle();
            if (owned.error) throw owned.error;
            if (!owned.data) return json({ error: 'Exchange request cannot be cancelled' }, 409);
            const result = await supabase.rpc('server_review_silarum_exchange', {
                p_request_id: requestId, p_admin_telegram_user_id: user.id, p_approved: false
            });
            if (result.error) throw result.error;
            return json({ exchange: result.data });
        }

        if (action === 'request_club_exchange') {
            const clubId = String(payload.clubId || '');
            const targetAsset = payload.targetAsset === 'USDT' ? 'USDT' : 'TON';
            const amount = Number(payload.amountSilarum);
            const destinationAddress = String(payload.destinationAddress || '').trim().slice(0, 200);
            if (!isUuid(clubId) || !Number.isFinite(amount) || amount <= 0 || !await hasClubPermission(clubId, 'manage_treasury')) return json({ error: 'Treasury access required' }, 403);
            if (destinationAddress.length < 20) return json({ error: 'Invalid destination address' }, 400);
            if (Deno.env.get('SILARUM_EXCHANGE_REQUESTS_ENABLED') !== 'true') return json({ error: 'SILARUM exchange is not enabled yet' }, 503);
            const treasury = await supabase.from('fight_club_treasuries').select('exchange_enabled').eq('club_id', clubId).single();
            if (treasury.error) throw treasury.error;
            if (!treasury.data.exchange_enabled) return json({ error: 'Club exchange is disabled' }, 403);
            const rate = Number(Deno.env.get(targetAsset === 'TON' ? 'SILARUM_TON_RATE' : 'SILARUM_USDT_RATE') || 0);
            const commissionBps = Math.max(0, Math.min(10000, Number(Deno.env.get('SILARUM_EXCHANGE_COMMISSION_BPS') || 0)));
            const gas = Math.max(0, Number(Deno.env.get(targetAsset === 'TON' ? 'TON_ESTIMATED_GAS' : 'USDT_ESTIMATED_GAS') || 0));
            const commission = Number((amount * commissionBps / 10000).toFixed(4));
            const net = Math.max(0, Number(((amount - commission) * rate - gas).toFixed(12)));
            if (!Number.isFinite(rate) || rate <= 0 || net <= 0) return json({ error: 'Exchange quote is unavailable' }, 503);
            const requestResult = await supabase.from('silarum_exchange_requests').insert({
                requester_telegram_user_id: user.id, source_type: 'club', source_club_id: clubId,
                amount_silarum: amount, target_asset: targetAsset, quote_rate: rate,
                service_commission_silarum: commission, estimated_gas_target: gas, net_target_amount: net,
                destination_address: destinationAddress,
                quote_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            }).select('*').single();
            if (requestResult.error) throw requestResult.error;
            const budget = await supabase.rpc('server_lock_club_budget', {
                p_club_id: clubId, p_actor_telegram_user_id: user.id, p_amount_silarum: amount,
                p_operation: 'exchange_lock', p_reference_type: 'silarum_exchange', p_reference_id: requestResult.data.id
            });
            if (budget.error) {
                await supabase.from('silarum_exchange_requests').delete().eq('id', requestResult.data.id).eq('status', 'pending_review');
                throw budget.error;
            }
            return json({ exchange: requestResult.data });
        }

        if (action === 'cancel_club_exchange') {
            const requestId = String(payload.requestId || '');
            if (!isUuid(requestId)) return json({ error: 'Invalid exchange request' }, 400);
            const requestResult = await supabase.from('silarum_exchange_requests').select('*').eq('id', requestId)
                .eq('source_type', 'club').eq('status', 'pending_review').maybeSingle();
            if (requestResult.error) throw requestResult.error;
            if (!requestResult.data || !await hasClubPermission(requestResult.data.source_club_id, 'manage_treasury')) {
                return json({ error: 'Exchange request cannot be cancelled' }, 403);
            }
            const result = await supabase.rpc('server_review_silarum_exchange', {
                p_request_id: requestId, p_admin_telegram_user_id: user.id, p_approved: false
            });
            if (result.error) throw result.error;
            return json({ exchange: result.data });
        }

        if (action === 'save_club_tournament') {
            const input = payload.tournament && typeof payload.tournament === 'object' ? payload.tournament as Record<string, unknown> : {};
            const clientClubId = String(input.organizerClubId || '');
            let clubId = isUuid(clientClubId) ? clientClubId : '';
            if (!clubId) {
                const membership = await supabase.from('fight_club_members').select('club_id').eq('telegram_user_id', user.id).eq('status', 'active').maybeSingle();
                if (membership.error) throw membership.error;
                clubId = String(membership.data?.club_id || '');
            }
            if (!await hasClubPermission(clubId, 'manage_tournaments')) return json({ error: 'Tournament access required' }, 403);
            const owned = await supabase.from('fight_clubs').select('*').eq('id', clubId).in('status', ['pending', 'verified']).maybeSingle();
            if (owned.error) throw owned.error;
            if (!owned.data) return json({ error: 'Club is unavailable' }, 403);
            const leagueTier = String(input.leagueTier || 'district');
            const discipline = String(input.discipline || 'fight');
            const format = String(input.format || 'knockout');
            const prizeType = String(input.prizeType || 'food');
            const prizeCurrency = 'SILARUM';
            const startsAt = new Date(Number(input.startsAt || 0));
            const registrationEndsAt = new Date(Number(input.registrationEndsAt || 0));
            const needsReview = owned.data.status !== 'verified' || leagueTier === 'world' || ['silarum', 'physical', 'digital', 'mixed'].includes(prizeType);
            if (!['district', 'city', 'world'].includes(leagueTier) || !['fight', 'borsch', 'mixed'].includes(discipline) || !['knockout', 'round_robin', 'groups_knockout'].includes(format)) return json({ error: 'Invalid tournament type' }, 400);
            if (!['food', 'silarum', 'physical', 'digital', 'mixed'].includes(prizeType) || prizeCurrency !== 'SILARUM') return json({ error: 'Invalid tournament prize' }, 400);
            if (Number.isNaN(startsAt.getTime()) || Number.isNaN(registrationEndsAt.getTime()) || registrationEndsAt > startsAt) return json({ error: 'Invalid tournament dates' }, 400);
            const tournament = {
                organizer_type: 'club', organizer_club_id: owned.data.id, created_by_telegram_id: user.id,
                league_tier: leagueTier, country_code: owned.data.country_code, city: owned.data.city,
                district: leagueTier === 'district' ? owned.data.district : '',
                title: String(input.title || '').trim().slice(0, 120), description: String(input.description || '').trim().slice(0, 2000),
                discipline, format, status: needsReview ? 'pending_review' : 'registration', approval_status: needsReview ? 'pending' : 'not_required',
                max_participants: Math.max(2, Math.min(100000, Number(input.maxParticipants || 16))),
                min_rating: Math.max(0, Math.min(1000000, Number(input.minRating || 0))), entry_silarum: 0,
                rules_text: String(input.rules || '').trim().slice(0, 5000),
                eligibility: leagueTier === 'district' ? {} : {
                    requires_qualification: true,
                    qualifying_tier: leagueTier === 'world' ? 'city' : 'district'
                },
                prize_type: prizeType,
                prize_title: String(input.prizeTitle || '').trim().slice(0, 200), prize_fund_amount: Math.max(0, Number(input.prizeAmount || 0)),
                prize_currency: prizeCurrency, prize_fulfillment: needsReview ? 'manual_review' : (prizeType === 'food' ? 'venue' : 'voucher'),
                poster_url: String(input.posterUrl || '').startsWith(`${supabaseUrl}/storage/v1/object/public/club-posters/`)
                    ? String(input.posterUrl).slice(0, 500) : null,
                financial_payout_enabled: false, registration_ends_at: registrationEndsAt.toISOString(), starts_at: startsAt.toISOString(),
                min_age: Math.max(0, Math.min(99, Number(input.minAge || 13))), is_test_mode: true
            };
            if (tournament.title.length < 3 || !tournament.rules_text || !tournament.prize_title) return json({ error: 'Title, rules and prize are required' }, 400);
            if (tournament.prize_fund_amount <= 0) return json({ error: 'SILARUM prize budget is required' }, 400);
            const result = await supabase.from('fight_tournaments').insert(tournament).select('*').single();
            if (result.error) throw result.error;
            const budget = await supabase.rpc('server_lock_club_budget', {
                p_club_id: owned.data.id, p_actor_telegram_user_id: user.id,
                p_amount_silarum: tournament.prize_fund_amount, p_operation: 'tournament_lock',
                p_reference_type: 'fight_tournament', p_reference_id: result.data.id
            });
            if (budget.error) {
                await supabase.from('fight_tournaments').delete().eq('id', result.data.id).eq('organizer_club_id', owned.data.id);
                throw budget.error;
            }
            return json({ tournament: result.data });
        }

        if (action === 'register_fight_tournament') {
            const tournamentId = String(payload.tournamentId || '');
            if (!isUuid(tournamentId)) return json({ error: 'Invalid tournament id' }, 400);
            const tournamentResult = await supabase.from('fight_tournaments').select('*').eq('id', tournamentId).eq('status', 'registration').single();
            if (tournamentResult.error) throw tournamentResult.error;
            const tournament = tournamentResult.data;
            if (new Date(tournament.registration_ends_at).getTime() < Date.now()) return json({ error: 'Registration is closed' }, 409);
            const countResult = await supabase.from('fight_tournament_registrations').select('*', { count: 'exact', head: true }).eq('tournament_id', tournamentId).in('status', ['registered', 'checked_in']);
            if (countResult.error) throw countResult.error;
            if (Number(countResult.count || 0) >= Number(tournament.max_participants)) return json({ error: 'Tournament is full' }, 409);
            const member = await supabase.from('fight_club_members').select('club_id,rating,fighter_key').eq('telegram_user_id', user.id).eq('status', 'active').maybeSingle();
            if (member.error) throw member.error;
            const rating = Number(member.data?.rating || 1200);
            if (rating < Number(tournament.min_rating || 0)) return json({ error: 'Rating is too low' }, 403);
            const eligibility = tournament.eligibility && typeof tournament.eligibility === 'object' ? tournament.eligibility : {};
            if (eligibility.requires_qualification === true) {
                let qualifyingQuery = supabase.from('fight_tournaments').select('id')
                    .eq('league_tier', String(eligibility.qualifying_tier || 'district'));
                if (tournament.league_tier === 'city') qualifyingQuery = qualifyingQuery.eq('city', tournament.city);
                const qualifying = await qualifyingQuery.limit(500);
                if (qualifying.error) throw qualifying.error;
                const qualifyingIds = (qualifying.data || []).map((item) => item.id);
                if (!qualifyingIds.length) return json({ error: 'Qualifying tournament is required' }, 403);
                const qualification = await supabase.from('fight_tournament_registrations').select('tournament_id')
                    .eq('telegram_user_id', user.id).eq('status', 'winner').in('tournament_id', qualifyingIds).limit(1).maybeSingle();
                if (qualification.error) throw qualification.error;
                if (!qualification.data) return json({ error: 'Qualifying tournament is required' }, 403);
            }
            const existing = await supabase.from('fight_tournament_registrations').select('*')
                .eq('tournament_id', tournamentId).eq('telegram_user_id', user.id).maybeSingle();
            if (existing.error) throw existing.error;
            if (existing.data) return json({ registration: existing.data });
            const result = await supabase.from('fight_tournament_registrations').insert({
                tournament_id: tournamentId, telegram_user_id: user.id, club_id: member.data?.club_id || null,
                nickname, fighter_key: String(member.data?.fighter_key || payload.fighterKey || 'alpha').slice(0, 50),
                rating_at_entry: rating, status: 'registered',
                eligibility_snapshot: { minimumRating: Number(tournament.min_rating || 0), rating }
            }).select('*').single();
            if (result.error) throw result.error;
            return json({ registration: result.data });
        }

        if (action === 'start_club_tournament') {
            const tournamentId = String(payload.tournamentId || '');
            if (!isUuid(tournamentId)) return json({ error: 'Invalid tournament id' }, 400);
            const tournamentResult = await supabase.from('fight_tournaments').select('*')
                .eq('id', tournamentId).eq('status', 'registration').single();
            if (tournamentResult.error) throw tournamentResult.error;
            if (!tournamentResult.data.organizer_club_id || !await hasClubPermission(tournamentResult.data.organizer_club_id, 'manage_tournaments')) return json({ error: 'Tournament access required' }, 403);
            const registrations = await supabase.from('fight_tournament_registrations')
                .select('telegram_user_id').eq('tournament_id', tournamentId).eq('status', 'registered').order('registered_at');
            if (registrations.error) throw registrations.error;
            if ((registrations.data || []).length < 2) return json({ error: 'At least two real participants are required' }, 409);
            const existing = await supabase.from('fight_tournament_matches').select('id', { count: 'exact', head: true }).eq('tournament_id', tournamentId);
            if (existing.error) throw existing.error;
            if (Number(existing.count || 0) > 0) return json({ error: 'Bracket already exists' }, 409);
            const participants = registrations.data || [];
            const matches = [];
            for (let index = 0; index < participants.length; index += 2) {
                matches.push({
                    tournament_id: tournamentId, round_number: 1, match_number: Math.floor(index / 2) + 1,
                    player_one_telegram_id: participants[index].telegram_user_id,
                    player_two_telegram_id: participants[index + 1]?.telegram_user_id || null,
                    winner_telegram_id: participants[index + 1] ? null : participants[index].telegram_user_id,
                    status: participants[index + 1] ? 'scheduled' : 'verified',
                    score: participants[index + 1] ? {} : { bye: true }
                });
            }
            const matchResult = await supabase.from('fight_tournament_matches').insert(matches).select('*');
            if (matchResult.error) throw matchResult.error;
            const updateResult = await supabase.from('fight_tournaments').update({ status: 'live', updated_at: new Date().toISOString() })
                .eq('id', tournamentId).eq('status', 'registration');
            if (updateResult.error) throw updateResult.error;
            return json({ matches: matchResult.data || [] });
        }

        if (action === 'submit_tournament_match_result') {
            const matchId = String(payload.matchId || '');
            if (!isUuid(matchId)) return json({ error: 'Invalid match id' }, 400);
            const result = await supabase.rpc('server_submit_tournament_result', {
                p_match_id: matchId,
                p_telegram_user_id: user.id,
                p_claimed_self_won: Boolean(payload.won)
            });
            if (result.error) throw result.error;
            return json({ claim: result.data });
        }

        if (action === 'verify_tournament_match_result') {
            const matchId = String(payload.matchId || '');
            const winnerId = Number(payload.winnerTelegramUserId);
            if (!isUuid(matchId) || !Number.isSafeInteger(winnerId) || winnerId <= 0) return json({ error: 'Invalid match result' }, 400);
            const result = await supabase.rpc('server_verify_tournament_result', {
                p_match_id: matchId,
                p_verifier_telegram_user_id: user.id,
                p_winner_telegram_user_id: winnerId,
                p_platform_admin: false
            });
            if (result.error) throw result.error;
            return json({ verification: result.data });
        }

        if (action === 'redeem_club_reward') {
            const voucherId = String(payload.voucherId || '');
            if (!isUuid(voucherId)) return json({ error: 'Invalid voucher id' }, 400);
            const voucher = await supabase.from('club_reward_vouchers').select('*').eq('id', voucherId).eq('status', 'issued').single();
            if (voucher.error) throw voucher.error;
            if (!voucher.data.club_id) return json({ error: 'Platform prize requires main admin' }, 403);
            if (!await hasClubPermission(voucher.data.club_id, 'redeem_rewards')) return json({ error: 'Club reward access required' }, 403);
            const result = await supabase.from('club_reward_vouchers').update({
                status: 'redeemed', redeemed_at: new Date().toISOString(), redeemed_by_telegram_id: user.id
            }).eq('id', voucherId).eq('status', 'issued').select('*').single();
            if (result.error) throw result.error;
            return json({ voucher: result.data });
        }

        if (action === 'leaderboard') {
            const type = payload.type === 'srum' ? 'srum' : 'rum';
            const column = type === 'srum' ? 'srum_available' : 'rumir_balance';
            const { data, error } = await supabase.from('game_accounts')
                .select('nickname,rumir_balance,srum_available').order(column, { ascending: false }).limit(100);
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
