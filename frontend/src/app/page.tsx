'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const LandingScene = dynamic(
  () => import('../components/landing/LandingScene').then((mod) => ({ default: mod.LandingScene })),
  { ssr: false }
);

export default function LandingPage() {
  const router = useRouter();
  
  // State variables
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const handleCreateRoom = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter a display name first.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create room server-side.');
      }

      const data = await response.json();
      const code = data.code;
      
      router.push(`/lobby/${code}?name=${encodeURIComponent(displayName.trim())}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Is the server running?');
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter a display name first.');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a 6-digit room code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: roomCode.trim().toUpperCase(),
          name: displayName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room.');
      }

      router.push(`/lobby/${roomCode.trim().toUpperCase()}?name=${encodeURIComponent(displayName.trim())}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please check your room code.');
      setLoading(false);
    }
  };

  return (
    <main className="w-screen h-screen relative bg-[#020101] overflow-hidden select-none">
      {/* 3D Background Scene */}
      <div className="absolute inset-0 z-0">
        <LandingScene />
      </div>

      {/* Foreground UI */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        
        {/* Centerpiece Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="flex flex-col items-center gap-8 pointer-events-auto w-full max-w-sm px-4"
        >
          {/* Titles */}
          <div className="text-center flex flex-col items-center gap-1 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
            <h1 className="text-7xl font-black tracking-tight text-white/90">
              UNO
            </h1>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/50">
              Immersive Multiplayer Card Experience
            </p>
          </div>

          {/* Controls Panel */}
          <div className="w-full flex flex-col gap-4">
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-950/80 backdrop-blur-md border border-red-500/40 rounded-xl p-3 flex gap-2.5 items-center text-xs text-red-200 shadow-xl">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inputs Container */}
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

              <input
                type="text"
                maxLength={12}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-center tracking-widest font-bold uppercase focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
              />

              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-center tracking-[0.3em] font-mono font-black uppercase text-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinRoom}
                disabled={loading}
                className="flex-1 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Join Room
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateRoom}
                disabled={loading}
                className="flex-1 bg-white/90 hover:bg-white text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] disabled:opacity-50"
              >
                Create Room
              </motion.button>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Minimal Footer */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
          Built for multiplayer fun
        </span>
      </div>

    </main>
  );
}
