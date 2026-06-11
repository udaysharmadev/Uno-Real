'use client';

import React from 'react';
import { CardColor, CardValue, getCardColorHex, getCardValueLabel } from '../../lib/cards/cardEngine';
import { CardBack } from './CardBack';

interface UnoCardProps {
  color: CardColor;
  value: CardValue;
  isFaceUp?: boolean;
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const UnoCard: React.FC<UnoCardProps> = ({
  color,
  value,
  isFaceUp = true,
  isSelected = false,
  className = '',
  style = {},
  onClick,
}) => {
  const isWild = color === 'wild';
  const bgHex = getCardColorHex(color);
  const valueLabel = getCardValueLabel(value);

  if (!isFaceUp) {
    return (
      <div 
        onClick={onClick} 
        className={`relative shrink-0 select-none cursor-pointer ${className}`}
        style={style}
      >
        <CardBack />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`w-[124px] h-[184px] rounded-2xl p-2.5 flex flex-col justify-between items-center relative overflow-hidden select-none cursor-pointer shrink-0 transition-all duration-300 ${className}`}
      style={{
        backgroundColor: bgHex,
        boxShadow: isSelected 
          ? '0 20px 35px rgba(0,0,0,0.75), 0 5px 15px rgba(0,0,0,0.45)' 
          : '0 10px 20px rgba(0,0,0,0.5), 0 3px 6px rgba(0,0,0,0.3)',
        border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)',
        ...style,
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
      <div className="absolute inset-[3px] rounded-xl border border-white/12 pointer-events-none z-20" />

      {/* Top-Left Corner Index */}
      <div className="w-full flex justify-start text-[14px] font-black text-white leading-none relative z-10">
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{valueLabel}</span>
      </div>

      {/* Center Symbol Area */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Central Diagonal Contrast Oval */}
        <div 
          className="absolute w-[86px] h-[106px] rounded-full rotate-[-28deg] border border-white/10"
          style={{
            background: isWild 
              ? 'radial-gradient(circle, #334155 40%, #0f172a 100%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 100%)',
          }}
        />

        {/* Wild Multi-color Wheel */}
        {isWild && (
          <div className="absolute w-[70px] h-[70px] rounded-full rotate-45 overflow-hidden flex flex-wrap border border-white/25">
            <div className="w-1/2 h-1/2 bg-[#ef4444]" />
            <div className="w-1/2 h-1/2 bg-[#3b82f6]" />
            <div className="w-1/2 h-1/2 bg-[#eab308]" />
            <div className="w-1/2 h-1/2 bg-[#10b981]" />
          </div>
        )}

        {/* Large Center Symbol */}
        <span 
          className={`text-4xl font-extrabold tracking-tighter text-white relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${
            value === 'wild_draw_four' ? 'text-2xl' : ''
          }`}
        >
          {valueLabel}
        </span>
      </div>

      {/* Bottom-Right Corner Index (Inverted) */}
      <div className="w-full flex justify-end text-[14px] font-black text-white leading-none relative z-10 rotate-180">
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{valueLabel}</span>
      </div>
    </div>
  );
};

export default UnoCard;

