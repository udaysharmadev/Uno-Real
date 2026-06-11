'use client';

import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { Player } from '../../types/game';
import { Avatar } from './Avatar';
import { UserPlus } from 'lucide-react';
import * as THREE from 'three';

interface PlayerSeatProps {
  seatNumber: number;
  player: Player | null;
  isLocal: boolean;
  position: [number, number, number];
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  seatNumber,
  player,
  isLocal,
  position,
}) => {
  const [hovered, setHovered] = useState(false);

  // Invite link copy handler on clicking empty seats
  const handleInvite = () => {
    if (player) return;
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    alert('Lobby invite link copied to clipboard!');
  };

  return (
    <group position={position}>
      {/* 1. Subtle 3D table glow marker (Felt decal) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.26, 0.29, 32]} />
        <meshBasicMaterial
          color={player ? (isLocal ? '#3b82f6' : '#8b5cf6') : '#475569'}
          transparent
          opacity={player ? 0.4 : 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Flat pixel-perfect 2D overlay projected at the 3D position */}
      <Html
        transform={false} // Disable 3D tilt/warping, keeping text/images crisp and readable
        center
        style={{ pointerEvents: 'auto' }}
      >
        <div 
          onClick={handleInvite}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`flex flex-col items-center justify-center transition-all duration-300 select-none cursor-pointer ${
            hovered ? 'scale-105' : 'scale-100'
          }`}
        >
          {player ? (
            // Occupied Seat UI: Premium Avatar + Name Capsule
            <div className="flex flex-col items-center">
              {/* Profile Avatar (Self-contained sizing, gradients and crown) */}
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
      </Html>
    </group>
  );
};
export default PlayerSeat;
