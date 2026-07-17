import { createClient } from 'npm:@supabase/supabase-js@2.110.7';

function constantTimeEqual(left: string, right: string): boolean {
    if (!left || left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
        difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return difference === 0;
}

function getSecretKey(): string {
    const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
    if (keys) {
        try {
            return JSON.parse(keys).default || '';
        } catch (_) {
            return '';
        }
    }
    return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

Deno.serve(async (request) => {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const workerSecret = Deno.env.get('SPARTAN_WORKER_SECRET') || '';
    if (!constantTimeEqual(request.headers.get('X-Spartan-Worker-Secret') || '', workerSecret)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', getSecretKey(), {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data, error } = await supabase.rpc('run_spartan_tick');
        if (error) throw error;
        return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('spartan-worker:', error instanceof Error ? error.message : error);
        return Response.json({ error: 'Worker failed' }, { status: 500 });
    }
});
