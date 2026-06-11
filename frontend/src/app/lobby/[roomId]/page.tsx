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
  Play, 
  ShieldAlert, 
  Loader2, 
  Layers 
} from 'lucide-react';

// Dynamically import rebuilt 3D Table Scene with SSR disabled
const TableScene = dynamic(
  () => import('../../../components/table/TableScene').then((mod) => mod.TableScene),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-4 z-50">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <h2 className="text-lg font-bold text-white tracking-wide">Drawing Card Table...</h2>
        <p className="text-slate-500 text-xs uppercase font-semibold tracking-wider">UNO Real 2.5D</p>
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
  const { 
    room, 
    player, 
    error, 
    connectionStatus, 
    clearAllCards 
  } = useGameStore();
  
  const [copied, setCopied] = useState(false);

  // Redirect back if name query parameter is missing
  useEffect(() => {
    if (!name) {
      router.replace('/');
    }
  }, [name, router]);

  // Connect socket and join room seating list
  useEffect(() => {
    if (!roomId || !name || !socket) return;
    
    joinRoom(roomId, name);

    // Reset card states on unmount/leave
    return () => {
      leaveRoom();
      clearAllCards();
    };
  }, [roomId, name, socket]);

  // Copy room code to clipboard
  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = player?.isHost || false;
  const totalPlayers = room?.players.length || 0;
  const canStart = totalPlayers >= 2;

  // Render connection/error loading states
  if (!room || !player) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen bg-slate-950">
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          {error ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel border-red-500/30 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl"
            >
              <ShieldAlert className="text-red-500 animate-bounce" size={48} />
              <h2 className="text-xl font-bold text-white">Join Failed</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all"
              >
                Return Home
              </button>
            </motion.div>
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
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative">
      
      {/* =================================================================== */}
      {/* TOP 75% - 3D Virtual Card Table Viewport                            */}
      {/* =================================================================== */}
      <div className="w-full h-[75%] relative border-b border-slate-900/60">
        
        {/* Full-screen 3D Scene */}
        <div className="w-full h-full absolute inset-0 z-0">
          <TableScene />
        </div>

        {/* HUD: Overlay Top Header Panel */}
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
          {/* Branding & Status Info */}
          <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-2 pointer-events-auto shadow-md">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-wide">UNO Real</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-widest font-medium">Virtual Room</span>
            </div>
          </div>

          {/* Room Code Pill */}
          <div className="glass-panel rounded-full px-5 py-1.5 flex items-center gap-3 pointer-events-auto shadow-md max-w-xs">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Room Code</span>
            <span className="font-mono text-xs font-bold tracking-widest text-blue-400 select-all">
              {roomId.toUpperCase()}
            </span>
            <button
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-white transition-all ml-1"
              title="Copy Room Code"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </button>
          </div>

          {/* Leave Table Button */}
          <button
            onClick={() => {
              leaveRoom();
              router.push('/');
            }}
            className="glass-panel rounded-xl px-3.5 py-2 hover:bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-all pointer-events-auto shadow-md flex items-center gap-2"
          >
            <LogOut size={12} /> Exit Table
          </button>
        </header>

        {/* HUD: Bottom Table Actions (Host Start Button) */}
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
          <div className="pointer-events-auto">
            {isHost ? (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  disabled={!canStart}
                  onClick={startGame}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 text-white font-bold py-2.5 px-6 rounded-full shadow-lg transition-all flex items-center gap-2 text-xs uppercase tracking-wider border border-emerald-400/20 disabled:border-transparent hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-none"
                >
                  <Play size={12} className="fill-current" /> Start Game
                </button>
                {!canStart && (
                  <span className="text-[9px] bg-slate-950/85 border border-slate-900/60 text-slate-400 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-md">
                    Waiting for players to sit ({totalPlayers}/2 minimum)
                  </span>
                )}
              </div>
            ) : (
              <div className="bg-slate-950/85 border border-slate-900/60 rounded-full px-4 py-1.5 text-center shadow-md backdrop-blur-sm">
                <span className="text-[9px] text-slate-300 font-semibold tracking-wide uppercase">
                  Waiting for host to start session...
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* =================================================================== */}
      {/* BOTTOM 25% - Player Hand Area HUD Panel                             */}
      {/* =================================================================== */}
      <footer className="w-full h-[25%] bg-gradient-to-t from-slate-950 to-slate-900/90 flex flex-col items-center justify-between p-4 relative border-t border-slate-800/40">
        {/* Soft neon divider border */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

        {/* Hand Area Label */}
        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
          <Layers size={13} className="text-slate-500" />
          <span>Your Hand</span>
        </div>

        {/* Hand Area Visual Layout Placeholders */}
        <div className="flex-1 w-full max-w-xl flex items-center justify-center gap-4 mt-2">
          {/* Dash outline where cards will sit */}
          <div className="w-full h-full rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/40 flex flex-col items-center justify-center p-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              No Cards Handed
            </span>
            <span className="text-[9px] text-slate-600 mt-1">
              (Cards will be distributed here once gameplay starts in Phase 3)
            </span>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="text-[8px] text-slate-600 uppercase tracking-widest font-semibold mt-1">
          UNO Real Table Engine v2.0 • Fixed 2.5D Tabletop Camera
        </div>
      </footer>

    </div>
  );
}
