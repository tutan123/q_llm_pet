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
    if (!groupRef.current || !leftWingRef.current || !rightWingRef.current || !headRef.current) return;
    
    globalTime.current += delta;
    actionTime.current += delta;
    
    const t = globalTime.current;
    const at = actionTime.current;
    
    // Components
    const group = groupRef.current;
    const leftWing = leftWingRef.current;
    const rightWing = rightWingRef.current;
    const head = headRef.current;

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
        const runCycle = Math.sin(at * 1.5); // -1 to 1
        targetWorldX = runCycle * 3.5;
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 20)) * 0.1;
        const direction = Math.cos(at * 1.5);
        targetRotY = direction > 0 ? 1.57 : -1.57;
        targetRotX = 0.3; // Lean forward
        lwRotZ = 1.2;
        rwRotZ = -1.2;
        break;

      case 'FLY':
        targetWorldX = Math.sin(at) * 3;
        targetWorldY = 2 + Math.sin(at * 2) * 0.5;
        targetWorldZ = Math.cos(at) * 1.5;
        targetRotY = at + 1.57; 
        targetRotX = 1.57; 
        lwRotZ = 2.5; 
        rwRotZ = -2.5;
        break;
        
      case 'SLIDE':
        targetWorldY = 0.2; 
        targetRotX = 1.57; 
        targetWorldX = Math.sin(at * 2) * 2;
        const slideDir = Math.cos(at * 2);
        targetRotY = slideDir > 0 ? 1.57 : -1.57;
        lwRotZ = 3.0;
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
        targetWorldY = -0.8;
        if (targetWorldY < -0.5) targetWorldY = -0.3;
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
        
      case 'SAD':
        targetRotX = 0.2;
        headRotY = Math.sin(t * 2) * 0.2;
        lwRotZ = 0.1;
        rwRotZ = -0.1;
        targetWorldY = -0.6;
        break;

      case 'ANGRY':
        targetRotX = -0.2;
        targetRotY = Math.sin(t * 30) * 0.1;
        lwRotZ = 1.5;
        rwRotZ = -1.5;
        break;

      case 'SURPRISE':
        targetWorldY = 0;
        targetRotX = -0.2;
        lwRotZ = 2.0;
        rwRotZ = -2.0;
        break;

      case 'LOOK_LEFT':
        headRotY = 1.0;
        break;

      case 'LOOK_RIGHT':
        headRotY = -1.0;
        break;

      case 'ROLL':
        targetRotZ = at * 10;
        targetWorldY = -0.2;
        lwRotZ = 3.0;
        rwRotZ = -3.0;
        break;
        
      case 'BACKFLIP':
        const flipDuration = 1.5;
        if (at < flipDuration) {
          const progress = at / flipDuration;
          targetWorldY = -0.5 + Math.sin(progress * Math.PI) * 3.5; 
          targetRotX = progress * Math.PI * 2;
        } else {
          targetWorldY = -0.5;
          targetRotX = 0; 
        }
        break;

      case 'CLAP':
        lwRotZ = 1.5 + Math.sin(t * 20) * 0.8;
        rwRotZ = -1.5 - Math.sin(t * 20) * 0.8;
        break;

      case 'THINK':
        headRotY = Math.sin(t) * 0.5;
        rwRotZ = -2.0;
        targetRotX = 0.1;
        break;

      case 'SIT':
        targetWorldY = -0.8;
        targetRotX = -0.2;
        lwRotZ = 0.5;
        rwRotZ = -0.5;
        break;
        
      case 'FIGHT':
        targetRotY = -0.5;
        lwRotZ = 1.5;
        rwRotZ = -1.5;
        group.rotation.y = Math.sin(t * 10) * 0.2;
        leftWing.rotation.x = Math.sin(t * 20) * 0.5;
        break;
      
      case 'SWIM':
        targetRotX = 1.57;
        targetWorldY = -0.2;
        lwRotZ = 2.0 + Math.sin(t * 5) * 1.0;
        rwRotZ = -2.0 - Math.sin(t * 5) * 1.0;
        break;

      case 'DAZZLE':
        targetRotY = Math.sin(t * 5) * 0.2;
        lwRotZ = 2.5 + Math.sin(t * 20) * 0.2;
        rwRotZ = -2.5 + Math.cos(t * 20) * 0.2;
        break;

      case 'HIDE':
        targetWorldY = -1.2;
        break;

      case 'PEEK':
        targetWorldY = -0.8 + Math.sin(t * 2) * 0.2;
        break;

      case 'LOVE':
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 5)) * 0.3;
        lwRotZ = 2.0;
        rwRotZ = -2.0;
        break;

      case 'KICK':
        targetRotZ = Math.sin(at * 10) * 0.8;
        targetWorldY = -0.3;
        break;

      case 'PUNCH':
        lwRotZ = 1.0 + Math.sin(at * 20) * 1.5;
        break;

      case 'KUNG_FU':
        targetRotY = Math.sin(t * 5);
        lwRotZ = 1.5 + Math.sin(t * 10);
        rwRotZ = -1.5 + Math.cos(t * 10);
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 5)) * 0.5;
        break;

      case 'TAI_CHI':
        const slowT = t * 0.5;
        targetRotY = Math.sin(slowT);
        lwRotZ = 1.0 + Math.sin(slowT * 2);
        rwRotZ = -1.0 + Math.cos(slowT * 2);
        targetWorldY = -0.5 + Math.sin(slowT) * 0.2;
        break;

      case 'MEDITATE':
        targetWorldY = -0.7;
        lwRotZ = 0.2;
        rwRotZ = -0.2;
        headRotY = 0;
        break;

      case 'BREAKDANCE':
        targetRotX = 1.57;
        targetRotY = t * 10;
        targetWorldY = 0.5;
        lwRotZ = 2.5;
        rwRotZ = -2.5;
        break;

      case 'BALLET':
        targetRotY = t * 4;
        targetWorldY = 0.2;
        lwRotZ = 2.5;
        rwRotZ = -2.5;
        break;

      case 'MOONWALK':
        targetWorldX = Math.sin(at) * 2;
        targetRotY = 1.57;
        targetWorldY = -0.5 + Math.abs(Math.sin(at * 10)) * 0.1;
        break;

      case 'SALUTE':
        rwRotZ = -2.8;
        break;

      case 'CRY':
        targetRotX = 0.5;
        headRotY = Math.sin(t * 10) * 0.1;
        targetWorldY = -0.6;
        break;

      case 'LAUGH':
        targetWorldY = -0.5 + Math.abs(Math.sin(t * 15)) * 0.3;
        targetRotX = -0.2;
        break;

      case 'SNEEZE':
        if (at % 2 < 1.5) {
          targetRotX = 0.5;
        } else {
          targetRotX = -0.8;
        }
        break;

      case 'SHOCKED':
        targetWorldY = 0.2;
        targetRotX = -0.4;
        lwRotZ = 2.8;
        rwRotZ = -2.8;
        break;

      default:
        targetWorldY = -0.5 + Math.sin(t) * 0.05;
        break;
    }

    const speed = 0.15;
    group.position.x += (targetWorldX - group.position.x) * speed;
    group.position.y += (targetWorldY - group.position.y) * speed;
    group.position.z += (targetWorldZ - group.position.z) * speed;

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
      {/* --- BODY --- */}
      {/* High poly capsule for smoother look */}
      <mesh ref={bodyRef} position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.7, 1.2, 8, 32]} />
        {/* Physical material for plastic toy look */}
        <meshPhysicalMaterial 
            color="#1e293b" 
            roughness={0.4} 
            clearcoat={0.3} 
            clearcoatRoughness={0.2} 
        />
      </mesh>

      {/* --- BELLY --- */}
      {/* Smoother belly patch */}
      <mesh position={[0, 0.7, 0.58]} scale={[0.82, 0.9, 0.5]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 1.6, 0]}>
         {/* Beak - Rounded cone */}
         <mesh position={[0, -0.1, 0.6]} rotation={[1.57, 0, 0]} castShadow>
            <coneGeometry args={[0.15, 0.4, 32]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} />
         </mesh>

         {/* Eyes - Larger, shinier */}
         <mesh position={[-0.25, 0.1, 0.52]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#000" roughness={0.1} metalness={0.5} />
         </mesh>
         <mesh position={[0.25, 0.1, 0.52]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#000" roughness={0.1} metalness={0.5} />
         </mesh>
          
         {/* Eye Reflections (Highlights) */}
         <mesh position={[-0.28, 0.14, 0.58]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="white" />
         </mesh>
         <mesh position={[0.22, 0.14, 0.58]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="white" />
         </mesh>

         {/* Rosy Cheeks (Blush) */}
         <mesh position={[-0.35, -0.05, 0.45]} rotation={[0, 0.5, 0]}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial color="#f472b6" opacity={0.6} transparent depthWrite={false} />
         </mesh>
         <mesh position={[0.35, -0.05, 0.45]} rotation={[0, -0.5, 0]}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial color="#f472b6" opacity={0.6} transparent depthWrite={false} />
         </mesh>
      </group>

      {/* --- ACCESSORIES --- */}
      {/* Bowtie */}
      <group position={[0, 1.35, 0.55]} rotation={[0.2, 0, 0]}>
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.12, 0.3, 16]} />
            <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.12, 0.3, 16]} />
            <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh rotation={[1.57, 0, 0]}>
             <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
             <meshStandardMaterial color="#b91c1c" />
        </mesh>
      </group>

      {/* --- WINGS --- */}
      <group position={[0, 1.0, 0]}>
        <mesh ref={leftWingRef} position={[-0.68, 0, 0]} rotation={[0, 0, 0.1]} castShadow>
            <capsuleGeometry args={[0.15, 0.8, 8, 16]} />
            <meshPhysicalMaterial color="#1e293b" roughness={0.4} clearcoat={0.3} />
        </mesh>
        <mesh ref={rightWingRef} position={[0.68, 0, 0]} rotation={[0, 0, -0.1]} castShadow>
            <capsuleGeometry args={[0.15, 0.8, 8, 16]} />
            <meshPhysicalMaterial color="#1e293b" roughness={0.4} clearcoat={0.3} />
        </mesh>
      </group>

      {/* --- FEET --- */}
      <group position={[0, 0.1, 0]}>
        <mesh position={[-0.3, 0, 0.3]} scale={[1, 0.3, 1.5]} castShadow>
           <sphereGeometry args={[0.28, 16, 16]} />
           <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
        <mesh position={[0.3, 0, 0.3]} scale={[1, 0.3, 1.5]} castShadow>
           <sphereGeometry args={[0.28, 16, 16]} />
           <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};
