import { Server, Socket } from 'socket.io';
import {
    CreateSessionPayload,
    JoinSessionPayload,
    ReconnectPayload,
    SwipePayload,
    SOCKET_EVENTS,
    SearchConfig,
} from '@/types';
import {
    createSession,
    joinSession,
    getSession,
    setUserSocket,
    handleDisconnect,
    startSession,
    recordSwipe,
    getClientState,
    canReconnect,
    endSession,
    isHostConnected,
    addMorePlaces,
    getSearchConfig,
    getSessionPlaceIds,
    getUserPreferences,
    canCreateSession,
    verifyToken,
} from './sessionManager';
import { fetchPlaces, INITIAL_RADIUS, MAX_RADIUS, RADIUS_INCREMENT, MAX_PLACES } from '@/lib/places/placesApi';
import {
    validateUserName,
    sanitizeUserName,
    validateSessionCode,
    validateLocation,
    validatePlaceId,
    validateSwipeDecision,
    validateSearchRadius,
} from '@/lib/security/validation';
import {
    sessionCreateLimiter,
    sessionJoinLimiter,
    failedJoinLimiter,
    swipeLimiter,
    reconnectLimiter,
    morePlacesLimiter,
    getClientIp,
    checkRateLimit,
    penalizeFailedAttempt,
} from '@/lib/security/rateLimit';
import { verifySessionToken } from '@/lib/security/tokens';
import { getTokenFromSocket } from '@/lib/security/cookies';
import {
    logAuthFailure,
    logRateLimited,
    logSessionCreated,
    logSessionJoined,
    logReconnectSuccess,
    logReconnectFailure,
    logValidationFailure,
} from '@/lib/security/auditLog';

/**
 * Helper to get token from payload or cookie
 * Prioritizes payload token, falls back to HttpOnly cookie
 */
function getToken(socket: { handshake: { headers: { cookie?: string } } }, payloadToken?: string): string | null {
    // First check payload (for create/join where cookie isn't set yet)
    if (payloadToken) {
        return payloadToken;
    }
    // Fall back to HttpOnly cookie
    return getTokenFromSocket(socket);
}

/**
 * Add a random delay to prevent timing attacks
 * This makes it impossible to distinguish between "session exists" and "session doesn't exist"
 * based on response time, preventing session enumeration attacks.
 * 
 * @param minMs Minimum delay in milliseconds
 * @param maxMs Maximum delay in milliseconds
 */
async function randomDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Registers all Socket.io event handlers
 */
export function registerSocketHandlers(io: Server) {
    io.on('connection', (socket: Socket) => {
        const clientIp = getClientIp(socket);
        console.log(`[Socket] Client connected: ${socket.id} from ${clientIp}`);

        // Create a new session (Host)
        socket.on(SOCKET_EVENTS.CREATE_SESSION, async (payload: CreateSessionPayload, callback) => {
            try {
                // Rate limiting
                const rateLimit = await checkRateLimit(sessionCreateLimiter, clientIp);
                if (!rateLimit.allowed) {
                    logRateLimited(clientIp, 'CREATE_SESSION', rateLimit.retryAfter || 60, socket.id);
                    callback({ error: { code: 'RATE_LIMITED', message: `Too many requests. Try again in ${rateLimit.retryAfter} seconds.` } });
                    return;
                }

                // Check if IP can create more sessions
                if (!canCreateSession(clientIp)) {
                    logRateLimited(clientIp, 'SESSION_LIMIT', 0, socket.id);
                    callback({ error: { code: 'SESSION_LIMIT', message: 'Maximum session limit reached for this IP' } });
                    return;
                }

                // Validate host name
                const nameValidation = validateUserName(payload.hostName);
                if (!nameValidation.valid) {
                    logValidationFailure(clientIp, 'hostName', payload.hostName || '', nameValidation.error || 'Invalid', socket.id);
                    callback({ error: { code: 'INVALID_NAME', message: nameValidation.error } });
                    return;
                }
                const sanitizedName = sanitizeUserName(payload.hostName);

                // Validate location
                const locationValidation = validateLocation(payload.location);
                if (!locationValidation.valid) {
                    callback({ error: { code: 'INVALID_LOCATION', message: locationValidation.error } });
                    return;
                }

                // Validate search radius if provided
                const initialRadius = payload.searchRadius || INITIAL_RADIUS;
                if (payload.searchRadius) {
                    const radiusValidation = validateSearchRadius(payload.searchRadius);
                    if (!radiusValidation.valid) {
                        callback({ error: { code: 'INVALID_RADIUS', message: radiusValidation.error } });
                        return;
                    }
                }

                console.log(`[Socket] Creating session for host: ${sanitizedName}`);
                console.log(`[Socket] Place types: ${payload.placeTypes?.join(', ') || 'all'}`);
                console.log(`[Socket] Search radius: ${initialRadius}m`);

                // Fetch places from Google API with selected radius
                const places = await fetchPlaces(
                    locationValidation.location!,
                    payload.searchType,
                    payload.searchQuery,
                    payload.placeTypes,
                    initialRadius
                );

                if (places.length === 0) {
                    callback({ error: { code: 'NO_PLACES', message: 'No places found for this location' } });
                    return;
                }

                // Create search config for progressive expansion
                const searchConfig: SearchConfig = {
                    location: locationValidation.location!,
                    placeTypes: payload.placeTypes,
                    searchType: payload.searchType,
                    currentRadius: initialRadius,
                    maxRadius: Math.max(initialRadius, MAX_RADIUS),
                    maxPlaces: MAX_PLACES,
                };

                // Create the session with search config and track by IP
                const { session, userId, token } = createSession(sanitizedName, places, searchConfig, clientIp);

                // Associate socket with user
                setUserSocket(session.id, userId, socket.id);

                // Join socket room
                socket.join(session.id);

                // Get client state
                const state = getClientState(session.id, userId);

                callback({
                    sessionId: session.id,
                    userId,
                    token, // Send JWT token for future authentication
                    state,
                });

                // Audit log successful session creation
                logSessionCreated(clientIp, session.id, userId, sanitizedName);
                console.log(`[Socket] Session created: ${session.id} by ${sanitizedName} with ${places.length} places`);
            } catch (error) {
                console.error('[Socket] Error creating session:', error);
                callback({ error: { code: 'CREATE_ERROR', message: 'Failed to create session' } });
            }
        });

        // Join an existing session (Guest)
        socket.on(SOCKET_EVENTS.JOIN_SESSION, async (payload: JoinSessionPayload, callback) => {
            try {
                // Rate limiting
                const rateLimit = await checkRateLimit(sessionJoinLimiter, clientIp);
                if (!rateLimit.allowed) {
                    logRateLimited(clientIp, 'JOIN_SESSION', rateLimit.retryAfter || 60, socket.id);
                    callback({ error: { code: 'RATE_LIMITED', message: `Too many requests. Try again in ${rateLimit.retryAfter} seconds.` } });
                    return;
                }

                // Validate user name
                const nameValidation = validateUserName(payload.userName);
                if (!nameValidation.valid) {
                    logValidationFailure(clientIp, 'userName', payload.userName || '', nameValidation.error || 'Invalid', socket.id);
                    callback({ error: { code: 'INVALID_NAME', message: nameValidation.error } });
                    return;
                }
                const sanitizedName = sanitizeUserName(payload.userName);

                // Validate session code
                const codeValidation = validateSessionCode(payload.sessionId);
                if (!codeValidation.valid) {
                    logValidationFailure(clientIp, 'sessionId', payload.sessionId || '', codeValidation.error || 'Invalid', socket.id);
                    // Add random delay to prevent timing attacks
                    await randomDelay();
                    await penalizeFailedAttempt(failedJoinLimiter, clientIp);
                    callback({ error: { code: 'INVALID_CODE', message: codeValidation.error } });
                    return;
                }

                console.log(`[Socket] User ${sanitizedName} joining session: ${payload.sessionId}`);

                const result = joinSession(payload.sessionId, sanitizedName);

                if (!result) {
                    // Log potential brute force/enumeration attempt
                    logAuthFailure(clientIp, 'Session not found', { attemptedSessionId: payload.sessionId }, socket.id);
                    // Add random delay to prevent timing attacks (session enumeration protection)
                    // This ensures the response time is the same whether session exists or not
                    await randomDelay();
                    // Penalize failed attempt to prevent brute force
                    await penalizeFailedAttempt(failedJoinLimiter, clientIp);
                    callback({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
                    return;
                }

                const { session, userId, token } = result;

                // Associate socket with user
                setUserSocket(session.id, userId, socket.id);

                // Join socket room
                socket.join(session.id);

                // Get client state
                const state = getClientState(session.id, userId);

                // Notify others in the room
                socket.to(session.id).emit(SOCKET_EVENTS.USER_JOINED, {
                    user: {
                        id: userId,
                        name: sanitizedName,
                        isHost: false,
                        connected: true,
                    },
                });

                callback({
                    userId,
                    token, // Send JWT token for future authentication
                    state,
                });

                // Audit log successful session join
                logSessionJoined(clientIp, session.id, userId, sanitizedName);
                console.log(`[Socket] User ${sanitizedName} joined session: ${session.id}`);
            } catch (error) {
                console.error('[Socket] Error joining session:', error);
                callback({ error: { code: 'JOIN_ERROR', message: 'Failed to join session' } });
            }
        });

        // Reconnect to a session (requires valid token from payload or cookie)
        socket.on(SOCKET_EVENTS.RECONNECT, async (payload: ReconnectPayload & { token?: string }, callback) => {
            try {
                // Rate limiting
                const rateLimit = await checkRateLimit(reconnectLimiter, clientIp);
                if (!rateLimit.allowed) {
                    logRateLimited(clientIp, 'RECONNECT', rateLimit.retryAfter || 60, socket.id);
                    callback({ error: { code: 'RATE_LIMITED', message: `Too many requests. Try again in ${rateLimit.retryAfter} seconds.` } });
                    return;
                }

                // Get token from payload or HttpOnly cookie
                const token = getToken(socket, payload.token);
                if (!token) {
                    logAuthFailure(clientIp, 'No token provided for reconnect', {}, socket.id);
                    callback({ error: { code: 'INVALID_TOKEN', message: 'Authentication required' } });
                    return;
                }

                const tokenPayload = verifySessionToken(token);
                if (!tokenPayload) {
                    logAuthFailure(clientIp, 'Invalid or expired token for reconnect', {}, socket.id);
                    callback({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
                    return;
                }

                const verifiedUserId = tokenPayload.userId;
                const verifiedSessionId = tokenPayload.sessionId;

                console.log(`[Socket] User ${verifiedUserId} reconnecting to session: ${verifiedSessionId}`);

                if (!canReconnect(verifiedSessionId, verifiedUserId)) {
                    logReconnectFailure(clientIp, verifiedSessionId, 'Session no longer exists or user not found', socket.id);
                    callback({ error: { code: 'CANNOT_RECONNECT', message: 'Cannot reconnect to this session' } });
                    return;
                }

                // Associate socket with user
                setUserSocket(verifiedSessionId, verifiedUserId, socket.id);

                // Join socket room
                socket.join(verifiedSessionId.toUpperCase());

                // Get client state
                const state = getClientState(verifiedSessionId, verifiedUserId);

                // Notify others
                socket.to(verifiedSessionId.toUpperCase()).emit(SOCKET_EVENTS.USER_RECONNECTED, {
                    userId: verifiedUserId,
                });

                callback({ state });

                // Audit log successful reconnection
                logReconnectSuccess(clientIp, verifiedSessionId, verifiedUserId, socket.id);
                console.log(`[Socket] User ${verifiedUserId} reconnected to session: ${verifiedSessionId}`);
            } catch (error) {
                console.error('[Socket] Error reconnecting:', error);
                callback({ error: { code: 'RECONNECT_ERROR', message: 'Failed to reconnect' } });
            }
        });

        // Start session (Host only, requires valid token from payload or cookie)
        socket.on(SOCKET_EVENTS.START_SESSION, (payload: { sessionId: string; userId: string; token?: string }, callback) => {
            try {
                // Get token from payload or HttpOnly cookie
                const token = getToken(socket, payload.token);
                if (!token) {
                    logAuthFailure(clientIp, 'No token provided for start session', {}, socket.id);
                    callback({ error: { code: 'INVALID_TOKEN', message: 'Authentication required' } });
                    return;
                }

                const tokenPayload = verifySessionToken(token);
                if (!tokenPayload) {
                    logAuthFailure(clientIp, 'Invalid or expired token for start session', {}, socket.id);
                    callback({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
                    return;
                }

                if (!tokenPayload.isHost) {
                    logAuthFailure(clientIp, 'Non-host attempted to start session', { sessionId: tokenPayload.sessionId, userId: tokenPayload.userId }, socket.id);
                    callback({ error: { code: 'NOT_HOST', message: 'Only the host can start the session' } });
                    return;
                }

                const verifiedUserId = tokenPayload.userId;
                const verifiedSessionId = tokenPayload.sessionId;

                const success = startSession(verifiedSessionId, verifiedUserId);

                if (!success) {
                    callback({ error: { code: 'NOT_HOST', message: 'Only the host can start the session' } });
                    return;
                }

                // Notify all users in the room
                io.to(verifiedSessionId).emit(SOCKET_EVENTS.SESSION_STARTED, {});

                callback({ success: true });

                console.log(`[Socket] Session started: ${verifiedSessionId}`);
            } catch (error) {
                console.error('[Socket] Error starting session:', error);
                callback({ error: { code: 'START_ERROR', message: 'Failed to start session' } });
            }
        });

        // Handle swipe (with validation and rate limiting, requires valid token from payload or cookie)
        socket.on(SOCKET_EVENTS.SWIPE, async (payload: SwipePayload & { token?: string }, callback) => {
            try {
                // Get token from payload or HttpOnly cookie
                const token = getToken(socket, payload.token);
                if (!token) {
                    logAuthFailure(clientIp, 'No token provided for swipe', {}, socket.id);
                    callback({ error: { code: 'INVALID_TOKEN', message: 'Authentication required' } });
                    return;
                }

                const tokenPayload = verifySessionToken(token);
                if (!tokenPayload) {
                    logAuthFailure(clientIp, 'Invalid or expired token for swipe', {}, socket.id);
                    callback({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
                    return;
                }

                const verifiedUserId = tokenPayload.userId;
                const verifiedSessionId = tokenPayload.sessionId;

                // Rate limiting per user
                const rateLimit = await checkRateLimit(swipeLimiter, `${clientIp}:${verifiedSessionId}`);
                if (!rateLimit.allowed) {
                    logRateLimited(clientIp, 'SWIPE', rateLimit.retryAfter || 60, socket.id);
                    callback({ error: { code: 'RATE_LIMITED', message: 'Slow down! Too many swipes.' } });
                    return;
                }

                // Validate place ID
                const placeValidation = validatePlaceId(payload.placeId);
                if (!placeValidation.valid) {
                    callback({ error: { code: 'INVALID_PLACE', message: placeValidation.error } });
                    return;
                }

                // Validate decision
                const decisionValidation = validateSwipeDecision(payload.decision);
                if (!decisionValidation.valid) {
                    callback({ error: { code: 'INVALID_DECISION', message: decisionValidation.error } });
                    return;
                }

                console.log(`[Socket] Swipe from ${verifiedUserId}: ${payload.decision} on ${payload.placeId}`);

                const result = recordSwipe(
                    verifiedSessionId,
                    verifiedUserId,
                    payload.placeId,
                    payload.decision
                );

                if (!result.success) {
                    callback({ error: { code: 'SWIPE_ERROR', message: 'Failed to record swipe' } });
                    return;
                }

                // Broadcast swipe to others (for potential UI sync)
                socket.to(verifiedSessionId).emit(SOCKET_EVENTS.SWIPE_RECORDED, {
                    userId: verifiedUserId,
                    placeId: payload.placeId,
                    decision: payload.decision,
                });

                // If queue was reordered, notify all users
                if (result.queueUpdated && result.newQueue) {
                    io.to(verifiedSessionId).emit(SOCKET_EVENTS.QUEUE_UPDATE, {
                        queue: result.newQueue,
                        reason: 'veto_reorder',
                    });
                    console.log(`[Socket] Queue reordered in session: ${verifiedSessionId}`);
                }

                // If there's a match, notify all users immediately
                if (result.match) {
                    io.to(verifiedSessionId).emit(SOCKET_EVENTS.MATCH, {
                        match: result.match,
                    });
                    console.log(`[Socket] Match found in session: ${verifiedSessionId} - ${result.match.place.name}`);
                }

                callback({ success: true, match: result.match });
            } catch (error) {
                console.error('[Socket] Error recording swipe:', error);
                callback({ error: { code: 'SWIPE_ERROR', message: 'Failed to record swipe' } });
            }
        });

        // Request more places (when running low on options, requires valid token from payload or cookie)
        socket.on(SOCKET_EVENTS.REQUEST_MORE_PLACES, async (payload: { sessionId: string; userId: string; token?: string }, callback) => {
            try {
                // Get token from payload or HttpOnly cookie
                const token = getToken(socket, payload.token);
                if (!token) {
                    logAuthFailure(clientIp, 'No token provided for request more places', {}, socket.id);
                    callback({ error: { code: 'INVALID_TOKEN', message: 'Authentication required' } });
                    return;
                }

                const tokenPayload = verifySessionToken(token);
                if (!tokenPayload) {
                    logAuthFailure(clientIp, 'Invalid or expired token for request more places', {}, socket.id);
                    callback({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
                    return;
                }

                const verifiedSessionId = tokenPayload.sessionId;

                // Rate limiting
                const rateLimit = await checkRateLimit(morePlacesLimiter, `${clientIp}:${verifiedSessionId}`);
                if (!rateLimit.allowed) {
                    logRateLimited(clientIp, 'REQUEST_MORE_PLACES', rateLimit.retryAfter || 60, socket.id);
                    callback({ error: { code: 'RATE_LIMITED', message: `Too many requests. Try again in ${rateLimit.retryAfter} seconds.` } });
                    return;
                }

                console.log(`[Socket] Request for more places in session: ${verifiedSessionId}`);

                const searchConfig = getSearchConfig(verifiedSessionId);
                const session = getSession(verifiedSessionId);

                if (!searchConfig || !session) {
                    callback({ error: { code: 'NO_CONFIG', message: 'Session not found or no search config' } });
                    return;
                }

                // Check if we've reached max places
                if (session.places.length >= searchConfig.maxPlaces) {
                    io.to(verifiedSessionId).emit(SOCKET_EVENTS.NO_MORE_PLACES, {
                        reason: 'max_places',
                        message: `Maximum of ${searchConfig.maxPlaces} places reached`,
                    });
                    callback({ success: false, reason: 'max_places' });
                    return;
                }

                // Check if we've reached max radius
                if (searchConfig.currentRadius >= searchConfig.maxRadius) {
                    io.to(verifiedSessionId).emit(SOCKET_EVENTS.NO_MORE_PLACES, {
                        reason: 'max_radius',
                        message: 'Maximum search area reached',
                    });
                    callback({ success: false, reason: 'max_radius' });
                    return;
                }

                // Calculate new radius
                const newRadius = Math.min(
                    searchConfig.currentRadius + RADIUS_INCREMENT,
                    searchConfig.maxRadius
                );

                // Get existing place IDs to exclude
                const existingPlaceIds = getSessionPlaceIds(verifiedSessionId);

                // Get user preferences based on swipe history
                const preferences = getUserPreferences(verifiedSessionId);
                console.log(`[Socket] User preferences - Liked: ${preferences.likedCategories.join(', ') || 'none'}, Disliked: ${preferences.dislikedCategories.join(', ') || 'none'}`);

                // Fetch more places with expanded radius and user preferences
                const newPlaces = await fetchPlaces(
                    searchConfig.location,
                    searchConfig.searchType,
                    undefined,
                    searchConfig.placeTypes,
                    newRadius,
                    existingPlaceIds,
                    preferences
                );

                if (newPlaces.length === 0) {
                    // No new places found, try again with even larger radius or give up
                    if (newRadius >= searchConfig.maxRadius) {
                        io.to(verifiedSessionId).emit(SOCKET_EVENTS.NO_MORE_PLACES, {
                            reason: 'no_more_available',
                            message: 'No more places available in this area',
                        });
                        callback({ success: false, reason: 'no_more_available' });
                    } else {
                        // Update radius even if no new places, so next request uses larger radius
                        addMorePlaces(verifiedSessionId, [], newRadius);
                        callback({ success: true, newPlacesCount: 0, newRadius });
                    }
                    return;
                }

                // Add new places to session (limit to not exceed max)
                const remainingSlots = searchConfig.maxPlaces - session.places.length;
                const placesToAdd = newPlaces.slice(0, remainingSlots);

                const result = addMorePlaces(verifiedSessionId, placesToAdd, newRadius);

                // Notify all users of the new places
                io.to(verifiedSessionId).emit(SOCKET_EVENTS.QUEUE_UPDATE, {
                    queue: session.queue,
                    places: placesToAdd,
                    reason: 'more_places',
                });

                console.log(`[Socket] Added ${placesToAdd.length} more places to session ${verifiedSessionId} (radius: ${newRadius}m)`);

                callback({
                    success: true,
                    newPlacesCount: placesToAdd.length,
                    totalPlaces: result.totalPlaces,
                    newRadius
                });
            } catch (error) {
                console.error('[Socket] Error fetching more places:', error);
                callback({ error: { code: 'FETCH_ERROR', message: 'Failed to fetch more places' } });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);

            const mapping = handleDisconnect(socket.id);

            if (mapping) {
                if (mapping.isHost) {
                    // Host disconnected - give them a grace period to reconnect
                    // This handles page navigation without ending the session
                    console.log(`[Socket] Host disconnected from session ${mapping.sessionId}, waiting for reconnect...`);

                    setTimeout(() => {
                        // Check if host has reconnected
                        if (!isHostConnected(mapping.sessionId)) {
                            // Host didn't reconnect - end the session
                            io.to(mapping.sessionId).emit(SOCKET_EVENTS.SESSION_ENDED, {
                                reason: 'host_left',
                                message: 'The host has left the session',
                            });
                            endSession(mapping.sessionId);
                            console.log(`[Socket] Session ${mapping.sessionId} ended - host left`);
                        } else {
                            console.log(`[Socket] Host reconnected to session ${mapping.sessionId}`);
                        }
                    }, 120000); // 2 minute grace period (handled by idle cleanup if longer)
                } else {
                    // Regular user left - just notify others
                    socket.to(mapping.sessionId).emit(SOCKET_EVENTS.USER_DISCONNECTED, {
                        userId: mapping.userId,
                    });
                    console.log(`[Socket] User ${mapping.userId} disconnected from session: ${mapping.sessionId}`);
                }
            }
        });
    });
}
