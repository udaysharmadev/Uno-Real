'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface RoomEnvironmentProps {
  numPlayers: number;
  localIndex: number;
  children?: React.ReactNode;
}

function CameraSetup({ numPlayers, localIndex }: RoomEnvironmentProps) {
  const { camera, gl } = useThree();
  const time = useRef(0);
  const basePosition = useRef(new THREE.Vector3());

  useEffect(() => {
    // Camera pulled 20% closer per user request
    const radius = 2.24; // Was 2.8
    const angle = (Math.PI * 2 / Math.max(numPlayers, 2)) * localIndex;
    
    const x = Math.sin(angle) * radius;
    const y = 1.45; // Was 1.8. Lowered slightly so lamp isn't cut off
    const z = Math.cos(angle) * radius;

    camera.position.set(x, y, z);
    basePosition.current.set(x, y, z);
    camera.lookAt(0, 1.0, 0);

    const perspCam = camera as THREE.PerspectiveCamera;
    perspCam.fov = 75; // Wider FOV (75) to see the ceiling mount and the player hand simultaneously
    perspCam.updateProjectionMatrix();

    // Attach zoom listeners
    const canvas = gl.domElement;
    let currentZoom = 1.0;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      currentZoom -= e.deltaY * 0.001;
      currentZoom = Math.max(0.85, Math.min(1.15, currentZoom));
      perspCam.zoom = currentZoom;
      perspCam.updateProjectionMatrix();
    };
    
    const handleDblClick = () => {
      currentZoom = 1.0;
      perspCam.zoom = currentZoom;
      perspCam.updateProjectionMatrix();
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('dblclick', handleDblClick);
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDblClick);
    };
  }, [camera, gl.domElement, numPlayers, localIndex]);

  useFrame((state, delta) => {
    time.current += delta;
    
    // Slow breathing effect
    const breathY = Math.sin(time.current * 1.5) * 0.015;
    const breathRotX = Math.cos(time.current * 1.2) * 0.002;
    const breathRotY = Math.sin(time.current * 1.3) * 0.002;

    camera.position.y = basePosition.current.y + breathY;
    
    camera.lookAt(0, 1.0, 0);
    
    // Apply breathing rotation offsets
    camera.rotateX(breathRotX);
    camera.rotateY(breathRotY);
  });

  return null;
}

function Floor() {
  const plankXPositions = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < 80; i++) {
      positions.push(-48 + i * 1.2);
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Main floor plane - Infinite scale */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0c0704" roughness={0.9} />
      </mesh>

      {/* Dark plank separation lines */}
      {plankXPositions.map((x, i) => (
        <mesh key={`plank-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.001, 0]}>
          <planeGeometry args={[0.012, 100]} />
          <meshStandardMaterial color="#050301" roughness={1.0} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function GameTable() {
  const tabletopGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Reduced by ~20%: X: 1.15, Z: 0.75
    shape.absellipse(0, 0, 1.15, 0.75, 0, Math.PI * 2, false, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
      curveSegments: 64,
    });
    return geo;
  }, []);

  const feltGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, 1.11, 0.71, 0, Math.PI * 2, false, 0); // Scaled felt
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.004,
      bevelEnabled: false,
      curveSegments: 64,
    });
    return geo;
  }, []);

  const legPositions: [number, number, number][] = useMemo(
    () => [
      [-0.8, 0.39, 0.5],
      [0.8, 0.39, 0.5],
      [-0.8, 0.39, -0.5],
      [0.8, 0.39, -0.5],
    ],
    []
  );

  return (
    <group>
      {/* Tabletop */}
      <mesh geometry={tabletopGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.83, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1a0c04" roughness={0.7} metalness={0.02} />
      </mesh>

      {/* Felt surface */}
      <mesh geometry={feltGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.875, 0]} receiveShadow>
        <meshStandardMaterial color="#0c331e" roughness={0.95} />
      </mesh>

      {/* Table legs */}
      {legPositions.map(([x, y, z], i) => (
        <group key={`leg-${i}`}>
          <mesh position={[x, y, z]} castShadow>
            <boxGeometry args={[0.12, 0.78, 0.12]} />
            <meshStandardMaterial color="#120602" roughness={0.8} />
          </mesh>
          {/* Foot pad */}
          <mesh position={[x, 0.015, z]}>
            <boxGeometry args={[0.15, 0.03, 0.15]} />
            <meshStandardMaterial color="#0a0301" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Support rails */}
      <mesh position={[-0.8, 0.25, 0]} castShadow>
        <boxGeometry args={[0.08, 0.08, 1.0]} />
        <meshStandardMaterial color="#120602" roughness={0.8} />
      </mesh>
      <mesh position={[0.8, 0.25, 0]} castShadow>
        <boxGeometry args={[0.08, 0.08, 1.0]} />
        <meshStandardMaterial color="#120602" roughness={0.8} />
      </mesh>

      {/* Center cross beam */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.6, 0.08, 0.08]} />
        <meshStandardMaterial color="#120602" roughness={0.8} />
      </mesh>
    </group>
  );
}

function HangingLamp() {
  const spotRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  const shadeGeo = useMemo(() => {
    const points = [
      new THREE.Vector2(0.28, 0.00),
      new THREE.Vector2(0.32, 0.02),
      new THREE.Vector2(0.33, 0.06),
      new THREE.Vector2(0.30, 0.12),
      new THREE.Vector2(0.22, 0.18),
      new THREE.Vector2(0.12, 0.23),
      new THREE.Vector2(0.05, 0.26),
      new THREE.Vector2(0.03, 0.27),
    ];
    return new THREE.LatheGeometry(points);
  }, []);

  useEffect(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current;
      spotRef.current.shadow.mapSize.set(2048, 2048);
      spotRef.current.shadow.bias = -0.0005;
      spotRef.current.shadow.camera.near = 0.5;
      spotRef.current.shadow.camera.far = 15;
    }
  }, []);

  return (
    <group>
      {/* Ceiling mount */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.04, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
      </mesh>

      {/* Cable */}
      <mesh position={[0, 1.85, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.7, 8]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>

      {/* Shade */}
      <mesh geometry={shadeGeo} position={[0, 1.5, 0]} castShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Shade rim ring */}
      <mesh position={[0, 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.27, 0.29, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Dramatic Spotlight (Light comes from INSIDE shade) */}
      <spotLight
        ref={spotRef}
        position={[0, 1.65, 0]}
        angle={Math.PI / 2.8}
        penumbra={0.6}
        intensity={80}
        color="#ffcc77"
        castShadow
        distance={15}
        decay={2}
      />

      {/* Spotlight target */}
      <object3D ref={targetRef} position={[0, 0.85, 0]} />

      {/* Inner glow point light inside shade */}
      <pointLight position={[0, 1.58, 0]} intensity={2.0} color="#ffb040" distance={2.5} decay={2} />

      {/* Front Fill Light for Player Cards */}
      <pointLight position={[0, 1.8, 2.8]} intensity={1.5} color="#ffffff" distance={5} decay={2} />
    </group>
  );
}

function Scene({ numPlayers, localIndex, children }: RoomEnvironmentProps) {
  return (
    <>
      <CameraSetup numPlayers={numPlayers} localIndex={localIndex} />
      <fog attach="fog" args={['#020101', 5, 25]} />
      
      {/* Dim ambient room visibility (deep dark blue/brown) */}
      <hemisphereLight args={['#0a1220', '#020101', 0.15]} />

      {/* Under-table bounce light for table legs */}
      <pointLight position={[0, 0.4, 0]} intensity={30} color="#ffaa55" distance={5} decay={2} castShadow />

      <Floor />
      <GameTable />
      <HangingLamp />
      {children}
    </>
  );
}

export function RoomEnvironment({ numPlayers, localIndex, children }: RoomEnvironmentProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      style={{ background: '#020101', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Scene numPlayers={numPlayers} localIndex={localIndex}>
        {children}
      </Scene>
    </Canvas>
  );
}
