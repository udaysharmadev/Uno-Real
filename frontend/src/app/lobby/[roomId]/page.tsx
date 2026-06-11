'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSocket } from '../../../hooks/useSocket';
import { useGameStore } from '../../../store/useGameStore';
import { PlayerHand } from '../../../components/cards/PlayerHand';
import { ReactionsHandler } from '../../../components/social/ReactionsHandler';
import { getSeatCoords } from '../../../utils/seating';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  LogOut, 
  ShieldAlert, 
  Loader2, 
  ArrowUpCircle,
  Layers
} from 'lucide-react';
import { getCardColorHex, getCardValueLabel, isValidMove } from '../../../lib/cards/cardEngine';

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

// High-performance canvas confetti particle effect
const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849'];
    const particles = Array.from({ length: 140 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > height) {
          particles[idx] = {
            ...p,
            x: Math.random() * width,
            y: -20,
            tilt: Math.random() * 10 - 5,
          };
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10 w-full h-full" />;
};

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
    setSelectedCardId,
    clearAllCards,
    isProcessing,
    setIsProcessing,
    isSpectator,
    toasts,
    addToast,
    removeToast
  } = useGameStore();
  
  const [copied, setCopied] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

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
      // Do NOT vacate room seat on temporary unmount or StrictMode rerenders
      clearAllCards();
    };
  }, [roomId, name, socket]);

  // Keydown listener to toggle socket debug panel (Ctrl + Shift + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDebugMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copy room code to clipboard
  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId.toUpperCase());
    setCopied(true);
    addToast('Lobby code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = player?.isHost || false;
  const totalPlayers = room?.players.length || 0;
  const canStart = totalPlayers >= 2;
  
  const localSeatNumber = player?.seatNumber || 1;
  const myHand = playerCards[localSeatNumber] || [];
  const selectedOldCard = myHand.find(c => c.id === selectedCardId);

  // Authoritative Play Card Trigger
  const handlePlayCard = () => {
    if (!selectedCardId || !selectedOldCard || isProcessing || isSpectator) return;

    // Check validity locally before sending to server
    const topDiscard = discardPile[discardPile.length - 1];
    if (topDiscard && !isValidMove(selectedOldCard, topDiscard, wildColor)) {
      addToast('Invalid move! Card must match color, value, or be a Wild card.', 'error');
      return;
    }

    // Set action locking immediately
    setIsProcessing(true);

    // Emit socket play-card directly (no optimistic removal or animation triggers here)
    playCard(selectedOldCard.id);
    setSelectedCardId(null);
  };

  const isMyTurn = currentPlayerId === player?.id && gameStatus === 'playing';

  // Find winner coordinates for localized spotlight render
  const getWinnerCoords = () => {
    const winnerPlayer = room?.players.find(p => p.id === winnerId);
    if (!winnerPlayer || !room) return { left: '50%', top: '50%' };
    const playerIndex = room.players.findIndex(p => p.id === winnerId);
    if (playerIndex !== -1) {
      const localIndex = room.players.findIndex(p => p.id === player?.id);
      const visualSlotIndex = (playerIndex - (localIndex !== -1 ? localIndex : 0) + room.players.length) % room.players.length;
      return getSeatCoords(visualSlotIndex, 0, room.players.length);
    }
    return getSeatCoords(winnerPlayer.seatNumber, localSeatNumber, 6);
  };
  const winnerCoords = getWinnerCoords();
  const winnerPlayerObj = room?.players.find(p => p.id === winnerId);

  // Render connection/error loading states
  if (!room || (!player && !isSpectator)) {
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
      
      {/* Reactions Layer Overlay */}
      <ReactionsHandler />

      {/* Floating Socket Debug Panel */}
      {debugMode && (
        <div className="fixed top-4 left-4 z-[99] bg-slate-950/95 border border-red-500/50 p-4 rounded-2xl shadow-2xl font-mono text-[9px] text-slate-200 max-w-xs pointer-events-auto backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-red-400 uppercase tracking-widest text-[8px]">Socket Debug Panel</span>
            <span className="bg-red-950/80 text-red-400 px-1 rounded uppercase font-bold text-[7px]">Ctrl+Shift+D</span>
          </div>
          <div className="space-y-1.5">
            <div><span className="text-slate-500">Connected:</span> <span className={socket?.connected ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{socket?.connected ? 'TRUE' : 'FALSE'}</span></div>
            <div><span className="text-slate-500">Game Status:</span> <span className="text-blue-400 font-bold uppercase">{gameStatus}</span></div>
            <div><span className="text-slate-500">Local Player ID:</span> <span className="text-slate-300">{player?.id || 'Spectator/Null'}</span></div>
            <div><span className="text-slate-500">Current Turn ID:</span> <span className="text-slate-300">{currentPlayerId || 'None'}</span></div>
            <div><span className="text-slate-500">Current Turn Seat:</span> <span className="text-slate-300">{currentPlayerSeat || 'None'}</span></div>
            <div><span className="text-slate-500">Discard Pile Size:</span> <span className="text-slate-300">{discardPile.length}</span></div>
            <div>
              <span className="text-slate-500">Top Discard:</span>{' '}
              <span className="text-amber-400 font-bold">
                {discardPile.length > 0
                  ? `${discardPile[discardPile.length - 1].color.toUpperCase()} ${discardPile[discardPile.length - 1].value.toUpperCase()}`
                  : 'None'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Cards In Hand:</span>{' '}
              <span className="text-purple-400 font-bold">
                {myHand.length}
              </span>
            </div>
            <div className="max-h-20 overflow-y-auto border-t border-slate-900 pt-1 text-[8px] text-slate-400">
              {myHand.map(c => `${c.color.toUpperCase()}_${c.value.toUpperCase()}`).join(', ') || 'No cards'}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
                toast.type === 'error'
                  ? 'bg-red-950/85 border-red-500/30 text-red-200'
                  : toast.type === 'success'
                    ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold leading-tight select-none">
                  {toast.type === 'error' ? '🚨' : toast.type === 'success' ? '✅' : 'ℹ️'}
                </span>
                <span className="text-[10px] font-bold tracking-wide leading-tight">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors text-[9px] font-black uppercase ml-4"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* =================================================================== */}
      {/* TOP 70% - Virtual Card Table Viewport                               */}
      {/* =================================================================== */}
      <div className="w-full h-[70%] relative border-b border-slate-900/60">
        
        {/* Full-screen Table Scene */}
        <div className="w-full h-full absolute inset-0 z-0">
          <TableScene />
        </div>

        {/* Winner Highlight Spotlight Overlay */}
        {gameStatus === 'ended' && winnerPlayerObj && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `radial-gradient(circle 200px at ${winnerCoords.left} ${winnerCoords.top}, transparent 10%, rgba(3, 7, 18, 0.88) 100%)`
            }}
          />
        )}

        {/* HUD: Overlay Top Header Panel */}
        <header className="absolute top-0 left-0 right-0 p-3.5 flex justify-between items-center z-20 pointer-events-none">
          {/* Branding & Status Info */}
          <div className="glass-panel rounded-lg px-3 py-1 flex items-center gap-1.5 pointer-events-auto shadow-md opacity-90">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-lg ${isSpectator ? 'bg-amber-500 shadow-amber-500/60' : 'bg-green-500 shadow-green-500/60'}`} />
            <span className="text-[10px] font-bold text-white tracking-wide">
              {isSpectator ? '⚡ Spectating' : '🏆 UNO Real'}
            </span>
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
            <motion.button
              whileHover={{ scale: 1.18 }}
              whileTap={{ scale: 0.85 }}
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-white transition-all ml-0.5"
              title="Copy Code"
            >
              {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
            </motion.button>
          </div>

          {/* Leave Table Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              leaveRoom();
              router.push('/');
            }}
            className="glass-panel rounded-lg px-2.5 py-1 hover:bg-red-950/20 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider transition-all pointer-events-auto shadow-md flex items-center gap-1 opacity-90"
          >
            <LogOut size={10} /> Exit
          </motion.button>
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
                  disabled={!isMyTurn || isProcessing || isSpectator}
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
                      <motion.button
                        whileHover={!canStart || isProcessing || isSpectator ? {} : { scale: 1.05 }}
                        whileTap={!canStart || isProcessing || isSpectator ? {} : { scale: 0.95 }}
                        disabled={!canStart || isProcessing || isSpectator}
                        onClick={() => {
                          setIsProcessing(true);
                          startGame();
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all flex items-center gap-1.5 text-xs uppercase tracking-wider border border-emerald-400/20 disabled:border-transparent disabled:text-slate-500"
                      >
                        Start Game
                      </motion.button>
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
            <span>{isSpectator ? 'Spectating Panel' : `Your Hand (${myHand.length} Cards)`}</span>
          </div>

          {/* Declare UNO button with tap feedback and glows */}
          {(myHand.length === 2 || myHand.length === 1) && gameStatus === 'playing' && !isSpectator && (
            <motion.button
              disabled={isProcessing}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92, y: 2 }}
              onClick={() => {
                setIsProcessing(true);
                callUno();
              }}
              className={`absolute right-4 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 border ${
                player && unoCalled[player.id]
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.75)] animate-pulse'
                  : 'bg-slate-900 border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-300 shadow-md shadow-red-500/10'
              }`}
            >
              {player && unoCalled[player.id] ? '🔴 UNO Declared!' : '📣 Declare UNO!'}
            </motion.button>
          )}
        </div>

        {/* Hand Area Visual Layout Fan */}
        <div className="flex-1 w-full max-w-3xl flex items-center justify-center gap-4 mt-1">
          {isSpectator ? (
            <div className="w-full h-[150px] rounded-2xl border border-dashed border-slate-800/60 bg-slate-950/40 flex flex-col items-center justify-center p-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Spectating match in progress...
              </span>
            </div>
          ) : myHand.length > 0 ? (
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
          <span>UNO Real Game Engine v5.0</span>
          <span>•</span>
          <span>Click cards to select</span>
          {isMyTurn && !isSpectator && (
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
      {gameStatus === 'awaiting_color_selection' && player && colorChooserId === player.id && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-sm text-center">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Choose Color</h3>
              <p className="text-slate-400 text-xs mt-1">Select the active color for the Wild card</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  chooseColor('red');
                }}
                className="bg-red-500 hover:bg-red-400 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-red-500/25 transition-all text-sm uppercase tracking-wide border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Red
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  chooseColor('blue');
                }}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-blue-500/25 transition-all text-sm uppercase tracking-wide border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Blue
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  chooseColor('green');
                }}
                className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-green-500/25 transition-all text-sm uppercase tracking-wide border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Green
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  chooseColor('yellow');
                }}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-4 rounded-2xl shadow-lg hover:shadow-yellow-500/25 transition-all text-sm uppercase tracking-wide border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yellow
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* OVERLAYS: Confetti Canvas Game Over Winner Alert                    */}
      {/* =================================================================== */}
      {gameStatus === 'ended' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 pointer-events-auto overflow-hidden">
          {/* Confetti canvas animation */}
          <ConfettiCanvas />

          <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] max-w-sm text-center z-20 relative">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-3xl font-extrabold animate-bounce">
              🏆
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest text-amber-400 animate-pulse">Winner!</h2>
              <p className="text-slate-200 text-lg font-bold mt-2">
                {player && winnerName === player.name ? '🎉 YOU WON THE GAME!' : `🎉 ${winnerName} won the game!`}
              </p>
              <p className="text-slate-400 text-xs mt-1">The UNO match has concluded</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                leaveRoom();
                router.push('/');
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 px-6 rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wider"
            >
              Return to Main Menu
            </motion.button>
          </div>
        </div>
      )}

    </div>
  );
}
