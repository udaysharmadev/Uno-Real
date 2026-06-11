'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSocket } from '../../../hooks/useSocket';
import { useGameStore } from '../../../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  LogOut, 
  Users, 
  Play, 
  Crown, 
  ShieldAlert, 
  Loader2, 
  CircleDot 
} from 'lucide-react';

// Dynamically import 3D Table with SSR disabled to prevent Node compilation errors
const GameTable = dynamic(
  () => import('../../../components/table/GameTable').then((mod) => mod.GameTable),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3 border border-slate-900 rounded-2xl min-h-[380px] md:min-h-[500px]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="text-sm font-medium tracking-wide">Calibrating 3D Arena...</span>
      </div>
    )
  }
);

export default function LobbyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const roomId = params?.roomId as string;
  const name = searchParams?.get('name');

  const { socket, joinRoom, leaveRoom, startGame } = useSocket();
  const { room, player, error, connectionStatus } = useGameStore();
  
  const [copied, setCopied] = useState(false);

  // Redirect back if name is not set
  useEffect(() => {
    if (!name) {
      router.replace('/');
    }
  }, [name, router]);

  // Connect socket and join room
  useEffect(() => {
    if (!roomId || !name || !socket) return;
    
    // Attempt to join the room
    joinRoom(roomId, name);

    // Leave room automatically on unmount to release seats
    return () => {
      leaveRoom();
    };
  }, [roomId, name, socket]); // Note: joinRoom and leaveRoom are dependencies, but socket acts as trigger

  // Copy room code to clipboard
  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if current user is the host
  const isHost = player?.isHost || false;
  const totalPlayers = room?.players.length || 0;
  const canStart = totalPlayers >= 2;

  // Render Loading state
  if (!room || !player) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen bg-slate-950">
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          {error ? (
            <div className="glass-panel border-red-500/30 p-6 rounded-2xl flex flex-col items-center gap-4">
              <ShieldAlert className="text-red-500" size={48} />
              <h2 className="text-xl font-bold text-white">Join Failed</h2>
              <p className="text-slate-400 text-sm">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all"
              >
                Return Home
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-500" size={40} />
              <h2 className="text-lg font-bold text-white">Connecting to Lobby...</h2>
              <p className="text-slate-500 text-xs tracking-wider uppercase font-semibold">
                Status: {connectionStatus}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-950">
      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-200">
            UNO Real Lobby
          </h1>
        </div>

        <button
          onClick={() => {
            leaveRoom();
            router.push('/');
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-950/20 text-red-400 hover:text-red-300 text-xs font-semibold uppercase tracking-wider transition-all"
        >
          <LogOut size={13} /> Exit Table
        </button>
      </header>

      {/* Main Grid: Responsive 3D Canvas + Info sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        
        {/* Left/Center 3D Canvas Box (takes 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative flex-1 bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            
            {/* Holographic camera rotation tip */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
              <span className="bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 px-2 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-sm">
                <CircleDot size={10} className="text-blue-500" /> Click and drag to orbit camera
              </span>
            </div>

            {/* Interactive 3D Canvas */}
            <div className="flex-1 min-h-[380px] lg:min-h-0 relative">
              <GameTable />
            </div>

          </div>
        </div>

        {/* Right Info Sidebar (takes 1 column) */}
        <div className="flex flex-col gap-6">
          
          {/* Room Details Card */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Lobby Access
            </h3>
            
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Room Code</span>
              <div className="flex gap-2 mt-1">
                <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 font-mono text-xl font-bold tracking-widest text-center text-blue-400 select-all">
                  {roomId.toUpperCase()}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white px-3 rounded-xl transition-all flex items-center justify-center shrink-0"
                  title="Copy code"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1 bg-slate-950/40 p-3 rounded-xl border border-slate-900/60">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500">Total Players</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users size={14} className="text-blue-400" />
                  <span className="text-sm font-bold text-white">{totalPlayers} / 6</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500">Room Status</span>
                <span className="block mt-0.5 text-xs font-bold text-green-400 capitalize">
                  {room.status}
                </span>
              </div>
            </div>
          </div>

          {/* Connected Players list */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg flex-1 flex flex-col min-h-[250px]">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3.5 flex justify-between items-center">
              <span>Seated Players</span>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-900">
                {totalPlayers} Seated
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <AnimatePresence initial={false}>
                {room.players.map((p) => {
                  const isCurrent = p.id === player.id;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`flex justify-between items-center px-3 py-2.5 rounded-xl border transition-all ${
                        isCurrent 
                          ? 'bg-blue-950/30 border-blue-500/30 shadow-[inset_0_0_8px_rgba(59,130,246,0.1)]' 
                          : 'bg-slate-950/60 border-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Seat Avatar Placeholder */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCurrent 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                        }`}>
                          S{p.seatNumber}
                        </div>
                        <span className={`text-sm font-semibold truncate ${isCurrent ? 'text-blue-200' : 'text-slate-200'}`}>
                          {p.name} {isCurrent && '(You)'}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.isHost && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Crown size={9} /> Host
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Host Start Game Controls */}
            <div className="mt-4 pt-4 border-t border-slate-900">
              {isHost ? (
                <div className="space-y-2">
                  <button
                    disabled={!canStart}
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group text-sm"
                  >
                    <Play size={14} className="fill-current" /> Start UNO Session
                  </button>
                  {!canStart && (
                    <p className="text-[10px] text-center text-slate-500 font-medium">
                      Waiting for at least 2 players to seat.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    Waiting for Host to start the game session...
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
