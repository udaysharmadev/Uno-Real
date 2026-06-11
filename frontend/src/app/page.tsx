'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, Plus, Search, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  
  // State variables
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // Create Room Flow
  const handleCreateRoom = async (e: React.FormEvent) => {
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
      
      // Redirect to lobby page
      router.push(`/lobby/${code}?name=${encodeURIComponent(displayName.trim())}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Is the server running?');
      setLoading(false);
    }
  };

  // Join Room Flow
  const handleJoinRoom = async (e: React.FormEvent) => {
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

      // Redirect to lobby page
      router.push(`/lobby/${roomCode.trim().toUpperCase()}?name=${encodeURIComponent(displayName.trim())}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please check your room code.');
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/30 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          >
            <Sparkles size={12} className="animate-pulse" /> Virtual 3D Table
          </motion.div>
          
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-violet-400 select-none pb-1 filter drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            UNO Real
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium max-w-xs mx-auto">
            Experience face-to-face card play around a virtual table with players in real-time.
          </p>
        </div>

        {/* Glassmorphic Form Container */}
        <div className="glass-panel rounded-2xl p-6 shadow-2xl relative">
          
          {/* Display Name Section */}
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
              Your Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={12}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all font-medium"
              />
            </div>
          </div>

          {/* Action Tabs / Switches */}
          <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-900 mb-6">
            <button
              onClick={() => { setIsJoining(false); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                !isJoining 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus size={14} /> Create Room
            </button>
            <button
              onClick={() => { setIsJoining(true); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                isJoining 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search size={14} /> Join Room
            </button>
          </div>

          {/* Errors */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 flex gap-2.5 items-start text-xs text-red-200">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Forms */}
          {!isJoining ? (
            /* CREATE ROOM FLOW */
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group text-sm"
              >
                {loading ? 'Creating Room...' : (
                  <>
                    Host Table <Play size={14} className="fill-current transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* JOIN ROOM FLOW */
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code..."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-center tracking-widest font-mono text-lg uppercase focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group text-sm"
              >
                {loading ? 'Joining Room...' : (
                  <>
                    Enter Lobby <Play size={14} className="fill-current transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </main>
  );
}
