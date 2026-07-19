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
    if (request.headers.get('Origin') && request.headers.get('Origin') !== appOrigin) return json({ error: 'Origin is not allowed' }, 403);
    if (Number(request.headers.get('Content-Length') || 0) > 5_500_000) return json({ error: 'Poster is too large' }, 413);

    try {
        const form = await request.formData();
        const file = form.get('poster');
        const clubId = String(form.get('clubId') || '');
        const initData = String(form.get('initData') || '');
        if (!(file instanceof File) || !/^[0-9a-f-]{36}$/i.test(clubId)) return json({ error: 'Invalid upload' }, 400);
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 5_242_880) {
            return json({ error: 'Use JPG, PNG or WEBP up to 5 MB' }, 400);
        }

        const botToken = Deno.env.get('TELEGRAM_GAME_BOT_TOKEN') || '';
        const user = await validateTelegramInitData(initData, botToken);
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabase = createClient(supabaseUrl, getSupabaseSecretKey(), {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const club = await supabase.from('fight_clubs').select('owner_telegram_user_id').eq('id', clubId).maybeSingle();
        if (club.error) throw club.error;
        let allowed = Number(club.data?.owner_telegram_user_id) === user.id;
        if (!allowed) {
            const member = await supabase.from('fight_club_members').select('permissions').eq('club_id', clubId)
                .eq('telegram_user_id', user.id).eq('status', 'active').maybeSingle();
            if (member.error) throw member.error;
            allowed = member.data?.permissions?.manage_news === true || member.data?.permissions?.manage_tournaments === true;
        }
        if (!allowed) return json({ error: 'Poster upload access required' }, 403);

        const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[file.type] || 'webp';
        const path = `${clubId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const upload = await supabase.storage.from('club-posters').upload(path, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
        });
        if (upload.error) throw upload.error;
        const publicUrl = supabase.storage.from('club-posters').getPublicUrl(path).data.publicUrl;
        return json({ path, publicUrl });
    } catch (error) {
        console.error('club-poster-upload:', error instanceof Error ? error.message : error);
        const message = error instanceof Error ? error.message : '';
        return json({ error: message.startsWith('Telegram ') ? message : 'Poster upload failed' }, message.startsWith('Telegram ') ? 401 : 500);
    }
});
