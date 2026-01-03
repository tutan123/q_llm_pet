import Action from '../core/Action';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import { ActionType } from '../../../types';
import { ACTION_DURATIONS } from '../../../constants';
import { NodeOptions } from '../core/BaseNode';

/**
 * ExecuteActionSequence handles a list of actions sequentially within the BT.
 */
export default class ExecuteActionSequence extends Action {
  constructor(options: NodeOptions = {}) {
    super({ 
      name: 'ExecuteActionSequence',
      ...options
    });
  }

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    const treeId = tick.tree?.id;
    const actions = blackboard?.get('pendingActions', treeId) || [];
    const setCurrentAction = blackboard?.get('setCurrentAction');

    if (actions.length === 0) {
      return FAILURE;
    }

    const currentIdx = blackboard?.get('currentSequenceIdx', treeId, this.id) || 0;
    const startTime = blackboard?.get('sequenceStartTime', treeId, this.id) || 0;
    const now = Date.now();

    if (currentIdx >= actions.length) {
      // Sequence finished
      blackboard?.set('pendingActions', [], treeId);
      blackboard?.set('currentSequenceIdx', 0, treeId, this.id);
      blackboard?.set('sequenceStartTime', 0, treeId, this.id);
      
      return SUCCESS;
    }

    const action = actions[currentIdx] as ActionType;
    const duration = (ACTION_DURATIONS[action] || 3) * 1000;

    if (startTime === 0) {
      blackboard?.set('bt_output_action', action);
      blackboard?.set('sequenceStartTime', now, treeId, this.id);
      
      // 消耗能量逻辑：每个新动作开始时扣 5 点
      if (action !== 'IDLE' && action !== 'SLEEP') {
        let energy = blackboard?.get('energy') || 100;
        energy -= 5;
        blackboard?.set('energy', Math.max(0, energy));
      }
      
      return RUNNING;
    }

    const elapsed = now - startTime;
    if (elapsed >= duration) {
      blackboard?.set('currentSequenceIdx', currentIdx + 1, treeId, this.id);
      blackboard?.set('sequenceStartTime', 0, treeId, this.id);
      return RUNNING;
    }

    return RUNNING;
  }
}

