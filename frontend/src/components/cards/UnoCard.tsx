'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CardColor, CardValue, getCardColorHex, getCardGlowColor, getCardValueLabel } from '../../lib/cards/cardEngine';
import { CardBack } from './CardBack';
import * as THREE from 'three';

interface UnoCardProps {
  color: CardColor;
  value: CardValue;
  isFaceUp?: boolean;
  isSelected?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
}

export const UnoCard: React.FC<UnoCardProps> = ({
  color,
  value,
  isFaceUp = true,
  isSelected = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onClick,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Smooth position and rotation lerping (Card Motion Engine)
  useFrame(() => {
    if (!meshRef.current) return;

    // Hover lift: lift by 0.25 units along local Y axis
    // Selection lift: lift by 0.15 units
    const hoverLift = hovered ? 0.25 : 0;
    const selectLift = isSelected ? 0.15 : 0;

    // Calculate dynamic targets
    const targetX = position[0];
    const targetY = position[1] + hoverLift + selectLift;
    const targetZ = position[2] + (hovered || isSelected ? 0.05 : 0); // Pull slightly forward

    const targetScale = hovered ? 1.08 : 1.0;

    // Lerp coordinates
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.15);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.15);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.15);

    // Lerp rotation
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, rotation[0], 0.15);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, rotation[1], 0.15);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, rotation[2], 0.15);

    // Lerp scale
    const currentScale = meshRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.15);
    meshRef.current.scale.setScalar(nextScale);
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  // Build the Card Face design using HTML + Tailwind
  const renderCardFace = () => {
    const isWild = color === 'wild';
    const bgHex = getCardColorHex(color);
    const valueLabel = getCardValueLabel(value);
    const glowShadow = getCardGlowColor(color);

    return (
      <div 
        className="w-[124px] h-[184px] rounded-2xl p-2.5 flex flex-col justify-between items-center relative overflow-hidden select-none"
        style={{
          backgroundColor: bgHex,
          boxShadow: isSelected 
            ? `0 0 20px #3b82f6, inset 0 0 10px rgba(255,255,255,0.4)` 
            : `0 4px 10px rgba(0,0,0,0.5), inset 0 0 8px rgba(255,255,255,0.2)`,
          border: isSelected ? '2.5px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.3)',
        }}
      >
        {/* Subtle texture highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />

        {/* Card Inner White Bezel Ring */}
        <div className="absolute inset-1 rounded-[11px] border border-white/20 pointer-events-none" />

        {/* Top-Left Corner Indicator */}
        <div className="w-full flex justify-start text-[13px] font-black text-white leading-none relative z-10">
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{valueLabel}</span>
        </div>

        {/* Center Symbol Area */}
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Central Diagonal Contrast Oval */}
          <div 
            className="absolute w-[86px] h-[106px] rounded-full rotate-[-28deg] border border-white/10"
            style={{
              background: isWild 
                ? 'radial-gradient(circle, #334155 40%, #0f172a 100%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 100%)',
            }}
          />

          {/* Wild Multi-color Wheel Overlay (4 sectors) */}
          {isWild && (
            <div className="absolute w-[70px] h-[70px] rounded-full rotate-45 overflow-hidden flex flex-wrap border border-white/20">
              <div className="w-1/2 h-1/2 bg-[#ef4444]" /> {/* Red */}
              <div className="w-1/2 h-1/2 bg-[#3b82f6]" /> {/* Blue */}
              <div className="w-1/2 h-1/2 bg-[#eab308]" /> {/* Yellow */}
              <div className="w-1/2 h-1/2 bg-[#10b981]" /> {/* Green */}
            </div>
          )}

          {/* Large Center Symbol */}
          <span 
            className={`text-4xl font-extrabold tracking-tighter text-white relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${
              value === 'wild_draw_four' ? 'text-2xl' : ''
            }`}
          >
            {valueLabel}
          </span>
        </div>

        {/* Bottom-Right Corner Indicator (Inverted) */}
        <div className="w-full flex justify-end text-[13px] font-black text-white leading-none relative z-10 rotate-180">
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{valueLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <group
      ref={meshRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
      onPointerDown={handlePointerDown}
    >
      {/* 3D Physical Card Body */}
      <mesh castShadow receiveShadow>
        {/* Card Dimensions: 0.62 width, 0.01 thickness, 0.92 height */}
        <boxGeometry args={[0.62, 0.012, 0.92]} />
        <meshStandardMaterial 
          color="#0f172a" 
          roughness={0.4} 
          metalness={0.2} 
        />
      </mesh>

      {/* Card Face HTML Overlay (Projected in 3D Space) */}
      <Html
        transform
        distanceFactor={200} // Maps 1px to 0.005 units (124px -> 0.62 units, 184px -> 0.92 units)
        position={[0, 0.007, 0]} // Sit flat on the top face of the card box
        rotation={[-Math.PI / 2, 0, 0]} // Face upwards
        style={{ backfaceVisibility: 'hidden' }}
      >
        {isFaceUp ? renderCardFace() : <CardBack />}
      </Html>

      {/* Card Back HTML Overlay (Projected on bottom face of card box) */}
      <Html
        transform
        distanceFactor={200}
        position={[0, -0.007, 0]} // Sit flat on the bottom face
        rotation={[Math.PI / 2, 0, 0]} // Face downwards
        style={{ backfaceVisibility: 'hidden' }}
      >
        <CardBack />
      </Html>
    </group>
  );
};
export default UnoCard;
