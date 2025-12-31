import Action from '../core/Action';
import { SUCCESS, RUNNING } from '../constants';
import Tick from '../core/Tick';
import { NodeOptions } from '../core/BaseNode';

interface WaitOptions extends NodeOptions {
  milliseconds?: number;
}

/**
 * The Wait node will return RUNNING for a specific amount of time, 
 * then it will return SUCCESS.
 */
export default class Wait extends Action {
  public milliseconds: number;

  constructor({ milliseconds = 1000, ...options }: WaitOptions = {}) {
    super({
      name: 'Wait',
      ...options,
    });
    this.milliseconds = milliseconds;
    this.properties.milliseconds = milliseconds;
  }

  open(tick: Tick): void {
    const startTime = Date.now();
    tick.blackboard?.set('startTime', startTime, tick.tree!.id, this.id);
  }

  tick(tick: Tick): number {
    const startTime = tick.blackboard?.get('startTime', tick.tree!.id, this.id);
    const currTime = Date.now();

    if (currTime - startTime >= this.milliseconds) {
      return SUCCESS;
    }

    return RUNNING;
  }
}

