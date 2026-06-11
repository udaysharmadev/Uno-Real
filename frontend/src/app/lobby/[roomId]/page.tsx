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

  const { 
    socket, 
    joinRoom, 
    leaveRoom, 
    startGame, 
    playCard, 
    drawCard, 
    chooseColor, 
    callUno 
  } = useSocket();

  const { 
    room, 
    player, 
    error,
    connectionStatus,
    playerCards,
    discardPile,
    selectedCardId,
    currentPlayerId,
    currentPlayerSeat,
    direction,
    wildColor,
    gameStatus,
    colorChooserId,
    winnerId,
    winnerName,
    unoCalled,
    removeCardFromPlayer,
    setSelectedCardId,
    clearAllCards,
    isProcessing,
    setIsProcessing
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

  // Play Selected Card Animation Flow (flies card from hand to discard stack)
  const handlePlayCard = () => {
    if (!selectedCardId || !selectedOldCard || isProcessing) return;

    // Check validity locally before starting the animation
    const topDiscard = discardPile[discardPile.length - 1];
    const isColorMatch = !topDiscard || selectedOldCard.color === 'wild' || 
      (topDiscard.color === 'wild' ? (wildColor === null || selectedOldCard.color === wildColor) : (selectedOldCard.color === topDiscard.color));
    const isValueMatch = topDiscard && selectedOldCard.value === topDiscard.value;

    if (!isColorMatch && !isValueMatch) {
      alert('Invalid move! Card must match color, value, or be a Wild card.');
      return;
    }

    // 1. Remove card from player hand in store (optimistic update)
    removeCardFromPlayer(localSeatNumber, selectedCardId);
    setSelectedCardId(null);
    setIsProcessing(true);

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
          // 3. On Arrival: Emit socket event to finalize on server
          playCard(selectedOldCard.id);
        }
      );
    } else {
      // Fallback
      playCard(selectedOldCard.id);
    }
  };

  const isMyTurn = currentPlayerId === player?.id && gameStatus === 'playing';

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
      {/* TOP 70% - Virtual Card Table Viewport                               */}
      {/* =================================================================== */}
      <div className="w-full h-[70%] relative border-b border-slate-900/60">
        
        {/* Full-screen Table Scene */}
        <div className="w-full h-full absolute inset-0 z-0">
          <TableScene />
        </div>

        {/* HUD: Overlay Top Header Panel */}
        <header className="absolute top-0 left-0 right-0 p-3.5 flex justify-between items-center z-20 pointer-events-none">
          {/* Branding & Status Info */}
          <div className="glass-panel rounded-lg px-3 py-1 flex items-center gap-1.5 pointer-events-auto shadow-md opacity-90">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-bold text-white tracking-wide">UNO Real</span>
          </div>

          {/* Turn Direction HUD Widget */}
          {gameStatus === 'playing' && (
            <div className="glass-panel rounded-full px-3 py-1 flex items-center gap-2 pointer-events-auto shadow-md text-[9px] font-extrabold uppercase tracking-wider text-indigo-300">
              🔄 Direction: {direction === 'clockwise' ? 'Clockwise ➡️' : 'Counter-Clockwise ⬅️'}
            </div>
          )}

          {/* Active Wild Color Widget */}
          {gameStatus === 'playing' && wildColor && (
            <div 
              className="glass-panel rounded-full px-3.5 py-1 flex items-center gap-2 pointer-events-auto shadow-lg text-[9px] font-black uppercase tracking-widest border"
              style={{
                borderColor: getCardColorHex(wildColor),
                color: getCardColorHex(wildColor),
                boxShadow: `0 0 10px ${getCardColorHex(wildColor)}30`
              }}
            >
              🎨 Color: {wildColor}
            </div>
          )}

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

        {/* HUD: Bottom Table Actions */}
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
          <div className="pointer-events-auto">
            {selectedOldCard ? (
              // Card selected: Show glowing Play button (only if it's local player's turn)
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="flex flex-col items-center gap-1.5"
              >
                <button
                  disabled={!isMyTurn || isProcessing}
                  onClick={handlePlayCard}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-full shadow-[0_0_24px_rgba(59,130,246,0.6)] transition-all flex items-center gap-2 text-xs uppercase tracking-wider border border-blue-400/30 animate-pulse"
                >
                  <ArrowUpCircle size={13} /> {isMyTurn ? `Play ${selectedOldCard.color} ${getCardValueLabel(selectedOldCard.value)}` : 'Wait For Your Turn'}
                </button>
              </motion.div>
            ) : (
              // Display state alert banners
              <div className="flex flex-col items-center gap-1.5">
                {gameStatus === 'lobby' ? (
                  isHost ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        disabled={!canStart || isProcessing}
                        onClick={() => {
                          setIsProcessing(true);
                          startGame();
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all flex items-center gap-1.5 text-xs uppercase tracking-wider border border-emerald-400/20 disabled:border-transparent disabled:text-slate-500"
                      >
                        Start Game
                      </button>
                      {!canStart && (
                        <span className="text-[8px] bg-slate-950/80 border border-slate-900/60 text-slate-400 px-2 py-0.5 rounded-full shadow-md">
                          Waiting for players to sit ({totalPlayers}/2 minimum)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] bg-slate-950/80 border border-slate-900/60 text-slate-400 px-3 py-1 rounded-full shadow-md">
                      Waiting for host to start game...
                    </span>
                  )
                ) : gameStatus === 'playing' ? (
                  isMyTurn ? (
                    <span className="text-xs bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.35)] font-black uppercase tracking-widest animate-pulse">
                      🟢 Your Turn - Select Card or Draw
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-950/80 border border-slate-900/60 text-slate-400 px-3.5 py-1.5 rounded-full shadow-md">
                      Waiting for Seat {currentPlayerSeat}'s turn...
                    </span>
                  )
                ) : gameStatus === 'awaiting_color_selection' ? (
                  <span className="text-[9px] bg-slate-950/80 border border-slate-900/60 text-slate-400 px-3.5 py-1.5 rounded-full shadow-md">
                    Waiting for color selection...
                  </span>
                ) : null}
              </div>
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
        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400 w-full justify-center relative">
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-slate-500" />
            <span>Your Hand ({myHand.length} Cards)</span>
          </div>

          {/* Declare UNO button */}
          {(myHand.length === 2 || myHand.length === 1) && gameStatus === 'playing' && (
            <button
              disabled={isProcessing}
              onClick={() => {
                setIsProcessing(true);
                callUno();
              }}
              className={`absolute right-4 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 border ${
                player && unoCalled[player.id]
                  ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                  : 'bg-slate-900 border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-300 animate-bounce'
              }`}
            >
              {player && unoCalled[player.id] ? '🔴 UNO Declared!' : '📣 Declare UNO!'}
            </button>
          )}
        </div>

        {/* Hand Area Visual Layout Fan */}
        <div className="flex-1 w-full max-w-3xl flex items-center justify-center gap-4 mt-1">
          {myHand.length > 0 ? (
            <PlayerHand />
          ) : (
            // Dash outline when hand is empty (or lobby)
            <div className="w-full h-[150px] rounded-2xl border border-dashed border-slate-800/60 bg-slate-950/40 flex flex-col items-center justify-center p-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {gameStatus === 'lobby' ? 'Waiting for Game to Start...' : 'Your hand is empty'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom footer text */}
        <div className="text-[8px] text-slate-600 uppercase tracking-widest font-semibold mt-1.5 flex items-center gap-3">
          <span>UNO Real Game Engine v4.0</span>
          <span>•</span>
          <span>Click cards to select</span>
          {isMyTurn && (
            <>
              <span>•</span>
              <span className="text-emerald-400 font-bold uppercase animate-pulse">Your Turn</span>
            </>
          )}
        </div>
      </footer>

      {/* =================================================================== */}
      {/* OVERLAYS: Color Selection Wheel Dialog                              */}
      {/* =================================================================== */}
      {gameStatus === 'awaiting_color_selection' && colorChooserId === player.id && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-sm text-center">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Choose Color</h3>
              <p className="text-slate-400 text-xs mt-1">Select the active color for the Wild card</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  chooseColor('red');
                }}
                className="bg-red-500 hover:bg-red-400 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-red-500/25 transition-all text-sm uppercase tracking-wide border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Red
              </button>
              <button
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  chooseColor('blue');
                }}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-blue-500/25 transition-all text-sm uppercase tracking-wide border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Blue
              </button>
              <button
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  chooseColor('green');
                }}
                className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-green-500/25 transition-all text-sm uppercase tracking-wide border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Green
              </button>
              <button
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  chooseColor('yellow');
                }}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-4 rounded-2xl shadow-lg hover:shadow-yellow-500/25 transition-all text-sm uppercase tracking-wide border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yellow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* OVERLAYS: Game Over Winner Alert                                    */}
      {/* =================================================================== */}
      {gameStatus === 'ended' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 pointer-events-auto">
          <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-3xl font-extrabold animate-bounce">
              🏆
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest text-amber-400 animate-pulse">Winner!</h2>
              <p className="text-slate-200 text-lg font-bold mt-2">
                {winnerName === player.name ? '🎉 YOU WON THE GAME!' : `🎉 ${winnerName} won the game!`}
              </p>
              <p className="text-slate-400 text-xs mt-1">The UNO match has concluded</p>
            </div>
            <button
              onClick={() => {
                leaveRoom();
                router.push('/');
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 px-6 rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wider"
            >
              Return to Main Menu
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

