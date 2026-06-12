import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface PhysicalCardProps {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild';
  value: string;
  isFaceUp: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  animateSpawn?: 'drop' | 'none';
  onClick?: () => void;
}

export const PhysicalCard: React.FC<PhysicalCardProps> = ({
  color,
  value,
  isFaceUp,
  position,
  rotation,
  animateSpawn = 'none',
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const currentPos = useRef(new THREE.Vector3(...position));
  const isMounted = useRef(false);

  useLayoutEffect(() => {
    if (meshRef.current) {
      if (!isMounted.current && animateSpawn === 'drop') {
        // Spawn near the local camera
        currentPos.current.set(0, 1.5, 1.5);
      } else {
        currentPos.current.copy(targetPos);
      }
      meshRef.current.position.copy(currentPos.current);

      const finalRotation = isFaceUp 
        ? rotation 
        : [rotation[0], rotation[1], rotation[2] + Math.PI];
      meshRef.current.rotation.set(finalRotation[0], finalRotation[1], finalRotation[2]);
    }
    isMounted.current = true;
  }, [targetPos, animateSpawn, isFaceUp, rotation]);

  useFrame(() => {
    if (meshRef.current && animateSpawn === 'drop') {
      currentPos.current.lerp(targetPos, 0.15);
      meshRef.current.position.copy(currentPos.current);
    }
  });

  const materials = useMemo(() => {
    // Front texture
    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = 256;
    frontCanvas.height = 380;
    const fctx = frontCanvas.getContext('2d');
    if (fctx) {
      const colorMap: Record<string, string> = {
        red: '#ff5555',
        blue: '#5555ff',
        green: '#55aa55',
        yellow: '#ffaa00',
        wild: '#222222',
      };
      
      // White border
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, 256, 380);

      // Inner color
      fctx.fillStyle = colorMap[color] || '#ffffff';
      fctx.fillRect(10, 10, 236, 360);

      // Center oval
      fctx.fillStyle = '#ffffff';
      fctx.beginPath();
      fctx.ellipse(128, 190, 90, 140, 0, 0, 2 * Math.PI);
      fctx.fill();

      // Main Text
      fctx.fillStyle = color === 'wild' ? '#000000' : (colorMap[color] || '#000000');
      fctx.font = 'bold 80px sans-serif';
      fctx.textAlign = 'center';
      fctx.textBaseline = 'middle';
      
      let displayVal = value;
      if (value === 'draw_two') displayVal = '+2';
      if (value === 'wild_draw_four') displayVal = '+4';
      if (value === 'skip') displayVal = '⊘';
      if (value === 'reverse') displayVal = '⇄';
      if (value === 'wild') displayVal = 'W';

      fctx.fillText(displayVal, 128, 190);

      // Corner texts
      fctx.font = 'bold 40px sans-serif';
      fctx.fillStyle = '#ffffff';
      fctx.fillText(displayVal, 40, 50);
      
      fctx.save();
      fctx.translate(216, 330);
      fctx.rotate(Math.PI);
      fctx.fillText(displayVal, 0, 0);
      fctx.restore();
    }
    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.colorSpace = THREE.SRGBColorSpace;

    // Back texture
    const backCanvas = document.createElement('canvas');
    backCanvas.width = 256;
    backCanvas.height = 380;
    const bctx = backCanvas.getContext('2d');
    if (bctx) {
      // White border
      bctx.fillStyle = '#ffffff';
      bctx.fillRect(0, 0, 256, 380);

      // Black/Dark background
      bctx.fillStyle = '#111111';
      bctx.fillRect(10, 10, 236, 360);

      // Red oval
      bctx.fillStyle = '#cc0000';
      bctx.beginPath();
      bctx.ellipse(128, 190, 90, 140, 0, 0, 2 * Math.PI);
      bctx.fill();

      // UNO text
      bctx.fillStyle = '#ffe200';
      bctx.font = 'bold 60px sans-serif';
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.save();
      bctx.translate(128, 190);
      bctx.rotate(-Math.PI / 4);
      bctx.fillText('UNO', 0, 0);
      bctx.restore();
    }
    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.colorSpace = THREE.SRGBColorSpace;

    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.1 });
    const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.6, metalness: 0.1 });
    const backMaterial = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.6, metalness: 0.1 });

    return [
      edgeMaterial,  // +x
      edgeMaterial,  // -x
      frontMaterial, // +y
      backMaterial,  // -y
      edgeMaterial,  // +z
      edgeMaterial,  // -z
    ];
  }, [color, value]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Cap delta to avoid large jumps on lag spikes
      const safeDelta = Math.min(delta, 0.1);
      const dt = 1 - Math.exp(-10 * safeDelta);
      
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, position[0], dt);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1], dt);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, position[2], dt);

      const finalRotation = isFaceUp 
        ? rotation 
        : [rotation[0], rotation[1], rotation[2] + Math.PI];

      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, finalRotation[0], dt);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, finalRotation[1], dt);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, finalRotation[2], dt);
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      material={materials} 
      castShadow 
      receiveShadow
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      onPointerOver={(e) => {
        if (onClick) {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={(e) => {
        if (onClick) {
          document.body.style.cursor = 'auto';
        }
      }}
    >
      <boxGeometry args={[0.124, 0.002, 0.184]} />
    </mesh>
  );
};
