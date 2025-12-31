import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import { ActionType } from '../../types';

export const usePenguinAnimations = (
  currentAction: ActionType,
  groupRef: React.RefObject<Group>,
  leftWingRef: React.RefObject<Mesh>,
  rightWingRef: React.RefObject<Mesh>,
  headRef: React.RefObject<Group>,
  position: [number, number, number]
) => {
  const globalTime = useRef(0);
  const actionTime = useRef(0);
  const prevAction = useRef<ActionType>('IDLE');

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

    const group = groupRef.current;
    const leftWing = leftWingRef.current;
    const rightWing = rightWingRef.current;
    const head = headRef.current;

    // --- Transforms ---
    let targetRotY = 0;
    let targetRotX = 0;
    let targetRotZ = 0;
    let lwRotZ = 0.2;
    let rwRotZ = -0.2;
    let headRotY = 0;
    
    let offsetWorldX = 0;
    let offsetWorldY = 0.5;
    let offsetWorldZ = 0;

    switch (currentAction) {
      case 'IDLE':
        offsetWorldY = 0.5 + Math.sin(t * 2) * 0.05;
        lwRotZ = 0.2 + Math.sin(t * 2) * 0.1;
        rwRotZ = -0.2 - Math.sin(t * 2) * 0.1;
        break;

      case 'WALK':
        offsetWorldY = 0.5 + Math.abs(Math.sin(t * 10)) * 0.1;
        targetRotZ = Math.sin(t * 10) * 0.2;
        lwRotZ = 0.8;
        rwRotZ = -0.8;
        break;
      
      case 'RUN':
        offsetWorldY = 0.5 + Math.abs(Math.sin(t * 20)) * 0.1;
        targetRotZ = Math.sin(t * 20) * 0.3;
        targetRotX = 0.3; 
        lwRotZ = 1.2;
        rwRotZ = -1.2;
        break;
        
      case 'RUN_ACROSS':
        const runCycle = Math.sin(at * 1.5);
        offsetWorldX = runCycle * 3.5;
        offsetWorldY = 0.5 + Math.abs(Math.sin(t * 20)) * 0.1;
        const direction = Math.cos(at * 1.5);
        targetRotY = direction > 0 ? 1.57 : -1.57;
        targetRotX = 0.3;
        lwRotZ = 1.2;
        rwRotZ = -1.2;
        break;

      case 'FLY':
        if (at > 5) {
            offsetWorldX = Math.sin(at) * 3;
            offsetWorldY = 2 + Math.sin(at * 2) * 0.5;
            offsetWorldZ = Math.cos(at) * 1.5;
        } else {
            offsetWorldY = 0.8 + Math.sin(t * 10) * 0.1;
            lwRotZ = 2.0 + Math.sin(t * 20) * 0.5;
            rwRotZ = -2.0 - Math.sin(t * 20) * 0.5;
        }
        targetRotY = at + 1.57; 
        targetRotX = 0.2; 
        break;
        
      case 'SLIDE':
        offsetWorldY = 1.2; 
        targetRotX = 1.57; 
        offsetWorldX = Math.sin(at * 2) * 2;
        const slideDir = Math.cos(at * 2);
        targetRotY = slideDir > 0 ? 1.57 : -1.57;
        lwRotZ = 3.0;
        rwRotZ = -3.0;
        break;

      case 'JUMP':
        offsetWorldY = 0.5 + Math.abs(Math.sin(at * 5)) * 1.5;
        lwRotZ = 2.5;
        rwRotZ = -2.5;
        break;

      case 'WAVE':
        lwRotZ = 0.2;
        rwRotZ = -2.5 + Math.sin(t * 15) * 0.5; 
        targetRotZ = -0.1;
        break;

      case 'DANCE':
        offsetWorldY = 0.5 + Math.abs(Math.sin(t * 8)) * 0.2;
        targetRotY = Math.sin(t * 5) * 0.5;
        lwRotZ = 2.0 + Math.sin(t * 10);
        rwRotZ = -2.0 + Math.cos(t * 10);
        break;

      case 'SPIN':
        targetRotY = t * 15;
        lwRotZ = 1.5;
        rwRotZ = -1.5;
        offsetWorldY = 0.7;
        break;

      case 'SHIVER':
        targetRotY = Math.sin(t * 50) * 0.1;
        lwRotZ = 0.5;
        rwRotZ = -0.5;
        break;
        
      case 'SLEEP':
        targetRotX = 0;
        targetRotZ = 1.57;
        offsetWorldY = 0.2;
        lwRotZ = 0.1;
        rwRotZ = -0.1;
        break;

      case 'BOW':
        targetRotX = 0.8;
        lwRotZ = 0.1;
        rwRotZ = -0.1;
        break;

      case 'HAPPY':
        offsetWorldY = 0.5 + Math.abs(Math.sin(t * 12)) * 0.5;
        lwRotZ = 2.5;
        rwRotZ = -2.5;
        break;
        
      case 'SAD':
        targetRotX = 0.2;
        headRotY = Math.sin(t * 2) * 0.2;
        lwRotZ = 0.1;
        rwRotZ = -0.1;
        offsetWorldY = 0.4;
        break;

      case 'ANGRY':
        targetRotX = -0.2;
        targetRotY = Math.sin(t * 30) * 0.1;
        lwRotZ = 1.5;
        rwRotZ = -1.5;
        break;

      case 'SURPRISE':
        offsetWorldY = 1.0;
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
        offsetWorldY = 0.8;
        lwRotZ = 3.0;
        rwRotZ = -3.0;
        break;
        
      case 'BACKFLIP':
        const flipDuration = 1.5;
        if (at < flipDuration) {
          const progress = at / flipDuration;
          offsetWorldY = 0.5 + Math.sin(progress * Math.PI) * 3.5; 
          targetRotX = progress * Math.PI * 2;
        } else {
          offsetWorldY = 0.5;
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
        offsetWorldY = 0.2;
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
        offsetWorldY = 0.8;
        lwRotZ = 2.0 + Math.sin(t * 5) * 1.0;
        rwRotZ = -2.0 - Math.sin(t * 5) * 1.0;
        break;

      case 'DAZZLE':
        targetRotY = Math.sin(t * 5) * 0.2;
        lwRotZ = 2.5 + Math.sin(t * 20) * 0.2;
        rwRotZ = -2.5 + Math.cos(t * 20) * 0.2;
        break;

      case 'HIDE':
        offsetWorldY = -0.2;
        break;

      case 'PEEK':
        offsetWorldY = 0.2 + Math.sin(t * 2) * 0.2;
        break;

      case 'LOVE':
        offsetWorldY = 0.5 + Math.abs(Math.sin(t * 5)) * 0.3;
        lwRotZ = 2.0;
        rwRotZ = -2.0;
        break;

      case 'KICK':
        targetRotZ = Math.sin(at * 10) * 0.8;
        offsetWorldY = 0.7;
        break;

      case 'PUNCH':
        lwRotZ = 1.0 + Math.sin(at * 20) * 1.5;
        break;

      case 'KUNG_FU':
        targetRotY = Math.sin(t * 5);
        lwRotZ = 1.5 + Math.sin(t * 10);
        rwRotZ = -1.5 + Math.cos(t * 10);
        offsetWorldY = 0.5 + Math.abs(Math.sin(t * 5)) * 0.5;
        break;

      case 'TAI_CHI':
        const slowT = t * 0.5;
        targetRotY = Math.sin(slowT);
        lwRotZ = 1.0 + Math.sin(slowT * 2);
        rwRotZ = -1.0 + Math.cos(slowT * 2);
        offsetWorldY = 0.5 + Math.sin(slowT) * 0.2;
        break;

      case 'MEDITATE':
        offsetWorldY = 0.3;
        lwRotZ = 0.2;
        rwRotZ = -0.2;
        headRotY = 0;
        break;

      case 'BREAKDANCE':
        targetRotX = 1.57;
        targetRotY = t * 10;
        offsetWorldY = 1.5;
        lwRotZ = 2.5;
        rwRotZ = -2.5;
        break;

      case 'BALLET':
        targetRotY = t * 4;
        offsetWorldY = 1.2;
        lwRotZ = 2.5;
        rwRotZ = -2.5;
        break;

      case 'MOONWALK':
        offsetWorldX = Math.sin(at) * 2;
        targetRotY = 1.57;
        offsetWorldY = 0.5 + Math.abs(Math.sin(at * 10)) * 0.1;
        break;

      case 'SALUTE':
        rwRotZ = -2.8;
        break;

      case 'CRY':
        targetRotX = 0.5;
        headRotY = Math.sin(t * 10) * 0.1;
        offsetWorldY = 0.4;
        break;

      case 'LAUGH':
        offsetWorldY = 0.5 + Math.abs(Math.sin(t * 15)) * 0.3;
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
        offsetWorldY = 1.2;
        targetRotX = -0.4;
        lwRotZ = 2.8;
        rwRotZ = -2.8;
        break;

      default:
        offsetWorldY = 0.5 + Math.sin(t) * 0.05;
        break;
    }

    const lerpSpeed = 0.15;
    const targetWorldX = position[0] + offsetWorldX;
    const targetWorldY = position[1] + offsetWorldY;
    const targetWorldZ = position[2] + offsetWorldZ;

    group.position.x += (targetWorldX - group.position.x) * lerpSpeed;
    group.position.y += (targetWorldY - group.position.y) * lerpSpeed;
    group.position.z += (targetWorldZ - group.position.z) * lerpSpeed;

    group.rotation.y += (targetRotY - group.rotation.y) * lerpSpeed;
    group.rotation.x += (targetRotX - group.rotation.x) * lerpSpeed;
    group.rotation.z += (targetRotZ - group.rotation.z) * lerpSpeed;

    leftWing.rotation.z += (lwRotZ - leftWing.rotation.z) * lerpSpeed;
    rightWing.rotation.z += (rwRotZ - rightWing.rotation.z) * lerpSpeed;
    
    if (head) {
        head.rotation.y += (headRotY - head.rotation.y) * lerpSpeed;
    }
  });

  return { globalTime, actionTime };
};

