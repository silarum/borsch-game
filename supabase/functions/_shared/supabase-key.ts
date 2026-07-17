export function getSupabaseSecretKey(): string {
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
