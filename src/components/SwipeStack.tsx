'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SwipeCard } from './SwipeCard';
import { Place } from '@/types';
import { X, Heart, Check } from 'lucide-react';

interface SwipeStackProps {
    places: Place[];
    queue: string[];
    currentIndex: number;
    onSwipe: (placeId: string, decision: 'yes' | 'no') => void;
}

export function SwipeStack({ places, queue, currentIndex, onSwipe }: SwipeStackProps) {
    // Get the current and next few places for the stack effect
    const visibleCards = queue
        .slice(currentIndex, currentIndex + 3)
        .map(id => places.find(p => p.id === id))
        .filter((p): p is Place => p !== undefined);

    if (visibleCards.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <motion.div 
                    className="text-center space-y-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div 
                        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                    >
                        <Check className="w-12 h-12 text-white" strokeWidth={3} />
                    </motion.div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-bold text-white">All Done!</h3>
                        <p className="text-zinc-400 text-lg">You&apos;ve seen all the options</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    const handleSwipe = (decision: 'yes' | 'no') => {
        const currentPlace = visibleCards[0];
        if (currentPlace) {
            onSwipe(currentPlace.id, decision);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col">
            {/* Card Area */}
            <div className="relative flex-1 min-h-0">
                <AnimatePresence mode="popLayout">
                    {visibleCards.map((place, index) => (
                        <SwipeCard
                            key={place.id}
                            place={place}
                            onSwipe={handleSwipe}
                            isTop={index === 0}
                        />
                    )).reverse()}
                </AnimatePresence>
            </div>

            {/* Action Buttons - Floating style */}
            <div className="flex justify-center items-center gap-8 py-8">
                {/* Reject Button */}
                <motion.button
                    onClick={() => handleSwipe('no')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="group relative w-18 h-18 sm:w-20 sm:h-20"
                >
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl group-hover:bg-red-500/40 transition-all duration-300" />
                    {/* Button */}
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border-2 border-red-500/50 group-hover:border-red-400 flex items-center justify-center shadow-xl shadow-red-500/10 group-hover:shadow-red-500/30 transition-all duration-300">
                        <X className="w-8 h-8 sm:w-9 sm:h-9 text-red-400 group-hover:text-red-300 transition-colors" strokeWidth={2.5} />
                    </div>
                </motion.button>

                {/* Accept Button */}
                <motion.button
                    onClick={() => handleSwipe('yes')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="group relative w-18 h-18 sm:w-20 sm:h-20"
                >
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/40 transition-all duration-300" />
                    {/* Button */}
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-md border-2 border-emerald-500/50 group-hover:border-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/10 group-hover:shadow-emerald-500/30 transition-all duration-300">
                        <Heart className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-400 group-hover:text-emerald-300 transition-colors" strokeWidth={2.5} />
                    </div>
                </motion.button>
            </div>
        </div>
    );
}
