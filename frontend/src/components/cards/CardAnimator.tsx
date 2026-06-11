'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { UnoCard } from './UnoCard';
import { CardColor, CardValue } from '../../lib/cards/cardEngine';
import * as THREE from 'three';

export interface FlyingCard {
  id: string;
  color: CardColor;
  value: CardValue;
  startPos: [number, number, number];
  endPos: [number, number, number];
  startRot: [number, number, number];
  endRot: [number, number, number];
  isFaceUp: boolean;
  progress: number;
  speed: number;
  onArrival?: () => void;
}

export const CardAnimator: React.FC = () => {
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
  const cardsRef = useRef<FlyingCard[]>([]);

  // Keep ref synchronized to avoid closures in useFrame
  useEffect(() => {
    cardsRef.current = flyingCards;
  }, [flyingCards]);

  // Expose global animation triggers for demo or socket integrations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (window as any).triggerDealCard = (
      color: CardColor,
      value: CardValue,
      startPos: [number, number, number],
      endPos: [number, number, number],
      startRot: [number, number, number],
      endRot: [number, number, number],
      isFaceUp: boolean,
      speed: number = 2.0, // Speed multiplier
      onArrival?: () => void
    ) => {
      const newCard: FlyingCard = {
        id: `fly-${Math.random().toString(36).substring(2, 9)}`,
        color,
        value,
        startPos,
        endPos,
        startRot,
        endRot,
        isFaceUp,
        progress: 0,
        speed,
        onArrival,
      };
      setFlyingCards((prev) => [...prev, newCard]);
    };

    return () => {
      delete (window as any).triggerDealCard;
    };
  }, []);

  useFrame((state, delta) => {
    if (cardsRef.current.length === 0) return;

    let updated = false;
    const nextCards = cardsRef.current.map((card) => {
      if (card.progress >= 1) return card;

      // Increment progress (approx. 0.015 per frame at 60fps, scaled by speed multiplier)
      const nextProgress = Math.min(1, card.progress + delta * card.speed * 1.5);
      updated = true;
      return { ...card, progress: nextProgress };
    });

    if (updated) {
      // Find cards that have arrived
      const arrived = nextCards.filter((c) => c.progress >= 1);
      
      // Trigger arrival callbacks
      arrived.forEach((c) => {
        if (c.onArrival) c.onArrival();
      });

      // Retain only cards that are still in-flight
      setFlyingCards(nextCards.filter((c) => c.progress < 1));
    }
  });

  return (
    <group>
      {flyingCards.map((card) => {
        const p = card.progress;
        
        // 1. Linear interpolation for X and Z position
        const x = THREE.MathUtils.lerp(card.startPos[0], card.endPos[0], p);
        const z = THREE.MathUtils.lerp(card.startPos[2], card.endPos[2], p);
        
        // 2. Parabolic arc trajectory for Y (creates a realistic card flip/throw curve)
        const linearY = THREE.MathUtils.lerp(card.startPos[1], card.endPos[1], p);
        const arcHeight = Math.sin(p * Math.PI) * 0.95; // peak at center of flight path
        const y = linearY + arcHeight;

        // 3. Smooth rotation interpolation
        const rx = THREE.MathUtils.lerp(card.startRot[0], card.endRot[0], p);
        const ry = THREE.MathUtils.lerp(card.startRot[1], card.endRot[1], p);
        const rz = THREE.MathUtils.lerp(card.startRot[2], card.endRot[2], p);

        // 4. Spin animation - add a Y spin during deal for realistic card rotation
        const spinY = (1 - p) * Math.PI * 1.5; // Spins 270 degrees in the air
        
        return (
          <UnoCard
            key={card.id}
            color={card.color}
            value={card.value}
            isFaceUp={card.isFaceUp}
            position={[x, y, z]}
            rotation={[rx, ry + spinY, rz]}
          />
        );
      })}
    </group>
  );
};
export default CardAnimator;
