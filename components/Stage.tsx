import React from 'react';
import { Float } from '@react-three/drei';

export const Stage = () => {
  // Create curtain folds
  const curtainFolds = Array.from({ length: 20 }).map((_, i) => {
    const x = (i - 10) * 0.8;
    const z = -4 + Math.cos(i * 0.5) * 0.5; // Wavy pattern
    return (
      <mesh key={i} position={[x, 2.5, z]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 9, 16]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
    );
  });

  return (
    <group>
      {/* --- Main Stage Floor --- */}
      {/* Wood Platform */}
      <mesh position={[0, -0.8, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5.2, 0.6, 64]} />
        <meshStandardMaterial color="#3f2312" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Gold Trim */}
      <mesh position={[0, -0.8, 0]}>
         <cylinderGeometry args={[5.05, 5.05, 0.61, 64, 1, true]} />
         <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Red Carpet Runner */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0.5]} receiveShadow>
        <planeGeometry args={[2, 6]} />
        <meshStandardMaterial color="#991b1b" roughness={0.9} />
      </mesh>

      {/* --- Background --- */}
      {/* Curtain Folds */}
      <group position={[0, 0, -1]}>
         {curtainFolds}
      </group>

      {/* Back Wall (Darkness behind curtains) */}
      <mesh position={[0, 4, -6]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* --- Decorations --- */}
      {/* Neon Star */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 3, -3.5]}>
          <mesh>
            <torusGeometry args={[1.5, 0.1, 16, 5, Math.PI * 2]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <mesh rotation={[0, 0, 0.6]}>
             <torusGeometry args={[1.5, 0.05, 16, 3]} /> 
             {/* Triangle approx via low poly torus/circle */}
             <meshStandardMaterial color="#cyan" emissive="#22d3ee" emissiveIntensity={1} />
          </mesh>
        </group>
      </Float>

      {/* Truss System */}
      <group position={[0, 6, 0]}>
        <mesh rotation={[0, 0, 1.57]}>
            <cylinderGeometry args={[0.1, 0.1, 12]} />
            <meshStandardMaterial color="#333" metalness={0.8} />
        </mesh>
        {/* Fake lights on truss */}
        {[-3, -1, 1, 3].map((x, i) => (
             <mesh key={i} position={[x, -0.3, 0]}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#111" />
                <mesh position={[0, -0.2, 0]} rotation={[1.57, 0, 0]}>
                    <circleGeometry args={[0.15]} />
                    <meshBasicMaterial color="#fff" />
                </mesh>
             </mesh>
        ))}
      </group>

      {/* Floor Reflections (Fake) - Plane below purely for shadow catching extensions if needed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#000" />
      </mesh>
    </group>
  );
};
