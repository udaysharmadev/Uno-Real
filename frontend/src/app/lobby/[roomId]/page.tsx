'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSocket } from '../../../hooks/useSocket';
import { useGameStore } from '../../../store/useGameStore';
import { PlayerHand } from '../../../components/cards/PlayerHand';
import { triggerDealerSequence } from '../../../lib/cards/cardAnimations';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  LogOut, 
  Play, 
  ShieldAlert, 
  Loader2, 
  Sparkles,
  ArrowUpCircle,
  Layers
} from 'lucide-react';
import { getCardColorHex, getCardValueLabel } from '../../../lib/cards/cardEngine';

// Dynamically import full-screen 3D Table Scene with SSR disabled
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

  const { socket, joinRoom, leaveRoom } = useSocket();
  const { 
    room, 
    player, 
    error, 
    connectionStatus, 
    playerCards,
    discardPile,
    selectedCardId,
    removeCardFromPlayer,
    setDiscardPile,
    setSelectedCardId,
    addCardToPlayer,
    setDrawPileCount,
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
  
  const localSeatNumber = player?.seatNumber || 1;
  const myHand = playerCards[localSeatNumber] || [];
  const selectedOldCard = myHand.find(c => c.id === selectedCardId);

  // Trigger dealer dealing sequence (flies cards round-robin in 3D, then adds them to store)
  const handleDealDemo = () => {
    if (!room) return;
    
    // Trigger round-robin deal
    triggerDealerSequence(room.players, localSeatNumber, {
      clearAllCards,
      setDrawPileCount,
      setDiscardPile,
      addCardToPlayer
    });
  };

  // Play Selected Card Animation Flow (flies card from hand to discard stack)
  const handlePlayCard = () => {
    if (!selectedCardId || !selectedOldCard) return;

    // 1. Remove card from player hand in store
    removeCardFromPlayer(localSeatNumber, selectedCardId);
    setSelectedCardId(null);

    // 2. Trigger HTML play-card throw flight path
    // Starts near bottom center (player hand area), lands on the discard pile at left: 59%, top: 50%
    const startX = '50%';
    const startY = '95%';
    const endX = '59%';
    const endY = '50%';

    const angles = [-6, 8, -12, 4, -2, 10, -5];
    const finalRot = angles[discardPile.length % angles.length];

    const animator = (window as any).triggerHtmlCardAnimation;
    if (animator) {
      animator(
        selectedOldCard.color,
        selectedOldCard.value,
        startX,
        startY,
        endX,
        endY,
        0, // startRot
        finalRot, // endRot
        1.0, // startScale
        0.72, // endScale
        true, // face up
        () => {
          // 3. On Arrival: append card to discard pile in store
          setDiscardPile([...discardPile, selectedOldCard]);
        }
      );
    } else {
      // Fallback
      setDiscardPile([...discardPile, selectedOldCard]);
    }
  };


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
      {/* TOP 70% - 3D Virtual Card Table Viewport                            */}
      {/* =================================================================== */}
      <div className="w-full h-[70%] relative border-b border-slate-900/60">
        
        {/* Full-screen 3D Scene */}
        <div className="w-full h-full absolute inset-0 z-0">
          <TableScene />
        </div>

        {/* HUD: Overlay Top Header Panel (Styled smaller to prioritize gameplay) */}
        <header className="absolute top-0 left-0 right-0 p-3.5 flex justify-between items-center z-20 pointer-events-none">
          {/* Branding & Status Info */}
          <div className="glass-panel rounded-lg px-3 py-1 flex items-center gap-1.5 pointer-events-auto shadow-md opacity-90">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-bold text-white tracking-wide">UNO Real</span>
          </div>

          {/* Minimalist Room Code Pill */}
          <div className="glass-panel rounded-full px-4 py-1 flex items-center gap-2 pointer-events-auto shadow-md opacity-90 max-w-xs text-[10px]">
            <span className="font-bold text-slate-400">Code:</span>
            <span className="font-mono font-bold tracking-widest text-blue-400 select-all uppercase">
              {roomId}
            </span>
            <button
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-white transition-all ml-0.5"
              title="Copy Code"
            >
              {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
            </button>
          </div>

          {/* Leave Table Button */}
          <button
            onClick={() => {
              leaveRoom();
              router.push('/');
            }}
            className="glass-panel rounded-lg px-2.5 py-1 hover:bg-red-950/20 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider transition-all pointer-events-auto shadow-md flex items-center gap-1 opacity-90"
          >
            <LogOut size={10} /> Exit
          </button>
        </header>

        {/* HUD: Bottom Table Actions (Play Selected Card / Status message) */}
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
          <div className="pointer-events-auto">
            {selectedOldCard ? (
              // Card selected: Show glowing Play button
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="flex flex-col items-center gap-1.5"
              >
                <button
                  onClick={handlePlayCard}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-6 rounded-full shadow-[0_0_24px_rgba(59,130,246,0.6)] transition-all flex items-center gap-2 text-xs uppercase tracking-wider border border-blue-400/30 animate-pulse"
                >
                  <ArrowUpCircle size={13} /> Play Card ({getCardValueLabel(selectedOldCard.value)})
                </button>
              </motion.div>
            ) : (
              // No selection: show start button for host if players joined
              isHost && (
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    disabled={!canStart}
                    onClick={() => alert('Start Game is a placeholder. Use the "DEAL DEMO HAND" button inside the hand area to test the game engine!')}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 text-white font-bold py-2 px-5 rounded-full shadow-md transition-all flex items-center gap-1.5 text-[10px] uppercase tracking-wider border border-emerald-400/20 disabled:border-transparent disabled:text-slate-500"
                  >
                    Start Game
                  </button>
                  {!canStart && (
                    <span className="text-[8px] bg-slate-950/80 border border-slate-900/60 text-slate-400 px-2 py-0.5 rounded-full shadow-md">
                      Waiting for players to sit ({totalPlayers}/2 minimum)
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>

      </div>

      {/* =================================================================== */}
      {/* BOTTOM 30% - Player Hand Area HUD Panel                             */}
      {/* =================================================================== */}
      <footer className="w-full h-[30%] bg-gradient-to-t from-slate-950 via-slate-950 to-slate-900/80 flex flex-col items-center justify-between p-3 relative border-t border-slate-800/40 z-10 shadow-2xl">
        {/* Soft neon divider border */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

        {/* Hand Area Label */}
        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
          <Layers size={13} className="text-slate-500" />
          <span>Your Hand</span>
        </div>

        {/* Hand Area Visual Layout Fan */}
        <div className="flex-1 w-full max-w-3xl flex items-center justify-center gap-4 mt-1">
          {myHand.length > 0 ? (
            <PlayerHand />
          ) : (
            // Dash outline when hand is empty
            <div className="w-full h-full rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/40 flex flex-col items-center justify-center p-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                No Cards Handed
              </span>
              <button
                onClick={handleDealDemo}
                className="mt-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2 px-5 rounded-xl text-[10px] uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5 border border-blue-500/20 animate-bounce"
              >
                <Sparkles size={11} className="text-amber-400" /> Deal Demo Hand
              </button>
            </div>
          )}
        </div>

        {/* Bottom footer text */}
        <div className="text-[8px] text-slate-600 uppercase tracking-widest font-semibold mt-1.5 flex items-center gap-3">
          <span>UNO Real Card Engine v2.5</span>
          <span>•</span>
          <span>Click cards to select</span>
          {myHand.length > 0 && (
            <>
              <span>•</span>
              <button 
                onClick={handleDealDemo} 
                className="text-blue-400 hover:text-blue-300 font-bold uppercase"
              >
                Redeal cards
              </button>
            </>
          )}
        </div>
      </footer>

    </div>
  );
}
