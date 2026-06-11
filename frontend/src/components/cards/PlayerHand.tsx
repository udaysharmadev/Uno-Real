'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { getCardColorHex, getCardValueLabel } from '../../lib/cards/cardEngine';

export const PlayerHand: React.FC = () => {
  const { 
    player, 
    playerCards, 
    selectedCardId, 
    setSelectedCardId 
  } = useGameStore();

  const localSeatNumber = player?.seatNumber || 1;
  const myCards = playerCards[localSeatNumber] || [];
  const N = myCards.length;

  // Compute rotation and translation offsets for the large 2.5D HTML Fan
  const getFanStyles = (index: number) => {
    if (N <= 1) return { rot: 0, tx: 0, ty: 0 };
    
    // Spread angle depending on card count (max 24 degrees spread total)
    const angleSpread = Math.min(3.5, 24 / N);
    const offset = index - (N - 1) / 2;
    
    const rot = offset * angleSpread;
    
    // Arch depth: side cards drop down
    const ty = Math.abs(offset) * Math.min(4.5, 15 / N);
    
    // Overlapping X shift (broader spacing for larger cards)
    const tx = offset * Math.min(-20, -180 / N); 

    return { rot, tx, ty };
  };

  const handleCardClick = (cardId: string) => {
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
                whileHover={{ 
                  y: -36, // Deeper hover lift
                  rotate: 0,
                  scale: 1.12, // Larger scale up
                  zIndex: 100,
                  transition: { type: 'spring', stiffness: 450, damping: 20 }
                }}
                onClick={() => handleCardClick(card.id)}
                className="absolute w-[130px] h-[195px] rounded-2xl p-4 cursor-pointer flex flex-col justify-between items-center transition-shadow duration-300 border border-white/25 origin-bottom shrink-0 shadow-[0_6px_15px_rgba(0,0,0,0.5)]"
                style={{
                  backgroundColor: cardBg,
                  borderColor: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.25)',
                  boxShadow: isSelected 
                    ? '0 0 24px rgba(59,130,246,0.9), 0 8px 20px rgba(0,0,0,0.6)' 
                    : '0 6px 15px rgba(0,0,0,0.4)',
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
