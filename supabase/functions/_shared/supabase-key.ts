export function getSupabaseSecretKey(): string {
    const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
    if (keys) {
        try {
            const parsed = JSON.parse(keys) as Record<string, unknown>;
            const configured = parsed.default || Object.values(parsed)
                .find((value) => typeof value === 'string' && value.startsWith('sb_secret_'));
            if (typeof configured === 'string' && configured) return configured;
        } catch (_) {
            if (keys.startsWith('sb_secret_')) return keys;
        }
    }
    return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}
