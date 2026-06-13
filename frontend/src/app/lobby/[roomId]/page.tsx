'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSocket } from '../../../hooks/useSocket';
import { useGameStore } from '../../../store/useGameStore';
import { ReactionsHandler } from '../../../components/social/ReactionsHandler';
import { getSeatCoords } from '../../../utils/seating';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  LogOut, 
  ShieldAlert, 
  Loader2, 
  ArrowUpCircle
} from 'lucide-react';
import { getCardColorHex, getCardValueLabel, isValidMove } from '../../../lib/cards/cardEngine';

// Premium Loader Component for elegant loading states
const PremiumLoader: React.FC<{ message: string; submessage?: string }> = ({ message, submessage }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 gap-6 z-[999] overflow-hidden select-none">
      {/* Pulsing neon backing glow */}
      <div className="absolute w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />
      
      {/* Animated Cards Graphic */}
      <div className="relative w-20 h-28 flex items-center justify-center">
        <motion.div
          animate={{ rotate: [-8, 0, -8] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="absolute w-14 h-20 bg-slate-900 border border-slate-800 rounded-xl shadow-lg transform -translate-x-3 rotate-[-8deg] origin-bottom-right flex items-center justify-center"
        >
          <span className="text-blue-500/30 text-lg font-black">🂠</span>
        </motion.div>
        <motion.div
          animate={{ rotate: [8, 0, 8] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="absolute w-14 h-20 bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl transform translate-x-3 rotate-[8deg] origin-bottom-left flex items-center justify-center"
        >
          <span className="text-blue-400/80 text-lg font-black">🂠</span>
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="absolute w-14 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 border border-white/20 rounded-xl shadow-2xl flex items-center justify-center z-10"
        >
          <span className="text-white text-xl font-black">🏆</span>
        </motion.div>
      </div>
      
      {/* Message and Submessage */}
      <div className="text-center space-y-2 relative z-10">
        <h2 className="text-lg font-black text-white uppercase tracking-widest animate-pulse">
          {message}
        </h2>
        {submessage && (
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            {submessage}
          </p>
        )}
      </div>
      
      {/* Premium loading bar */}
      <div className="w-48 h-[3px] bg-slate-900 rounded-full overflow-hidden relative border border-white/5">
        <motion.div 
          animate={{ x: [-200, 200] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        />
      </div>
    </div>
  );
};

// Dynamically import full-screen 2.5D Table Scene with SSR disabled
const TableScene = dynamic(
  () => import('../../../components/table/TableScene').then((mod) => mod.TableScene),
  { 
    ssr: false,
    loading: () => <PremiumLoader message="Drawing Card Table..." submessage="Aligning table felt & wood grain..." />
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
    setError,
    connectionStatus,
    playerCards,
    discardPile,
    currentPlayerId,
    currentPlayerSeat,
    direction,
    wildColor,
    gameStatus,
    colorChooserId,
    winnerId,
    winnerName,
    unoCalled,
    clearAllCards,
    isProcessing,
    setIsProcessing,
    isSpectator,
    toasts,
    addToast,
    removeToast,
    tableTheme,
    setTableTheme,
    isMuted,
    toggleMute
  } = useGameStore();
  
  const [copied, setCopied] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Redirect back if name query parameter is missing
  useEffect(() => {
    if (!name) {
      router.replace('/');
    }
  }, [name, router]);

  // Auto-redirect if room no longer exists
  useEffect(() => {
    if (error === 'Room not found' || error === 'This room no longer exists') {
      const timer = setTimeout(() => {
        setError(null);
        router.push('/');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, router, setError]);

  // Connect socket and join room seating list
  useEffect(() => {
    if (!roomId || !name || !socket) return;
    
    joinRoom(roomId, name);

    return () => {
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

  // Calculate final leaderboard standings at ended status
  const getStandings = () => {
    if (!room) return [];
    return [...room.players]
      .map((p) => {
        const count = playerCards[p.seatNumber]?.length || 0;
        return { name: p.name, id: p.id, cardCount: count };
      })
      .sort((a, b) => a.cardCount - b.cardCount);
  };
  const standings = getStandings();

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
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {error === 'Room not found' ? 'This room no longer exists' : error}
              </p>
              {(error === 'Room not found' || error === 'This room no longer exists') && (
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider animate-pulse">
                  Redirecting to home page shortly...
                </p>
              )}
              <button
                onClick={() => {
                  setError(null);
                  router.push('/');
                }}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all"
              >
                Return Home
              </button>
            </motion.div>
          ) : (
            <PremiumLoader 
              message="Connecting to Lobby..." 
              submessage={`Status: ${connectionStatus.toUpperCase()} • Syncing seating slots...`} 
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative">
      
      {/* Reactions Layer Overlay */}
      <ReactionsHandler />



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
                  ? 'bg-red-950/85 border-red-500/30 text-red-200 shadow-red-500/10'
                  : toast.type === 'success'
                    ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-200 shadow-emerald-500/10'
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
      {/* FULL SCREEN - Virtual Card Table Viewport                           */}
      {/* =================================================================== */}
      <div className="w-full h-full relative">
        
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
        <header className="absolute top-0 left-0 right-0 p-3.5 flex justify-between items-center z-20 pointer-events-none gap-2">
          {/* Branding & Status Info */}
          <div className="glass-panel rounded-lg px-3 py-1 flex items-center gap-1.5 pointer-events-auto shadow-md opacity-90">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-lg ${isSpectator ? 'bg-amber-500 shadow-amber-500/60' : 'bg-green-500 shadow-green-500/60'}`} />
            <span className="text-[10px] font-bold text-white tracking-wide">
              {isSpectator ? '⚡ Spectating' : '🏆 UNO Real'}
            </span>
          </div>

          <div className="flex gap-2 items-center pointer-events-auto ml-auto">
            {/* Elegant Sound Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                toggleMute();
                addToast(!isMuted ? 'Sound Muted' : 'Sound Enabled', 'info');
              }}
              className="glass-panel rounded-full p-2 text-slate-300 hover:text-white transition-all shadow-md opacity-90 flex items-center justify-center border border-slate-800 w-8 h-8 shrink-0"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              <span className="text-[12px]">{isMuted ? '🔇' : '🔊'}</span>
            </motion.button>

            {/* Premium Theme Switcher Toolbar Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const themes: Array<'classic-green' | 'premium-blue' | 'dark-night'> = ['classic-green', 'premium-blue', 'dark-night'];
                const currentIdx = themes.indexOf(tableTheme || 'premium-blue');
                const nextIdx = (currentIdx + 1) % themes.length;
                setTableTheme(themes[nextIdx]);
                addToast(`Table theme: ${themes[nextIdx].replace('-', ' ').toUpperCase()}`, 'info');
              }}
              className="glass-panel rounded-full p-2 text-slate-300 hover:text-white transition-all shadow-md opacity-90 flex items-center justify-center border border-slate-800 w-8 h-8 shrink-0"
              title="Change Table Style"
            >
              <span className="text-[12px]">🎨</span>
            </motion.button>

            {/* Minimalist Room Code Copy Circle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode}
              className="glass-panel rounded-full p-2 text-slate-300 hover:text-white transition-all shadow-md opacity-90 flex items-center justify-center border border-slate-800 w-8 h-8 shrink-0"
              title="Copy Room Code"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </motion.button>

            {/* Leave Table Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                leaveRoom();
                router.push('/');
              }}
              className="glass-panel rounded-full p-2 hover:bg-red-950/20 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-all shadow-md flex items-center justify-center opacity-90 w-8 h-8 shrink-0"
              title="Exit Table"
            >
              <LogOut size={12} />
            </motion.button>
          </div>
        </header>

        {/* HUD: Bottom Table Actions */}
        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
          <div className="pointer-events-auto">
            {/* Display state alert banners */}
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
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 text-white font-bold py-2 px-5 rounded-full shadow-md transition-all flex items-center gap-1 text-[10px] uppercase tracking-wider border border-emerald-400/20 disabled:border-transparent disabled:text-slate-500"
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
                  <span className="text-[8px] bg-slate-950/80 border border-slate-900/60 text-slate-400 px-3 py-1 rounded-full shadow-md">
                    Waiting for host...
                  </span>
                )
              ) : gameStatus === 'playing' ? (
                isMyTurn ? (
                  <span className="text-[10px] bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 px-4 py-1.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.25)] font-black uppercase tracking-widest animate-pulse">
                    🟢 Your Turn - Play Card or Draw
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-950/80 border border-slate-900/60 text-slate-400 px-3 py-1 rounded-full shadow-md">
                    Waiting for Seat {currentPlayerSeat}...
                  </span>
                )
              ) : gameStatus === 'awaiting_color_selection' ? (
                <span className="text-[9px] bg-slate-950/80 border border-slate-900/60 text-slate-400 px-3.5 py-1.5 rounded-full shadow-md">
                  Waiting for color selection...
                </span>
              ) : null}

              {/* Declare UNO Button (Moved from footer) */}
              {(myHand.length === 2 || myHand.length === 1) && gameStatus === 'playing' && !isSpectator && (
                <motion.button
                  disabled={isProcessing}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92, y: 2 }}
                  onClick={() => {
                    setIsProcessing(true);
                    callUno();
                  }}
                  className={`mt-2 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 border ${
                    player && unoCalled[player.id]
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.75)] animate-pulse'
                      : 'bg-slate-900 border-slate-700 hover:border-red-500 hover:text-red-400 text-slate-300 shadow-md shadow-red-500/10'
                  }`}
                >
                  {player && unoCalled[player.id] ? '🔴 UNO Declared!' : '📣 Declare UNO!'}
                </motion.button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* =================================================================== */}
      {/* OVERLAYS: Color Selection Wheel Dialog                              */}
      {/* =================================================================== */}
      {gameStatus === 'awaiting_color_selection' && player && colorChooserId === player.id && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-slate-900/95 border border-slate-700 p-6 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-sm text-center pointer-events-auto backdrop-blur-md">
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
      {/* OVERLAYS: Confetti Canvas Game Over Standings & Play Again          */}
      {/* =================================================================== */}
      {gameStatus === 'ended' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 pointer-events-auto overflow-hidden">
          {/* Confetti canvas animation */}
          <ConfettiCanvas />

          <div className="bg-slate-900 border border-amber-500/30 p-7 rounded-3xl flex flex-col items-center gap-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] max-w-sm w-full text-center z-20 relative">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-2xl font-extrabold animate-bounce">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-amber-400 animate-pulse">Victory Match!</h2>
              <p className="text-slate-200 text-md font-bold mt-1">
                {player && winnerName === player.name ? '🎉 YOU WON THE GAME!' : `🎉 ${winnerName} won the game!`}
              </p>
            </div>

            {/* Standings Leaderboard List */}
            <div className="w-full border-t border-b border-slate-800 py-3 my-0.5 space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block text-left mb-1">Final Standings</span>
              {standings.map((entry, idx) => {
                const rank = idx + 1;
                const isWinner = rank === 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                return (
                  <div 
                    key={entry.id}
                    className={`flex justify-between items-center px-3 py-1.5 rounded-xl border ${
                      isWinner 
                        ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' 
                        : entry.id === player?.id 
                          ? 'bg-blue-950/40 border-blue-500/20 text-blue-200'
                          : 'bg-slate-950/60 border-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-bold">{medal} #{rank}</span>
                      <span className="font-black truncate max-w-[100px]">{entry.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">
                      {entry.cardCount === 0 ? 'Won' : `${entry.cardCount} cards left`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Play Again Loop Buttons */}
            <div className="w-full space-y-2">
              {isHost ? (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={isProcessing}
                  onClick={() => {
                    setIsProcessing(true);
                    startGame();
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 px-6 rounded-2xl shadow-lg transition-all text-xs uppercase tracking-wider border border-emerald-400/20 disabled:opacity-40"
                >
                  🔄 Play Again (Host)
                </motion.button>
              ) : (
                <div className="w-full py-2.5 px-4 rounded-xl bg-slate-950/60 border border-slate-900 text-center animate-pulse text-[8px] font-black uppercase tracking-widest text-slate-500">
                  ⏳ Waiting for host to restart...
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  leaveRoom();
                  router.push('/');
                }}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-2xl text-[10px] uppercase tracking-wide transition-all"
              >
                Exit to Main Menu
              </motion.button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
