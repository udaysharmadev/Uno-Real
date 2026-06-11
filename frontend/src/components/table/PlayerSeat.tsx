'use client';

import React from 'react';
import { Html } from '@react-three/drei';
import { Player } from '../../types/game';
import { User, Shield, UserPlus } from 'lucide-react';

interface PlayerSeatProps {
  position: [number, number, number];
  rotationY: number;
  player: Player | null;
  isLocal: boolean;
  seatNumber: number;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  position,
  rotationY,
  player,
  isLocal,
  seatNumber,
}) => {
  // Determine color theme based on player state
  const getThemeColor = () => {
    if (!player) return 'border-slate-800/40 text-slate-500 bg-slate-900/40';
    if (isLocal) return 'border-blue-500/50 text-blue-200 bg-blue-950/80 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
    return 'border-violet-500/50 text-violet-200 bg-violet-950/80 shadow-[0_0_15px_rgba(139,92,246,0.2)]';
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 3D Seat Pedestal Base */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.12, 32]} />
        <meshStandardMaterial
          color={player ? (isLocal ? '#1e3a8a' : '#4c1d95') : '#1e293b'}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* Glowing Outer Ring on Pedestal */}
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.52, 32]} />
        <meshBasicMaterial
          color={player ? (isLocal ? '#3b82f6' : '#8b5cf6') : '#475569'}
          transparent
          opacity={player ? 0.9 : 0.2}
          side={2}
        />
      </mesh>

      {/* HTML Overlay Panel (Facing screen/camera using billboard-like behavior) */}
      <Html
        position={[0, 0.4, 0]}
        center
        distanceFactor={6} // Scale panel naturally in 3D perspective
        style={{ pointerEvents: 'none' }}
      >
        <div className={`w-36 select-none rounded-xl border p-2.5 backdrop-blur-md transition-all duration-300 flex flex-col items-center justify-center text-center ${getThemeColor()}`}>
          {player ? (
            // Occupied Seat UI
            <div className="w-full flex flex-col items-center">
              {/* Avatar Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 border ${
                isLocal 
                  ? 'bg-blue-500/20 border-blue-400/50' 
                  : 'bg-violet-500/20 border-violet-400/50'
              }`}>
                <User size={18} className={isLocal ? 'text-blue-400' : 'text-violet-400'} />
              </div>

              {/* Display Name */}
              <span className="font-semibold text-sm truncate max-w-full leading-tight text-white mb-0.5">
                {player.name}
              </span>

              {/* Host/Player Tag */}
              <div className="flex items-center gap-1 mt-1">
                {player.isHost && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] uppercase px-1 py-0.5 rounded flex items-center gap-0.5">
                    <Shield size={8} /> Host
                  </span>
                )}
                {isLocal && (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] uppercase px-1 py-0.5 rounded">
                    You
                  </span>
                )}
                {!isLocal && !player.isHost && (
                  <span className="text-[9px] text-slate-400 bg-slate-800/40 px-1 py-0.5 rounded">
                    Player
                  </span>
                )}
              </div>
            </div>
          ) : (
            // Empty Seat UI
            <div className="w-full flex flex-col items-center py-1">
              <div className="w-8 h-8 rounded-full border border-dashed border-slate-700/80 flex items-center justify-center mb-1 bg-slate-950/40">
                <UserPlus size={14} className="text-slate-600" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Seat {seatNumber}
              </span>
              <span className="text-[9px] text-slate-600 font-medium mt-0.5">
                Empty
              </span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
