'use client';

import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const CameraController: React.FC = () => {
  const { camera } = useThree();

  useEffect(() => {
    // Fixed camera placement:
    // Y=4.6 (height), Z=4.6 (distance) looking at Y=-0.15 (felt center).
    // This creates an exact stable 45-degree tabletop view of the oval table.
    camera.position.set(0, 4.6, 4.6);
    camera.lookAt(new THREE.Vector3(0, -0.15, 0));
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
};
export default CameraController;
