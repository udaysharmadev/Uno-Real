'use client';

import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const TableSurface: React.FC = () => {
  const { gameStatus, tableTheme, room, playerCards, discardPile, wildColor, direction } = useGameStore();
  const isEnded = gameStatus === 'ended';

  const topCard = discardPile[discardPile.length - 1] || null;
  const activeColor = topCard ? (topCard.color === 'wild' ? wildColor : topCard.color) : null;

  // Calculate the lowest card count in an active game to communicate match tension
  const getMinCards = () => {
    if (!room || gameStatus !== 'playing') return 99;
    const activeCounts = room.players.map((p) => playerCards[p.seatNumber]?.length || 0);
    return activeCounts.length > 0 ? Math.min(...activeCounts) : 99;
  };
  const minCards = getMinCards();

  // Define Theme Visual Specs
  const themeSpecs = {
    'classic-green': {
      gradient: 'radial-gradient(circle at center, #1b5e3a 0%, #0c331e 60%, #03140a 100%)',
      borderGlow: 'shadow-[inset_0_0_45px_rgba(16,185,129,0.22)]',
      trimBorder: 'border-emerald-600/40 shadow-[inset_0_0_12px_rgba(16,185,129,0.3)]',
      accentColor: 'border-emerald-500/20'
    },
    'premium-blue': {
      gradient: 'radial-gradient(circle at center, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
      borderGlow: 'shadow-[inset_0_0_45px_rgba(59,130,246,0.22)]',
      trimBorder: 'border-amber-600/60 shadow-[inset_0_0_12px_rgba(217,119,6,0.35)]',
      accentColor: 'border-blue-500/10'
    },
    'dark-night': {
      gradient: 'radial-gradient(circle at center, #312e81 0%, #111827 60%, #030712 100%)',
      borderGlow: 'shadow-[inset_0_0_45px_rgba(139,92,246,0.22)]',
      trimBorder: 'border-purple-600/50 shadow-[inset_0_0_12px_rgba(139,92,246,0.3)]',
      accentColor: 'border-purple-500/15'
    }
  };

  const specs = themeSpecs[tableTheme || 'premium-blue'];

  // Dynamic border color based on the current active gameplay color
  const getActiveBorderColor = () => {
    if (gameStatus !== 'playing' || !activeColor) return null;
    switch (activeColor) {
      case 'red': return 'rgba(239, 68, 68, 0.45)';
      case 'blue': return 'rgba(59, 130, 246, 0.45)';
      case 'green': return 'rgba(16, 185, 129, 0.45)';
      case 'yellow': return 'rgba(234, 179, 8, 0.45)';
      default: return null;
    }
  };
  const activeBorderColor = getActiveBorderColor();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <style>{`
        @keyframes felt-breathing {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.65; }
        }
        .animate-felt-breathing {
          animation: felt-breathing 8s ease-in-out infinite;
        }
      `}</style>
      
      {/* 1. Wood Side Wall Thickness (Bezel Shadow Layer for 3D depth) */}
      <div 
        className="absolute w-[72%] h-[54%] rounded-[50%] bg-[#150904] translate-y-[10px] pointer-events-none"
        style={{
          boxShadow: `
            0 45px 95px rgba(0,0,0,0.98),
            0 10px 20px rgba(0,0,0,0.8)
          `
        }}
      />

      {/* 2. Main Large Wood Bezel Oval Table */}
      <div 
        className="w-[72%] h-[54%] rounded-[50%] bg-gradient-to-br from-[#3e1e0f] via-[#1a0b04] to-[#2e150a] flex items-center justify-center relative"
        style={{
          boxShadow: `
            inset 0 6px 16px rgba(255,255,255,0.08),
            0 2px 4px rgba(255,255,255,0.2)
          `,
        }}
      >
        {/* 3. Custom Border Trim Line (sits at wood inner edge) */}
        <div className={`absolute inset-[13px] rounded-[50%] border-2 pointer-events-none z-10 transition-all duration-750 ${specs.trimBorder}`} />

        {/* 4. Outer Edge Chrome Rim Accent */}
        <div className="absolute inset-[15px] rounded-[50%] border border-slate-700/40 pointer-events-none z-10" />

        {/* 5. Dynamic Felt Surface with Radial Gradient */}
        <div 
          className="absolute inset-[16px] rounded-[50%] overflow-hidden transition-all duration-750"
          style={{
            background: specs.gradient
          }}
        >
          {/* Premium Felt Fabric Dual Texture Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.14] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(255,255,255,0.85) 1px, transparent 0),
                radial-gradient(circle at 2px 2px, rgba(0,0,0,0.6) 1px, transparent 0)
              `,
              backgroundSize: '5px 5px, 10px 10px'
            }}
          />

          {/* Warm center spotlight overlay */}
          <div 
            className="absolute inset-0 pointer-events-none z-0 mix-blend-color-dodge animate-felt-breathing"
            style={{
              background: 'radial-gradient(circle at center, rgba(253, 230, 138, 0.18) 0%, rgba(253, 230, 138, 0.02) 45%, transparent 70%)'
            }}
          />

          {/* Central Turn Direction Indicator (Felt Graphic) */}
          {gameStatus === 'playing' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 z-0">
              <svg 
                className={`w-36 h-36 ${
                  direction === 'clockwise' ? 'animate-[spin_20s_linear_infinite]' : 'animate-[spin_20s_linear_infinite_reverse]'
                }`}
                viewBox="0 0 100 100"
              >
                <path 
                  d="M 50,15 A 35,35 0 0,1 85,50 M 85,50 L 89,42 M 85,50 L 77,46" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.6)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
                <path 
                  d="M 50,85 A 35,35 0 0,1 15,50 M 15,50 L 11,58 M 15,50 L 23,54" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.6)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
              </svg>
            </div>
          )}

          {/* Soft theme-based felt inner border glow line, tinted with active card color when playing */}
          <div 
            className={`absolute inset-8 rounded-[50%] border pointer-events-none transition-all duration-750 ${
              activeBorderColor ? '' : `${specs.accentColor} ${specs.borderGlow}`
            }`} 
            style={activeBorderColor ? {
              borderColor: activeBorderColor,
              boxShadow: `inset 0 0 45px ${activeBorderColor.replace('0.45', '0.22')}`
            } : {}}
          />

          {/* Center Table Vignette shadow */}
          <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] pointer-events-none" />

          {/* Low Card Tension Edge Vignette Overlay (Danger Glows) */}
          <div 
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none z-10 ${
              minCards === 1 
                ? 'opacity-75 border-4 border-red-600/30 shadow-[inset_0_0_65px_rgba(220,38,38,0.7)] animate-pulse'
                : minCards === 2
                  ? 'opacity-60 border-4 border-amber-600/20 shadow-[inset_0_0_50px_rgba(245,158,11,0.55)] animate-pulse'
                  : minCards === 3
                    ? 'opacity-40 border-4 border-yellow-500/10 shadow-[inset_0_0_35px_rgba(234,179,8,0.35)] animate-pulse'
                    : 'opacity-0'
            }`}
          />

          {/* Dimmer overlay for Game Over Spotlight Focus */}
          <div 
            className={`absolute inset-0 bg-black/70 transition-opacity duration-1000 pointer-events-none z-10 ${
              isEnded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default TableSurface;
