'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { PlaceType, PlaceTypeIcon, PLACE_TYPE_OPTIONS, SEARCH_RADIUS_OPTIONS } from '@/types';
import { Toast } from '@/components/Toast';
import {
    Utensils,
    Sparkles,
    Sandwich,
    Coffee,
    Croissant,
    EggFried,
    Check,
    ChevronRight,
    ChevronLeft,
    Plus,
    MapPin,
    AlertCircle,
} from 'lucide-react';

// Map icon names to Lucide components
const iconMap: Record<PlaceTypeIcon, React.ComponentType<{ className?: string }>> = {
    'utensils': Utensils,
    'sparkles': Sparkles,
    'hamburger': Sandwich,
    'coffee': Coffee,
    'croissant': Croissant,
    'egg-fried': EggFried,
};

export default function CreateSession() {
    const router = useRouter();
    const { createSession, isConnected, error, clearError } = useSocket();

    const [step, setStep] = useState<'place-type' | 'radius' | 'details'>('place-type');
    const [selectedTypes, setSelectedTypes] = useState<PlaceType[]>([]);
    const [selectedRadius, setSelectedRadius] = useState<number>(3000); // Default 3km
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [locationError, setLocationError] = useState('');

    // Check location permission when reaching details step
    useEffect(() => {
        if (step === 'details') {
            if ('permissions' in navigator) {
                navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                    if (result.state === 'denied') {
                        setLocationError('Location access is denied. Please enable it in your browser settings.');
                    } else if (result.state === 'prompt') {
                        // Optional: You could show a message here too, or just wait for them to click Create which triggers the prompt
                        // For now, let's just let the Create button trigger the prompt, as that's standard behavior.
                        // But the user asked to "check if the user has their locations on", implying we should warn them if they don't.
                        // If it's 'prompt', it means we haven't asked yet or they reset it. The Create button will ask.
                        // If it's 'denied', we definitely should warn.
                    }
                });
            }
        }
    }, [step]);

    const togglePlaceType = (type: PlaceType) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleContinue = () => {
        if (step === 'place-type') {
            setStep('radius');
        } else if (step === 'radius') {
            setStep('details');
        }
    };

    const handleBack = () => {
        if (step === 'details') {
            setStep('radius');
        } else if (step === 'radius') {
            setStep('place-type');
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) return;

        setIsLoading(true);
        setLocationError('');
        clearError();

        try {
            // Get user's location
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                });
            });

            await createSession({
                hostName: name.trim(),
                location: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                },
                searchType: 'restaurant',
                placeTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
                searchRadius: selectedRadius,
            });

            // Navigate to session page
            router.push('/session');
        } catch (err) {
            console.error('Create session error:', err);
            if (err instanceof GeolocationPositionError) {
                setLocationError('Please enable location access to find nearby places');
            } else if (err instanceof Error) {
                setLocationError(err.message || 'Failed to create session');
            } else if (typeof err === 'object' && err !== null) {
                // Handle non-Error objects (like socket errors)
                const errObj = err as Record<string, unknown>;
                const message = errObj.message || errObj.error || JSON.stringify(err);
                setLocationError(String(message) || 'An unexpected error occurred');
            } else {
                setLocationError('Failed to create session. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#030706] relative overflow-hidden">
            {/* Refined gradient background */}
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

            {/* Header */}
            <motion.header
                className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                    </div>
                    <span className="text-lg font-semibold text-white tracking-tight">Sync</span>
                </Link>

                {/* Connection indicator */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className="text-xs text-zinc-500 font-medium">
                        {isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                </div>
            </motion.header>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-6 pb-12">
                <AnimatePresence mode="wait">
                    {step === 'place-type' ? (
                        <motion.div
                            key="place-type"
                            className="w-full max-w-2xl"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header section */}
                            <div className="text-center mb-8">
                                {/* Step indicator */}
                                <div className="inline-flex items-center gap-2 mb-6">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                                        1
                                    </div>
                                    <div className="w-8 h-px bg-zinc-700" />
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-semibold">
                                        2
                                    </div>
                                    <div className="w-8 h-px bg-zinc-700" />
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-semibold">
                                        3
                                    </div>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                                    What are you in the mood for?
                                </h1>
                                <p className="text-zinc-400 text-base">
                                    Select one or more types of places you&apos;re interested in
                                </p>
                            </div>

                            {/* Place type grid */}
                            <motion.div
                                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-sm mb-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {PLACE_TYPE_OPTIONS.map((option) => {
                                        const isSelected = selectedTypes.includes(option.id);
                                        const IconComponent = iconMap[option.icon];
                                        return (
                                            <motion.button
                                                key={option.id}
                                                onClick={() => togglePlaceType(option.id)}
                                                className={`relative p-4 rounded-xl border transition-all duration-200 text-left ${isSelected
                                                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                                    : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12]'
                                                    }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-white/[0.05] text-zinc-400'
                                                        }`}>
                                                        <IconComponent className="w-5 h-5" />
                                                    </div>
                                                    <span className={`font-medium text-sm ${isSelected ? 'text-emerald-300' : 'text-zinc-300'}`}>
                                                        {option.label}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <motion.div
                                                        className="absolute top-2 right-2"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {selectedTypes.length === 0 && (
                                    <p className="text-center text-zinc-500 text-sm mt-6">
                                        Skip to search all types of places
                                    </p>
                                )}
                            </motion.div>

                            {/* Continue button */}
                            <motion.button
                                onClick={handleContinue}
                                className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-400 hover:to-emerald-500 transition-all duration-200 flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <span>Continue</span>
                                <ChevronRight className="w-4 h-4" />
                            </motion.button>

                            {selectedTypes.length > 0 && (
                                <motion.p
                                    className="text-center text-emerald-400/70 text-sm mt-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''} selected
                                </motion.p>
                            )}
                        </motion.div>
                    ) : step === 'radius' ? (
                        <motion.div
                            key="radius"
                            className="w-full max-w-lg"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header section */}
                            <div className="text-center mb-8">
                                {/* Step indicator */}
                                <div className="inline-flex items-center gap-2 mb-6">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="w-8 h-px bg-emerald-500/50" />
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                                        2
                                    </div>
                                    <div className="w-8 h-px bg-zinc-700" />
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-semibold">
                                        3
                                    </div>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                                    How far to search?
                                </h1>
                                <p className="text-zinc-400 text-base">
                                    Select the search radius from your location
                                </p>
                            </div>

                            {/* Radius selection */}
                            <motion.div
                                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-sm mb-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {SEARCH_RADIUS_OPTIONS.map((option) => {
                                        const isSelected = selectedRadius === option.id;
                                        return (
                                            <motion.button
                                                key={option.id}
                                                onClick={() => setSelectedRadius(option.id)}
                                                className={`relative p-4 rounded-xl border transition-all duration-200 text-left ${isSelected
                                                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                                    : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12]'
                                                    }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className={`font-bold text-lg ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                                                        {option.label}
                                                    </span>
                                                    <span className={`text-xs ${isSelected ? 'text-emerald-400/70' : 'text-zinc-500'}`}>
                                                        {option.description}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <motion.div
                                                        className="absolute top-2 right-2"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            {/* Navigation buttons */}
                            <div className="flex gap-3">
                                <motion.button
                                    onClick={handleBack}
                                    className="h-12 px-6 rounded-xl font-medium text-base bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Back</span>
                                </motion.button>

                                <motion.button
                                    onClick={handleContinue}
                                    className="flex-1 h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-400 hover:to-emerald-500 transition-all duration-200 flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <span>Continue</span>
                                    <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details"
                            className="w-full max-w-lg"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header section */}
                            <div className="text-center mb-8">
                                {/* Step indicator */}
                                <div className="inline-flex items-center gap-2 mb-6">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="w-8 h-px bg-emerald-500/50" />
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="w-8 h-px bg-emerald-500/50" />
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                                        3
                                    </div>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                                    Almost there!
                                </h1>
                                <p className="text-zinc-400 text-base">
                                    Enter your name to create the session
                                </p>
                            </div>

                            {/* Selected types summary */}
                            {selectedTypes.length > 0 && (
                                <motion.div
                                    className="mb-6 text-center text-sm text-zinc-400"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <span className="text-white font-medium">{selectedTypes.length}</span>
                                    {' '}
                                    {selectedTypes.length === 1 ? 'category' : 'categories'} selected
                                </motion.div>
                            )}

                            {/* Form card */}
                            <motion.div
                                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                {/* Name Input */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Your name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-zinc-500 focus:border-emerald-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        maxLength={20}
                                        autoFocus
                                    />
                                </div>


                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={handleBack}
                                        className="h-12 px-6 rounded-xl font-medium text-base bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-center gap-2"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Back</span>
                                    </motion.button>

                                    <motion.button
                                        onClick={handleCreate}
                                        disabled={!name.trim() || isLoading || !isConnected}
                                        className={`flex-1 h-12 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${name.trim() && !isLoading && isConnected
                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-400 hover:to-emerald-500'
                                            : 'bg-white/[0.04] text-zinc-500 cursor-not-allowed border border-white/[0.06]'
                                            }`}
                                        whileHover={name.trim() && !isLoading && isConnected ? { scale: 1.01 } : undefined}
                                        whileTap={name.trim() && !isLoading && isConnected ? { scale: 0.99 } : undefined}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Finding places...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                <span>Create Session</span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>

                            {/* Info text */}
                            <motion.div
                                className="mt-6 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <p className="text-sm text-zinc-500">
                                    <MapPin className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                                    We&apos;ll use your location to find nearby places
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {(error || locationError) && (
                    <Toast
                        message={error?.message || locationError}
                        type="error"
                        onClose={() => {
                            if (error) clearError();
                            if (locationError) setLocationError('');
                        }}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
