'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const CenterDeckPlaceholder: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Slow float animation to make the deck feel holographic/interactive
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.position.y = 0.02 + Math.sin(time * 1.5) * 0.015;
  });

  return (
    <group ref={groupRef} position={[-0.45, 0.02, 0]}>
      {/* 3D Stack of Cards (Simulated by box offsets) */}
      
      {/* Glow highlight under the deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.15} />
      </mesh>

      {/* Card 1 (Bottom) */}
      <mesh position={[0, 0.01, 0]} castShadow>
        <boxGeometry args={[0.62, 0.015, 0.92]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Card 2 (Middle) */}
      <mesh position={[0.01, 0.03, -0.005]} rotation={[0, 0.01, 0]} castShadow>
        <boxGeometry args={[0.62, 0.015, 0.92]} />
        <meshStandardMaterial color="#991b1b" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Card 3 (Top - glowing red shell representing UNO card back) */}
      <mesh position={[-0.005, 0.05, 0.005]} rotation={[0, -0.015, 0]} castShadow>
        <boxGeometry args={[0.62, 0.02, 0.92]} />
        <meshStandardMaterial
          color="#dc2626" // Red card back
          roughness={0.25}
          metalness={0.6}
          emissive="#b91c1c"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Inner card border decoration */}
      <mesh position={[-0.005, 0.061, 0.005]} rotation={[-Math.PI / 2, 0, -0.015]}>
        <planeGeometry args={[0.5, 0.8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Central UNO Oval Placeholder */}
      <mesh position={[-0.005, 0.062, 0.005]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[0, 0.18, 32]} />
        <meshBasicMaterial color="#ea580c" />
      </mesh>
    </group>
  );
};
