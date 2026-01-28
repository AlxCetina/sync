'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  const features = [
    { icon: '01', label: 'Create a session', desc: 'Set location and preferences' },
    { icon: '02', label: 'Share the code', desc: 'Invite your group instantly' },
    { icon: '03', label: 'Swipe together', desc: 'Everyone picks favorites' },
    { icon: '04', label: 'Get your match', desc: 'Discover the perfect spot' },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#030706]">
      {/* Refined gradient background */}
      <div className="absolute inset-0">
        {/* Main top glow */}
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          }}
        />
        {/* Subtle side accents */}
        <div
          className="absolute top-1/4 -left-[200px] w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.04) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute bottom-0 -right-[200px] w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.03) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        className="relative z-10 min-h-screen flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.header
          variants={itemVariants}
          className="flex items-center justify-between px-6 sm:px-12 py-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">Sync</span>
          </div>
        </motion.header>

        {/* Main hero content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-12">
          {/* Main headline */}
          <motion.div variants={itemVariants} className="text-center mb-6 max-w-3xl">
            <span className="block mb-4 text-zinc-600 text-sm font-medium">
              Find your perfect spot, together
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Stop asking
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                where to eat
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-center text-lg sm:text-xl text-zinc-400 max-w-xl mb-10 leading-relaxed"
          >
            Swipe on restaurants together and find the perfect match for your group. No more endless debates.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-20"
          >
            <Link href="/create" className="w-full sm:w-auto sm:flex-1">
              <motion.button
                className="w-full h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Session
              </motion.button>
            </Link>

            <Link href="/join" className="w-full sm:w-auto sm:flex-1">
              <motion.button
                className="w-full h-12 px-8 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-medium text-base hover:bg-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Join Session
              </motion.button>
            </Link>
          </motion.div>

          {/* How it works - minimal version */}
          <motion.div
            variants={itemVariants}
            className="w-full max-w-3xl"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.icon}
                  className="text-center group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                >
                  <div className="mb-3 inline-flex items-center justify-center">
                    <span className="text-xs font-mono text-emerald-400/60 tracking-wider">{feature.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">{feature.label}</p>
                  <p className="text-xs text-zinc-500">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer removed as text was moved to top */}
      </motion.div>
    </main>
  );
}
