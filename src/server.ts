import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import { registerSocketHandlers } from './lib/socket/handlers';
import { cleanupExpiredSessions } from './lib/socket/sessionManager';
import { connectionLimiter, getClientIp } from './lib/security/rateLimit';

const dev = process.env.NODE_ENV !== 'production';
const debugMode = process.env.DEBUG_MODE === 'true';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Security headers middleware using helmet
// Note: CSP is handled by Next.js middleware (src/proxy.ts) with nonces
const helmetMiddleware = helmet({
    // Disable helmet's CSP - we use middleware with nonces instead
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false, // Required for external images
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Required for images
});

// Apply helmet to response
function applySecurityHeaders(req: IncomingMessage, res: ServerResponse): void {
    // Create mock next function for helmet
    const next = () => { };
    helmetMiddleware(req as any, res as any, next);
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        // Apply security headers
        applySecurityHeaders(req, res);

        // Additional security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(self)');

        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    // Initialize Socket.io with security configurations
    const io = new SocketServer(httpServer, {
        cors: {
            origin: dev ? ['http://localhost:3000'] : (process.env.ALLOWED_ORIGINS?.split(',') || []),
            methods: ['GET', 'POST'],
            credentials: true,
        },
        // Connection state recovery for reconnection
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
            skipMiddlewares: false, // Don't skip middlewares for security
        },
        // Additional socket security options
        pingTimeout: 30000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6, // 1MB max payload
    });

    // Socket.io middleware for rate limiting connections
    io.use(async (socket, next) => {
        const clientIp = getClientIp(socket);

        try {
            await connectionLimiter.consume(clientIp);
            next();
        } catch {
            console.log(`[Socket] Connection rate limited for IP: ${clientIp}`);
            next(new Error('Too many connections. Please try again later.'));
        }
    });

    // Register all socket handlers
    registerSocketHandlers(io);

    // Cleanup expired sessions every hour
    setInterval(() => {
        const cleaned = cleanupExpiredSessions();
        if (cleaned > 0) {
            console.log(`[Cleanup] Removed ${cleaned} expired sessions`);
        }
    }, 60 * 60 * 1000);

    httpServer.listen(port, () => {
        console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🔄 Sync - Real-time Decision Making                     ║
  ║                                                           ║
  ║   ➜ Local:   http://${hostname}:${port}                        ║
  ║   ➜ Socket:  Ready for connections                        ║
  ║   ➜ Mode:    ${dev ? 'Development' : 'Production'}                               ║
  ║   ➜ Debug:   ${debugMode ? 'ON (using mock data)' : 'OFF (using API)'}                       ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `);
    });
});
