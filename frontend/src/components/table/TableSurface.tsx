'use client';

import React from 'react';
import * as THREE from 'three';

export const TableSurface: React.FC = () => {
  return (
    <group position={[0, -0.06, 0]}>
      {/* 1. Table Drop Shadow Underlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} scale={[1.65, 1.05, 1.05]}>
        <planeGeometry args={[2.8, 2.8]} />
        <meshBasicMaterial 
          color="#020617" 
          transparent 
          opacity={0.65} 
        />
      </mesh>

      {/* 2. Main Outer Bezel - Polished Dark Border (Leather / Dark Wood) */}
      <mesh castShadow position={[0, 0, 0]} scale={[1.6, 1.0, 1.0]}>
        <cylinderGeometry args={[1.35, 1.37, 0.12, 64]} />
        <meshStandardMaterial
          color="#090d16" // Extremely dark charcoal leather tone
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* 3. Raised Outer Bezel Rim */}
      <mesh position={[0, 0.055, 0]} scale={[1.605, 1.0, 1.005]}>
        <cylinderGeometry args={[1.35, 1.35, 0.02, 64, 1, true]} />
        <meshStandardMaterial
          color="#1e293b" // Slate metal accent
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 4. Gold Inner Border Ring Accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.062, 0]} scale={[1.6, 1.0, 1.0]}>
        <ringGeometry args={[1.21, 1.23, 64]} />
        <meshStandardMaterial
          color="#d97706" // Premium Gold Highlight
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>

      {/* 5. Inner Felt Play Field - Dark Blue felt */}
      <mesh receiveShadow position={[0, 0.05, 0]} scale={[1.6, 1.0, 1.0]}>
        <cylinderGeometry args={[1.21, 1.21, 0.02, 64]} />
        <meshStandardMaterial
          color="#0c1b33" // Deep poker felt dark blue
          roughness={0.95} // High light absorption for felt look
          metalness={0.0}
        />
      </mesh>

      {/* 6. Subtle glowing ring inside the felt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.061, 0]} scale={[1.6, 1.0, 1.0]}>
        <ringGeometry args={[1.19, 1.20, 64]} />
        <meshBasicMaterial
          color="#1d4ed8" // Soft glowing blue highlight on felt
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
export default TableSurface;
