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

  const [shakeActive, setShakeActive] = useState(false);
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

        // Draw 4 cards trigger a table rumble shake
        if (topCard.value === 'wild_draw_four') {
          setShakeActive(true);
          const timer = setTimeout(() => setShakeActive(false), 450);
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
      className="w-full h-full relative overflow-hidden flex items-center justify-center"
      style={{
        background: 'radial-gradient(circle at 50% -20%, #451a03 0%, #120501 50%, #030000 100%)'
      }}
    >
      {/* HTML Ambient Lamp Spotlight Blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[35%] bg-amber-500/5 blur-[95px] rounded-full pointer-events-none z-0" />

      {/* Top opponent chair backrest silhouette */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[8%] bg-black/45 rounded-b-[80px] blur-[20px] pointer-events-none z-10" />

      {/* Bottom chair backrest silhouette */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[12%] bg-black/40 rounded-t-[100px] blur-[25px] pointer-events-none z-10" />

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
        .animate-table-rumble {
          animation: table-rumble 0.45s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      {/* HTML Ambient Vignette Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/50 pointer-events-none z-10" />
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(3,7,18,0.8)] pointer-events-none z-10" />

      {/* 2.5D HTML Card Table Container (applying rumble shake & responsive scaling wrapper) */}
      <div className={`w-full h-full relative flex items-center justify-center transition-transform scale-90 sm:scale-100 origin-center ${shakeActive ? 'animate-table-rumble' : ''}`}>
        
        {/* The Oval Felt Table Surface */}
        <TableSurface />

        {/* =================================================================== */}
        {/* CENTER GAME AREA (Draw Pile, Discard Pile, Play Area)               */}
        {/* =================================================================== */}
        
        {/* Central Play Area Target zone */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[164px] rounded-2xl border border-dashed border-blue-500/25 bg-blue-950/5 flex flex-col items-center justify-center pointer-events-none scale-[0.72] z-10">
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
                  transform: `translate(calc(-50% + ${idx * 2}px), calc(-50% - ${idx * 2}px))`,
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
                transform: 'translate(-50%, 62px)',
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
            }}
          />
        )}

        {/* Discard Pile (Top cards face up) */}
        <div className="absolute left-[59%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 scale-[0.72]">
          {discardPile.length === 0 ? (
            // Hollow placeholder if discard pile is empty
            <div className="w-[124px] h-[184px] rounded-2xl border border-dashed border-slate-800/50 flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
              <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">Empty</span>
            </div>
          ) : (
            // Render top cards with slight random translations/rotations
            discardPile.slice(-5).map((card, idx, arr) => {
              return (
                <div
                  key={card.id}
                  className="absolute"
                  style={{
                    transform: `translate(calc(-50% + ${discardOffsetX(idx)}px), calc(-50% + ${discardOffsetY(idx)}px)) rotate(${discardRotation(idx)}deg)`,
                    zIndex: idx + 10,
                  }}
                >
                  <UnoCard 
                    color={card.color} 
                    value={card.value} 
                    isFaceUp={true} 
                    isSelected={false}
                  />
                </div>
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

              return (
                <PlayerSeat
                  key={occupant.id}
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
