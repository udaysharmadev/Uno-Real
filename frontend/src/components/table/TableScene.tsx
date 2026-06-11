'use client';

import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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

    // Give opponents mock cards for visual realism in 3D
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

    // Card fan position: placed slightly inside the table radius (72% distance to center)
    // and elevated above the felt
    const handX = transform.position[0] * 0.72;
    const handZ = transform.position[2] * 0.72;
    const handY = transform.position[1] + 0.15;

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
      {/* HTML Ambient Vignette Overlay for depth */}
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

          {/* 3D Draw Pile Stack (shifted slightly left to make room for center play area) */}
          <CardStack count={drawPileCount} isDiscard={false} position={[-0.72, 0.01, 0]} />

          {/* 3D Discard Pile Stack (shifted slightly right) */}
          <CardStack 
            count={discardPile.length} 
            isDiscard={true} 
            topCard={discardPile[discardPile.length - 1]} 
            position={[0.72, 0.01, 0]} 
          />

          {/* --- CENTRAL PLAY AREA TARGET --- */}
          <group position={[0, 0.012, 0]}>
            {/* Outline decal on felt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.38, 0.4, 32]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
              <circleGeometry args={[0.38, 32]} />
              <meshBasicMaterial color="#1e293b" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            {/* Dotted border indicators */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
              <ringGeometry args={[0.42, 0.44, 4, 1, 0, Math.PI * 2]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} />
            </mesh>
            {/* Flat 2D HTML Label */}
            <Html transform={false} center>
              <div className="flex flex-col items-center justify-center bg-blue-950/50 border border-blue-500/20 px-2 py-0.5 rounded-full text-center shadow-md backdrop-blur-sm pointer-events-none">
                <span className="text-[7px] font-black uppercase tracking-widest text-blue-400">
                  Play Area
                </span>
              </div>
            </Html>
          </group>

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
              <group key={`fan-seat-${seat.seatNumber}`} position={seat.handPosition}>
                <CardFan
                  isLocal={false}
                  cardCount={cardCount}
                  position={[0, 0, 0]}
                  rotation={[0.15, 0, 0]} // Flat-facing slightly tilted cards
                />
                
                {/* Floating card count overlay tag */}
                <Html transform={false} center position={[0, 0.45, 0]}>
                  <div className="bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm pointer-events-none">
                    <span className="text-[8px] font-bold text-slate-300 whitespace-nowrap">
                      {cardCount} Cards
                    </span>
                  </div>
                </Html>
              </group>
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
