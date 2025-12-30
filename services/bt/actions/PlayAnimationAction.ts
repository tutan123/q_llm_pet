import Action from '../core/Action';
import { SUCCESS, RUNNING } from '../constants';
import Tick from '../core/Tick';
import { ActionType } from '../../../types';

/**
 * PlayAnimationAction sets the current action of the penguin.
 * If a duration is provided, it returns RUNNING until the time is up.
 */
export default class PlayAnimationAction extends Action {
  constructor({ action = 'IDLE' as ActionType, duration = 0 } = {}) {
    super({ 
      name: 'PlayAnimationAction', 
      properties: { action, duration } 
    });
  }

  open(tick: Tick): void {
    const startTime = Date.now();
    tick.blackboard?.set('startTime', startTime, tick.tree?.id, this.id);
  }

  tick(tick: Tick): number {
    const action = this.properties.action as ActionType;
    const duration = (this.properties.duration as number) * 1000;
    const setCurrentAction = tick.blackboard?.get('setCurrentAction');
    
    if (setCurrentAction) {
      setCurrentAction(action);
    }

    if (duration > 0) {
      const startTime = tick.blackboard?.get('startTime', tick.tree?.id, this.id);
      const now = Date.now();
      if (now - startTime < duration) {
        return RUNNING;
      }
    }
    
    return SUCCESS;
  }
}

