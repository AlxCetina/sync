'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ClientSessionState } from '@/types';
import { Users, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface SessionLobbyProps {
    sessionState: ClientSessionState;
    onStart: () => void;
}

export function SessionLobby({ sessionState, onStart }: SessionLobbyProps) {
    const connectedUsers = sessionState.users.filter(u => u.connected);
    const [copied, setCopied] = useState(false);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(sessionState.sessionId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
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

                {/* Connected users indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <Users className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                    <span className="text-sm text-zinc-300 font-medium">{connectedUsers.length} connected</span>
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
                    {/* Session Code Section */}
                    <div className="text-center mb-10">
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-medium mb-4">Session Code</p>
                        <motion.div
                            className="flex justify-center items-center gap-2 sm:gap-3 mb-4"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex gap-1.5 sm:gap-2">
                                {sessionState.sessionId.split('').map((char, i) => (
                                    <motion.span
                                        key={i}
                                        className="w-10 h-11 sm:w-12 sm:h-14 flex items-center justify-center bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl text-lg sm:text-2xl font-mono font-bold text-white"
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 * i }}
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </div>
                            <motion.button
                                onClick={copyCode}
                                className={`h-10 px-3 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${copied
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                    : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:bg-white/[0.08] hover:border-white/[0.16] hover:text-white'
                                    }`}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {copied ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </motion.button>
                        </motion.div>
                        <p className="text-sm text-zinc-500">Share this code with others to join</p>
                    </div>

                    {/* Form card */}
                    <motion.div
                        className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 backdrop-blur-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {/* Players Section */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-white/[0.06]" />
                                <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Players</span>
                                <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>

                            <div className="space-y-3">
                                {connectedUsers.map((user, index) => (
                                    <motion.div
                                        key={user.id}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 * index }}
                                    >
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white ${user.isHost
                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20'
                                            : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20'
                                            }`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-white">{user.name}</p>
                                            <p className="text-sm text-zinc-500">
                                                {user.isHost ? 'Host' : 'Guest'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-emerald-400 text-sm font-medium">Connected</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Start Button (Host only) */}
                        {sessionState.isHost && (
                            <motion.button
                                onClick={onStart}
                                disabled={connectedUsers.length < 2}
                                className={`w-full h-12 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${connectedUsers.length >= 2
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-400 hover:to-emerald-500'
                                    : 'bg-white/[0.04] text-zinc-500 cursor-not-allowed border border-white/[0.06]'
                                    }`}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                whileTap={connectedUsers.length >= 2 ? { scale: 0.98 } : undefined}
                            >
                                {connectedUsers.length >= 2 ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                                        </svg>
                                        <span>Start Swiping!</span>
                                    </>
                                ) : (
                                    <span>Waiting for {2 - connectedUsers.length} more player{connectedUsers.length === 1 ? '' : 's'}...</span>
                                )}
                            </motion.button>
                        )}

                        {/* Guest waiting message */}
                        {!sessionState.isHost && (
                            <motion.div
                                className="text-center py-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex justify-center mb-3">
                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <p className="text-sm text-zinc-400">Waiting for host to start the session...</p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Places Preview */}
                    <motion.div
                        className="mt-6 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm text-zinc-400">Places to explore</span>
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                                {sessionState.places.length}
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </main>
    );
}
