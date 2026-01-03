import Action from '../core/Action';
import { SUCCESS, RUNNING } from '../constants';
import Tick from '../core/Tick';
import { ActionType } from '../../../types';
import { NodeOptions } from '../core/BaseNode';

interface PlayAnimationOptions extends NodeOptions {
  action?: ActionType;
  duration?: number;
}

/**
 * PlayAnimationAction sets the current action of the penguin.
 * If a duration is provided, it returns RUNNING until the time is up.
 */
export default class PlayAnimationAction extends Action {
  constructor(options: PlayAnimationOptions = {}) {
    const { action = 'IDLE', duration = 0, title, ...rest } = options;
    super({ 
      name: 'PlayAnimationAction', 
      title: title || `Animation: ${action}`,
      properties: { action, duration },
      ...rest
    });
  }

  open(tick: Tick): void {
    const startTime = Date.now();
    tick.blackboard?.set('startTime', startTime, tick.tree?.id, this.id);
  }

  tick(tick: Tick): number {
    const action = this.properties.action as ActionType;
    const duration = (this.properties.duration as number) * 1000;
    const treeId = tick.tree?.id;
    const blackboard = tick.blackboard;
    
    // Set output key
    blackboard?.set('bt_output_action', action);

    // 消耗能量逻辑：动作刚开始执行时扣除
    if (action !== 'IDLE' && action !== 'SLEEP') {
      const isJustStarted = !blackboard?.get('isOpen', treeId, this.id); // 这里逻辑稍微有点绕，因为 open() 先于 tick()
      // 我们用一个自定义 key 来标记是否已经扣过能量
      if (!blackboard?.get('energyConsumed', treeId, this.id)) {
        let energy = blackboard?.get('energy') || 100;
        energy -= 5;
        blackboard?.set('energy', Math.max(0, energy));
        blackboard?.set('energyConsumed', true, treeId, this.id);
      }
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

  close(tick: Tick): void {
    // 重置能量扣除标记，以便下次执行同一个节点时再次扣除
    tick.blackboard?.set('energyConsumed', false, tick.tree?.id, this.id);
  }
}
