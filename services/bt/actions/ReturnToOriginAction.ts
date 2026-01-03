import Action from '../core/Action';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import { NodeOptions } from '../core/BaseNode';

/**
 * ReturnToOriginAction smoothly moves the penguin back to [0, -1, 0]
 */
export default class ReturnToOriginAction extends Action {
  constructor(options: NodeOptions = {}) {
    super({ 
      name: 'ReturnToOriginAction',
      ...options
    });
  }

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    
    // 位置是全局同步的
    const currentPos = blackboard?.get('penguinPosition');

    if (!currentPos) {
      return FAILURE; // 数据缺失时跳过该分支
    }

    const target: [number, number, number] = [0, -1, 0];
    
    // 计算距离
    const dx = target[0] - currentPos[0];
    const dy = target[1] - currentPos[1];
    const dz = target[2] - currentPos[2];
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

    if (distance < 0.05) {
      // console.log('BT: ReturnToOriginAction - Already at origin, returning FAILURE');
      return FAILURE;
    }

    // 每一帧移动 15% 的剩余距离
    const speed = 0.15;
    const nextPos: [number, number, number] = [
      currentPos[0] + dx * speed,
      currentPos[1] + dy * speed,
      currentPos[2] + dz * speed
    ];

    // 设置位置，并确保播放走路动画
    blackboard?.set('bt_output_action', 'WALK');
    blackboard?.set('bt_output_position', nextPos);
    return RUNNING;
  }
}

