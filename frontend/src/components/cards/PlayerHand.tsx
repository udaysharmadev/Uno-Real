'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { getCardColorHex, getCardValueLabel, CardItem } from '../../lib/cards/cardEngine';
import { Sparkles } from 'lucide-react';

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

  // Compute rotation and translation offsets for the 2.5D HTML Fan
  const getFanStyles = (index: number) => {
    if (N <= 1) return { rot: 0, tx: 0, ty: 0 };
    
    // Spread angle depending on card count (max 28 degrees spread)
    const angleSpread = Math.min(5, 28 / N);
    const offset = index - (N - 1) / 2;
    
    const rot = offset * angleSpread;
    
    // Arch depth: side cards drop down
    const ty = Math.abs(offset) * Math.min(3.5, 12 / N);
    
    // Overlapping X shift
    const tx = offset * -2; 

    return { rot, tx, ty };
  };

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-end pb-1.5 relative select-none">
      
      {/* Cards Fan Container */}
      <div className="flex justify-center items-end relative h-32 w-full max-w-xl px-8 mt-1">
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
                initial={{ opacity: 0, y: 80, scale: 0.8, rotate: 0 }}
                animate={{ 
                  opacity: 1, 
                  y: isSelected ? -16 + ty : ty, // Lift if selected
                  x: tx,
                  rotate: isSelected ? 0 : rot, // Straighten if selected
                  scale: isSelected ? 1.05 : 1,
                  zIndex: isSelected ? 30 : idx + 5
                }}
                exit={{ opacity: 0, y: -60, scale: 0.8, rotate: 0 }}
                whileHover={{ 
                  y: -24, 
                  rotate: 0,
                  scale: 1.1,
                  zIndex: 50,
                  transition: { type: 'spring', stiffness: 450, damping: 22 }
                }}
                onClick={() => handleCardClick(card.id)}
                className="absolute w-[86px] h-[132px] rounded-xl p-2 cursor-pointer flex flex-col justify-between items-center transition-shadow duration-300 border origin-bottom shrink-0 shadow-lg"
                style={{
                  backgroundColor: cardBg,
                  borderColor: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.25)',
                  boxShadow: isSelected 
                    ? '0 0 16px rgba(59,130,246,0.8), 0 4px 12px rgba(0,0,0,0.6)' 
                    : '0 4px 10px rgba(0,0,0,0.4)',
                }}
              >
                {/* Specular Gloss Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-65 rounded-xl pointer-events-none" />
                
                {/* Rounded Inner Card Bezel */}
                <div className="absolute inset-1 rounded-[10px] border border-white/10 pointer-events-none" />

                {/* Top-Left Corner Index */}
                <div className="w-full flex justify-start text-[11px] font-black text-white leading-none relative z-10">
                  <span>{valueLabel}</span>
                </div>

                {/* Diagonal Oval Accent & Center Symbol */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div 
                    className="absolute w-[92%] h-[92%] rounded-full rotate-[-25deg] border border-white/5"
                    style={{
                      background: isWild 
                        ? 'radial-gradient(circle, #334155 40%, #0f172a 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)',
                    }}
                  />

                  {/* Wild Color Wheel */}
                  {isWild && (
                    <div className="absolute w-12 h-12 rounded-full rotate-45 overflow-hidden flex flex-wrap border border-white/10">
                      <div className="w-1/2 h-1/2 bg-[#ef4444]" />
                      <div className="w-1/2 h-1/2 bg-[#3b82f6]" />
                      <div className="w-1/2 h-1/2 bg-[#eab308]" />
                      <div className="w-1/2 h-1/2 bg-[#10b981]" />
                    </div>
                  )}

                  <span className={`text-2xl font-extrabold text-white relative z-10 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)] ${
                    card.value === 'wild_draw_four' ? 'text-lg' : ''
                  }`}>
                    {valueLabel}
                  </span>
                </div>

                {/* Bottom-Right Corner Index (Inverted) */}
                <div className="w-full flex justify-end text-[11px] font-black text-white leading-none relative z-10 rotate-180">
                  <span>{valueLabel}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {myCards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1.5 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Your Hand is Empty</span>
            <span className="text-[9px] font-medium">(Click the "Deal Demo Hand" button on the right to deal!)</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default PlayerHand;
