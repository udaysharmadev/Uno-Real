'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useSocket';
import { PhysicalCard } from '../cards/PhysicalCard';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export const WebGLCards: React.FC = () => {
  const { room, player, currentPlayerId, playerCards, discardPile, drawPileCount, gameStatus } = useGameStore();
  const { playCard, drawCard } = useSocket();

  const isMyTurn = currentPlayerId === player?.id && (gameStatus === 'playing' || gameStatus === 'awaiting_color_selection');

  // Must render cards when playing OR waiting for color selection OR game ended
  if (!room || !['playing', 'awaiting_color_selection', 'ended'].includes(gameStatus)) return null;

  const playersList = room.players || [];
  const numPlayers = Math.max(playersList.length, 2);
  const localPlayerIndex = playersList.findIndex(p => p.id === player?.id);
  const safeLocalIndex = localPlayerIndex >= 0 ? localPlayerIndex : 0;
  const topCard = discardPile[discardPile.length - 1];

  return (
    <group>
      {/* ============================================================== */}
      {/* FORCE TEST / DEBUG RENDERING                                 */}
      {/* ============================================================== */}
      {topCard && (
        <group position={[0, 1.2, 0.5]} scale={[1.5, 1.5, 1.5]}>
          <Html position={[0, 0.8, 0]} center zIndexRange={[100, 0]}>
            <div className="bg-black/90 p-4 border-2 border-red-500 rounded-xl text-white font-mono text-center whitespace-nowrap">
              <div className="font-bold text-xl text-red-500 mb-2">TOP CARD DEBUG</div>
              <div className="text-lg">COLOR: <span className="text-yellow-400 font-black uppercase">{topCard.color}</span></div>
              <div className="text-lg">VALUE: <span className="text-yellow-400 font-black uppercase">{topCard.value}</span></div>
              <div className="text-xs text-gray-400 mt-2">ID: {topCard.id}</div>
              <div className="text-xs text-gray-400">STACK SIZE: {discardPile.length}</div>
            </div>
          </Html>
          <PhysicalCard
            key={`giant-${topCard.id}`}
            color={topCard.color}
            value={topCard.value}
            isFaceUp={true}
            position={[0, 0, 0]}
            rotation={[-0.2, 0, 0]} // Tilted slightly towards camera
          />
        </group>
      )}

      {/* 1. DISCARD PILE (RIGHT SIDE) */}
      <group position={[0.25, 0.88, 0]}>
        {discardPile.slice(-4).map((card, sliceIdx, arr) => {
          // sliceIdx is 0 to 3. idx should be the actual index for pseudo-randomness
          const actualIdx = discardPile.length - arr.length + sliceIdx;
          const isTop = sliceIdx === arr.length - 1;
          const randAngle = (Math.sin(actualIdx * 12.9898) * 43758.5453) % 1;
          const randRot = (Math.cos(actualIdx * 78.233) * 43758.5453) % 1;
          
          const xOffset = (randAngle - 0.5) * 0.08;
          const zOffset = (randRot - 0.5) * 0.08;
          const yRot = (randRot - 0.5) * 0.3;

          return (
            <PhysicalCard
              key={card.id}
              color={card.color}
              value={card.value}
              isFaceUp={true}
              position={[xOffset, actualIdx * 0.002, zOffset]}
              rotation={[0, yRot, 0]}
              animateSpawn={isTop ? 'drop' : 'none'}
            />
          );
        })}
      </group>

      {/* 2. DRAW PILE (LEFT SIDE) */}
      <group position={[-0.25, 0.88, 0]}>
        {Array.from({ length: Math.min(15, drawPileCount) }).map((_, idx) => {
          const randAngle = (Math.sin(idx * 12.9898) * 43758.5453) % 1;
          const randRot = (Math.cos(idx * 78.233) * 43758.5453) % 1;
          
          const xOffset = (randAngle - 0.5) * 0.04;
          const zOffset = (randRot - 0.5) * 0.04;

          return (
            <PhysicalCard
              key={`draw-${idx}`}
              color="wild"
              value="wild"
              isFaceUp={false}
              position={[xOffset, idx * 0.002, zOffset]}
              rotation={[0, 0, 0]}
              onClick={idx === Math.min(15, drawPileCount) - 1 && isMyTurn ? () => drawCard() : undefined}
            />
          );
        })}
        {/* Draw Pile Count Badge */}
        {drawPileCount > 0 && (
          <Html position={[0, 0.15, 0]} center zIndexRange={[100, 0]}>
            <div className="bg-black/80 backdrop-blur-md px-[10px] py-[6px] h-[24px] flex items-center justify-center rounded-full text-white font-bold text-[12px] border border-white/20 shadow-lg select-none whitespace-nowrap">
              {drawPileCount} CARDS
            </div>
          </Html>
        )}
      </group>

      {/* 3. OPPONENT HANDS */}
      {playersList.map((occupant, pIdx) => {
        const isLocal = occupant.id === player?.id;
        if (isLocal) return null; // Local player hand is pure HTML HUD now

        const relativeIndex = (pIdx - safeLocalIndex + numPlayers) % numPlayers;
        const baseAngle = (Math.PI * 2 / numPlayers) * relativeIndex;
        
        const hand = playerCards[occupant.seatNumber] || [];
        const cardCount = hand.length;
        if (cardCount === 0) return null;

        const rX = 1.15;
        const rZ = 0.75;
        const groupPosition: [number, number, number] = [
          Math.sin(baseAngle) * rX,
          1.1,
          Math.cos(baseAngle) * rZ
        ];

        return (
          <group key={`player-${occupant.id}`} position={groupPosition}>
            {/* Card Count Badge above opponent hand */}
            {/* position is lowered to prevent overlapping the hanging lamp shade at y=1.5 */}
            <Html position={[0, 0.15, 0]} center zIndexRange={[100, 0]}>
              <div className="flex flex-col items-center gap-1 select-none pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-[10px] py-[6px] h-[24px] flex items-center justify-center rounded-full text-white font-bold text-[14px] border border-white/10 whitespace-nowrap">
                  {occupant.name}
                </div>
                <div className="bg-red-500 text-white font-black text-[12px] px-[10px] py-[6px] h-[24px] flex items-center justify-center rounded-full shadow-lg whitespace-nowrap">
                  {cardCount} CARDS
                </div>
              </div>
            </Html>

            {/* Hand Fan */}
            {hand.map((card, cIdx) => {
              const spreadAngle = 0.10; // Increased spread angle for 25% wider fan
              const totalSpread = (cardCount - 1) * spreadAngle;
              const startAngle = -totalSpread / 2;
              const cardAngle = startAngle + (cIdx * spreadAngle);
              
              // Local rotation within the group
              const rotation: [number, number, number] = [
                0.8,
                baseAngle + Math.PI,
                cardAngle * -1 // Tilt the cards slightly in a fan
              ];
              
              const position: [number, number, number] = [
                Math.sin(cardAngle) * 0.3,
                Math.cos(cardAngle) * 0.3 - 0.3, // Arc height
                -cIdx * 0.005 // Prevent Z-fighting
              ];

              return (
                <PhysicalCard
                  key={card.id}
                  color={card.color}
                  value={card.value}
                  isFaceUp={false}
                  position={position}
                  rotation={rotation}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

export default WebGLCards;
