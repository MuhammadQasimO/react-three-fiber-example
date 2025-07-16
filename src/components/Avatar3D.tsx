import React, {useRef, useEffect, useState} from 'react';
import {useFrame} from '@react-three/fiber/native';
import {useGLTF, useAnimations} from '@react-three/drei/native';
import {Group} from 'three';

interface Avatar3DProps {
  onLoadStateChange?: (isLoaded: boolean, error?: string) => void;
}

const Avatar3D: React.FC<Avatar3DProps> = ({onLoadStateChange}) => {
  const group = useRef<Group>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the GLB file using useGLTF - this should be called directly as a hook
  const gltf = useGLTF(require('../../assets/rob-fi.glb'));

  // Extract animations safely
  const gltfData = gltf ? (Array.isArray(gltf) ? gltf[0] : gltf) : null;
  const animations = gltfData?.animations || [];
  const actions = useAnimations(animations, group);
  const scene = gltfData?.scene || null;

  // Notify parent component when loaded
  useEffect(() => {
    if (gltfData && scene && !isLoaded) {
      setIsLoaded(true);
      onLoadStateChange?.(true);
      console.log('GLTF loaded and ready');
    }
  }, [gltfData, scene, isLoaded, onLoadStateChange]);

  // Start all animations once when loaded
  useEffect(() => {
    if (!actions || !actions.actions || !isLoaded) return;

    try {
      const actualActions = actions.actions;
      if (!actualActions || typeof actualActions !== 'object') return;

      const actualAnimationNames = Object.keys(actualActions);
      console.log('Starting all animations:', actualAnimationNames);

      // Start all animations initially
      actualAnimationNames.forEach((animationName, index) => {
        const animation = actualActions[animationName];
        if (animation && typeof animation.play === 'function') {
          setTimeout(() => {
            try {
              animation.play();
              console.log(`Started: ${animationName}`);
            } catch (error) {
              console.error(`Error starting ${animationName}:`, error);
            }
          }, index * 100);
        }
      });
    } catch (error) {
      console.error('Error starting animations:', error);
    }
  }, [isLoaded, actions]);

  // Animate the avatar with subtle movements
  useFrame(state => {
    if (group.current) {
      // Gentle floating animation
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;

      // Subtle rotation
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  // Simple safety check
  if (!scene) {
    console.log('No scene available, returning null');
    return null;
  }

  return (
    <group position={[0, -1.4, 0]}>
      {/* Lighting for the avatar */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, 5]} intensity={0.4} color="#ff6b6b" />
      <pointLight position={[5, -5, 5]} intensity={0.4} color="#4ecdc4" />

      {/* Humanoid Robot Avatar */}
      <group ref={group} scale={0.15} position={[0, 0, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
};

// Preload the GLB file for better performance (module level as per docs)
useGLTF.preload(require('../../assets/rob-fi.glb'));

export default Avatar3D;
