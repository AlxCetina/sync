'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';

export default function JoinSession() {
    const router = useRouter();
    const { joinSession, isConnected, error, clearError } = useSocket();

    const [name, setName] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const chars = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).split('');
            const newCode = [...code];
            chars.forEach((char, i) => {
                if (index + i < 6) {
                    newCode[index + i] = char;
                }
            });
            setCode(newCode);

            // Focus next empty or last input
            const nextIndex = Math.min(index + chars.length, 5);
            const nextInput = document.getElementById(`code-${nextIndex}`);
            nextInput?.focus();
        } else {
            // Single character
            const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const newCode = [...code];
            newCode[index] = char;
            setCode(newCode);

            // Auto-focus next input
            if (char && index < 5) {
                const nextInput = document.getElementById(`code-${index + 1}`);
                nextInput?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const sessionCode = code.join('');
    const isCodeComplete = sessionCode.length === 6;

    const handleJoin = async () => {
        if (!name.trim() || !isCodeComplete || isLoading) return;

        setIsLoading(true);
        clearError();

        try {
            await joinSession(sessionCode, name.trim());
            router.push('/session');
        } catch (err) {
            console.error('Join session error:', err);
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
                <motion.div
                    className="w-full max-w-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {/* Header section */}
                    <div className="text-center mb-10">
                        <motion.div
                            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1, damping: 15 }}
                        >
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </motion.div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                            Join Session
                        </h1>
                        <p className="text-zinc-400 text-base">
                            Enter the code shared by your host
                        </p>
                    </div>

                    {/* Form card */}
                    <motion.div
                        className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
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
                            />
                        </div>

                        {/* Session Code */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-zinc-300 mb-3">
                                Session code
                            </label>
                            <div className="flex justify-center gap-1.5 sm:gap-2">
                                {code.map((char, index) => (
                                    <motion.input
                                        key={index}
                                        id={`code-${index}`}
                                        type="text"
                                        value={char}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/[0.08] text-white uppercase tracking-wider focus:border-emerald-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                        maxLength={6}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Connection Status */}
                        {!isConnected && (
                            <motion.div
                                className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-amber-300 text-sm">Connecting to server...</span>
                            </motion.div>
                        )}

                        {/* Error */}
                        {error && (
                            <motion.div
                                className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <span className="text-sm text-red-300">{error.message}</span>
                            </motion.div>
                        )}

                        {/* Join Button */}
                        <motion.button
                            onClick={handleJoin}
                            disabled={!name.trim() || !isCodeComplete || isLoading || !isConnected}
                            className={`w-full h-12 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${name.trim() && isCodeComplete && !isLoading && isConnected
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-400 hover:to-emerald-500'
                                : 'bg-white/[0.04] text-zinc-500 cursor-not-allowed border border-white/[0.06]'
                                }`}
                            whileHover={name.trim() && isCodeComplete && !isLoading && isConnected ? { scale: 1.01 } : undefined}
                            whileTap={name.trim() && isCodeComplete && !isLoading && isConnected ? { scale: 0.99 } : undefined}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Joining...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                    </svg>
                                    <span>Join Session</span>
                                </>
                            )}
                        </motion.button>
                    </motion.div>

                    {/* Info text */}
                    <motion.div
                        className="mt-6 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="text-sm text-zinc-500">
                            <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                            Ask your host for the 6-digit session code
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </main>
    );
}
