'use client';

import React, { useState } from 'react';
import { Player } from '../../types/game';
import { Avatar } from './Avatar';
import { UserPlus } from 'lucide-react';

interface PlayerSeatProps {
  seatNumber: number;
  player: Player | null;
  isLocal: boolean;
  coords: { left: string; top: string; rotation: number };
  cardCount: number;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  seatNumber,
  player,
  isLocal,
  coords,
  cardCount = 0,
}) => {
  const [hovered, setHovered] = useState(false);

  // Invite link copy handler on clicking empty seats
  const handleInvite = () => {
    if (player) return;
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    alert('Lobby invite link copied to clipboard!');
  };

  // Position the opponent card counts so they always point toward the table felt center
  const getOpponentCardsOffsetClass = () => {
    if (seatNumber === 2 || seatNumber === 3) return 'right-full mr-3.5 top-1/2 -translate-y-1/2';
    if (seatNumber === 5 || seatNumber === 6) return 'left-full ml-3.5 top-1/2 -translate-y-1/2';
    if (seatNumber === 4) return 'top-full mt-3 left-1/2 -translate-x-1/2';
    return 'hidden';
  };

  return (
    <div 
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
          hovered ? 'scale-105' : 'scale-100'
        }`}
      >
        {player ? (
          // Occupied Seat UI: Premium Avatar + Name Capsule
          <div className="flex flex-col items-center relative">
            {/* Profile Avatar */}
            <Avatar 
              name={player.name} 
              isHost={player.isHost} 
              isLocal={isLocal} 
              size="md" 
            />
            
            {/* Username Capsule Tag */}
            <div className={`mt-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md transition-all flex items-center justify-center ${
              isLocal
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
                {/* Visual stacked card backs */}
                <div className="flex -space-x-3.5 mb-1.5">
                  {Array.from({ length: Math.min(3, cardCount) }).map((_, idx) => (
                    <div 
                      key={`cardback-${idx}`}
                      className="w-[28px] h-[40px] bg-slate-950 rounded-md border border-slate-700/80 shadow-md relative overflow-hidden shrink-0"
                      style={{
                        transform: `rotate(${(idx - 1) * 8}deg) translateY(${Math.abs(idx - 1) * 2}px)`,
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #030712 100%)',
                      }}
                    >
                      {/* Mini card-back borders */}
                      <div className="absolute inset-0.5 rounded-[3px] border border-blue-500/10 pointer-events-none" />
                      <div className="absolute inset-0.5 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                    </div>
                  ))}
                </div>
                {/* Count Badge */}
                <div className="bg-slate-950/90 border border-slate-800/85 px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <span className="text-[9px] font-extrabold text-blue-400">
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
          <div className="flex flex-col items-center">
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
    </div>
  );
};

export default PlayerSeat;

