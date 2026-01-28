'use client';

import { useMemo } from 'react';
import { ClientSessionState, Place, Match } from '@/types';

interface UseSessionReturn {
    // Current place to display
    currentPlace: Place | null;

    // Remaining places in queue (after current)
    remainingCount: number;

    // Progress percentage
    progress: number;

    // Whether the session is complete (no more cards)
    isComplete: boolean;

    // All matches found
    matches: Match[];

    // Connected users info
    users: ClientSessionState['users'];
    connectedUsersCount: number;

    // Session info
    sessionId: string | null;
    isHost: boolean;
    status: ClientSessionState['status'] | null;
}

export function useSession(sessionState: ClientSessionState | null): UseSessionReturn {
    const currentPlace = useMemo(() => {
        if (!sessionState) return null;

        const currentPlaceId = sessionState.queue[sessionState.currentIndex];
        if (!currentPlaceId) return null;

        return sessionState.places.find(p => p.id === currentPlaceId) || null;
    }, [sessionState]);

    const remainingCount = useMemo(() => {
        if (!sessionState) return 0;
        return Math.max(0, sessionState.queue.length - sessionState.currentIndex - 1);
    }, [sessionState]);

    const progress = useMemo(() => {
        if (!sessionState || sessionState.queue.length === 0) return 0;
        return Math.round((sessionState.currentIndex / sessionState.queue.length) * 100);
    }, [sessionState]);

    const isComplete = useMemo(() => {
        if (!sessionState) return false;
        return sessionState.currentIndex >= sessionState.queue.length;
    }, [sessionState]);

    const connectedUsersCount = useMemo(() => {
        if (!sessionState) return 0;
        return sessionState.users.filter(u => u.connected).length;
    }, [sessionState]);

    return {
        currentPlace,
        remainingCount,
        progress,
        isComplete,
        matches: sessionState?.matches || [],
        users: sessionState?.users || [],
        connectedUsersCount,
        sessionId: sessionState?.sessionId || null,
        isHost: sessionState?.isHost || false,
        status: sessionState?.status || null,
    };
}
