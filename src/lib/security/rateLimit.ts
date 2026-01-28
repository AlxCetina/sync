import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Rate limiting configuration for different operations
 */

// Rate limiter for session creation (prevent spam)
export const sessionCreateLimiter = new RateLimiterMemory({
    points: 5,          // 5 sessions
    duration: 60 * 60,  // per hour
    blockDuration: 60 * 60, // block for 1 hour if exceeded
});

// Rate limiter for session joins (prevent brute force)
export const sessionJoinLimiter = new RateLimiterMemory({
    points: 10,         // 10 attempts
    duration: 60,       // per minute
    blockDuration: 60 * 5, // block for 5 minutes if exceeded
});

// Rate limiter for failed join attempts (stricter)
export const failedJoinLimiter = new RateLimiterMemory({
    points: 5,          // 5 failed attempts
    duration: 60,       // per minute
    blockDuration: 60 * 15, // block for 15 minutes if exceeded
});

// Rate limiter for swipes (prevent rapid-fire automation)
export const swipeLimiter = new RateLimiterMemory({
    points: 60,         // 60 swipes
    duration: 60,       // per minute
    blockDuration: 60,  // block for 1 minute if exceeded
});

// Rate limiter for reconnection attempts
export const reconnectLimiter = new RateLimiterMemory({
    points: 10,         // 10 reconnect attempts
    duration: 60,       // per minute
    blockDuration: 60 * 2, // block for 2 minutes if exceeded
});

// Rate limiter for requesting more places
export const morePlacesLimiter = new RateLimiterMemory({
    points: 5,          // 5 requests
    duration: 60,       // per minute
    blockDuration: 60,  // block for 1 minute if exceeded
});

// Global connection limiter per IP
export const connectionLimiter = new RateLimiterMemory({
    points: 20,         // 20 connections
    duration: 60,       // per minute
    blockDuration: 60 * 5, // block for 5 minutes if exceeded
});

/**
 * Get client IP from socket
 * 
 * SECURITY: By default, we do NOT trust proxy headers (X-Forwarded-For, X-Real-IP)
 * as they can be spoofed by clients. Only enable TRUST_PROXY if you are certain
 * the app is behind a trusted reverse proxy (nginx, Cloudflare, etc.).
 * 
 * Set TRUST_PROXY=true in environment to enable proxy header trust.
 */
export function getClientIp(socket: { handshake: { address: string; headers: Record<string, string | string[] | undefined> } }): string {
    // Only trust proxy headers if explicitly configured
    const trustProxy = process.env.TRUST_PROXY === 'true';
    
    if (trustProxy) {
        // Check for forwarded IP (behind proxy/load balancer)
        const forwarded = socket.handshake.headers['x-forwarded-for'];
        if (forwarded) {
            const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
            return ips.split(',')[0].trim();
        }
        
        const realIp = socket.handshake.headers['x-real-ip'];
        if (realIp) {
            return Array.isArray(realIp) ? realIp[0] : realIp;
        }
    }
    
    // Default: use direct socket address (cannot be spoofed)
    return socket.handshake.address;
}

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
    limiter: RateLimiterMemory,
    key: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
        await limiter.consume(key);
        return { allowed: true };
    } catch (rateLimiterRes) {
        const res = rateLimiterRes as { msBeforeNext?: number };
        return {
            allowed: false,
            retryAfter: res.msBeforeNext ? Math.ceil(res.msBeforeNext / 1000) : 60,
        };
    }
}

/**
 * Penalize for failed attempt (consumes extra points)
 */
export async function penalizeFailedAttempt(
    limiter: RateLimiterMemory,
    key: string,
    points: number = 2
): Promise<void> {
    try {
        await limiter.consume(key, points);
    } catch {
        // Already rate limited, ignore
    }
}
