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

    if (isDragging && pointerPosition) {
      // 这里的坐标已经由 App.tsx 处理过投影补偿
      // Set output key instead of calling a callback directly
      blackboard?.set('bt_output_position', [pointerPosition.x, pointerPosition.y, pointerPosition.z]);
      return RUNNING;
    }

    return SUCCESS;
  }
}

