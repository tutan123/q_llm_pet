import Action from '../core/Action';
import { SUCCESS } from '../constants';
import Tick from '../core/Tick';
import { ActionType } from '../../../types';

/**
 * PlayAnimationAction sets the current action of the penguin.
 */
export default class PlayAnimationAction extends Action {
  constructor({ action = 'IDLE' as ActionType } = {}) {
    super({ 
      name: 'PlayAnimationAction', 
      properties: { action } 
    });
  }

  tick(tick: Tick): number {
    const action = this.properties.action as ActionType;
    const setCurrentAction = tick.blackboard?.get('setCurrentAction', tick.tree?.id);
    
    if (setCurrentAction) {
      setCurrentAction(action);
    }
    
    return SUCCESS;
  }
}

