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

  // Compute rotation and translation offsets for the large 2.5D HTML Fan
  const getFanStyles = (index: number) => {
    if (N <= 1) return { rot: 0, tx: 0, ty: 0 };
    
    // Dynamic spread angle depending on card count N
    const maxSpread = Math.min(45, N * 4.5); // spread up to 45 degrees max
    const angleSpread = maxSpread / (N - 1);
    const offset = index - (N - 1) / 2;
    
    const rot = offset * angleSpread;
    
    // Parabolic vertical arch drop-down curve (y = a * x^2)
    const archDepth = Math.min(3.5, 30 / N); // drop factor
    const ty = Math.pow(offset, 2) * archDepth;
    
    // Dynamic overlapping horizontal spread (cards contract closer together as N increases)
    const cardWidth = 130;
    const spaceFactor = Math.max(0.12, Math.min(0.65, 5 / N)); // percentage of card width
    const tx = offset * (cardWidth * spaceFactor);

    return { rot, tx, ty };
  };

  const handleCardClick = (cardId: string) => {
    if (isProcessing || !isMyTurn || isSpectator) return;
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-end pb-3 relative select-none">
      
      {/* Expanded Cards Fan Container (Higher height to fit 195px cards and hover lifts) */}
      <div className="flex justify-center items-end relative h-48 w-full max-w-2xl px-12 mt-2">
        <AnimatePresence>
          {myCards.map((card, idx) => {
            const isSelected = selectedCardId === card.id;
            const { rot, tx, ty } = getFanStyles(idx);
            const isWild = card.color === 'wild';
            const cardBg = getCardColorHex(card.color);
            const valueLabel = getCardValueLabel(card.value);
            
            // AUTHORITATIVE MOVE VALIDATION HIGHLIGHTING
            // Card is valid only if it's our turn, we aren't spectating, the game is active, and it matches the discard
            const isCardValid = isMyTurn && !isSpectator && gameStatus === 'playing' && isValidMove(card, topDiscard, wildColor);

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 120, scale: 0.8, rotate: 0 }}
                animate={{ 
                  opacity: 1, 
                  y: isSelected ? -28 + ty : ty, // Lift cards significantly if selected
                  x: tx,
                  rotate: isSelected ? 0 : rot, 
                  scale: isSelected ? 1.05 : 1,
                  zIndex: isSelected ? 40 : idx + 10
                }}
                exit={{ opacity: 0, y: -80, scale: 0.8, rotate: 0 }}
                whileHover={isProcessing || !isCardValid ? {} : { 
                  y: -36, // Deeper hover lift
                  rotate: 0,
                  scale: 1.12, // Larger scale up
                  zIndex: 100,
                  transition: { type: 'spring', stiffness: 450, damping: 20 }
                }}
                onClick={() => handleCardClick(card.id)}
                className={`absolute w-[130px] h-[195px] rounded-2xl p-4 flex flex-col justify-between items-center transition-all duration-300 border origin-bottom shrink-0 ${
                  isProcessing 
                    ? 'cursor-not-allowed' 
                    : isCardValid 
                      ? 'cursor-pointer shadow-[0_6px_15px_rgba(0,0,0,0.5)] border-white/25' 
                      : 'cursor-not-allowed border-white/10'
                }`}
                style={{
                  backgroundColor: cardBg,
                  borderColor: isSelected ? '#3b82f6' : undefined,
                  boxShadow: isSelected 
                    ? '0 0 24px rgba(59,130,246,0.9), 0 8px 20px rgba(0,0,0,0.6)' 
                    : undefined,
                  opacity: isCardValid ? 1.0 : 0.40,
                  filter: isCardValid ? 'none' : 'grayscale(40%) brightness(75%)',
                  pointerEvents: isCardValid && !isProcessing ? 'auto' : 'none'
                }}
              >
                {/* Specular Gloss Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-65 rounded-2xl pointer-events-none" />
                
                {/* Rounded Inner Card Bezel */}
                <div className="absolute inset-1.5 rounded-[10px] border border-white/10 pointer-events-none" />

                {/* Top-Left Corner Index (Larger size) */}
                <div className="w-full flex justify-start text-[16px] font-black text-white leading-none relative z-10">
                  <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{valueLabel}</span>
                </div>

                {/* Diagonal Oval Accent & Center Symbol */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div 
                    className="absolute w-[100px] h-[120px] rounded-full rotate-[-28deg] border border-white/5"
                    style={{
                      background: isWild 
                        ? 'radial-gradient(circle, #334155 40%, #0f172a 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 100%)',
                    }}
                  />

                  {/* Wild Color Wheel */}
                  {isWild && (
                    <div className="absolute w-[75px] h-[75px] rounded-full rotate-45 overflow-hidden flex flex-wrap border border-white/10">
                      <div className="w-1/2 h-1/2 bg-[#ef4444]" />
                      <div className="w-1/2 h-1/2 bg-[#3b82f6]" />
                      <div className="w-1/2 h-1/2 bg-[#eab308]" />
                      <div className="w-1/2 h-1/2 bg-[#10b981]" />
                    </div>
                  )}

                  <span className={`text-5xl font-black text-white relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] leading-none ${
                    card.value === 'wild_draw_four' ? 'text-3xl' : ''
                  }`}>
                    {valueLabel}
                  </span>
                </div>

                {/* Bottom-Right Corner Index (Inverted) */}
                <div className="w-full flex justify-end text-[16px] font-black text-white leading-none relative z-10 rotate-180">
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
