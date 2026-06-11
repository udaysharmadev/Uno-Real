'use client';

import React from 'react';
import * as THREE from 'three';

export const TableSurface: React.FC = () => {
  return (
    <group position={[0, -0.06, 0]}>
      {/* 1. Large Table Drop Shadow Underlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} scale={[1.7, 1.1, 1.1]}>
        <planeGeometry args={[3.8, 3.8]} />
        <meshBasicMaterial 
          color="#010307" 
          transparent 
          opacity={0.75} 
        />
      </mesh>

      {/* 2. Main Outer Bezel - Large Polished Dark Wood/Leather Bezel */}
      <mesh castShadow position={[0, 0, 0]} scale={[1.65, 1.0, 1.0]}>
        <cylinderGeometry args={[1.9, 1.92, 0.12, 64]} />
        <meshStandardMaterial
          color="#080c14" // Deep dark matte black leather bezel
          roughness={0.4}
          metalness={0.15}
        />
      </mesh>

      {/* 3. Outer Edge Chrome Rim */}
      <mesh position={[0, 0.055, 0]} scale={[1.655, 1.0, 1.005]}>
        <cylinderGeometry args={[1.9, 1.9, 0.02, 64, 1, true]} />
        <meshStandardMaterial
          color="#1e293b" 
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 4. Gold Inner Border Ring Divider */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.062, 0]} scale={[1.65, 1.0, 1.0]}>
        <ringGeometry args={[1.76, 1.78, 64]} />
        <meshStandardMaterial
          color="#d97706" // Gold border line
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>

      {/* 5. Inner Felt Play Field - Expanded Dark Green/Blue felt */}
      <mesh receiveShadow position={[0, 0.05, 0]} scale={[1.65, 1.0, 1.0]}>
        <cylinderGeometry args={[1.76, 1.76, 0.02, 64]} />
        <meshStandardMaterial
          color="#0a172e" // Premium poker felt dark blue
          roughness={0.95} 
          metalness={0.0}
        />
      </mesh>

      {/* 6. Felt Neon Underglow Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.061, 0]} scale={[1.65, 1.0, 1.0]}>
        <ringGeometry args={[1.74, 1.75, 64]} />
        <meshBasicMaterial
          color="#2563eb" // Soft blue neon line running along inner felt border
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
export default TableSurface;
