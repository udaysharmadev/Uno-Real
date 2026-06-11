'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { getCardColorHex, getCardValueLabel, isValidMove, CardItem } from '../../lib/cards/cardEngine';

export const PlayerHand: React.FC = () => {
  const { 
    player, 
    playerCards, 
    selectedCardId, 
    setSelectedCardId,
    isProcessing,
    discardPile,
    wildColor,
    currentPlayerId,
    gameStatus,
    isSpectator
  } = useGameStore();

  const localSeatNumber = player?.seatNumber || 1;
  const myCards = playerCards[localSeatNumber] || [];
  const N = myCards.length;

  const isMyTurn = currentPlayerId === player?.id && gameStatus === 'playing';
  const topDiscard = discardPile[discardPile.length - 1] || null;

  // Compute rotation and translation offsets for the circular card fan
  const getFanStyles = (index: number) => {
    if (N <= 1) return { rot: 0, tx: 0, ty: 0, scale: 1.0 };
    
    // Geometric circle calculation: Sit cards on a circle of radius 220px
    const offset = index - (N - 1) / 2;
    
    // Contract spacing angle as N increases to keep cards within view bounds
    const angleStep = Math.min(6.5, 36 / (N - 1));
    const rot = offset * angleStep;
    
    const radius = 220; 
    const rad = (rot * Math.PI) / 180;
    const tx = Math.sin(rad) * radius;
    const ty = (1 - Math.cos(rad)) * radius;

    // Responsive scaling: Shrink card sizes dynamically for very large hands (e.g. 7+ cards)
    const scale = N > 7 ? Math.max(0.68, 1.0 - (N - 7) * 0.035) : 1.0;

    return { rot, tx, ty, scale };
  };

  const handleCardClick = (cardId: string) => {
    if (isProcessing || !isMyTurn || isSpectator) return;
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-end pb-1 relative select-none">
      
      {/* Cards Fan Container (Reduced height to fit smaller viewport and cards) */}
      <div className="flex justify-center items-end relative h-36 w-full max-w-2xl px-12 mt-1">
        <AnimatePresence>
          {myCards.map((card, idx) => {
            const isSelected = selectedCardId === card.id;
            const { rot, tx, ty, scale } = getFanStyles(idx);
            const isWild = card.color === 'wild';
            const cardBg = getCardColorHex(card.color);
            const valueLabel = getCardValueLabel(card.value);
            
            // AUTHORITATIVE MOVE VALIDATION HIGHLIGHTING
            const isCardValid = isMyTurn && !isSpectator && gameStatus === 'playing' && isValidMove(card, topDiscard, wildColor);

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 100, scale: 0.8, rotate: 0 }}
                animate={{ 
                  opacity: isCardValid ? 1.0 : 0.40, 
                  y: isSelected ? -20 + ty : ty, // Lift selected card slightly higher (safe bound)
                  x: tx,
                  rotate: isSelected ? 0 : rot, 
                  scale: isSelected ? scale * 1.06 : scale, 
                  zIndex: isSelected ? 40 : idx + 10
                }}
                exit={{ opacity: 0, y: -60, scale: 0.8, rotate: 0 }}
                whileHover={isProcessing || !isCardValid ? {} : { 
                  y: -24, // Deeper hover lift (safe bound)
                  rotate: 0,
                  scale: scale * 1.12, 
                  zIndex: 100,
                  transition: { type: 'spring', stiffness: 450, damping: 20 }
                }}
                onClick={() => handleCardClick(card.id)}
                className={`absolute w-[95px] h-[142px] rounded-2xl p-2.5 flex flex-col justify-between items-center transition-colors duration-300 border origin-bottom shrink-0 ${
                  isProcessing 
                    ? 'cursor-not-allowed' 
                    : isCardValid 
                      ? 'cursor-pointer border-white/20' 
                      : 'cursor-not-allowed border-white/10'
                }`}
                style={{
                  backgroundColor: cardBg,
                  borderColor: isSelected ? '#3b82f6' : undefined,
                  boxShadow: isSelected 
                    ? '0 15px 25px rgba(0,0,0,0.65), 0 3px 10px rgba(0,0,0,0.35)' 
                    : isCardValid 
                      ? '0 8px 16px rgba(0,0,0,0.45), 0 2px 5px rgba(0,0,0,0.25)' 
                      : '0 3px 6px rgba(0,0,0,0.25)',
                  filter: isCardValid ? 'none' : 'grayscale(40%) brightness(75%)',
                  pointerEvents: isCardValid && !isProcessing ? 'auto' : 'none',
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
