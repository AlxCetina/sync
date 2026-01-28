'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from '@/hooks/useSession';
import { SwipeStack } from '@/components/SwipeStack';
import { MatchNotification } from '@/components/MatchNotification';
import { SessionLobby } from '@/components/SessionLobby';
import { Match } from '@/types';

export default function SessionPage() {
    const router = useRouter();
    const { sessionState, startSession, swipe, disconnect, isReconnecting, requestMorePlaces, noMorePlaces } = useSocket();
    const { currentPlace, remainingCount, progress, isComplete, matches, users, connectedUsersCount, sessionId, isHost, status } = useSession(sessionState);

    const [activeMatch, setActiveMatch] = useState<Match | null>(null);
    const [showMatches, setShowMatches] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const hasRequestedMoreRef = useRef(false);

    // Redirect if no session
    useEffect(() => {
        if (!sessionState && !isReconnecting) {
            // Wait a bit for reconnection attempt
            const timer = setTimeout(() => {
                if (!sessionState) {
                    router.push('/');
                }
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [sessionState, isReconnecting, router]);

    // Track the previous matches count to detect new matches
    const prevMatchCountRef = useRef<number | null>(null);

    // Show new matches - track by count change to reliably detect new matches
    useEffect(() => {
        const currentCount = matches.length;

        // Initialize on first render with matches data (handles reconnection case)
        if (prevMatchCountRef.current === null) {
            prevMatchCountRef.current = currentCount;
            return;
        }

        // If we have more matches than before, show notification for the newest one
        if (currentCount > prevMatchCountRef.current && currentCount > 0) {
            const newMatch = matches[currentCount - 1];
            setActiveMatch(newMatch);
            console.log('[Session] New match detected:', newMatch.place.name);
        }

        // Update the previous count
        prevMatchCountRef.current = currentCount;
    }, [matches]);

    // Auto-request more places when running low (less than 5 remaining)
    useEffect(() => {
        const LOW_THRESHOLD = 5;

        // Only request more if:
        // - Session is active
        // - Running low on places
        // - Not already loading more
        // - Not reached max places
        // - Haven't already requested for this threshold
        if (
            status === 'active' &&
            remainingCount <= LOW_THRESHOLD &&
            remainingCount > 0 &&
            !isLoadingMore &&
            !noMorePlaces &&
            !hasRequestedMoreRef.current
        ) {
            hasRequestedMoreRef.current = true;
            setIsLoadingMore(true);

            requestMorePlaces()
                .then((result) => {
                    console.log('[Session] More places result:', result);
                    if (result.newPlacesCount && result.newPlacesCount > 0) {
                        // Reset the flag so we can request again when we get low again
                        hasRequestedMoreRef.current = false;
                    }
                })
                .catch((err) => {
                    console.error('[Session] Failed to get more places:', err);
                })
                .finally(() => {
                    setIsLoadingMore(false);
                });
        }

        // Reset the flag when remainingCount goes back up (new places were added)
        if (remainingCount > LOW_THRESHOLD) {
            hasRequestedMoreRef.current = false;
        }
    }, [remainingCount, status, isLoadingMore, noMorePlaces, requestMorePlaces]);

    const handleSwipe = useCallback(async (placeId: string, decision: 'yes' | 'no') => {
        try {
            await swipe(placeId, decision);
        } catch (err) {
            console.error('Swipe error:', err);
        }
    }, [swipe]);

    const handleStart = useCallback(async () => {
        try {
            await startSession();
        } catch (err) {
            console.error('Start session error:', err);
        }
    }, [startSession]);

    const handleDisconnect = useCallback(() => {
        disconnect();
        router.push('/');
    }, [disconnect, router]);

    // Loading state
    if (!sessionState) {
        return (
            <main className="min-h-screen bg-[#030706] relative overflow-hidden flex items-center justify-center">
                {/* Background effects matching Create page */}
                <div className="absolute inset-0">
                    <div
                        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
                        style={{
                            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
                        }}
                    />
                    <div
                        className="absolute bottom-0 right-0 w-[600px] h-[600px]"
                        style={{
                            background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.04) 0%, transparent 50%)',
                        }}
                    />
                </div>

                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: '64px 64px',
                    }}
                />

                <motion.div
                    className="relative z-10 text-center space-y-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />

                        {/* Inner pulse */}
                        <div className="absolute inset-0 m-2 rounded-full bg-emerald-500/10 animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-white tracking-tight">
                            {isReconnecting ? 'Reconnecting...' : 'Syncing Session'}
                        </h2>
                        <p className="text-zinc-500 text-sm font-medium">
                            {isReconnecting ? 'Trying to get you back in' : 'Preparing your experience'}
                        </p>
                    </div>
                </motion.div>
            </main>
        );
    }

    // Waiting room (before session starts)
    if (status === 'waiting') {
        return <SessionLobby sessionState={sessionState} onStart={handleStart} />;
    }

    return (
        <main className="min-h-screen gradient-hero flex flex-col overflow-hidden">
            {/* Progress Bar - Top edge */}
            <div className="h-1 bg-white/5 relative">
                <motion.div
                    className="h-full bg-gradient-to-r from-[var(--primary-400)] via-[var(--primary-500)] to-[var(--accent-400)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <motion.div
                    className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ left: '-20%' }}
                    animate={{ left: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
                {/* Left: Exit Button */}
                <motion.button
                    onClick={handleDisconnect}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                    <svg className="w-5 h-5 text-white/70 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>

                {/* Right: Session Info */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Session Code - Prominent badge */}
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <span className="text-white font-mono text-sm sm:text-base font-semibold tracking-wider">{sessionId}</span>
                    </div>

                    {/* Connected Users - With status indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <div className="relative">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        </div>
                        <span className="text-white text-sm sm:text-base font-semibold">{connectedUsersCount}</span>
                    </div>

                    {/* Matches Button - Enhanced with animation */}
                    {matches.length > 0 && (
                        <motion.button
                            onClick={() => setShowMatches(!showMatches)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[var(--primary-500)]/20 to-[var(--accent-500)]/20 backdrop-blur-sm border border-[var(--primary-500)]/40 rounded-xl hover:border-[var(--primary-500)]/60 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary-400)]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[var(--primary-400)] text-sm sm:text-base font-semibold">{matches.length}</span>
                            {/* New match indicator */}
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--primary-400)] rounded-full animate-ping" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--primary-400)] rounded-full" />
                        </motion.button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0 relative">
                {isComplete ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                        <motion.div
                            className="text-center space-y-8 max-w-md w-full"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto rounded-full gradient-primary glow-primary flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>
                            <div className="space-y-3">
                                <h2 className="text-3xl font-bold text-white">All Done!</h2>
                                <p className="text-[var(--foreground-muted)] text-lg">
                                    You&apos;ve gone through all the options.
                                    {matches.length > 0 ? ` You found ${matches.length} match${matches.length > 1 ? 'es' : ''}!` : ' No matches this time.'}
                                </p>
                            </div>

                            {matches.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-[var(--foreground-muted)] text-sm font-medium">Your matches:</p>
                                    {matches.map((match, index) => (
                                        <motion.div
                                            key={match.placeId}
                                            className="p-4 glass rounded-2xl hover:bg-[var(--surface-glass-hover)] transition-colors"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <div className="flex items-center gap-4 mb-3">
                                                <div
                                                    className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0"
                                                    style={{ backgroundImage: `url(${match.place.photoUrl})` }}
                                                />
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="text-white font-semibold truncate">{match.place.name}</p>
                                                    <p className="text-[var(--foreground-muted)] text-sm truncate">{match.place.address}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.place.name)}&query_place_id=${match.placeId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--primary-500)]/20 hover:bg-[var(--primary-500)]/30 border border-[var(--primary-500)]/40 rounded-xl font-medium text-[var(--primary-400)] transition-all active:scale-[0.98]"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-sm">Open in Maps</span>
                                            </a>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleDisconnect}
                                className="w-full py-4 btn-primary rounded-2xl font-bold text-white text-lg"
                            >
                                Done
                            </button>
                        </motion.div>
                    </div>
                ) : (
                    sessionState && (
                        <div className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-6 pb-4">
                            {/* Card Container - Better responsive sizing */}
                            <div className="w-full max-w-md h-[calc(100vh-220px)] min-h-[400px] max-h-[650px]">
                                <SwipeStack
                                    places={sessionState.places}
                                    queue={sessionState.queue}
                                    currentIndex={sessionState.currentIndex}
                                    onSwipe={handleSwipe}
                                />
                            </div>

                            {/* Remaining count - Integrated better */}
                            <motion.div
                                className="mt-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <span className="text-white/60 text-sm font-medium">
                                    <span className="text-white/90 font-semibold">{remainingCount}</span> remaining
                                </span>
                            </motion.div>
                        </div>
                    )
                )}
            </div>

            {/* Matches Drawer */}
            {showMatches && matches.length > 0 && (
                <motion.div
                    className="absolute inset-0 z-30 bg-black/95 backdrop-blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="h-full overflow-y-auto">
                        {/* Drawer Header */}
                        <div className="sticky top-0 z-10 bg-gradient-to-b from-black via-black/95 to-transparent pb-6 pt-6 px-6">
                            <div className="max-w-lg mx-auto flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--primary-500)]/20 to-[var(--accent-500)]/20 border border-[var(--primary-500)]/30">
                                        <svg className="w-6 h-6 text-[var(--primary-400)]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Your Matches</h2>
                                        <p className="text-[var(--foreground-muted)] text-sm">{matches.length} place{matches.length > 1 ? 's' : ''} everyone liked</p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={() => setShowMatches(false)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                                >
                                    <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>

                        {/* Matches List */}
                        <div className="px-6 pb-8">
                            <div className="max-w-lg mx-auto space-y-5">
                                {matches.map((match, index) => (
                                    <motion.div
                                        key={match.placeId}
                                        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[var(--primary-500)]/40 transition-all duration-300"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {/* Image */}
                                        <div
                                            className="h-48 sm:h-56 bg-cover bg-center relative"
                                            style={{ backgroundImage: `url(${match.place.photoUrl})` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                                            {/* Match badge */}
                                            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[var(--primary-500)]/20 backdrop-blur-md border border-[var(--primary-500)]/40 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-[var(--primary-400)]" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-[var(--primary-400)] text-xs font-semibold">Match</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="text-xl font-bold text-white mb-3">{match.place.name}</h3>

                                            {/* Info pills */}
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                    <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                    </svg>
                                                    <span className="text-amber-400 font-semibold text-sm">{match.place.rating.toFixed(1)}</span>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                    <span className="text-emerald-400 font-semibold text-sm">{'$'.repeat(match.place.priceLevel)}</span>
                                                </div>
                                                {match.place.userRatingsTotal && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                                                        <span className="text-white/60 text-sm">{match.place.userRatingsTotal.toLocaleString()} reviews</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Address */}
                                            <div className="flex items-start gap-2 text-[var(--foreground-muted)] mb-4">
                                                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-sm">{match.place.address}</span>
                                            </div>

                                            {/* Open in Maps Button */}
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.place.name)}&query_place_id=${match.placeId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] hover:from-[var(--primary-400)] hover:to-[var(--primary-500)] rounded-xl font-semibold text-white shadow-lg shadow-[var(--primary-500)]/20 transition-all active:scale-[0.98]"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>Open in Google Maps</span>
                                                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Match Notification */}
            <MatchNotification
                match={activeMatch}
                onDismiss={() => setActiveMatch(null)}
                participantCount={connectedUsersCount}
            />
        </main>
    );
}
