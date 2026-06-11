'use client';

import React from 'react';
import { UnoCard } from './UnoCard';
import { CardItem } from '../../lib/cards/cardEngine';

interface CardFanProps {
  cards?: CardItem[];
  cardCount?: number; // Used for opponents where we only know the count
  isLocal: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  selectedCardId?: string | null;
  onCardClick?: (cardId: string) => void;
}

export const CardFan: React.FC<CardFanProps> = ({
  cards = [],
  cardCount = 0,
  isLocal,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  selectedCardId = null,
  onCardClick,
}) => {
  // If rendering opponent and cards array is empty, populate mock cards for cardCount
  const visibleCards = !isLocal && cards.length === 0 && cardCount > 0
    ? Array.from({ length: cardCount }).map((_, i) => ({ id: `opponent-card-${i}`, color: 'wild' as const, value: 'wild' as const }))
    : cards;

  const N = visibleCards.length;
  if (N === 0) return null;

  // Spacing and spreading constants
  // For local hand (large and flat) vs opponent hand (small and tight)
  const angleSpread = isLocal 
    ? Math.min(0.09, 0.45 / N) // Max ~25 degrees spread total
    : Math.min(0.12, 0.35 / N); // Tight spread for opponents

  const spacingX = isLocal 
    ? Math.min(0.24, 1.8 / N) // Horizontal spacing
    : Math.min(0.12, 0.7 / N); // Tight spacing for opponents

  return (
    <group position={position} rotation={rotation}>
      {visibleCards.map((card, idx) => {
        // Calculate relative index centered around 0
        // (e.g. for N=5: -2, -1, 0, 1, 2)
        const offset = idx - (N - 1) / 2;

        // 1. Z-Rotation creates the fan tilt
        const rotZ = -offset * angleSpread;

        // 2. X-Position spreads cards horizontally
        const posX = offset * spacingX;

        // 3. Y-Position creates the curved arch (cards at the sides drop down)
        const posY = -Math.abs(offset) * (isLocal ? 0.035 : 0.015);

        // 4. Z-Position overlays cards naturally from left to right to prevent Z-fighting
        const posZ = idx * 0.012;

        // Opponent cards are tilted slightly forward towards center, local cards are flat
        const rotX = isLocal ? -Math.PI / 8 : 0.1; 
        const rotY = 0;

        const isSelected = selectedCardId === card.id;

        return (
          <UnoCard
            key={card.id}
            color={card.color}
            value={card.value}
            isFaceUp={isLocal} // Face up only for local player
            isSelected={isSelected}
            position={[posX, posY, posZ]}
            rotation={[rotX, rotY, rotZ]}
            onClick={() => {
              if (isLocal && onCardClick) {
                onCardClick(card.id);
              }
            }}
          />
        );
      })}
    </group>
  );
};
export default CardFan;
