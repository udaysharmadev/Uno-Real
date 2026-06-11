'use client';

import React from 'react';
import * as THREE from 'three';

export const DiscardPilePlaceholder: React.FC = () => {
  return (
    <group position={[0.45, 0.02, 0]} rotation={[0, Math.PI / 8, 0]}>
      {/* Glow highlight under the discard card */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.15} />
      </mesh>

      {/* Discard Pile Base Slot (Shadow footprint) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[0.48, 0.52, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* The top card of the discard pile */}
      <mesh position={[0, 0.005, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.01, 0.92]} />
        <meshStandardMaterial
          color="#10b981" // Active Green UNO Card
          roughness={0.3}
          metalness={0.6}
          emissive="#047857"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Card Border design */}
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* Central Symbol Placeholder (e.g. green circle with inner design) */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.18, 32]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Glowing project ring representing discard action area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]}>
        <ringGeometry args={[0.12, 0.15, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};
