'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CardPlaceholderProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  isDeck?: boolean;
}

export const CardPlaceholder: React.FC<CardPlaceholderProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = '#ef4444', // Red-500 neon
  isDeck = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Add subtle floating animation for cards
  useFrame((state) => {
    if (!meshRef.current) return;
    
    if (isDeck) {
      // Very slow rotation to feel alive
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.02;
    } else {
      // Discard pile sits flat, but can have a slight hover/offset
      meshRef.current.position.y = position[1];
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      {/* Box geometry representing UNO card dimensions */}
      <boxGeometry args={[0.7, 0.02, 1.0]} />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.8}
        emissive={new THREE.Color(color)}
        emissiveIntensity={isDeck ? 0.2 : 0.05}
      />
    </mesh>
  );
};
