'use client';

import React, { useEffect } from 'react';
import { TableSurface } from './TableSurface';
import { PlayerSeat } from './PlayerSeat';
import { CardAnimator } from '../cards/CardAnimator';
import { UnoCard } from '../cards/UnoCard';
import { useGameStore } from '../../store/useGameStore';
import { getSeatCoords } from '../../utils/seating';
import { useSocket } from '../../hooks/useSocket';

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

  const localSeatNumber = player?.seatNumber || 1;
  const isMyTurn = currentPlayerId === player?.id && gameStatus === 'playing';

  const playersList = room?.players || [];
  const numPlayers = playersList.length || 2;
  const localIndex = room ? playersList.findIndex(p => p.id === player?.id) : -1;

  // Helper to fetch player seated at seatNumber (only used in lobby status)
  const getPlayerAtSeat = (seatNo: number) => {
    if (!room) return null;
    return room.players.find((p) => p.seatNumber === seatNo) || null;
  };

  // Clear cards when returning to lobby
  useEffect(() => {
    if (!room || room.status !== 'playing') {
      clearAllCards();
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
          <div 
            onClick={handleDrawPileClick}
            className={`absolute left-[41%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 scale-[0.72] select-none transition-all ${
              isMyTurn && !isProcessing && !isSpectator
                ? 'cursor-pointer hover:brightness-110 active:scale-[0.68] filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] pointer-events-auto' 
                : 'pointer-events-none opacity-50 brightness-75'
            }`}
            title={isMyTurn && !isProcessing && !isSpectator ? 'Draw Card' : undefined}
          >
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

        {/* Central Turn Status Messages Overlay */}
        {gameStatus === 'playing' && (
          <div 
            className="absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center"
          >
            {isMyTurn ? (
              <div className="px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-center animate-pulse">
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                  Your Turn
                </span>
              </div>
            ) : (() => {
              const activePlayer = room?.players.find(p => p.id === currentPlayerId);
              return activePlayer ? (
                <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-md text-center">
                  <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {activePlayer.name}'s Turn
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* =================================================================== */}
        {/* SEAT SYSTEM (Dynamic seats based on player count or 6-seat lobby)    */}
        {/* =================================================================== */}
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
                key={seatNumber}
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

        {/* Card Animation Layer (Framer Motion spring bus) */}
        <CardAnimator />

      </div>
    </div>
  );
};

export default TableScene;


