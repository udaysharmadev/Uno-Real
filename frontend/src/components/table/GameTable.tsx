'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CenterArea } from './CenterArea';
import { PlayerSeat } from './PlayerSeat';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

export const GameTable: React.FC = () => {
  const { room, player } = useGameStore();

  // Find local player's seat number to align them to the bottom of the table
  const localSeatNumber = player?.seatNumber || 1;

  // Seating layout parameters
  const SEAT_RADIUS = 3.6; // Distance from center
  const TOTAL_SEATS = 6;

  // Helper to get player at specific seat number
  const getPlayerAtSeat = (seatNo: number) => {
    if (!room) return null;
    return room.players.find((p) => p.seatNumber === seatNo) || null;
  };

  // Generate coordinates for all 6 seats
  const seatConfig = Array.from({ length: TOTAL_SEATS }).map((_, index) => {
    const seatNumber = index + 1;
    
    // Relative angle: Rotates the coordinates so the local player's seat is always at the bottom (-PI/2)
    const relativeAngle = ((seatNumber - localSeatNumber) * (2 * Math.PI)) / TOTAL_SEATS - Math.PI / 2;
    
    const x = SEAT_RADIUS * Math.cos(relativeAngle);
    const z = SEAT_RADIUS * Math.sin(relativeAngle);
    const y = 0.05; // Slightly above table floor
    
    // Rotate seat to face the center (0,0,0)
    const rotationY = -relativeAngle - Math.PI / 2;

    const occupant = getPlayerAtSeat(seatNumber);
    const isLocal = occupant ? occupant.id === player?.id : false;

    return {
      seatNumber,
      position: [x, y, z] as [number, number, number],
      rotationY,
      occupant,
      isLocal,
    };
  });

  return (
    <div className="w-full h-full relative min-h-[380px] md:min-h-[500px]">
      {/* 3D Viewport */}
      <Canvas
        camera={{ position: [0, 5, 6.5], fov: 45 }}
        shadows
        className="w-full h-full"
      >
        <color attach="background" args={['#030712']} />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        
        {/* Neon accent spotlight on the table */}
        <spotLight
          position={[0, 8, 0]}
          angle={0.6}
          penumbra={0.8}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        {/* Point light in center to illuminate deck */}
        <pointLight position={[0, 1.5, 0]} intensity={1.0} color="#3b82f6" />

        {/* Ambient table fill light */}
        <directionalLight position={[2, 5, 2]} intensity={0.8} />

        <group position={[0, -0.4, 0]}>
          {/* Main 3D Poker/Card Table Geometry */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[2.5, 2.6, 0.2, 64]} />
            <meshStandardMaterial
              color="#0f172a" // slate-900 felt
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>

          {/* Table Outer Wooden Rim */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[2.62, 2.62, 0.15, 64, 1, true]} />
            <meshStandardMaterial
              color="#020617" // slate-950 trim
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>

          {/* Neon Glow Outer Table Border */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
            <ringGeometry args={[2.52, 2.56, 64]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={2} />
          </mesh>

          {/* Table Center Area (Deck & Discards) */}
          <CenterArea />

          {/* 6 Player Seats */}
          {seatConfig.map((seat) => (
            <PlayerSeat
              key={seat.seatNumber}
              seatNumber={seat.seatNumber}
              position={seat.position}
              rotationY={seat.rotationY}
              player={seat.occupant}
              isLocal={seat.isLocal}
            />
          ))}
        </group>

        {/* Orbit Controls to rotate camera around table */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.1} // Prevent looking under table
          minPolarAngle={Math.PI / 6}    // Prevent looking top-down completely
        />
      </Canvas>
    </div>
  );
};
