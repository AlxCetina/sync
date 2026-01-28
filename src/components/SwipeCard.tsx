'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Place } from '@/types';
import { MapPin, Star, ExternalLink } from 'lucide-react';

interface SwipeCardProps {
    place: Place;
    onSwipe: (decision: 'yes' | 'no') => void;
    isTop?: boolean;
}

export function SwipeCard({ place, onSwipe, isTop = false }: SwipeCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

    // Indicator opacity based on swipe direction
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;

        if (info.offset.x > threshold) {
            onSwipe('yes');
        } else if (info.offset.x < -threshold) {
            onSwipe('no');
        }
    };

    // Open Google Maps
    const openGoogleMaps = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`;
        window.open(url, '_blank');
    };

    // Price level display
    const priceDisplay = place.priceLevel ? '$'.repeat(place.priceLevel) : '$';
    
    // Price level color
    const getPriceColor = () => {
        if (!place.priceLevel || place.priceLevel <= 1) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
        if (place.priceLevel === 2) return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
        return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
    };

    return (
        <motion.div
            className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ x, rotate, opacity }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={isTop ? handleDragEnd : undefined}
            whileDrag={{ scale: 1.02 }}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
                x: x.get() > 0 ? 300 : -300,
                opacity: 0,
                transition: { duration: 0.25, ease: 'easeOut' }
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {/* Card Container with dynamic glow */}
            <div 
                className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                    style={{
                        backgroundImage: `url(${place.photoUrl || '/placeholder.jpg'})`,
                    }}
                />

                {/* Multi-layer Gradient Overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />

                {/* Like Indicator */}
                <motion.div
                    className="absolute top-8 right-8 px-6 py-3 rounded-2xl rotate-12 border-4 border-emerald-400 bg-emerald-500/30 backdrop-blur-sm shadow-lg"
                    style={{ opacity: likeOpacity }}
                >
                    <span className="text-emerald-400 font-black text-3xl tracking-wider drop-shadow-lg">LIKE</span>
                </motion.div>

                {/* Nope Indicator */}
                <motion.div
                    className="absolute top-8 left-8 px-6 py-3 rounded-2xl -rotate-12 border-4 border-red-400 bg-red-500/30 backdrop-blur-sm shadow-lg"
                    style={{ opacity: nopeOpacity }}
                >
                    <span className="text-red-400 font-black text-3xl tracking-wider drop-shadow-lg">NOPE</span>
                </motion.div>

                {/* Top Actions Bar - Google Maps Button */}
                <button
                    onClick={openGoogleMaps}
                    className="absolute top-5 left-1/2 -translate-x-1/2 group px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center gap-2 hover:bg-white/20 hover:border-white/40 transition-all duration-300 active:scale-95 whitespace-nowrap"
                >
                    <MapPin className="w-4 h-4 text-white/90 group-hover:text-white transition-colors shrink-0" />
                    <span className="text-white/90 text-sm font-medium group-hover:text-white transition-colors">View on Map</span>
                    <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors shrink-0" />
                </button>

                {/* Content Area */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Glass background for content */}
                    <div className="relative">
                        {/* Name & Rating Row */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight flex-1 drop-shadow-lg">
                                {place.name}
                            </h2>
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shrink-0">
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow" />
                                <span className="text-white font-bold text-lg">{place.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Categories & Info Pills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {place.categories.slice(0, 2).map((category) => (
                                <span
                                    key={category}
                                    className="px-4 py-1.5 text-sm font-medium bg-white/10 backdrop-blur-sm rounded-full text-white/90 border border-white/10"
                                >
                                    {category}
                                </span>
                            ))}
                            <span className={`px-4 py-1.5 text-sm font-bold rounded-full border backdrop-blur-sm ${getPriceColor()}`}>
                                {priceDisplay}
                            </span>
                            {place.userRatingsTotal && (
                                <span className="px-4 py-1.5 text-sm font-medium bg-white/10 backdrop-blur-sm rounded-full text-white/70 border border-white/10">
                                    {place.userRatingsTotal.toLocaleString()} reviews
                                </span>
                            )}
                        </div>

                        {/* Address */}
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-white/40 shrink-0" />
                            <p className="text-white/60 text-sm truncate">{place.address}</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
