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

  return (
    <motion.div 
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
      style={{
        left: coords.left,
        top: coords.top,
      }}
    >
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

        {/* Pulsing Active Turn indicator ring */}
        {player && isActiveTurn && !isUnoMoment && (
          <div className="absolute inset-[-6px] rounded-full border-2 border-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)] z-0 pointer-events-none" />
        )}

        {/* Floating UNO! Badge overlay */}
        {isUnoMoment && (
          <div className="absolute -top-6 bg-gradient-to-r from-red-600 to-amber-600 border border-red-400 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.85)] animate-bounce z-20 uppercase tracking-widest leading-none">
            UNO!
          </div>
        )}

        {player ? (
          // Occupied Seat UI: Premium Avatar + Name Capsule
          <div className="flex flex-col items-center relative z-10">
            {/* Profile Avatar */}
            <Avatar 
              name={player.name} 
              isHost={player.isHost} 
              isLocal={isLocal} 
              size="md" 
            />
            
            {/* Username Capsule Tag */}
            <div className={`mt-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md transition-all flex items-center justify-center ${
              isUnoMoment
                ? 'bg-red-950/85 border-red-500/60 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : isActiveTurn
                  ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : isLocal
                    ? 'bg-blue-950/85 border-blue-500/40 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-900/90 border-slate-800 text-slate-200 shadow-md'
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
                {/* Count Badge */}
                <div className={`px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 border backdrop-blur-sm ${
                  isUnoMoment 
                    ? 'bg-red-950/90 border-red-500/30' 
                    : 'bg-slate-950/90 border-slate-800/85'
                }`}>
                  <span className={`text-[9px] font-extrabold ${isUnoMoment ? 'text-red-400' : 'text-blue-400'}`}>
                    {cardCount}
                  </span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">
                    Cards
                  </span>
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
