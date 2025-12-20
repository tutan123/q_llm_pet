import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import { ActionType } from '../types';

interface PenguinProps {
  currentAction: ActionType;
  animationProgress: number; 
}

export const Penguin3D: React.FC<PenguinProps> = ({ currentAction }) => {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const headRef = useRef<Group>(null);
  const leftWingRef = useRef<Mesh>(null);
  const rightWingRef = useRef<Mesh>(null);

  // Global time for continuous animations (breathing)
  const globalTime = useRef(0);
  // Action time resets when action changes (for locomotion)
  const actionTime = useRef(0);
  const prevAction = useRef<ActionType>('IDLE');

  // Reset action time on change
  useEffect(() => {
    if (prevAction.current !== currentAction) {
        actionTime.current = 0;
        prevAction.current = currentAction;
    }
  }, [currentAction]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    globalTime.current += delta;
    actionTime.current += delta;
    
    const t = globalTime.current;
    const at = actionTime.current;
    
    // Components
    const group = groupRef.current!;
    const leftWing = leftWingRef.current!;
    const rightWing = rightWingRef.current!;
    const head = headRef.current!;

    // --- Transforms ---
    // Poses
    let targetRotY = 0;
    let targetRotX = 0;
    let targetRotZ = 0;
    let lwRotZ = 0.2;
    let rwRotZ = -0.2;
    let headRotY = 0;
    
    // Root Motion (World Position)
    let targetWorldX = 0;
    let targetWorldY = -0.5; // Floor level default
    let targetWorldZ = 0;

    switch (currentAction) {
      case 'IDLE':
        targetWorldY = -0.5 + Math.sin(t * 2) * 0.05;
        lwRotZ = 0.2 + Math.sin(t * 2) * 0.1;
        rwRotZ = -0.2 - Math.sin(t * 2) * 0.1;
        break;

      case 'WALK':
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 10)) * 0.1;
        targetRotZ = Math.sin(t * 10) * 0.2;
        lwRotZ = 0.8;
        rwRotZ = -0.8;
        break;
      
      case 'RUN':
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 20)) * 0.1;
        targetRotZ = Math.sin(t * 20) * 0.3;
        targetRotX = 0.3; 
        lwRotZ = 1.2;
        rwRotZ = -1.2;
        break;
        
      case 'RUN_ACROSS':
        // Run from -3 to 3 and back
        // Period of 4 seconds
        const runCycle = Math.sin(at * 1.5); // -1 to 1
        targetWorldX = runCycle * 3.5;
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 20)) * 0.1;
        
        // Face direction of movement
        // Derivative of sin is cos. If cos > 0 moving right, else left
        const direction = Math.cos(at * 1.5);
        targetRotY = direction > 0 ? 1.57 : -1.57;
        targetRotX = 0.3; // Lean forward
        
        // Arms
        lwRotZ = 1.2;
        rwRotZ = -1.2;
        break;

      case 'FLY':
        // Figure 8 pattern in air
        targetWorldX = Math.sin(at) * 3;
        targetWorldY = 2 + Math.sin(at * 2) * 0.5;
        targetWorldZ = Math.cos(at) * 1.5;
        
        // Face forward along path roughly
        targetRotY = at + 1.57; // Just spin to look cool while flying
        targetRotX = 1.57; // Horizontal body (superman)
        
        lwRotZ = 2.5; // Wings out
        rwRotZ = -2.5;
        break;
        
      case 'SLIDE':
        // Belly slide
        // Raise Y to 0.2 to account for body radius (0.7) when rotated 90deg, 
        // ensuring belly sits on floor (-0.5) instead of clipping.
        targetWorldY = 0.2; 
        targetRotX = 1.57; // Flat on belly
        targetWorldX = Math.sin(at * 2) * 2;
        
        const slideDir = Math.cos(at * 2);
        targetRotY = slideDir > 0 ? 1.57 : -1.57;
        
        lwRotZ = 3.0; // Streamline
        rwRotZ = -3.0;
        break;

      case 'JUMP':
        targetWorldY = -0.5 + Math.abs(Math.sin(at * 5)) * 1.5;
        lwRotZ = 2.5;
        rwRotZ = -2.5;
        break;

      case 'WAVE':
        lwRotZ = 0.2;
        rwRotZ = -2.5 + Math.sin(t * 15) * 0.5; 
        targetRotZ = -0.1;
        break;

      case 'DANCE':
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 8)) * 0.2;
        targetRotY = Math.sin(t * 5) * 0.5;
        lwRotZ = 2.0 + Math.sin(t * 10);
        rwRotZ = -2.0 + Math.cos(t * 10);
        break;

      case 'SPIN':
        targetRotY = t * 15;
        lwRotZ = 1.5;
        rwRotZ = -1.5;
        targetWorldY = -0.3;
        break;

      case 'SHIVER':
        targetRotY = Math.sin(t * 50) * 0.1;
        lwRotZ = 0.5;
        rwRotZ = -0.5;
        break;
        
      case 'SLEEP':
        targetRotX = 0;
        targetRotZ = 1.57;
        targetWorldY = -0.8; // Sleep might still clip slightly but looks like sinking into bed
        if (targetWorldY < -0.5) targetWorldY = -0.3; // Fix sleep clipping too
        lwRotZ = 0.1;
        rwRotZ = -0.1;
        break;

      case 'BOW':
        targetRotX = 0.8;
        lwRotZ = 0.1;
        rwRotZ = -0.1;
        break;

      case 'HAPPY':
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 12)) * 0.5;
        lwRotZ = 2.5;
        rwRotZ = -2.5;
        break;
        
      case 'SURPRISE':
        targetWorldY = 0;
        targetRotX = -0.2;
        lwRotZ = 2.0;
        rwRotZ = -2.0;
        break;
        
      case 'BACKFLIP':
        const flipDuration = 1.5; // Complete flip in 1.5s
        if (at < flipDuration) {
          const progress = at / flipDuration;
          // High jump to avoid head clipping when inverted
          targetWorldY = -0.5 + Math.sin(progress * Math.PI) * 3.5; 
          // Full 360 rotation
          targetRotX = progress * Math.PI * 2;
        } else {
          // Landed
          targetWorldY = -0.5;
          targetRotX = 0; 
        }
        break;
        
      case 'FIGHT':
        // Boxing
        targetRotY = -0.5;
        lwRotZ = 1.5;
        rwRotZ = -1.5;
        // Punching motion
        group.rotation.y = Math.sin(t * 10) * 0.2;
        leftWing.rotation.x = Math.sin(t * 20) * 0.5;
        break;
      
      case 'DAZZLE':
        // Jazz hands
        targetRotY = Math.sin(t * 5) * 0.2;
        lwRotZ = 2.5 + Math.sin(t * 20) * 0.2;
        rwRotZ = -2.5 + Math.cos(t * 20) * 0.2;
        break;

      default:
        targetWorldY = -0.5 + Math.sin(t) * 0.05;
        break;
    }

    // Apply Transforms with Lerp for smoothness (Pose)
    const speed = 0.15;
    
    group.position.x += (targetWorldX - group.position.x) * speed;
    group.position.y += (targetWorldY - group.position.y) * speed;
    group.position.z += (targetWorldZ - group.position.z) * speed;

    // For Backflip, we want sharp rotation control, but lerp is okay if speed is high enough
    // We'll trust the speed=0.15 is fast enough for 60fps, otherwise snap it for Backflip?
    // Let's keep lerp for smoothness, but maybe increase speed if needed. 
    
    group.rotation.y += (targetRotY - group.rotation.y) * speed;
    group.rotation.x += (targetRotX - group.rotation.x) * speed;
    group.rotation.z += (targetRotZ - group.rotation.z) * speed;

    leftWing.rotation.z += (lwRotZ - leftWing.rotation.z) * speed;
    rightWing.rotation.z += (rwRotZ - rightWing.rotation.z) * speed;
    
    if (head) {
        head.rotation.y += (headRotY - head.rotation.y) * speed;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* BODY */}
      <mesh ref={bodyRef} position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.7, 1.2, 4, 16]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>

      {/* BELLY */}
      <mesh position={[0, 0.7, 0.6]} scale={[0.8, 0.9, 0.5]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#fff" roughness={0.8} />
      </mesh>

      {/* HEAD GROUP */}
      <group ref={headRef} position={[0, 1.6, 0]}>
         {/* Beak */}
         <mesh position={[0, -0.1, 0.6]} rotation={[1.57, 0, 0]} castShadow>
            <coneGeometry args={[0.15, 0.4, 32]} />
            <meshStandardMaterial color="#fbbf24" />
         </mesh>

         {/* Eyes */}
         <mesh position={[-0.25, 0.1, 0.5]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="black" roughness={0.1} />
         </mesh>
         <mesh position={[0.25, 0.1, 0.5]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="black" roughness={0.1} />
         </mesh>
          {/* Eye sparkle */}
         <mesh position={[-0.28, 0.15, 0.55]}>
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial color="white" />
         </mesh>
         <mesh position={[0.22, 0.15, 0.55]}>
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial color="white" />
         </mesh>
      </group>

      {/* WINGS */}
      <group position={[0, 1.0, 0]}>
        <mesh ref={leftWingRef} position={[-0.65, 0, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.8, 4, 8]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
        </mesh>
        <mesh ref={rightWingRef} position={[0.65, 0, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.8, 4, 8]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
        </mesh>
      </group>

      {/* FEET */}
      <group position={[0, 0.1, 0]}>
        <mesh position={[-0.3, 0, 0.3]} scale={[1, 0.3, 1.5]} castShadow>
           <sphereGeometry args={[0.25]} />
           <meshStandardMaterial color="#fbbf24" roughness={0.3} />
        </mesh>
        <mesh position={[0.3, 0, 0.3]} scale={[1, 0.3, 1.5]} castShadow>
           <sphereGeometry args={[0.25]} />
           <meshStandardMaterial color="#fbbf24" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};
