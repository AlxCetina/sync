'use client';

import { motion } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type = 'info', onClose, duration = 5000 }: ToastProps) {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const styles = {
        success: {
            bg: 'bg-[#064e3b]', // Darker emerald for better contrast on dark bg
            border: 'border-emerald-500/30',
            text: 'text-emerald-100',
            icon: 'text-emerald-400',
            indicator: 'bg-emerald-500'
        },
        error: {
            bg: 'bg-[#450a0a]', // Darker red
            border: 'border-red-500/30',
            text: 'text-red-100',
            icon: 'text-red-400',
            indicator: 'bg-red-500'
        },
        info: {
            bg: 'bg-[#172554]', // Darker blue
            border: 'border-blue-500/30',
            text: 'text-blue-100',
            icon: 'text-blue-400',
            indicator: 'bg-blue-500'
        }
    };

    const currentStyle = styles[type];
    const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className={`
                    pointer-events-auto
                    relative w-full max-w-sm overflow-hidden
                    rounded-xl border ${currentStyle.border}
                    ${currentStyle.bg} shadow-lg shadow-black/20
                    backdrop-blur-md
                `}
            >
                {/* Progress bar or colored indicator line */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${currentStyle.indicator}`} />

                <div className="flex items-start gap-3 p-4 pl-5">
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${currentStyle.icon}`} />

                    <div className="flex-1">
                        <p className={`text-sm font-medium leading-relaxed ${currentStyle.text}`}>
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className={`
                            -mt-1 -mr-1 p-2 rounded-lg
                            hover:bg-white/10 transition-colors
                            ${currentStyle.text} opacity-70 hover:opacity-100
                        `}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
