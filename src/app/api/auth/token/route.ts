import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/security/tokens';
import { AUTH_COOKIE_NAME, COOKIE_OPTIONS, serializeCookie, serializeDeleteCookie } from '@/lib/security/cookies';

/**
 * POST /api/auth/token
 * Set the auth token as an HttpOnly cookie
 * 
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Verify the token is valid before setting it as a cookie
        const payload = verifySessionToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Create response with Set-Cookie header
        const response = NextResponse.json({ success: true });
        response.headers.set(
            'Set-Cookie',
            serializeCookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS)
        );

        return response;
    } catch (error) {
        console.error('[Auth] Error setting token cookie:', error);
        return NextResponse.json(
            { error: 'Failed to set token' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/auth/token
 * Clear the auth token cookie
 */
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', serializeDeleteCookie(AUTH_COOKIE_NAME));
    return response;
}
