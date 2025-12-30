import Action from '../core/Action';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';

/**
 * ReturnToOriginAction smoothly moves the penguin back to [0, -1, 0]
 */
export default class ReturnToOriginAction extends Action {
  constructor() {
    super({ name: 'ReturnToOriginAction' });
  }

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    
    // 位置是全局同步的
    const currentPos = blackboard?.get('penguinPosition');
    const setPosition = blackboard?.get('setPenguinPosition');

    if (!currentPos || !setPosition) {
      return FAILURE; // 数据缺失时跳过该分支
    }

    const target: [number, number, number] = [0, -1, 0];
    
    // 计算距离
    const dx = target[0] - currentPos[0];
    const dy = target[1] - currentPos[1];
    const dz = target[2] - currentPos[2];
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

    if (distance < 0.05) {
      // 如果已经在原点附近，返回 FAILURE
      // 这样 Priority Selector 才能继续往下执行其他分支（如点击、LLM 指令）
      // 只有在真正执行“归位”动作过程中才返回 RUNNING
      return FAILURE;
    }

    // 每一帧移动 15% 的剩余距离
    const speed = 0.15;
    const nextPos: [number, number, number] = [
      currentPos[0] + dx * speed,
      currentPos[1] + dy * speed,
      currentPos[2] + dz * speed
    ];

    setPosition(nextPos);
    return RUNNING;
  }
}

