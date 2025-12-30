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
    const isDragging = tick.blackboard?.get('isDragging', tick.tree?.id);
    const pointerPosition = tick.blackboard?.get('pointerPosition', tick.tree?.id); // { x, y, z }
    const setPenguinPosition = tick.blackboard?.get('setPenguinPosition', tick.tree?.id);

    if (isDragging && pointerPosition && setPenguinPosition) {
      // Typically lifting up slightly on Y axis
      setPenguinPosition([pointerPosition.x, pointerPosition.y + 0.5, pointerPosition.z]);
      return RUNNING;
    }

    return SUCCESS;
  }
}

