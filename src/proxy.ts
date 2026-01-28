import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to add security headers
 * In development: Minimal restrictions to allow Next.js dev tools
 * In production: Stricter CSP for security
 */
export function proxy(_request: NextRequest) {
    const isDev = process.env.NODE_ENV !== 'production';

    const response = NextResponse.next();

    // In development, skip CSP to allow Next.js dev overlay and hot reload
    if (!isDev) {
        const cspDirectives = [
            `default-src 'self'`,
            // Scripts: self + unsafe-inline for Next.js hydration
            `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
            // Styles: self + unsafe-inline for CSS-in-JS and Tailwind
            `style-src 'self' 'unsafe-inline'`,
            // Images: self, data URIs, and trusted domains
            `img-src 'self' data: blob: https://images.unsplash.com https://places.googleapis.com https://maps.googleapis.com https://maps.gstatic.com`,
            // Connections: self, WebSocket, and Google APIs
            `connect-src 'self' ws: wss: https://maps.googleapis.com https://places.googleapis.com`,
            // Fonts: self and Google Fonts
            `font-src 'self' https://fonts.gstatic.com`,
            // Objects: none (no plugins)
            `object-src 'none'`,
            // Media
            `media-src 'self'`,
            // Frames: Google Maps if needed
            `frame-src 'self' https://maps.google.com`,
            // Frame ancestors: none (prevent being embedded)
            `frame-ancestors 'none'`,
            // Form actions
            `form-action 'self'`,
            // Base URI
            `base-uri 'self'`,
            // Upgrade insecure requests
            'upgrade-insecure-requests',
        ];

        response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
    }

    // Always set these security headers (both dev and prod)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(self)');

    return response;
}

/**
 * Configure which paths the middleware runs on
 * We want CSP on all pages, but not on static files or API routes
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         * - api routes (handled separately)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
    ],
};
