'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Match } from '@/types';
import { useEffect } from 'react';
import { MapPin, Star, ExternalLink, Users, Sparkles } from 'lucide-react';

interface MatchNotificationProps {
    match: Match | null;
    onDismiss: () => void;
    participantCount?: number;
}

export function MatchNotification({ match, onDismiss, participantCount = 2 }: MatchNotificationProps) {
    // Auto-dismiss after 8 seconds (longer to give time to read and take action)
    useEffect(() => {
        if (match) {
            const timer = setTimeout(onDismiss, 8000);
            return () => clearTimeout(timer);
        }
    }, [match, onDismiss]);

    const openInMaps = () => {
        if (match) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.place.name)}&query_place_id=${match.placeId}`;
            window.open(url, '_blank');
        }
    };

    // Price level color
    const getPriceColor = (level: number) => {
        if (level <= 1) return 'text-emerald-400';
        if (level === 2) return 'text-amber-400';
        return 'text-orange-400';
    };

    return (
        <AnimatePresence>
            {match && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Content */}
                    <motion.div
                        className="relative w-full max-w-sm"
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 50 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        {/* Celebration Animation - Enhanced with more particles */}
                        <div className="absolute -inset-24 pointer-events-none">
                            {[...Array(24)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full"
                                    style={{
                                        left: '50%',
                                        top: '50%',
                                        width: Math.random() * 8 + 4,
                                        height: Math.random() * 8 + 4,
                                        background: [
                                            'var(--primary-300)',
                                            'var(--primary-400)',
                                            'var(--accent-400)',
                                            'var(--primary-500)',
                                            '#6ee7b7',
                                            'var(--accent-500)',
                                            '#a7f3d0',
                                            '#fcd34d',
                                            '#f472b6',
                                            '#818cf8'
                                        ][i % 10],
                                        boxShadow: `0 0 15px currentColor`
                                    }}
                                    initial={{ x: 0, y: 0, scale: 0 }}
                                    animate={{
                                        x: Math.cos((i * 15 * Math.PI) / 180) * (150 + Math.random() * 80),
                                        y: Math.sin((i * 15 * Math.PI) / 180) * (150 + Math.random() * 80),
                                        scale: [0, 1.5, 0],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        delay: i * 0.02,
                                        ease: 'easeOut',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Floating sparkles */}
                        <div className="absolute -inset-12 pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={`sparkle-${i}`}
                                    className="absolute"
                                    style={{
                                        left: `${20 + (i % 3) * 30}%`,
                                        top: `${15 + Math.floor(i / 3) * 70}%`,
                                    }}
                                    animate={{
                                        y: [-5, 5, -5],
                                        opacity: [0.5, 1, 0.5],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        duration: 2,
                                        delay: i * 0.3,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                >
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                </motion.div>
                            ))}
                        </div>

                        {/* Glow Ring */}
                        <motion.div
                            className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-r from-[var(--primary-500)] via-[var(--accent-400)] to-[var(--primary-500)] opacity-60 blur-3xl"
                            animate={{
                                opacity: [0.4, 0.7, 0.4],
                                scale: [0.95, 1.05, 0.95],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />

                        {/* Main Card */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--primary-500)]/30 bg-zinc-900/50 backdrop-blur-sm">
                            {/* Header Section with Match Badge */}
                            <div className="relative">
                                {/* Image */}
                                <div
                                    className="h-52 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${match.place.photoUrl})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

                                {/* Match Badge - Top Center */}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                                    <motion.div
                                        className="relative"
                                        initial={{ y: -30, opacity: 0, scale: 0.5 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                                    >
                                        {/* Badge glow */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-500)] to-[var(--accent-500)] rounded-full blur-lg opacity-70" />
                                        <div className="relative px-6 py-2.5 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] rounded-full shadow-lg flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-white" />
                                            <span className="text-white font-bold text-base tracking-wide">IT&apos;S A MATCH!</span>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Everyone Agreed Badge */}
                                <motion.div
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                                        <Users className="w-4 h-4 text-[var(--primary-400)]" />
                                        <span className="text-white/90 text-sm font-medium">
                                            All {participantCount} people agreed!
                                        </span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content Section */}
                            <div className="p-5 space-y-4">
                                {/* Place Name */}
                                <motion.h2
                                    className="text-2xl font-bold text-white"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {match.place.name}
                                </motion.h2>

                                {/* Info Pills */}
                                <motion.div
                                    className="flex flex-wrap items-center gap-2"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.55 }}
                                >
                                    {/* Rating */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        <span className="text-amber-400 font-semibold text-sm">{match.place.rating.toFixed(1)}</span>
                                    </div>

                                    {/* Price */}
                                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                                        <span className={`font-bold text-sm ${getPriceColor(match.place.priceLevel)}`}>
                                            {'$'.repeat(match.place.priceLevel)}
                                        </span>
                                    </div>

                                    {/* Reviews */}
                                    {match.place.userRatingsTotal && (
                                        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                                            <span className="text-white/60 text-sm">
                                                {match.place.userRatingsTotal.toLocaleString()} reviews
                                            </span>
                                        </div>
                                    )}

                                    {/* Categories */}
                                    {match.place.categories?.slice(0, 1).map((cat) => (
                                        <div key={cat} className="px-3 py-1.5 bg-[var(--primary-500)]/10 border border-[var(--primary-500)]/30 rounded-lg">
                                            <span className="text-[var(--primary-400)] text-sm font-medium">{cat}</span>
                                        </div>
                                    ))}
                                </motion.div>

                                {/* Address */}
                                <motion.div
                                    className="flex items-start gap-2 text-white/50"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span className="text-sm">{match.place.address}</span>
                                </motion.div>
                            </div>

                            {/* Action Buttons */}
                            <motion.div
                                className="p-5 pt-0 flex gap-3"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.65 }}
                            >
                                {/* Open in Maps - Primary Action */}
                                <button
                                    onClick={openInMaps}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] hover:from-[var(--primary-400)] hover:to-[var(--primary-500)] rounded-xl font-semibold text-white shadow-lg shadow-[var(--primary-500)]/25 transition-all active:scale-[0.98]"
                                >
                                    <MapPin className="w-5 h-5" />
                                    <span>Open in Maps</span>
                                    <ExternalLink className="w-4 h-4 opacity-70" />
                                </button>

                                {/* Continue - Secondary Action */}
                                <button
                                    onClick={onDismiss}
                                    className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl font-semibold text-white/80 hover:text-white transition-all active:scale-[0.98]"
                                >
                                    Continue
                                </button>
                            </motion.div>
                        </div>


                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
