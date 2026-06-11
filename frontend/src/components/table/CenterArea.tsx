'use client';

import React from 'react';
import { CardPlaceholder } from './CardPlaceholder';

export const CenterArea: React.FC = () => {
  return (
    <group>
      {/* Central Table Glowing Ring / Arena Zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[1.1, 1.2, 64]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={2} />
      </mesh>
      
      {/* Subtle Inner Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[1.18, 1.2, 64]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} side={2} />
      </mesh>

      {/* Draw Pile (Stacked Cards) */}
      <group position={[-0.6, 0.01, 0]}>
        {/* Render a stack of 4 cards to give it thickness */}
        <CardPlaceholder position={[0, 0, 0]} color="#ef4444" isDeck={true} />
        <CardPlaceholder position={[0, 0.02, 0.01]} rotation={[0, 0.02, 0]} color="#ef4444" />
        <CardPlaceholder position={[0.01, 0.04, -0.01]} rotation={[0, -0.01, 0]} color="#ef4444" />
        <CardPlaceholder position={[-0.01, 0.06, 0]} rotation={[0, 0.04, 0]} color="#ef4444" />
      </group>

      {/* Discard Pile (Single Card, slightly angled) */}
      <group position={[0.6, 0.01, 0]}>
        <CardPlaceholder 
          position={[0, 0, 0]} 
          rotation={[0, Math.PI / 6, 0]} 
          color="#10b981" // Green-500
          isDeck={false} 
        />
      </group>

      {/* Center Label for Future Play (Holographic projection) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.15} />
      </mesh>
    </group>
  );
};
