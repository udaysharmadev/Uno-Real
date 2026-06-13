'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '../../store/useGameStore';

import { PlayerHandHUD } from './PlayerHandHUD';

// Dynamic imports of the Three.js components — SSR disabled for WebGL
const RoomEnvironment = dynamic(
  () => import('./RoomEnvironment').then(mod => ({ default: mod.RoomEnvironment })),
  { ssr: false }
);
const WebGLSeats = dynamic(
  () => import('./WebGLSeats').then(mod => ({ default: mod.WebGLSeats })),
  { ssr: false }
);
const WebGLCards = dynamic(
  () => import('./WebGLCards').then(mod => ({ default: mod.WebGLCards })),
  { ssr: false }
);

export const TableScene: React.FC = () => {
  const { room, player, currentPlayerId, isProcessing, isSpectator } = useGameStore();

  const isMyTurn = currentPlayerId === player?.id && room?.status === 'playing' && !isProcessing;

  // Calculate local player index for POV camera positioning
  const playersList = room?.players || [];
  const numPlayers = Math.max(playersList.length, 2);
  const localIndex = room ? playersList.findIndex(p => p.id === player?.id) : -1;
  const safeLocalIndex = localIndex >= 0 ? localIndex : 0;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* ================================================================= */}
      {/* PURE WEBGL 3D ENVIRONMENT — No HTML overlays                      */}
      {/* ================================================================= */}
      <RoomEnvironment numPlayers={numPlayers} localIndex={safeLocalIndex}>
        <WebGLSeats />
        <WebGLCards />
      </RoomEnvironment>

      {/* HUD LAYER */}
      <PlayerHandHUD />

      {/* Elegant Room Code display */}
      <div className="absolute top-6 left-6 z-50">
        <div className="px-3 py-1 bg-black/40 border border-white/10 rounded backdrop-blur-md text-white/50 font-mono text-xs cursor-copy hover:text-white transition-colors">
          Lobby: {room?.code}
        </div>
      </div>
    </div>
  );
};

export default TableScene;
