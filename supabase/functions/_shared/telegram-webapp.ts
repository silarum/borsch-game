const encoder = new TextEncoder();

async function hmacSha256(keyBytes: Uint8Array, value: string): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function toHex(bytes: Uint8Array): string {
    return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left: string, right: string): boolean {
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
        difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return difference === 0;
}

export type TelegramWebAppUser = {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
};

export async function validateTelegramInitData(
    initData: string,
    botToken: string,
    maxAgeSeconds = 3600
): Promise<TelegramWebAppUser> {
    if (!initData || !botToken) throw new Error('Telegram authentication is not configured');

    const params = new URLSearchParams(initData);
    const receivedHash = params.get('hash')?.toLowerCase() || '';
    const authDate = Number(params.get('auth_date') || 0);
    const userJson = params.get('user');
    if (!receivedHash || !authDate || !userJson) throw new Error('Telegram initData is incomplete');

    const now = Math.floor(Date.now() / 1000);
    if (authDate > now + 60 || now - authDate > maxAgeSeconds) {
        throw new Error('Telegram initData has expired');
    }

    params.delete('hash');
    params.delete('signature');
    const dataCheckString = [...params.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const secretKey = await hmacSha256(encoder.encode('WebAppData'), botToken);
    const calculatedHash = toHex(await hmacSha256(secretKey, dataCheckString));
    if (!constantTimeEqual(calculatedHash, receivedHash)) {
        throw new Error('Telegram initData signature is invalid');
    }

    const user = JSON.parse(userJson) as TelegramWebAppUser;
    if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('Telegram user is invalid');
    return user;
}
