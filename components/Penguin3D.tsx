import React, { useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import { ActionType, ExpressionType } from '../types';
import { usePenguinAnimations } from './penguin/usePenguinAnimations';
import { usePenguinExpressions } from './penguin/usePenguinExpressions';

interface PenguinProps {
  currentAction: ActionType;
  currentExpression?: ExpressionType;
  position?: [number, number, number];
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export const Penguin3D: React.FC<PenguinProps> = ({ 
  currentAction, 
  currentExpression = 'NEUTRAL',
  position = [0, -1, 0],
  onPointerDown,
  onPointerUp,
  onPointerMove,
  onClick
}) => {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const headRef = useRef<Group>(null);
  const leftWingRef = useRef<Mesh>(null);
  const rightWingRef = useRef<Mesh>(null);
  const leftEyeRef = useRef<Mesh>(null);
  const rightEyeRef = useRef<Mesh>(null);
  const beakRef = useRef<Mesh>(null);
  const blushGroupRef = useRef<Group>(null);
  const heartRef = useRef<Group>(null);

  // --- Animation Hook ---
  const { globalTime } = usePenguinAnimations(
    currentAction, 
    groupRef, 
    leftWingRef, 
    rightWingRef, 
    headRef, 
    position
  );

  // --- Expression Hook ---
  usePenguinExpressions(
    currentExpression, 
    leftEyeRef, 
    rightEyeRef, 
    beakRef, 
    blushGroupRef, 
    heartRef, 
    headRef,
    globalTime
  );

  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onClick={onClick}
    >
      {/* --- HEART (for LOVING expression) --- */}
      <group ref={heartRef} scale={[0, 0, 0]} position={[0, 2.2, 0.2]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ff4d4d" />
        </mesh>
        <mesh position={[-0.1, 0.1, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ff4d4d" />
        </mesh>
        <mesh position={[0.1, 0.1, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ff4d4d" />
        </mesh>
      </group>

      {/* --- BODY --- */}
      <mesh ref={bodyRef} position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.7, 1.2, 8, 32]} />
        <meshPhysicalMaterial 
            color="#1e293b" 
            roughness={0.4} 
            clearcoat={0.3} 
            clearcoatRoughness={0.2} 
        />
      </mesh>

      {/* --- BELLY --- */}
      <mesh position={[0, 0.7, 0.58]} scale={[0.82, 0.9, 0.5]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      {/* --- HEAD --- */}
      <group ref={headRef} position={[0, 1.6, 0]}>
         {/* BEAK */}
         <mesh ref={beakRef} position={[0, -0.1, 0.6]} rotation={[1.57, 0, 0]} castShadow>
            <coneGeometry args={[0.15, 0.4, 32]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} />
         </mesh>

         {/* EYES */}
         <mesh ref={leftEyeRef} position={[-0.25, 0.1, 0.52]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#000" roughness={0.1} metalness={0.5} />
         </mesh>
         <mesh ref={rightEyeRef} position={[0.25, 0.1, 0.52]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#000" roughness={0.1} metalness={0.5} />
         </mesh>
          
         {/* EYE HIGHLIGHTS */}
         <mesh position={[-0.28, 0.14, 0.58]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="white" />
         </mesh>
         <mesh position={[0.22, 0.14, 0.58]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="white" />
         </mesh>

         {/* BLUSH --- Using group for better management --- */}
         <group ref={blushGroupRef}>
           <mesh position={[-0.35, -0.05, 0.45]} rotation={[0, 0.5, 0]}>
              <circleGeometry args={[0.08, 16]} />
              <meshBasicMaterial color="#f472b6" opacity={0.4} transparent depthWrite={false} />
           </mesh>
           <mesh position={[0.35, -0.05, 0.45]} rotation={[0, -0.5, 0]}>
              <circleGeometry args={[0.08, 16]} />
              <meshBasicMaterial color="#f472b6" opacity={0.4} transparent depthWrite={false} />
           </mesh>
         </group>
      </group>

      {/* --- ACCESSORIES --- */}
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
