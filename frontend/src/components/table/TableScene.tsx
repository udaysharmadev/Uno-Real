'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSurface } from './TableSurface';
import { PlayerSeat } from './PlayerSeat';
import { CardAnimator } from '../cards/CardAnimator';
import { UnoCard } from '../cards/UnoCard';
import { useGameStore } from '../../store/useGameStore';
import { getSeatCoords } from '../../utils/seating';
import { useSocket } from '../../hooks/useSocket';
import { getCardColorHex } from '../../lib/cards/cardEngine';

export const TableScene: React.FC = () => {
  const { 
    room, 
    player, 
    playerCards,
    discardPile,
    drawPileCount,
    currentPlayerId,
    gameStatus,
    clearAllCards,
    isProcessing,
    setIsProcessing,
    isSpectator
  } = useGameStore();

  const { drawCard } = useSocket();

  const [rumbleType, setRumbleType] = useState<'standard' | 'heavy' | null>(null);
  const [impactColor, setImpactColor] = useState<string | null>(null);
  const [impactKey, setImpactKey] = useState(0);
  const [lastDiscardCount, setLastDiscardCount] = useState(0);

  const localSeatNumber = player?.seatNumber || 1;
  const isMyTurn = currentPlayerId === player?.id && gameStatus === 'playing';

  const playersList = room?.players || [];
  const numPlayers = playersList.length || 2;
  const localIndex = room ? playersList.findIndex(p => p.id === player?.id) : -1;

  // Listen to discardPile changes to trigger landing shockwaves and table rumbles
  useEffect(() => {
    if (discardPile.length > lastDiscardCount) {
      setLastDiscardCount(discardPile.length);
      const topCard = discardPile[discardPile.length - 1];
      if (topCard) {
        setImpactColor(getCardColorHex(topCard.color));
        setImpactKey((prev) => prev + 1);

        // Standard card: 180ms rumble, Draw 4: 450ms rumble
        if (topCard.value === 'wild_draw_four') {
          setRumbleType('heavy');
          const timer = setTimeout(() => setRumbleType(null), 450);
          return () => clearTimeout(timer);
        } else {
          setRumbleType('standard');
          const timer = setTimeout(() => setRumbleType(null), 180);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [discardPile, lastDiscardCount]);

  // Helper to fetch player seated at seatNumber (only used in lobby status)
  const getPlayerAtSeat = (seatNo: number) => {
    if (!room) return null;
    return room.players.find((p) => p.seatNumber === seatNo) || null;
  };

  // Clear cards when returning to lobby
  useEffect(() => {
    if (!room || room.status !== 'playing') {
      clearAllCards();
      setLastDiscardCount(0);
    }
  }, [room?.status, clearAllCards]);

  const handleDrawPileClick = () => {
    if (isMyTurn && !isProcessing && !isSpectator) {
      setIsProcessing(true);
      drawCard();
    }
  };

  // Stable offsets/rotations for discard pile stack rendering
  const discardRotation = (idx: number) => {
    const angles = [-8, 6, -10, 4, 0];
    return angles[idx % angles.length];
  };

  const discardOffsetX = (idx: number) => {
    const offsets = [-4, 3, -2, 4, 0];
    return offsets[idx % offsets.length];
  };

  const discardOffsetY = (idx: number) => {
    const offsets = [2, -3, 4, -2, 0];
    return offsets[idx % offsets.length];
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden flex items-center justify-center animate-camera-drift"
      style={{
        background: 'radial-gradient(circle at 50% -20%, #451a03 0%, #120501 50%, #030000 100%)',
        perspective: '1200px'
      }}
    >
      {/* 3D Grounded Wooden Floor Panel */}
      <div 
        className="absolute bottom-0 w-full h-[55%] pointer-events-none select-none z-0 overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #20120b 0%, #0c0604 100%)',
          borderTop: '1px solid rgba(251,191,36,0.04)',
        }}
      >
        {/* Wooden floor planks lines */}
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 42px)',
            transform: 'perspective(400px) rotateX(80deg) origin-top scale(1.8)',
          }}
        />
        {/* Soft table shadow drop cast by heavy wood structure */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[78%] h-[75%] rounded-full bg-black/85 blur-[24px]"
          style={{ transform: 'translateY(-18%)' }}
        />
      </div>

      {/* Back Wall & Room Corners */}
      <div className="absolute inset-x-0 top-0 h-[45%] pointer-events-none select-none z-0 bg-[#0d0705] overflow-hidden">
        {/* Soft room corner line */}
        <div className="absolute left-[38%] inset-y-0 w-[1.5px] bg-gradient-to-b from-amber-950/10 via-black/40 to-transparent" />
        
        {/* Decorative wall shadow mask */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/20" />

        {/* Decorative Blurred Picture Frame on Wall */}
        <div className="absolute left-[10%] top-[18%] w-16 h-20 border border-amber-950/20 bg-black/50 rounded shadow-2xl opacity-40 blur-[0.6px] rotate-[1.5deg] flex items-center justify-center">
          <div className="w-[85%] h-[85%] bg-amber-950/5 border border-amber-950/15 flex items-center justify-center">
            <span className="text-[12px] text-amber-500/10 font-black">🂠</span>
          </div>
        </div>

        {/* Decorative wall shelf with items silhouettes */}
        <div className="absolute right-[12%] top-[16%] w-28 h-2.5 bg-[#170a04] shadow-md border-b border-amber-950/10 blur-[0.6px] opacity-75">
          {/* Silhouettes */}
          <div className="absolute bottom-full right-4 w-3.5 h-6 bg-black/60 rounded-sm" />
          <div className="absolute bottom-full right-10 w-4.5 h-8 bg-black/60 rounded-sm" />
          <div className="absolute bottom-full right-18 w-2.5 h-5 bg-black/60 rounded-sm" />
        </div>
      </div>

      {/* Warm Hanging Lamp Cord & Shade */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none opacity-85"
        style={{ zIndex: 15 }}
      >
        <div className="w-[1.5px] h-24 bg-gradient-to-b from-black to-[#291307]" />
        <div className="w-20 h-10 bg-gradient-to-b from-[#1b0a03] to-[#2e1307] rounded-t-full border-b border-amber-500/20 shadow-[0_4px_12px_rgba(0,0,0,0.6)] relative flex items-end justify-center">
          {/* Bulb Glow */}
          <div className="w-5 h-5 rounded-full bg-yellow-100 blur-[2px] -mb-1.5 shadow-[0_0_20px_rgba(253,230,138,0.95)]" />
        </div>
      </div>

      {/* HTML Ambient Lamp Spotlight Blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[40%] bg-amber-500/10 blur-[110px] rounded-full pointer-events-none z-0 animate-pulse" />

      {/* Cozy glowing radial corners */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-indigo-900/10 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Blurred Couch Silhouette behind the hand area */}
      <div 
        className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[85%] h-24 bg-[#0a0502]/90 rounded-t-[50%] blur-[2.5px] border-t border-amber-950/20 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Dynamic Keyframe Shakes Injector */}
      <style>{`
        @keyframes table-rumble {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2.5px, -1.5px) rotate(-0.6deg); }
          20% { transform: translate(-3.5px, 0px) rotate(1.2deg); }
          30% { transform: translate(0px, 2px) rotate(0deg); }
          40% { transform: translate(1.5px, -1.5px) rotate(1.2deg); }
          50% { transform: translate(-1px, 2.5px) rotate(-1.2deg); }
          60% { transform: translate(-3.5px, 1.5px) rotate(0deg); }
          70% { transform: translate(2.5px, 1.5px) rotate(-0.6deg); }
          80% { transform: translate(-1px, -1.5px) rotate(1.2deg); }
          90% { transform: translate(2.5px, 2.5px) rotate(0deg); }
        }
        .animate-table-rumble-standard {
          animation: table-rumble 0.18s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-table-rumble-heavy {
          animation: table-rumble 0.45s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes camera-drift {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          50% { transform: translateY(2px) translateX(1px) rotate(0.04deg); }
        }
        .animate-camera-drift {
          animation: camera-drift 12s ease-in-out infinite;
        }
      `}</style>

      {/* HTML Ambient Vignette Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/50 pointer-events-none z-10" />
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(3,7,18,0.8)] pointer-events-none z-10" />

      {/* 2.5D HTML Card Table Container (applying rumble shake & responsive scaling wrapper) */}
      <div className={`w-full h-full relative flex items-center justify-center transition-transform scale-90 sm:scale-100 origin-center ${
        rumbleType === 'heavy' ? 'animate-table-rumble-heavy' : rumbleType === 'standard' ? 'animate-table-rumble-standard' : ''
      }`}>
        
        {/* The Oval Felt Table Surface */}
        <TableSurface />

        {/* Elegant stenciled felt Room Code printed directly on table */}
        <div 
          className="absolute left-1/2 top-[63%] -translate-x-1/2 text-[9.5px] font-mono tracking-widest font-black uppercase text-white/10 select-all pointer-events-auto cursor-copy"
          style={{
            transform: 'rotateX(58deg)',
          }}
          title="Copy Room Code"
          onClick={() => {
            if (room?.code) {
              navigator.clipboard.writeText(room.code.toUpperCase());
              (window as any).dispatchEvent(new CustomEvent('toast-request', { detail: { message: 'Lobby code copied to clipboard!', type: 'success' } }));
            }
          }}
        >
          Lobby: {room?.code}
        </div>

        {/* =================================================================== */}
        {/* CENTER GAME AREA (Draw Pile, Discard Pile, Play Area)               */}
        {/* =================================================================== */}
        
        {/* Central Play Area Target zone */}
        <div 
          className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 w-[110px] h-[164px] rounded-2xl border border-dashed border-blue-500/20 bg-blue-950/5 flex flex-col items-center justify-center pointer-events-none scale-[0.72] z-10"
          style={{
            transform: 'translate(-50%, -50%) rotateX(54deg)',
          }}
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/40">
            Play Area
          </span>
        </div>

        {/* Draw Pile (Stacked card backs) */}
        {drawPileCount > 0 && (
          <div 
            onClick={handleDrawPileClick}
            className={`absolute left-[41%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 scale-[0.72] select-none transition-all ${
              isMyTurn && !isProcessing && !isSpectator
                ? 'cursor-pointer hover:brightness-110 active:scale-[0.68] filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] pointer-events-auto' 
                : 'pointer-events-none opacity-50 brightness-75'
            }`}
            title={isMyTurn && !isProcessing && !isSpectator ? 'Draw Card' : undefined}
          >
            {Array.from({ length: Math.min(5, drawPileCount) }).map((_, idx) => (
              <div
                key={`draw-${idx}`}
                className="absolute"
                style={{
                  transform: `translate(calc(-50% + ${idx * 2}px), calc(-50% - ${idx * 2}px)) rotateX(54deg)`,
                  zIndex: idx,
                }}
              >
                <UnoCard color="wild" value="wild" isFaceUp={false} />
              </div>
            ))}
            {/* Draw pile count badge floating on top */}
            <div 
              className={`absolute z-30 border px-2 py-0.5 rounded-full shadow-lg transition-colors ${
                isMyTurn
                  ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
                  : 'bg-slate-950/90 border-slate-800 text-red-400'
              }`}
              style={{
                transform: 'translate(-50%, 54px)',
                left: '0px'
              }}
            >
              <span className="text-[9px] font-black whitespace-nowrap">
                {drawPileCount}
              </span>
            </div>
          </div>
        )}

        {/* Discard Pile Shockwave Impact Ring Ripple */}
        {impactColor && (
          <motion.div
            key={`impact-${impactKey}`}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute left-[59%] top-[50%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 z-0 pointer-events-none w-32 h-48"
            style={{
              borderColor: impactColor,
              boxShadow: `0 0 25px ${impactColor}`,
              transform: 'translate(-50%, -50%) rotateX(54deg)',
            }}
          />
        )}

        {/* Discard Pile (Top cards face up) */}
        <div className="absolute left-[59%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 scale-[0.72]">
          {discardPile.length === 0 ? (
            // Hollow placeholder if discard pile is empty
            <div 
              className="w-[124px] h-[184px] rounded-2xl border border-dashed border-slate-800/50 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: 'translate(-50%, -50%) rotateX(54deg)',
              }}
            >
              <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">Empty</span>
            </div>
          ) : (
            // Render top cards with slight random translations/rotations
            discardPile.slice(-5).map((card, idx, arr) => {
              const isTop = idx === arr.length - 1;
              return (
                <motion.div
                  key={card.id}
                  initial={isTop ? { scale: 1.15, y: -15, rotateZ: discardRotation(idx) - 8 } : {}}
                  animate={isTop ? { scale: 1, y: 0, rotateZ: discardRotation(idx) } : {}}
                  transition={isTop ? { type: 'spring', stiffness: 220, damping: 12 } : {}}
                  className="absolute"
                  style={{
                    transform: `translate(calc(-50% + ${discardOffsetX(idx)}px), calc(-50% + ${discardOffsetY(idx)}px)) rotateX(54deg) rotateZ(${discardRotation(idx)}deg)`,
                    zIndex: idx + 10,
                  }}
                >
                  <UnoCard 
                    color={card.color} 
                    value={card.value} 
                    isFaceUp={true} 
                    isSelected={false}
                  />
                </motion.div>
              );
            })
          )}
        </div>

        {/* =================================================================== */}
        {/* SEAT SYSTEM (Dynamic seats based on player count or 6-seat lobby)    */}
        {/* =================================================================== */}
        <AnimatePresence>
          {room && room.status === 'playing' ? (
            // Active Gameplay: Render only occupied seats with sequential indexing
            playersList.map((occupant, idx) => {
              const visualSlotIndex = (idx - localIndex + numPlayers) % numPlayers;
              const coords = getSeatCoords(visualSlotIndex, 0, numPlayers);
              const isLocal = occupant.id === player?.id;
              const cardCount = playerCards[occupant.seatNumber]?.length || 0;
              const isActiveTurn = occupant.id === currentPlayerId;

              // First-person: Omit rendering the local player's seat bubble on the table
              if (visualSlotIndex === 0) return null;

              return (
                <PlayerSeat
                  key={`seat-${occupant.seatNumber}`}
                  seatNumber={occupant.seatNumber}
                  player={occupant}
                  isLocal={isLocal}
                  coords={coords}
                  cardCount={cardCount}
                  isActiveTurn={isActiveTurn}
                />
              );
            })
          ) : (
            // Lobby status: Render all 6 static seats with invitations enabled
            Array.from({ length: 6 }).map((_, index) => {
              const seatNumber = index + 1;
              const coords = getSeatCoords(seatNumber, localSeatNumber, 6);
              const occupant = getPlayerAtSeat(seatNumber);
              const isLocal = occupant ? occupant.id === player?.id : false;
              const cardCount = playerCards[seatNumber]?.length || 0;
              const isActiveTurn = occupant ? occupant.id === currentPlayerId : false;

              // Determine visual slot index to see if it is local player
              const visualSlotIndex = (seatNumber - localSeatNumber + 6) % 6;
              if (visualSlotIndex === 0) return null;

              return (
                <PlayerSeat
                  key={`seat-${seatNumber}`}
                  seatNumber={seatNumber}
                  player={occupant}
                  isLocal={isLocal}
                  coords={coords}
                  cardCount={cardCount}
                  isActiveTurn={isActiveTurn}
                />
              );
            })
          )}
        </AnimatePresence>

        {/* Card Animation Layer (Framer Motion spring bus) */}
        <CardAnimator />

      </div>
    </div>
  );
};

export default TableScene;
