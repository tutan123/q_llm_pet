import Action from '../core/Action';
import { SUCCESS, RUNNING } from '../constants';
import Tick from '../core/Tick';

/**
 * FollowPointerNode updates the penguin's position to follow the pointer when dragging.
 */
export default class FollowPointerNode extends Action {
  constructor() {
    super({ name: 'FollowPointerNode' });
  }

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    // 显式从全局作用域获取数据
    const isDragging = blackboard?.get('isDragging');
    const pointerPosition = blackboard?.get('pointerPosition'); // { x, y, z }
    const setPenguinPosition = blackboard?.get('setPenguinPosition');

    if (isDragging && pointerPosition && setPenguinPosition) {
      // 这里的坐标已经由 App.tsx 处理过投影补偿
      setPenguinPosition([pointerPosition.x, pointerPosition.y, pointerPosition.z]);
      return RUNNING;
    }

    return SUCCESS;
  }
}

