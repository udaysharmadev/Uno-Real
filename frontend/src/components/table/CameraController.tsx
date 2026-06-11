'use client';

import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const CameraController: React.FC = () => {
  const { camera } = useThree();

  useEffect(() => {
    // Zoom closer: camera at Y=3.4, Z=3.4 looking at center Y=-0.2.
    // Frames the expanded table to occupy 60% of the screen.
    camera.position.set(0, 3.4, 3.4);
    camera.lookAt(new THREE.Vector3(0, -0.2, 0));
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
};
export default CameraController;
