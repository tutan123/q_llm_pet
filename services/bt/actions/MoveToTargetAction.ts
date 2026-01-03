import Action from '../core/Action';
import { SUCCESS, RUNNING, FAILURE } from '../constants';
import Tick from '../core/Tick';
import { NodeOptions } from '../core/BaseNode';

interface MoveToTargetOptions extends NodeOptions {
  targetKey?: string; // Blackboard key containing [x, y, z]
  targetPos?: [number, number, number]; // Literal position
  speed?: number;
}

/**
 * MoveToTargetAction moves the penguin towards a specific point on the stage.
 */
export default class MoveToTargetAction extends Action {
  constructor(options: MoveToTargetOptions = {}) {
    const { targetKey, targetPos, speed = 0.1, ...rest } = options;
    super({
      name: 'MoveToTargetAction',
      properties: { targetKey, targetPos, speed },
      ...rest
    });
  }

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    const treeId = tick.tree?.id;
    const { targetKey, targetPos, speed } = this.properties;
    
    // 1. Get target position
    let target = targetPos;
    if (targetKey) {
      target = blackboard?.get(targetKey);
    }

    if (!target) return FAILURE;

    // 2. Get current position
    const currentPos = blackboard?.get('penguinPosition') || [0, -1, 0];
    
    // 3. Calculate distance
    const dx = target[0] - currentPos[0];
    const dy = target[1] - currentPos[1];
    const dz = target[2] - currentPos[2];
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

    if (distance < 0.1) {
      return SUCCESS;
    }

    // 4. Move and Consume Energy (only once at start)
    if (!blackboard?.get('energyConsumed', treeId, this.id)) {
      let energy = blackboard?.get('energy') || 100;
      energy -= 5;
      blackboard?.set('energy', Math.max(0, energy));
      blackboard?.set('energyConsumed', true, treeId, this.id);
    }

    const moveSpeed = speed * (1 / 60) * 10; // Normalized speed
    const nextPos: [number, number, number] = [
      currentPos[0] + (dx / distance) * moveSpeed,
      currentPos[1] + (dy / distance) * moveSpeed,
      currentPos[2] + (dz / distance) * moveSpeed
    ];

    blackboard?.set('bt_output_action', 'WALK');
    blackboard?.set('bt_output_position', nextPos);
    
    return RUNNING;
  }

  close(tick: Tick): void {
    tick.blackboard?.set('energyConsumed', false, tick.tree?.id, this.id);
  }
}

