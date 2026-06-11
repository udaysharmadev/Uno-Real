'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnoCard } from './UnoCard';
import { CardColor, CardValue } from '../../lib/cards/cardEngine';

export interface HtmlAnimatingCard {
  id: string;
  color: CardColor;
  value: CardValue;
  startX: string;
  startY: string;
  endX: string;
  endY: string;
  rotateStart: number;
  rotateEnd: number;
  scaleStart: number;
  scaleEnd: number;
  isFaceUp: boolean;
  onArrival?: () => void;
}

export const CardAnimator: React.FC = () => {
  const [animatingCards, setAnimatingCards] = useState<HtmlAnimatingCard[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Expose HTML card animation trigger
    (window as any).triggerHtmlCardAnimation = (
      color: CardColor,
      value: CardValue,
      startX: string,
      startY: string,
      endX: string,
      endY: string,
      rotateStart: number,
      rotateEnd: number,
      scaleStart: number,
      scaleEnd: number,
      isFaceUp: boolean,
      onArrival?: () => void
    ) => {
      const newCard: HtmlAnimatingCard = {
        id: `anim-${Math.random().toString(36).substring(2, 9)}`,
        color,
        value,
        startX,
        startY,
        endX,
        endY,
        rotateStart,
        rotateEnd,
        scaleStart,
        scaleEnd,
        isFaceUp,
        onArrival,
      };
      setAnimatingCards((prev) => [...prev, newCard]);
    };

    return () => {
      delete (window as any).triggerHtmlCardAnimation;
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {animatingCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ 
              left: card.startX, 
              top: card.startY, 
              rotate: card.rotateStart, 
              scale: card.scaleStart,
              opacity: 1 
            }}
            animate={{ 
              left: card.endX, 
              top: card.endY, 
              rotate: card.rotateEnd, 
              scale: card.scaleEnd,
              opacity: 1 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 120, 
              damping: 16,
              mass: 0.8
            }}
            onAnimationComplete={() => {
              if (card.onArrival) card.onArrival();
              setAnimatingCards((prev) => prev.filter((c) => c.id !== card.id));
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <UnoCard color={card.color} value={card.value} isFaceUp={card.isFaceUp} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CardAnimator;

