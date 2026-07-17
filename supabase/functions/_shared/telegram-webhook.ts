export async function getTelegramWebhookSecret(
    botToken: string,
    configuredSecret = ''
): Promise<string> {
    if (configuredSecret) return configuredSecret;
    const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`crypto-borsch-webhook:${botToken}`)
    );
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
