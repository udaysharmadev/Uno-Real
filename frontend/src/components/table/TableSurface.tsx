'use client';

import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const TableSurface: React.FC = () => {
  const { gameStatus } = useGameStore();
  const isEnded = gameStatus === 'ended';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      
      {/* 1. Large Wood Bezel Oval Table */}
      <div 
        className="w-[86%] h-[72%] rounded-[50%] bg-gradient-to-br from-[#3e1e0f] via-[#1a0b04] to-[#2e150a] flex items-center justify-center relative"
        style={{
          boxShadow: `
            0 35px 85px rgba(0,0,0,0.95), 
            inset 0 6px 16px rgba(255,255,255,0.08),
            0 2px 4px rgba(255,255,255,0.2)
          `,
        }}
      >
        {/* 2. Gold Border Trim Line (sits at wood inner edge) */}
        <div className="absolute inset-[13px] rounded-[50%] border-2 border-amber-600/60 pointer-events-none shadow-[inset_0_0_12px_rgba(217,119,6,0.35)] z-10" />

        {/* 3. Outer Edge Chrome Rim Accent */}
        <div className="absolute inset-[15px] rounded-[50%] border border-slate-700/40 pointer-events-none z-10" />

        {/* 4. Dark Blue Felt Surface with Radial Gradient */}
        <div 
          className="absolute inset-[16px] rounded-[50%] overflow-hidden transition-all duration-700"
          style={{
            background: 'radial-gradient(circle at center, #0f244c 0%, #07122a 65%, #020612 100%)'
          }}
        >
          {/* Subtle Felt Fabric Texture Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.09] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '7px 7px'
            }}
          />

          {/* Soft neon blue felt inner border glow line */}
          <div className="absolute inset-8 rounded-[50%] border border-blue-500/10 shadow-[inset_0_0_45px_rgba(59,130,246,0.2)] pointer-events-none" />

          {/* Center Table Vignette shadow */}
          <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] pointer-events-none" />

          {/* Dimmer overlay for Game Over Spotlight Focus */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none z-10 ${
              isEnded ? 'opacity-70' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default TableSurface;
