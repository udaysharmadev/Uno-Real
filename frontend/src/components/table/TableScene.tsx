'use client';

import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { TableSurface } from './TableSurface';
import { PlayerSeat } from './PlayerSeat';
import { CameraController } from './CameraController';
import { CardStack } from '../cards/CardStack';
import { CardFan } from '../cards/CardFan';
import { CardAnimator } from '../cards/CardAnimator';
import { useGameStore } from '../../store/useGameStore';
import { getSeatCoords } from '../../utils/seating';
import { generatePhase3DemoHand, getOpponentDemoCardCounts } from '../../lib/cards/mockCards';
import { createCard } from '../../lib/cards/cardEngine';
import * as THREE from 'three';

export const TableScene: React.FC = () => {
  const { 
    room, 
    player, 
    cameraMode,
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

  // 1. Initialize Default Board States immediately on mount
  useEffect(() => {
    // Populate local player's hand with Phase 3 demo hand: Red 5, Blue Reverse, Yellow Skip, Wild, Green 8, Red Draw Two, Blue 1
    setPlayerCards(localSeatNumber, generatePhase3DemoHand());
    
    // Set draw pile count and default top discard card
    setDrawPileCount(54);
    setDiscardPile([createCard('green', '7')]);

    // Give opponents mock cards for visual realism in the 3D space
    if (room) {
      room.players.forEach(p => {
        if (p.seatNumber !== localSeatNumber) {
          const count = getOpponentDemoCardCounts(p.seatNumber);
          setPlayerCards(p.seatNumber, Array.from({ length: count }).map(() => createCard('red', '0')));
        }
      });
    }
  }, [localSeatNumber, room]);

  // Map players to the 6 fixed visual seat coordinates relative to the local player
  const seats = Array.from({ length: TOTAL_SEATS }).map((_, index) => {
    const seatNumber = index + 1;
    const transform = getSeatCoords(seatNumber, localSeatNumber);
    const occupant = getPlayerAtSeat(seatNumber);
    const isLocal = occupant ? occupant.id === player?.id : false;

    // Card fan position: placed slightly inside the table radius (75% distance to center)
    // and elevated above the felt
    const handX = transform.position[0] * 0.72;
    const handZ = transform.position[2] * 0.72;
    const handY = transform.position[1] + 0.12;

    return {
      seatNumber,
      position: transform.position,
      occupant,
      isLocal,
      handPosition: [handX, handY, handZ] as [number, number, number],
    };
  });

  return (
    <div className="w-full h-full relative">
      {/* Ambient Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none z-10" />
      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(3,7,18,0.7)] pointer-events-none z-10" />

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ fov: 30, near: 0.1, far: 20 }} // Locked tabletop FOV
        className="w-full h-full"
      >
        <color attach="background" args={['#030712']} />

        {/* Stable Studio Lights */}
        <ambientLight intensity={0.5} />
        
        <spotLight
          position={[0, 6, 0]}
          angle={0.6}
          penumbra={0.5}
          intensity={1.8}
          castShadow
          color="#bfdbfe"
        />

        <directionalLight position={[2, 4, 3]} intensity={0.6} />

        {/* Rebuilt Table Scene Elements */}
        <group position={[0, -0.4, 0]}>
          {/* Centered Premium Oval Poker felt table */}
          <TableSurface />

          {/* 3D Draw Pile Stack */}
          <CardStack count={drawPileCount} isDiscard={false} position={[-0.48, 0.01, 0]} />

          {/* 3D Discard Pile Stack */}
          <CardStack 
            count={discardPile.length} 
            isDiscard={true} 
            topCard={discardPile[discardPile.length - 1]} 
            position={[0.48, 0.01, 0]} 
          />

          {/* 6 Fixed Player Seats around table circumference */}
          {seats.map((seat) => (
            <PlayerSeat
              key={seat.seatNumber}
              seatNumber={seat.seatNumber}
              position={seat.position}
              player={seat.occupant}
              isLocal={seat.isLocal}
            />
          ))}

          {/* Opponent Card Fans floating on felt in front of their seats (backs only) */}
          {seats.map((seat) => {
            if (seat.isLocal || !seat.occupant) return null;
            const cardCount = playerCards[seat.seatNumber]?.length || 0;
            return (
              <CardFan
                key={`fan-seat-${seat.seatNumber}`}
                isLocal={false}
                cardCount={cardCount}
                position={seat.handPosition}
                rotation={[0.15, 0, 0]} // Flat-facing slightly tilted cards
              />
            );
          })}

          {/* 3D Card Dealing Animation bus */}
          <CardAnimator />
        </group>

        {/* Static Camera Perspective Lock */}
        <CameraController />
      </Canvas>
    </div>
  );
};
export default TableScene;
