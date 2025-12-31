import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import { ExpressionType } from '../../types';

export const usePenguinExpressions = (
  currentExpression: ExpressionType,
  leftEyeRef: React.RefObject<Mesh>,
  rightEyeRef: React.RefObject<Mesh>,
  beakRef: React.RefObject<Mesh>,
  blushGroupRef: React.RefObject<Group>,
  heartRef: React.RefObject<Group>,
  headRef: React.RefObject<Group>,
  globalTime: React.MutableRefObject<number>
) => {
  useFrame(() => {
    const leftEye = leftEyeRef.current;
    const rightEye = rightEyeRef.current;
    const beak = beakRef.current;
    const blushGroup = blushGroupRef.current;
    const heartGroup = heartRef.current;
    const head = headRef.current;
    const t = globalTime.current;

    if (leftEye && rightEye && beak && blushGroup && heartGroup && head) {
      let eyeScaleY = 1;
      let eyeScaleX = 1;
      let eyeRotZ = 0;
      let blushOpacity = 0.4;
      let beakRotX = 1.57; // Default rotation for beak (cone)
      let heartScale = 0;

      // Auto-blink logic
      const isBlinking = (t % 4) < 0.15;
      
      switch (currentExpression) {
        case 'HAPPY':
          eyeScaleY = 0.7;
          eyeScaleX = 1.2;
          blushOpacity = 0.8;
          break;
        case 'SAD':
          eyeScaleY = 1.2;
          eyeScaleX = 0.8;
          eyeRotZ = 0.2;
          blushOpacity = 0.1;
          break;
        case 'ANGRY':
          eyeScaleY = 0.5;
          eyeScaleX = 1.2;
          eyeRotZ = -0.3;
          blushOpacity = 0;
          break;
        case 'SURPRISED':
          eyeScaleY = 1.5;
          eyeScaleX = 1.5;
          beakRotX = 1.2; // Open beak
          blushOpacity = 0.6;
          break;
        case 'EXCITED':
          eyeScaleY = 1.3 + Math.sin(t * 10) * 0.2;
          eyeScaleX = 1.3 + Math.cos(t * 10) * 0.2;
          blushOpacity = 1.0;
          break;
        case 'SLEEPY':
          eyeScaleY = 0.1;
          blushOpacity = 0.2;
          break;
        case 'LOVING':
          eyeScaleY = 1.1;
          blushOpacity = 1.0;
          heartScale = 1.0 + Math.sin(t * 5) * 0.2;
          break;
        case 'CONFUSED':
          eyeScaleY = 1.0;
          eyeScaleX = 1.0;
          head.rotation.z = Math.sin(t * 2) * 0.3;
          break;
        case 'BLINK':
          eyeScaleY = 0.1;
          break;
        default: // NEUTRAL
          if (isBlinking) eyeScaleY = 0.1;
          break;
      }

      // Smoothly apply expression values
      const lerpFactor = 0.2;
      leftEye.scale.y += (eyeScaleY - leftEye.scale.y) * lerpFactor;
      leftEye.scale.x += (eyeScaleX - leftEye.scale.x) * lerpFactor;
      leftEye.rotation.z += (eyeRotZ - leftEye.rotation.z) * lerpFactor;

      rightEye.scale.y += (eyeScaleY - rightEye.scale.y) * lerpFactor;
      rightEye.scale.x += (eyeScaleX - rightEye.scale.x) * lerpFactor;
      rightEye.rotation.z += (-eyeRotZ - rightEye.rotation.z) * lerpFactor;

      beak.rotation.x += (beakRotX - beak.rotation.x) * lerpFactor;

      blushGroup.children.forEach((child: any) => {
        if (child.material) {
          child.material.opacity += (blushOpacity - child.material.opacity) * 0.1;
        }
      });

      heartGroup.scale.setScalar(heartGroup.scale.x + (heartScale - heartGroup.scale.x) * lerpFactor);
      if (heartScale > 0.1) {
        heartGroup.position.y = 2.2 + Math.sin(t * 3) * 0.2;
        heartGroup.rotation.y = Math.sin(t * 2) * 0.5;
      } else {
        // Reset head rotation Z when not confused
        if (currentExpression !== 'CONFUSED') {
          head.rotation.z += (0 - head.rotation.z) * 0.1;
        }
      }
    }
  });
};

