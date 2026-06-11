'use client';

import React, { useMemo } from 'react';
import { UnoCard } from './UnoCard';
import { CardColor, CardValue, CardItem } from '../../lib/cards/cardEngine';

interface CardStackProps {
  count: number;
  isDiscard?: boolean;
  topCard?: CardItem | null;
  position?: [number, number, number];
}

export const CardStack: React.FC<CardStackProps> = ({
  count,
  isDiscard = false,
  topCard = null,
  position = [0, 0, 0],
}) => {
  // Generate a stable seed of random offsets for the stack
  // using useMemo so they don't jump around on every render!
  const stackOffsets = useMemo(() => {
    return Array.from({ length: Math.min(count, 8) }).map((_, idx) => {
      if (isDiscard) {
        // Discard pile is messy: random Y rotation and X/Z shifts
        const rotY = (Math.random() - 0.5) * 0.45; // ~25 deg max
        const posX = (Math.random() - 0.5) * 0.07;
        const posZ = (Math.random() - 0.5) * 0.07;
        return { posX, posZ, rotY };
      } else {
        // Draw pile is neat: very tiny offset
        const rotY = (Math.random() - 0.5) * 0.05;
        const posX = (Math.random() - 0.5) * 0.01;
        const posZ = (Math.random() - 0.5) * 0.01;
        return { posX, posZ, rotY };
      }
    });
  }, [count, isDiscard]);

  if (count <= 0) return null;

  return (
    <group position={position}>
      {/* Glow Footprint under stack */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshBasicMaterial 
          color={isDiscard ? '#10b981' : '#ef4444'} 
          transparent 
          opacity={0.12} 
        />
      </mesh>

      {/* Render stacked cards below the top card */}
      {stackOffsets.map((offset, idx) => {
        const isTop = idx === stackOffsets.length - 1;
        
        // Stack cards vertically along Y axis
        const posY = idx * 0.015;

        // If it's the top card of a discard pile and topCard is provided, render it face up
        const renderFaceUp = isDiscard && isTop;
        const cardColor: CardColor = renderFaceUp && topCard ? topCard.color : (isDiscard ? 'green' : 'red');
        const cardValue: CardValue = renderFaceUp && topCard ? topCard.value : (isDiscard ? '0' : 'wild');

        return (
          <UnoCard
            key={`stack-card-${idx}`}
            color={cardColor}
            value={cardValue}
            isFaceUp={renderFaceUp}
            position={[offset.posX, posY, offset.posZ]}
            rotation={[0, offset.rotY, 0]}
          />
        );
      })}
    </group>
  );
};
export default CardStack;
