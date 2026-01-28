import {
    Session,
    SessionUser,
    Place,
    Match,
    ClientSessionState,
    SwipeData,
    SearchConfig
} from '@/types';
import { recordPlaceVeto, shouldRemovePlace, trackCategoryVeto } from '@/lib/algorithm/reorderQueue';
import { 
    generateSecureUserId, 
    generateSecureSessionCode,
    generateSessionToken,
    verifySessionToken,
    SessionTokenPayload
} from '@/lib/security/tokens';

// In-memory session store
const sessions = new Map<string, Session>();

// Map socket IDs to session info for cleanup on disconnect
const socketToSession = new Map<string, { sessionId: string; userId: string }>();

// Track sessions per IP for rate limiting
const sessionsPerIp = new Map<string, Set<string>>();

// Track last access time for LRU eviction
const sessionLastAccess = new Map<string, number>();

// Memory limits configuration
const MEMORY_LIMITS = {
    // Maximum total sessions allowed in memory
    MAX_TOTAL_SESSIONS: 1000,
    // Maximum sessions per IP
    MAX_SESSIONS_PER_IP: 10,
    // Idle timeout - sessions with no activity for this long are candidates for eviction (2 hours)
    SESSION_IDLE_TIMEOUT_MS: 2 * 60 * 60 * 1000,
    // Percentage of oldest sessions to evict when at capacity
    EVICTION_PERCENTAGE: 0.1, // 10%
} as const;

const MAX_SESSIONS_PER_IP = MEMORY_LIMITS.MAX_SESSIONS_PER_IP;

/**
 * Generate a secure 6-character session code
 * Includes a retry limit to prevent infinite loops if code space is exhausted
 */
function generateSessionCode(): string {
    const MAX_ATTEMPTS = 100;
    let code = generateSecureSessionCode();
    let attempts = 0;
    
    // Ensure uniqueness with retry limit
    while (sessions.has(code)) {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
            throw new Error('Failed to generate unique session code after maximum attempts');
        }
        code = generateSecureSessionCode();
    }
    return code;
}

/**
 * Update the last access time for a session (for LRU tracking)
 */
function touchSession(sessionId: string): void {
    sessionLastAccess.set(sessionId, Date.now());
}

/**
 * Evict oldest sessions when at capacity
 * Uses LRU (Least Recently Used) strategy
 */
function evictOldestSessionsIfNeeded(): void {
    if (sessions.size < MEMORY_LIMITS.MAX_TOTAL_SESSIONS) {
        return;
    }

    console.log(`[SessionManager] Session limit reached (${sessions.size}/${MEMORY_LIMITS.MAX_TOTAL_SESSIONS}), evicting oldest sessions...`);

    // Calculate how many to evict
    const evictionCount = Math.max(1, Math.floor(sessions.size * MEMORY_LIMITS.EVICTION_PERCENTAGE));

    // Get all sessions with their last access times
    const sessionsByAccess: Array<{ id: string; lastAccess: number }> = [];
    sessions.forEach((_, id) => {
        sessionsByAccess.push({
            id,
            lastAccess: sessionLastAccess.get(id) || 0,
        });
    });

    // Sort by last access time (oldest first)
    sessionsByAccess.sort((a, b) => a.lastAccess - b.lastAccess);

    // Evict the oldest sessions
    let evicted = 0;
    for (let i = 0; i < evictionCount && i < sessionsByAccess.length; i++) {
        const sessionId = sessionsByAccess[i].id;
        const session = sessions.get(sessionId);
        
        if (session) {
            // Clean up socket mappings
            session.users.forEach(user => {
                if (user.socketId) {
                    socketToSession.delete(user.socketId);
                }
            });
            
            // Clean up IP tracking
            untrackSessionByIp(sessionId);
            
            // Clean up last access tracking
            sessionLastAccess.delete(sessionId);
            
            // Delete the session
            sessions.delete(sessionId);
            evicted++;
            
            console.log(`[SessionManager] Evicted idle session: ${sessionId}`);
        }
    }

    console.log(`[SessionManager] Evicted ${evicted} sessions, now at ${sessions.size} sessions`);
}

/**
 * Clean up idle sessions that haven't been accessed recently
 * More aggressive than expiration - removes sessions that are technically valid but unused
 */
export function cleanupIdleSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    sessions.forEach((session, id) => {
        const lastAccess = sessionLastAccess.get(id) || session.createdAt.getTime();
        const idleTime = now - lastAccess;

        // Check if all users are disconnected and session is idle
        const allUsersDisconnected = Array.from(session.users.values()).every(u => !u.connected);
        
        if (allUsersDisconnected && idleTime > MEMORY_LIMITS.SESSION_IDLE_TIMEOUT_MS) {
            // Clean up socket mappings
            session.users.forEach(user => {
                if (user.socketId) {
                    socketToSession.delete(user.socketId);
                }
            });
            
            // Clean up IP tracking
            untrackSessionByIp(id);
            
            // Clean up last access tracking
            sessionLastAccess.delete(id);
            
            sessions.delete(id);
            cleaned++;
            
            console.log(`[SessionManager] Cleaned up idle session: ${id} (idle for ${Math.round(idleTime / 60000)} minutes)`);
        }
    });

    return cleaned;
}

/**
 * Get memory usage statistics
 */
export function getMemoryStats(): {
    totalSessions: number;
    maxSessions: number;
    utilizationPercent: number;
    totalUsers: number;
    totalSocketMappings: number;
} {
    let totalUsers = 0;
    sessions.forEach(session => {
        totalUsers += session.users.size;
    });

    return {
        totalSessions: sessions.size,
        maxSessions: MEMORY_LIMITS.MAX_TOTAL_SESSIONS,
        utilizationPercent: Math.round((sessions.size / MEMORY_LIMITS.MAX_TOTAL_SESSIONS) * 100),
        totalUsers,
        totalSocketMappings: socketToSession.size,
    };
}

/**
 * Check if IP can create more sessions
 */
export function canCreateSession(clientIp: string): boolean {
    const ipSessions = sessionsPerIp.get(clientIp);
    if (!ipSessions) return true;
    return ipSessions.size < MAX_SESSIONS_PER_IP;
}

/**
 * Track session creation by IP
 */
function trackSessionByIp(clientIp: string, sessionId: string): void {
    if (!sessionsPerIp.has(clientIp)) {
        sessionsPerIp.set(clientIp, new Set());
    }
    sessionsPerIp.get(clientIp)!.add(sessionId);
}

/**
 * Remove session tracking for IP
 */
function untrackSessionByIp(sessionId: string): void {
    sessionsPerIp.forEach((sessions, ip) => {
        sessions.delete(sessionId);
        if (sessions.size === 0) {
            sessionsPerIp.delete(ip);
        }
    });
}

/**
 * Verify a session token and return the payload
 */
export function verifyToken(token: string): SessionTokenPayload | null {
    return verifySessionToken(token);
}

/**
 * Creates a new session
 */
export function createSession(
    hostName: string, 
    places: Place[], 
    searchConfig?: SearchConfig,
    clientIp?: string
): { session: Session; userId: string; token: string } {
    // Check memory limits and evict if necessary before creating new session
    evictOldestSessionsIfNeeded();

    const sessionId = generateSessionCode();
    const userId = generateSecureUserId();
    
    // Track by IP if provided
    if (clientIp) {
        trackSessionByIp(clientIp, sessionId);
    }

    const hostUser: SessionUser = {
        id: userId,
        name: hostName,
        isHost: true,
        socketId: null,
        connected: true,
        lastSeenIndex: 0,
        swipes: new Map(),
    };

    const session: Session = {
        id: sessionId,
        hostId: userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        status: 'waiting',
        places,
        queue: places.map(p => p.id),
        categoryVetos: new Map(),
        categoryLikes: new Map(),
        placeVetos: new Map(),
        users: new Map([[userId, hostUser]]),
        matches: [],
        searchConfig,
    };

    sessions.set(sessionId, session);
    
    // Track last access time for LRU eviction
    touchSession(sessionId);

    // Generate JWT token for authentication
    const token = generateSessionToken(sessionId, userId, true);

    return { session, userId, token };
}

/**
 * Gets a session by ID
 * Updates last access time for LRU tracking
 */
export function getSession(sessionId: string): Session | undefined {
    const normalizedId = sessionId.toUpperCase();
    const session = sessions.get(normalizedId);
    
    if (session) {
        touchSession(normalizedId);
    }
    
    return session;
}

/**
 * Joins an existing session
 * Updates last access time for LRU tracking
 */
export function joinSession(
    sessionId: string,
    userName: string
): { session: Session; userId: string; token: string } | null {
    const normalizedId = sessionId.toUpperCase();
    const session = sessions.get(normalizedId);

    if (!session) {
        return null;
    }

    const userId = generateSecureUserId();

    const user: SessionUser = {
        id: userId,
        name: userName,
        isHost: false,
        socketId: null,
        connected: true,
        lastSeenIndex: 0,
        swipes: new Map(),
    };

    session.users.set(userId, user);
    
    // Update last access time for LRU tracking
    touchSession(normalizedId);

    // Generate JWT token for authentication
    const token = generateSessionToken(normalizedId, userId, false);

    return { session, userId, token };
}

/**
 * Sets the socket ID for a user (on connect/reconnect)
 * Updates last access time for LRU tracking
 */
export function setUserSocket(
    sessionId: string,
    userId: string,
    socketId: string
): boolean {
    const session = sessions.get(sessionId);
    const user = session?.users.get(userId);

    if (!session || !user) {
        return false;
    }

    // Clean up old socket mapping if exists
    if (user.socketId) {
        socketToSession.delete(user.socketId);
    }

    user.socketId = socketId;
    user.connected = true;
    socketToSession.set(socketId, { sessionId, userId });
    
    // Update last access time for LRU tracking
    touchSession(sessionId);

    return true;
}

/**
 * Handles user disconnection
 * Returns disconnect info including whether user was host
 */
export function handleDisconnect(socketId: string): { sessionId: string; userId: string; isHost: boolean } | null {
    const mapping = socketToSession.get(socketId);

    if (!mapping) {
        return null;
    }

    const { sessionId, userId } = mapping;
    const session = sessions.get(sessionId);
    const user = session?.users.get(userId);
    const isHost = session?.hostId === userId;

    if (user) {
        user.connected = false;
        user.socketId = null;
    }

    socketToSession.delete(socketId);

    // Don't delete session immediately - let the cleanup handle it or wait for reconnect
    // This allows hosts to navigate between pages without ending the session
    return { sessionId, userId, isHost: isHost ?? false };
}

/**
 * Ends a session and cleans up all associated data
 * Called when host leaves and doesn't reconnect
 */
export function endSession(sessionId: string): void {
    const session = sessions.get(sessionId);
    if (!session) return;

    // Clean up all socket mappings for this session
    session.users.forEach(user => {
        if (user.socketId) {
            socketToSession.delete(user.socketId);
        }
    });
    
    // Clean up IP tracking
    untrackSessionByIp(sessionId);
    
    // Clean up last access tracking
    sessionLastAccess.delete(sessionId);
    
    sessions.delete(sessionId);
}

/**
 * Checks if the host is still connected to a session
 */
export function isHostConnected(sessionId: string): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    const host = session.users.get(session.hostId);
    return host?.connected ?? false;
}

/**
 * Checks if a user can reconnect to a session
 * Verifies the session exists, hasn't expired, and the user is a member
 */
export function canReconnect(sessionId: string, userId: string): boolean {
    const session = sessions.get(sessionId.toUpperCase());
    if (!session || !session.users.has(userId)) {
        return false;
    }
    // Check if session has expired
    if (session.expiresAt < new Date()) {
        return false;
    }
    return true;
}

/**
 * Starts a session (host only)
 */
export function startSession(sessionId: string, userId: string): boolean {
    const session = sessions.get(sessionId);

    if (!session || session.hostId !== userId) {
        return false;
    }

    session.status = 'active';
    return true;
}

/**
 * Records a swipe and checks for matches
 * Updates last access time for LRU tracking
 */
export function recordSwipe(
    sessionId: string,
    userId: string,
    placeId: string,
    decision: 'yes' | 'no'
): {
    success: boolean;
    match?: Match;
    queueUpdated?: boolean;
    newQueue?: string[];
} {
    const session = sessions.get(sessionId);
    const user = session?.users.get(userId);
    const place = session?.places.find(p => p.id === placeId);

    if (!session || !user || !place) {
        return { success: false };
    }

    // Update last access time for LRU tracking
    touchSession(sessionId);

    // Record the swipe
    const swipeData: SwipeData = {
        placeId,
        decision,
        timestamp: new Date(),
        categories: place.categories,
    };
    user.swipes.set(placeId, swipeData);
    user.lastSeenIndex++;

    let queueUpdated = false;
    let newQueue: string[] | undefined;
    let match: Match | undefined;

    if (decision === 'no') {
        // Record the place veto (affects only this specific place)
        recordPlaceVeto(session.placeVetos, userId, placeId);
        
        // Track category veto for preference learning (doesn't affect queue)
        trackCategoryVeto(session.categoryVetos, userId, place.categories);

        // Check if ALL users have now swiped "no" on this specific place
        if (shouldRemovePlace(session.placeVetos, placeId, session.users.size)) {
            // Remove the place from the queue
            session.queue = session.queue.filter(id => id !== placeId);
            queueUpdated = true;
            newQueue = session.queue;
        }
    } else {
        // Process like - track positive preferences
        processLike(session.categoryLikes, userId, place.categories);

        // Check for match - all connected users swiped yes on this place
        const connectedUsers = Array.from(session.users.values()).filter(u => u.connected);
        const allSwipedYes = connectedUsers.every(u => {
            const swipe = u.swipes.get(placeId);
            return swipe?.decision === 'yes';
        });

        if (allSwipedYes && connectedUsers.length >= 2) {
            match = {
                placeId,
                place,
                matchedAt: new Date(),
                matchedBy: connectedUsers.map(u => u.id),
            };
            session.matches.push(match);
        }
    }

    return { success: true, match, queueUpdated, newQueue };
}

/**
 * Track positive preference when a user likes a place
 */
function processLike(
    categoryLikes: Map<string, Set<string>>,
    userId: string,
    categories: string[]
): void {
    for (const category of categories) {
        if (!categoryLikes.has(category)) {
            categoryLikes.set(category, new Set());
        }
        categoryLikes.get(category)!.add(userId);
    }
}

/**
 * Adds more places to a session (for progressive search)
 */
export function addMorePlaces(
    sessionId: string, 
    newPlaces: Place[],
    newRadius?: number
): { success: boolean; totalPlaces: number } {
    const session = sessions.get(sessionId);
    
    if (!session) {
        return { success: false, totalPlaces: 0 };
    }

    // Add new places (avoid duplicates)
    const existingIds = new Set(session.places.map(p => p.id));
    const uniqueNewPlaces = newPlaces.filter(p => !existingIds.has(p.id));
    
    session.places.push(...uniqueNewPlaces);
    session.queue.push(...uniqueNewPlaces.map(p => p.id));

    // Update search config radius if provided
    if (newRadius && session.searchConfig) {
        session.searchConfig.currentRadius = newRadius;
    }

    return { success: true, totalPlaces: session.places.length };
}

/**
 * Gets the search config for a session
 */
export function getSearchConfig(sessionId: string): SearchConfig | undefined {
    return sessions.get(sessionId)?.searchConfig;
}

/**
 * Gets all place IDs in a session (for excluding from future searches)
 */
export function getSessionPlaceIds(sessionId: string): string[] {
    const session = sessions.get(sessionId);
    return session ? session.places.map(p => p.id) : [];
}

/**
 * Gets user preferences based on swipe history
 * Returns liked and disliked categories with their preference scores
 */
export function getUserPreferences(sessionId: string): {
    likedCategories: string[];
    dislikedCategories: string[];
    preferredSearchQueries: string[];
} {
    const session = sessions.get(sessionId);
    
    if (!session) {
        return { likedCategories: [], dislikedCategories: [], preferredSearchQueries: [] };
    }

    const totalUsers = session.users.size;
    
    // Calculate liked categories (categories that most users liked)
    const likedCategories: string[] = [];
    session.categoryLikes.forEach((likers, category) => {
        // If at least half of users liked this category, include it
        if (likers.size >= totalUsers / 2) {
            likedCategories.push(category.toLowerCase());
        }
    });

    // Calculate disliked categories (categories that most users vetoed)
    const dislikedCategories: string[] = [];
    session.categoryVetos.forEach((vetoers, category) => {
        // If at least half of users vetoed this category, exclude it
        if (vetoers.size >= totalUsers / 2) {
            dislikedCategories.push(category.toLowerCase());
        }
    });

    // Map liked categories to search queries for fetching more places
    const categoryToQuery: Record<string, string> = {
        'sushi': 'sushi restaurant',
        'japanese': 'japanese restaurant',
        'chinese': 'chinese restaurant',
        'korean': 'korean restaurant',
        'thai': 'thai restaurant',
        'indian': 'indian restaurant',
        'mexican': 'mexican restaurant',
        'italian': 'italian restaurant',
        'pizza': 'pizza restaurant',
        'burger': 'burger restaurant',
        'fast food': 'fast food restaurant',
        'cafe': 'cafe',
        'coffee': 'coffee shop',
        'bakery': 'bakery',
        'bar': 'bar',
        'pub': 'pub',
        'seafood': 'seafood restaurant',
        'steakhouse': 'steakhouse',
        'vegetarian': 'vegetarian restaurant',
        'vegan': 'vegan restaurant',
        'brunch': 'brunch restaurant',
        'breakfast': 'breakfast restaurant',
        'asian': 'asian restaurant',
        'american': 'american restaurant',
        'french': 'french restaurant',
        'mediterranean': 'mediterranean restaurant',
        'ramen': 'ramen restaurant',
    };

    const preferredSearchQueries: string[] = [];
    for (const category of likedCategories) {
        const query = categoryToQuery[category];
        if (query && !preferredSearchQueries.includes(query)) {
            preferredSearchQueries.push(query);
        }
    }

    return { likedCategories, dislikedCategories, preferredSearchQueries };
}

/**
 * Gets the client-side session state for a specific user
 */
export function getClientState(sessionId: string, userId: string): ClientSessionState | null {
    const session = sessions.get(sessionId);
    const user = session?.users.get(userId);

    if (!session || !user) {
        return null;
    }

    // Convert swipes map to record
    const swipes: Record<string, 'yes' | 'no'> = {};
    user.swipes.forEach((swipe, placeId) => {
        swipes[placeId] = swipe.decision;
    });

    // Convert users map to array
    const users = Array.from(session.users.values()).map(u => ({
        id: u.id,
        name: u.name,
        isHost: u.isHost,
        connected: u.connected,
    }));

    return {
        sessionId: session.id,
        userId: user.id,
        userName: user.name,
        isHost: user.isHost,
        status: session.status,
        queue: session.queue,
        places: session.places,
        currentIndex: user.lastSeenIndex,
        swipes,
        matches: session.matches,
        users,
    };
}

/**
 * Cleanup expired sessions (call periodically)
 * Also cleans up idle sessions that have no connected users
 */
export function cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;

    sessions.forEach((session, id) => {
        if (session.expiresAt < now) {
            // Clean up socket mappings
            session.users.forEach(user => {
                if (user.socketId) {
                    socketToSession.delete(user.socketId);
                }
            });
            
            // Clean up IP tracking
            untrackSessionByIp(id);
            
            // Clean up last access tracking
            sessionLastAccess.delete(id);
            
            sessions.delete(id);
            cleaned++;
        }
    });

    // Also run idle session cleanup
    cleaned += cleanupIdleSessions();

    return cleaned;
}

// Export for testing
export { sessions, socketToSession };
