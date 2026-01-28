/**
 * Cookie utilities for HttpOnly token management
 */

// Cookie name for the auth token
export const AUTH_COOKIE_NAME = 'sync_auth_token';

// Cookie options for security
export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    path: '/',
};

/**
 * Serialize a cookie for Set-Cookie header
 */
export function serializeCookie(name: string, value: string, options: typeof COOKIE_OPTIONS): string {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    
    if (options.maxAge) {
        parts.push(`Max-Age=${options.maxAge}`);
    }
    if (options.path) {
        parts.push(`Path=${options.path}`);
    }
    if (options.httpOnly) {
        parts.push('HttpOnly');
    }
    if (options.secure) {
        parts.push('Secure');
    }
    if (options.sameSite) {
        parts.push(`SameSite=${options.sameSite}`);
    }
    
    return parts.join('; ');
}

/**
 * Serialize a cookie for deletion (expired)
 */
export function serializeDeleteCookie(name: string): string {
    return `${name}=; Path=/; Max-Age=0; HttpOnly`;
}

/**
 * Parse cookies from a cookie header string
 */
export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
    if (!cookieHeader) {
        return {};
    }
    
    const cookies: Record<string, string> = {};
    const pairs = cookieHeader.split(';');
    
    for (const pair of pairs) {
        const [name, ...valueParts] = pair.trim().split('=');
        if (name && valueParts.length > 0) {
            try {
                cookies[name.trim()] = decodeURIComponent(valueParts.join('=').trim());
            } catch {
                // Invalid encoding, skip this cookie
            }
        }
    }
    
    return cookies;
}

/**
 * Extract auth token from socket handshake cookies
 */
export function getTokenFromSocket(socket: { handshake: { headers: { cookie?: string } } }): string | null {
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parseCookies(cookieHeader);
    return cookies[AUTH_COOKIE_NAME] || null;
}
