'use client';

import React, { useEffect } from 'react';
import { TableSurface } from './TableSurface';
import { PlayerSeat } from './PlayerSeat';
import { CardAnimator } from '../cards/CardAnimator';
import { UnoCard } from '../cards/UnoCard';
import { useGameStore } from '../../store/useGameStore';
import { getSeatCoords } from '../../utils/seating';
import { generatePhase3DemoHand, getOpponentDemoCardCounts } from '../../lib/cards/mockCards';
import { createCard } from '../../lib/cards/cardEngine';

export const TableScene: React.FC = () => {
  const { 
    room, 
    player, 
    playerCards,
    discardPile,
    drawPileCount,
    setPlayerCards,
    setDiscardPile,
    setDrawPileCount
  } = useGameStore();

  const localSeatNumber = player?.seatNumber || 1;
  const TOTAL_SEATS = 6;

  // Helper to fetch player seated at seatNumber
  const getPlayerAtSeat = (seatNo: number) => {
    if (!room) return null;
    return room.players.find((p) => p.seatNumber === seatNo) || null;
  };

  // 1. Initialize Board States immediately on mount
  useEffect(() => {
    // Populate local player's hand with Phase 3 demo hand
    setPlayerCards(localSeatNumber, generatePhase3DemoHand());
    
    // Set draw pile count and default top discard card
    setDrawPileCount(54);
    setDiscardPile([createCard('green', '7')]);

    // Give opponents mock cards for visual realism
    if (room) {
      room.players.forEach(p => {
        if (p.seatNumber !== localSeatNumber) {
          const count = getOpponentDemoCardCounts(p.seatNumber);
          setPlayerCards(p.seatNumber, Array.from({ length: count }).map(() => createCard('red', '0')));
        }
      });
    }
  }, [localSeatNumber, room]);

  // Stable offsets/rotations for discard pile stack rendering
  const discardRotation = (idx: number) => {
    const angles = [-6, 8, -12, 4, -2, 10, -5];
    return angles[idx % angles.length];
  };

  const discardOffsetX = (idx: number) => {
    const offsets = [-3, 2, -1, 3, -2, 1, -3];
    return offsets[idx % offsets.length];
  };

  const discardOffsetY = (idx: number) => {
    const offsets = [1, -2, 3, -1, 2, -3, 1];
    return offsets[idx % offsets.length];
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      {/* HTML Ambient Vignette Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/50 pointer-events-none z-10" />
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(3,7,18,0.8)] pointer-events-none z-10" />

      {/* 2.5D HTML Card Table Container */}
      <div className="w-full h-full relative flex items-center justify-center">
        
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
          <div className="absolute left-[41%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 scale-[0.72]">
            {Array.from({ length: Math.min(4, Math.ceil(drawPileCount / 12)) }).map((_, idx) => (
              <div
                key={`draw-${idx}`}
                className="absolute"
                style={{
                  transform: `translate(calc(-50% + ${idx * 1.5}px), calc(-50% - ${idx * 1.5}px))`,
                  zIndex: idx,
                }}
              >
                <UnoCard color="wild" value="wild" isFaceUp={false} />
              </div>
            ))}
            {/* Draw pile count badge floating on top */}
            <div 
              className="absolute z-30 bg-slate-950/90 border border-slate-800/80 px-2 py-0.5 rounded-full shadow-lg"
              style={{
                transform: 'translate(-50%, 62px)',
                left: '0px'
              }}
            >
              <span className="text-[9px] font-black text-red-400 whitespace-nowrap">
                {drawPileCount}
              </span>
            </div>
          </div>
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
              const isTop = idx === arr.length - 1;
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
        {/* SEAT SYSTEM (6 seats surrounding the table)                          */}
        {/* =================================================================== */}
        {Array.from({ length: TOTAL_SEATS }).map((_, index) => {
          const seatNumber = index + 1;
          const coords = getSeatCoords(seatNumber, localSeatNumber);
          const occupant = getPlayerAtSeat(seatNumber);
          const isLocal = occupant ? occupant.id === player?.id : false;
          const cardCount = playerCards[seatNumber]?.length || 0;

          return (
            <PlayerSeat
              key={seatNumber}
              seatNumber={seatNumber}
              player={occupant}
              isLocal={isLocal}
              coords={coords}
              cardCount={cardCount}
            />
          );
        })}

        {/* Card Animation Layer (Framer Motion spring bus) */}
        <CardAnimator />

      </div>
    </div>
  );
};

export default TableScene;

