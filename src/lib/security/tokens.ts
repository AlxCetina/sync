import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Token generation and verification utilities
 */

// Get JWT secret from environment or generate a secure random one
// In production, this MUST be set via environment variable
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Token expiration times
const TOKEN_EXPIRY = {
    session: '24h',     // Session tokens expire in 24 hours
    reconnect: '2h',    // Reconnect tokens expire in 2 hours
} as const;

export interface SessionTokenPayload {
    sessionId: string;
    userId: string;
    isHost: boolean;
    iat?: number;
    exp?: number;
}

/**
 * Generate a cryptographically secure user ID
 */
export function generateSecureUserId(): string {
    return crypto.randomUUID();
}

/**
 * Generate a cryptographically secure session code
 * Uses a larger character set than before but still human-readable
 */
export function generateSecureSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(6);
    let code = '';
    
    for (let i = 0; i < 6; i++) {
        code += chars[bytes[i] % chars.length];
    }
    
    return code;
}

/**
 * Generate a JWT session token
 */
export function generateSessionToken(sessionId: string, userId: string, isHost: boolean): string {
    const payload: SessionTokenPayload = {
        sessionId,
        userId,
        isHost,
    };
    
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY.session,
    });
}

/**
 * Verify and decode a session token
 */
export function verifySessionToken(token: string): SessionTokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as SessionTokenPayload;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Generate a secure photo proxy token
 * This prevents users from forging photo URLs
 */
export function generatePhotoToken(photoName: string): string {
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(photoName);
    return hmac.digest('hex').slice(0, 32);
}

/**
 * Verify a photo proxy token
 */
export function verifyPhotoToken(photoName: string, token: string): boolean {
    const expected = generatePhotoToken(photoName);
    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(token)
    );
}

/**
 * Hash a value for secure comparison (e.g., for rate limiting keys)
 */
export function hashForKey(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}
