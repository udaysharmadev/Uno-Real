'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { getCardColorHex, getCardValueLabel, isValidMove, CardItem } from '../../lib/cards/cardEngine';
import { useSocket } from '../../hooks/useSocket';

export const PlayerHand: React.FC = () => {
  const { 
    player, 
    playerCards, 
    isProcessing,
    setIsProcessing,
    discardPile,
    wildColor,
    currentPlayerId,
    gameStatus,
    isSpectator
  } = useGameStore();

  const { playCard } = useSocket();
  const [invalidShakeCardId, setInvalidShakeCardId] = useState<string | null>(null);

  const localSeatNumber = player?.seatNumber || 1;
  const myCards = playerCards[localSeatNumber] || [];
  const N = myCards.length;

  const isMyTurn = currentPlayerId === player?.id && gameStatus === 'playing';
  const topDiscard = discardPile[discardPile.length - 1] || null;

  // Compute rotation and translation offsets for the circular card fan
  const getFanStyles = (index: number) => {
    if (N <= 1) return { rot: 0, tx: 0, ty: 0, scale: 1.0 };
    
    // Flat, natural arc of cards held in hand
    const offset = index - (N - 1) / 2;
    const angleStep = Math.min(6.0, 42 / (N - 1));
    const rot = offset * angleStep;
    
    const radius = 340; 
    const rad = (rot * Math.PI) / 180;
    const tx = Math.sin(rad) * radius;
    const ty = (1 - Math.cos(rad)) * radius;

    // Responsive scaling: Shrink card sizes dynamically for very large hands
    const scale = N > 7 ? Math.max(0.62, 1.0 - (N - 7) * 0.04) : 1.0;

    return { rot, tx, ty, scale };
  };

  const handleCardClick = (card: CardItem, isCardValid: boolean) => {
    if (isProcessing || isSpectator || !isMyTurn) return;
    
    if (isCardValid) {
      setIsProcessing(true);
      playCard(card.id);
    } else {
      // Trigger card shake and red glow for feedback
      setInvalidShakeCardId(card.id);
      setTimeout(() => {
        setInvalidShakeCardId(null);
      }, 500);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-end pb-0 relative select-none">
      
      {/* Cards Fan Container with 3D Perspective */}
      <div 
        className="flex justify-center items-end relative h-40 w-full max-w-3xl px-12 mt-2"
        style={{ perspective: '1000px' }}
      >
        <AnimatePresence>
          {myCards.map((card, idx) => {
            const { rot, tx, ty, scale } = getFanStyles(idx);
            const isWild = card.color === 'wild';
            const cardBg = getCardColorHex(card.color);
            const valueLabel = getCardValueLabel(card.value);
            
            // AUTHORITATIVE MOVE VALIDATION HIGHLIGHTING
            const isCardValid = isMyTurn && !isSpectator && gameStatus === 'playing' && isValidMove(card, topDiscard, wildColor);
            const isShaking = card.id === invalidShakeCardId;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 100, scale: 0.8, rotate: 0 }}
                animate={isShaking ? {
                  opacity: 1.0,
                  x: [tx, tx - 5, tx + 5, tx - 5, tx + 5, tx], // Horizontal shake sequence
                  y: ty,
                  rotate: rot,
                  rotateX: 18,
                  scale: scale,
                  zIndex: 50,
                } : { 
                  opacity: isCardValid ? 1.0 : 0.40, 
                  y: ty, 
                  x: tx,
                  rotate: rot, 
                  rotateX: 18,
                  scale: scale, 
                  zIndex: idx + 10
                }}
                exit={{ opacity: 0, y: -60, scale: 0.8, rotate: 0 }}
                transition={isShaking ? {
                  duration: 0.4,
                  ease: 'easeInOut'
                } : undefined}
                whileHover={isProcessing || !isCardValid ? {} : { 
                  y: -32, // Deeper hover lift (safe bound)
                  rotateX: 6, // Tilt slightly more forward on hover
                  rotateY: -6, // Tilt Y
                  scale: scale * 1.15, 
                  zIndex: 100,
                  transition: { type: 'spring', stiffness: 450, damping: 20 }
                }}
                onClick={() => handleCardClick(card, isCardValid)}
                className={`absolute w-[110px] h-[165px] rounded-2xl p-2.5 flex flex-col justify-between items-center transition-colors duration-300 border origin-bottom shrink-0 ${
                  isProcessing 
                    ? 'cursor-not-allowed' 
                    : isCardValid 
                      ? 'cursor-pointer border-white/20' 
                      : 'cursor-not-allowed border-white/10'
                }`}
                style={{
                  backgroundColor: cardBg,
                  borderColor: isShaking ? '#ef4444' : undefined,
                  boxShadow: isShaking
                    ? '0 0 25px rgba(239, 68, 68, 0.85), 0 5px 15px rgba(239, 68, 68, 0.45)'
                    : isCardValid 
                      ? '0 8px 16px rgba(0,0,0,0.45), 0 2px 5px rgba(0,0,0,0.25)' 
                      : '0 3px 6px rgba(0,0,0,0.25)',
                  filter: isCardValid ? 'none' : 'grayscale(40%) brightness(75%)',
                  pointerEvents: 'auto', // Keep pointerEvents always enabled to handle invalid clicks!
                  transformOrigin: 'center 130%', // Rotate from pivot point below card for natural circular fanning
                }}
              >
                {/* Specular gloss highlight (sharp reflection line simulating glossy card highlight) */}
                <div 
                  className="absolute inset-0 pointer-events-none z-20 rounded-2xl" 
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.06) 100%)'
                  }}
                />
                
                {/* Outer physical cardstock rim shadow for edge shading */}
                <div className="absolute inset-0 rounded-2xl border border-black/35 pointer-events-none z-20" />
                {/* Inner physical cardstock highlight rim */}
                <div className="absolute inset-[2.5px] rounded-xl border border-white/10 pointer-events-none z-20" />

                {/* Top-Left Corner Index (Scaled down) */}
                <div className="w-full flex justify-start text-[12px] font-black text-white leading-none relative z-10">
                  <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{valueLabel}</span>
                </div>

                {/* Diagonal Oval Accent & Center Symbol */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div 
                    className="absolute w-[72px] h-[88px] rounded-full rotate-[-28deg] border border-white/5"
                    style={{
                      background: isWild 
                        ? 'radial-gradient(circle, #334155 40%, #0f172a 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 100%)',
                    }}
                  />

                  {/* Wild Color Wheel */}
                  {isWild && (
                    <div className="absolute w-[54px] h-[54px] rounded-full rotate-45 overflow-hidden flex flex-wrap border border-white/10">
                      <div className="w-1/2 h-1/2 bg-[#ef4444]" />
                      <div className="w-1/2 h-1/2 bg-[#3b82f6]" />
                      <div className="w-1/2 h-1/2 bg-[#eab308]" />
                      <div className="w-1/2 h-1/2 bg-[#10b981]" />
                    </div>
                  )}

                  <span className={`text-3xl font-black text-white relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] leading-none ${
                    card.value === 'wild_draw_four' ? 'text-xl' : ''
                  }`}>
                    {valueLabel}
                  </span>
                </div>

                {/* Bottom-Right Corner Index (Inverted) */}
                <div className="w-full flex justify-end text-[12px] font-black text-white leading-none relative z-10 rotate-180">
                  <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{valueLabel}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default PlayerHand;
