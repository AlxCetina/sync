'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    ClientSessionState,
    CreateSessionPayload,
    JoinSessionPayload,
    SwipePayload,
    Match,
    Place,
    SOCKET_EVENTS,
    QueueUpdateEvent,
    MatchEvent,
    UserJoinedEvent,
    UserDisconnectedEvent,
    UserReconnectedEvent,
    SessionEndedEvent,
    ErrorEvent,
} from '@/types';

// Storage keys (token is now stored in HttpOnly cookie, not localStorage)
const STORAGE_KEYS = {
    SESSION_ID: 'sync_session_id',
    USER_ID: 'sync_user_id',
};

/**
 * Set the auth token as an HttpOnly cookie via API
 */
async function setAuthCookie(token: string): Promise<boolean> {
    try {
        const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include',
        });
        return response.ok;
    } catch (error) {
        console.error('[Auth] Failed to set auth cookie:', error);
        return false;
    }
}

/**
 * Clear the auth token cookie via API
 */
async function clearAuthCookie(): Promise<void> {
    try {
        await fetch('/api/auth/token', {
            method: 'DELETE',
            credentials: 'include',
        });
    } catch (error) {
        console.error('[Auth] Failed to clear auth cookie:', error);
    }
}

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    isReconnecting: boolean;
    sessionState: ClientSessionState | null;
    error: ErrorEvent | null;
    noMorePlaces: boolean;

    // Actions
    createSession: (payload: Omit<CreateSessionPayload, 'userId'>) => Promise<void>;
    joinSession: (sessionId: string, userName: string) => Promise<void>;
    startSession: () => Promise<void>;
    swipe: (placeId: string, decision: 'yes' | 'no') => Promise<{ match?: Match }>;
    requestMorePlaces: () => Promise<{ success: boolean; newPlacesCount?: number }>;
    disconnect: () => void;
    clearError: () => void;
}

export function useSocket(): UseSocketReturn {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [sessionState, setSessionState] = useState<ClientSessionState | null>(null);
    const [error, setError] = useState<ErrorEvent | null>(null);
    const [noMorePlaces, setNoMorePlaces] = useState(false);

    // Initialize socket connection
    useEffect(() => {
        const socket = io({
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            withCredentials: true, // Send cookies with socket connection
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            setIsConnected(true);

            // Try to reconnect to existing session using HttpOnly cookie
            // The token is sent automatically via the cookie
            const savedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
            const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

            if (savedSessionId && savedUserId && !sessionState) {
                setIsReconnecting(true);
                socket.emit(
                    SOCKET_EVENTS.RECONNECT,
                    { 
                        sessionId: savedSessionId, 
                        userId: savedUserId,
                        // Token is read from HttpOnly cookie on server
                    },
                    (response: { state?: ClientSessionState; error?: ErrorEvent }) => {
                        setIsReconnecting(false);
                        if (response.state) {
                            setSessionState(response.state);
                            console.log('[Socket] Reconnected to session:', savedSessionId);
                        } else {
                            // Clear invalid session data
                            localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
                            localStorage.removeItem(STORAGE_KEYS.USER_ID);
                            clearAuthCookie();
                        }
                    }
                );
            }
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err);
            setError({ code: 'CONNECTION_ERROR', message: 'Failed to connect to server' });
        });

        // Session events
        socket.on(SOCKET_EVENTS.SESSION_STARTED, () => {
            setSessionState(prev => prev ? { ...prev, status: 'active' } : null);
        });

        socket.on(SOCKET_EVENTS.USER_JOINED, (event: UserJoinedEvent) => {
            setSessionState(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    users: [...prev.users, event.user],
                };
            });
        });

        socket.on(SOCKET_EVENTS.USER_DISCONNECTED, (event: UserDisconnectedEvent) => {
            setSessionState(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    users: prev.users.map(u =>
                        u.id === event.userId ? { ...u, connected: false } : u
                    ),
                };
            });
        });

        socket.on(SOCKET_EVENTS.USER_RECONNECTED, (event: UserReconnectedEvent) => {
            setSessionState(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    users: prev.users.map(u =>
                        u.id === event.userId ? { ...u, connected: true } : u
                    ),
                };
            });
        });

        socket.on(SOCKET_EVENTS.QUEUE_UPDATE, (event: QueueUpdateEvent) => {
            console.log('[Socket] Queue updated:', event.reason);
            setSessionState(prev => {
                if (!prev) return null;
                // If new places were added, merge them
                const updatedPlaces = event.places 
                    ? [...prev.places, ...event.places]
                    : prev.places;
                return { ...prev, queue: event.queue, places: updatedPlaces };
            });
        });

        socket.on(SOCKET_EVENTS.NO_MORE_PLACES, (event: { reason: string; message: string }) => {
            console.log('[Socket] No more places:', event.reason);
            setNoMorePlaces(true);
        });

        socket.on(SOCKET_EVENTS.MATCH, (event: MatchEvent) => {
            console.log('[Socket] Match!', event.match.place.name);
            setSessionState(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    matches: [...prev.matches, event.match],
                };
            });
        });

        socket.on(SOCKET_EVENTS.SESSION_ENDED, (event: SessionEndedEvent) => {
            console.log('[Socket] Session ended:', event.reason);
            // Clear session data and auth cookie
            localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
            localStorage.removeItem(STORAGE_KEYS.USER_ID);
            clearAuthCookie();
            setSessionState(null);
            setError({ code: 'SESSION_ENDED', message: event.message });
        });

        socket.on(SOCKET_EVENTS.ERROR, (event: ErrorEvent) => {
            console.error('[Socket] Error:', event);
            setError(event);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Create session
    const createSession = useCallback(async (payload: Omit<CreateSessionPayload, 'userId'>) => {
        const socket = socketRef.current;
        if (!socket) throw new Error('Socket not connected');

        return new Promise<void>((resolve, reject) => {
            // Add timeout to prevent hanging promises
            const timeout = setTimeout(() => {
                reject(new Error('Session creation timed out'));
            }, 30000); // 30 second timeout

            socket.emit(
                SOCKET_EVENTS.CREATE_SESSION,
                payload,
                async (response: { sessionId?: string; userId?: string; token?: string; state?: ClientSessionState; error?: ErrorEvent }) => {
                    clearTimeout(timeout);

                    console.log('[Socket] Create session response:', response);

                    if (response.error) {
                        setError(response.error);
                        reject(new Error(response.error.message));
                        return;
                    }

                    if (response.state && response.sessionId && response.userId) {
                        // Save session info to localStorage for UI purposes
                        localStorage.setItem(STORAGE_KEYS.SESSION_ID, response.sessionId);
                        localStorage.setItem(STORAGE_KEYS.USER_ID, response.userId);
                        
                        // Set token as HttpOnly cookie (secure, not accessible via JS)
                        if (response.token) {
                            const cookieSet = await setAuthCookie(response.token);
                            if (!cookieSet) {
                                console.warn('[Socket] Failed to set auth cookie, using payload token as fallback');
                            }
                        }

                        setSessionState(response.state);
                        resolve();
                    } else {
                        // Handle unexpected response format
                        const errorMsg = 'Invalid response from server';
                        setError({ code: 'INVALID_RESPONSE', message: errorMsg });
                        reject(new Error(errorMsg));
                    }
                }
            );
        });
    }, []);

    // Join session
    const joinSession = useCallback(async (sessionId: string, userName: string) => {
        const socket = socketRef.current;
        if (!socket) throw new Error('Socket not connected');

        const payload: JoinSessionPayload = { sessionId, userName };

        return new Promise<void>((resolve, reject) => {
            socket.emit(
                SOCKET_EVENTS.JOIN_SESSION,
                payload,
                async (response: { userId?: string; token?: string; state?: ClientSessionState; error?: ErrorEvent }) => {
                    if (response.error) {
                        setError(response.error);
                        reject(new Error(response.error.message));
                        return;
                    }

                    if (response.state && response.userId) {
                        // Save session info to localStorage for UI purposes
                        localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
                        localStorage.setItem(STORAGE_KEYS.USER_ID, response.userId);
                        
                        // Set token as HttpOnly cookie (secure, not accessible via JS)
                        if (response.token) {
                            const cookieSet = await setAuthCookie(response.token);
                            if (!cookieSet) {
                                console.warn('[Socket] Failed to set auth cookie, using payload token as fallback');
                            }
                        }

                        setSessionState(response.state);
                        resolve();
                    }
                }
            );
        });
    }, []);

    // Start session
    const startSession = useCallback(async () => {
        const socket = socketRef.current;
        if (!socket || !sessionState) throw new Error('Socket not connected or no session');

        return new Promise<void>((resolve, reject) => {
            socket.emit(
                SOCKET_EVENTS.START_SESSION,
                { 
                    sessionId: sessionState.sessionId, 
                    userId: sessionState.userId,
                    // Token is read from HttpOnly cookie on server
                },
                (response: { success?: boolean; error?: ErrorEvent }) => {
                    if (response.error) {
                        setError(response.error);
                        reject(new Error(response.error.message));
                        return;
                    }
                    resolve();
                }
            );
        });
    }, [sessionState]);

    // Swipe
    const swipe = useCallback(async (placeId: string, decision: 'yes' | 'no'): Promise<{ match?: Match }> => {
        const socket = socketRef.current;
        if (!socket || !sessionState) throw new Error('Socket not connected or no session');

        const payload: SwipePayload = {
            sessionId: sessionState.sessionId,
            userId: sessionState.userId,
            placeId,
            decision,
            // Token is read from HttpOnly cookie on server
        };

        return new Promise((resolve, reject) => {
            // Optimistic update
            setSessionState(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    swipes: { ...prev.swipes, [placeId]: decision },
                    currentIndex: prev.currentIndex + 1,
                };
            });

            socket.emit(
                SOCKET_EVENTS.SWIPE,
                payload,
                (response: { success?: boolean; match?: Match; error?: ErrorEvent }) => {
                    if (response.error) {
                        // Rollback optimistic update
                        setSessionState(prev => {
                            if (!prev) return null;
                            const newSwipes = { ...prev.swipes };
                            delete newSwipes[placeId];
                            return {
                                ...prev,
                                swipes: newSwipes,
                                currentIndex: prev.currentIndex - 1,
                            };
                        });
                        setError(response.error);
                        reject(new Error(response.error.message));
                        return;
                    }
                    resolve({ match: response.match });
                }
            );
        });
    }, [sessionState]);

    // Request more places when running low
    const requestMorePlaces = useCallback(async (): Promise<{ success: boolean; newPlacesCount?: number }> => {
        const socket = socketRef.current;
        if (!socket || !sessionState) throw new Error('Socket not connected or no session');

        return new Promise((resolve, reject) => {
            socket.emit(
                SOCKET_EVENTS.REQUEST_MORE_PLACES,
                { 
                    sessionId: sessionState.sessionId, 
                    userId: sessionState.userId,
                    // Token is read from HttpOnly cookie on server
                },
                (response: { success?: boolean; newPlacesCount?: number; error?: ErrorEvent; reason?: string }) => {
                    if (response.error) {
                        setError(response.error);
                        reject(new Error(response.error.message));
                        return;
                    }
                    resolve({ 
                        success: response.success ?? false, 
                        newPlacesCount: response.newPlacesCount 
                    });
                }
            );
        });
    }, [sessionState]);

    // Disconnect and clear session
    const disconnect = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        clearAuthCookie(); // Clear HttpOnly cookie
        setSessionState(null);
        setNoMorePlaces(false);

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current.connect();
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        isReconnecting,
        sessionState,
        error,
        noMorePlaces,
        createSession,
        joinSession,
        startSession,
        swipe,
        requestMorePlaces,
        disconnect,
        clearError,
    };
}
