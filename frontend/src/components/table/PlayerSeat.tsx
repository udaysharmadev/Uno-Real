'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Player } from '../../types/game';
import { Avatar } from './Avatar';
import { UserPlus } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

interface PlayerSeatProps {
  seatNumber: number;
  player: Player | null;
  isLocal: boolean;
  coords: { left: string; top: string; rotation: number };
  cardCount: number;
  isActiveTurn?: boolean;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  seatNumber,
  player,
  isLocal,
  coords,
  cardCount = 0,
  isActiveTurn = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const { unoCalled } = useGameStore();

  const hasCalledUno = player ? !!unoCalled[player.id] : false;
  // UNO Moment triggers when a player has exactly 1 card left and has declared UNO
  const isUnoMoment = player && cardCount === 1 && hasCalledUno;

  // Invite link copy handler on clicking empty seats
  const handleInvite = () => {
    if (player) return;
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    alert('Lobby invite link copied to clipboard!');
  };

  // Position the opponent card counts so they always point toward the table felt center
  const getOpponentCardsOffsetClass = () => {
    const leftPct = parseFloat(coords.left);
    const topPct = parseFloat(coords.top);
    if (leftPct > 70) return 'right-full mr-3.5 top-1/2 -translate-y-1/2';
    if (leftPct < 30) return 'left-full ml-3.5 top-1/2 -translate-y-1/2';
    if (topPct < 40) return 'top-full mt-3 left-1/2 -translate-x-1/2';
    return 'top-full mt-3 left-1/2 -translate-x-1/2';
  };

  // Low Card Tension Config
  const getTensionConfig = () => {
    if (cardCount === 1) {
      return {
        glowClass: 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse',
        badgeClass: 'bg-red-950/90 border-red-500/60 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
        badgeText: 'UNO!',
        countColor: 'text-red-400'
      };
    }
    if (cardCount === 2) {
      return {
        glowClass: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse',
        badgeClass: 'bg-amber-950/90 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
        badgeText: 'DANGER',
        countColor: 'text-amber-400'
      };
    }
    if (cardCount === 3) {
      return {
        glowClass: 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]',
        badgeClass: 'bg-yellow-950/90 border-yellow-500/40 text-yellow-300 shadow-[0_0_6px_rgba(234,179,8,0.2)]',
        badgeText: 'WARNING',
        countColor: 'text-yellow-400'
      };
    }
    return {
      glowClass: '',
      badgeClass: isLocal ? 'bg-blue-950/85 border-blue-500/40 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.2)]' : 'bg-slate-900/90 border-slate-800 text-slate-200 shadow-md',
      badgeText: null,
      countColor: 'text-blue-400'
    };
  };

  const tension = getTensionConfig();

  // Spotlight rotation towards center (50%, 50%)
  const getSpotlightStyle = (): React.CSSProperties => {
    const leftPct = parseFloat(coords.left);
    const topPct = parseFloat(coords.top);
    const dx = 50 - leftPct;
    const dy = 50 - topPct;
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    
    return {
      transform: `translateY(-50%) rotate(${angleDeg}deg)`,
      transformOrigin: '0% 50%',
      // A nice conical spotlight fading out, matching the green turn ring
      background: 'conic-gradient(from -20deg at 0% 50%, rgba(16, 185, 129, 0.16) 0deg, rgba(16, 185, 129, 0.03) 20deg, transparent 40deg)',
      width: '280px',
      height: '140px',
    };
  };

  return (
    <motion.div 
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.7, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
      style={{
        left: coords.left,
        top: coords.top,
      }}
    >
      {/* Active Turn Spotlight Beam projecting towards center */}
      {player && isActiveTurn && (
        <div 
          className="absolute top-1/2 left-1/2 pointer-events-none -z-30 mix-blend-screen opacity-90 animate-pulse"
          style={getSpotlightStyle()}
        />
      )}

      <div 
        onClick={handleInvite}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative flex flex-col items-center justify-center transition-all duration-300 select-none cursor-pointer ${
          isUnoMoment ? 'animate-pulse scale-105' : hovered ? 'scale-105' : 'scale-100'
        }`}
      >
        {/* Pulsing Red Hot Seat Glow for UNO Moment */}
        {player && isUnoMoment && (
          <div className="absolute inset-[-8px] rounded-full border-2 border-red-500 animate-ping shadow-[0_0_25px_rgba(239,68,68,0.8)] z-0 pointer-events-none" />
        )}

        {/* Premium Active Player Turn focus rings */}
        {player && isActiveTurn && (
          <>
            <div className="absolute inset-[-10px] rounded-full border-2 border-dashed border-emerald-400/60 animate-[spin_16s_linear_infinite] z-0 pointer-events-none" />
            <div className="absolute inset-[-6px] rounded-full border-2 border-emerald-500/50 animate-pulse shadow-[0_0_25px_rgba(16,185,129,0.6),_inset_0_0_10px_rgba(16,185,129,0.3)] z-0 pointer-events-none" />
          </>
        )}

        {/* Low Card Tension Warning Badges (WARNING, DANGER, UNO!) */}
        {player && tension.badgeText && (
          <div className={`absolute -top-7 px-2.5 py-0.5 rounded-full font-black text-[7px] tracking-widest uppercase animate-bounce z-20 border transition-all ${tension.badgeClass}`}>
            {tension.badgeText}
          </div>
        )}

        {player ? (
          // Occupied Seat UI: Premium Avatar + Name Capsule
          <div className="flex flex-col items-center relative z-10">
            {/* Anchoring floor shadow */}
            <div className="absolute w-[44px] h-[6px] rounded-full bg-black/60 blur-[2.5px] translate-y-[21px] z-0 pointer-events-none" />

            {/* Profile Avatar inside relative wrapper with Chair silhouette */}
            <div className="relative flex items-center justify-center">
              {/* Chair silhouette backrest panel */}
              <div className="absolute w-[46px] h-[46px] rounded-full bg-[#181d28] border border-[#2d3748] -z-10 translate-y-[-2px] shadow-[0_4px_8px_rgba(0,0,0,0.5)] opacity-85 pointer-events-none" />
              
              <motion.div
                whileHover={{ scale: 1.08 }}
                animate={cardCount > 0 && cardCount <= 3 ? {
                  scale: [1, 1.08, 1, 1.08, 1],
                } : { scale: 1 }}
                transition={cardCount > 0 && cardCount <= 3 ? {
                  duration: cardCount === 1 ? 0.7 : cardCount === 2 ? 1.1 : 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : { type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Avatar 
                  name={player.name} 
                  isHost={player.isHost} 
                  isLocal={isLocal} 
                  size="md" 
                />
              </motion.div>
            </div>
            
            {/* Username Capsule Tag */}
            <div className={`mt-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md transition-all flex items-center justify-center ${
              tension.badgeClass
            }`}>
              <span className="text-[10px] font-bold tracking-wide text-white leading-none truncate max-w-[75px]">
                {player.name}
              </span>
            </div>

            {/* Opponent Card Stack visualization next to avatar */}
            {!isLocal && cardCount > 0 && (
              <div className={`absolute ${getOpponentCardsOffsetClass()} flex flex-col items-center z-10 pointer-events-none`}>
                {/* Visual dynamic fanned card backs */}
                <div className="flex mb-1.5 justify-center items-end h-[48px]">
                  {Array.from({ length: cardCount }).map((_, idx) => {
                    const rot = cardCount <= 1 ? 0 : (idx - (cardCount - 1) / 2) * Math.min(10, 40 / cardCount);
                    const ty = cardCount <= 1 ? 0 : Math.pow(idx - (cardCount - 1) / 2, 2) * Math.min(1.5, 5 / cardCount);
                    return (
                      <div 
                        key={`cardback-${idx}`}
                        className="w-[22px] h-[32px] bg-slate-950 rounded-sm border border-slate-700/80 shadow-md relative overflow-hidden shrink-0 transition-all duration-300"
                        style={{
                          transform: `rotate(${rot}deg) translateY(${ty}px)`,
                          background: 'linear-gradient(135deg, #1e1b4b 0%, #030712 100%)',
                          marginRight: idx < cardCount - 1 ? '-14px' : '0px',
                          zIndex: idx,
                        }}
                      >
                        {/* Mini card-back borders */}
                        <div className="absolute inset-0.5 rounded-[2px] border border-blue-500/10 pointer-events-none" />
                        <div className="absolute inset-0.5 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                      </div>
                    );
                  })}
                </div>
                
                {/* Dynamic Card Count Badge with smooth number scale pops */}
                <div className={`px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 border backdrop-blur-sm transition-all duration-300 ${
                  cardCount === 1 
                    ? 'bg-red-950/90 border-red-500/40 shadow-red-500/15' 
                    : cardCount === 2
                      ? 'bg-amber-950/90 border-amber-500/40 shadow-amber-500/15'
                      : 'bg-slate-950/90 border-slate-800/85 shadow-md'
                }`}>
                  <span className="text-[10px] select-none text-slate-400">🂠</span>
                  <motion.span 
                    key={cardCount}
                    initial={{ scale: 0.7, opacity: 0.6 }}
                    animate={{ scale: [0.7, 1.25, 1], opacity: 1 }}
                    transition={{
                      scale: { duration: 0.35, ease: 'easeOut' },
                      opacity: { duration: 0.2 }
                    }}
                    className={`text-[9px] font-extrabold ${tension.countColor}`}
                  >
                    x{cardCount}
                  </motion.span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Empty Seat UI: Dashed Ring + Subtle Glow + Invite Label
          <div className="flex flex-col items-center z-10">
            <div className={`w-10 h-10 rounded-full border border-dashed flex items-center justify-center bg-slate-950/70 backdrop-blur-sm transition-all duration-300 ${
              hovered
                ? 'border-emerald-500/80 bg-emerald-950/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                : 'border-slate-800 text-slate-600'
            }`}>
              <UserPlus size={12} className={hovered ? 'animate-pulse' : ''} />
            </div>
            <span className={`text-[8px] font-extrabold uppercase tracking-widest mt-1 px-1.5 py-0.5 rounded-full border transition-all duration-300 ${
              hovered
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950/50 border-slate-900 text-slate-500'
            }`}>
              Invite
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerSeat;
