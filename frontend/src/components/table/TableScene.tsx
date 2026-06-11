'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { TableSurface } from './TableSurface';
import { PlayerSeat } from './PlayerSeat';
import { CameraController } from './CameraController';
import { useGameStore } from '../../store/useGameStore';
import { getSeatCoords } from '../../utils/seating';
import { Inbox, Layers } from 'lucide-react';
import * as THREE from 'three';

export const TableScene: React.FC = () => {
  const { room, player } = useGameStore();

  const localSeatNumber = player?.seatNumber || 1;
  const TOTAL_SEATS = 6;

  // Helper to fetch player seated at seatNumber
  const getPlayerAtSeat = (seatNo: number) => {
    if (!room) return null;
    return room.players.find((p) => p.seatNumber === seatNo) || null;
  };

  // Map players to the 6 fixed visual seat coordinates relative to the local player
  const seats = Array.from({ length: TOTAL_SEATS }).map((_, index) => {
    const seatNumber = index + 1;
    const transform = getSeatCoords(seatNumber, localSeatNumber);
    const occupant = getPlayerAtSeat(seatNumber);
    const isLocal = occupant ? occupant.id === player?.id : false;

    return {
      seatNumber,
      position: transform.position,
      occupant,
      isLocal,
    };
  });

  return (
    <div className="w-full h-full relative">
      {/* High-performance HTML Ambient Vignette Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none z-10" />
      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(3,7,18,0.7)] pointer-events-none z-10" />

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ fov: 30, near: 0.1, far: 20 }} // Narrow FOV (30) for flat isometric tabletop view
        className="w-full h-full"
      >
        <color attach="background" args={['#030712']} />

        {/* Stable Studio Lighting */}
        <ambientLight intensity={0.5} />
        
        {/* Soft overhead light to illuminate table center */}
        <spotLight
          position={[0, 6, 0]}
          angle={0.6}
          penumbra={0.5}
          intensity={1.8}
          castShadow
          color="#bfdbfe"
        />

        <directionalLight position={[2, 4, 3]} intensity={0.6} />

        {/* Rebuilt Table Scene Elements */}
        <group position={[0, -0.4, 0]}>
          {/* Centered Premium Oval Poker-style Table */}
          <TableSurface />

          {/* 6 Fixed Player Seats around table circumference */}
          {seats.map((seat) => (
            <PlayerSeat
              key={seat.seatNumber}
              seatNumber={seat.seatNumber}
              position={seat.position}
              player={seat.occupant}
              isLocal={seat.isLocal}
            />
          ))}

          {/* --- CENTER PLAY AREA PLACEHOLDERS --- */}
          
          {/* Draw Pile Placeholder */}
          <group position={[-0.48, 0.011, 0]}>
            {/* 3D Flat Outline Plate on Felt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
              <planeGeometry args={[0.55, 0.8]} />
              <meshStandardMaterial 
                color="#ef4444" 
                roughness={0.9} 
                transparent 
                opacity={0.15} 
              />
            </mesh>
            {/* Draw border ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
              <ringGeometry args={[0.26, 0.28, 4]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
            </mesh>
            {/* Flat 2D HTML tag */}
            <Html transform={false} center>
              <div className="flex flex-col items-center gap-1 bg-red-950/70 border border-red-500/35 px-2.5 py-1.5 rounded-xl text-center shadow-lg backdrop-blur-sm min-w-[85px]">
                <Layers size={13} className="text-red-400" />
                <span className="text-[8px] font-black uppercase tracking-wider text-red-200">
                  Draw Pile
                </span>
              </div>
            </Html>
          </group>

          {/* Discard Pile Placeholder */}
          <group position={[0.48, 0.011, 0]}>
            {/* 3D Flat Outline Plate on Felt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
              <planeGeometry args={[0.55, 0.8]} />
              <meshStandardMaterial 
                color="#10b981" 
                roughness={0.9} 
                transparent 
                opacity={0.15} 
              />
            </mesh>
            {/* Discard border ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
              <ringGeometry args={[0.26, 0.28, 4]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
            </mesh>
            {/* Flat 2D HTML tag */}
            <Html transform={false} center>
              <div className="flex flex-col items-center gap-1 bg-emerald-950/70 border border-emerald-500/35 px-2.5 py-1.5 rounded-xl text-center shadow-lg backdrop-blur-sm min-w-[85px]">
                <Inbox size={13} className="text-emerald-400" />
                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-200">
                  Discard Pile
                </span>
              </div>
            </Html>
          </group>

        </group>

        {/* Static Camera Perspective Lock */}
        <CameraController />
      </Canvas>
    </div>
  );
};
export default TableScene;
