import Decorator, { DecoratorOptions } from '../core/Decorator';
import { SUCCESS, FAILURE, RUNNING, ERROR } from '../constants';
import Tick from '../core/Tick';

interface TimeoutOptions extends DecoratorOptions {
  timeout?: number;
}

/**
 * The Timeout decorator returns FAILURE if the child does not finish within 
 * the given time (in milliseconds).
 */
export default class Timeout extends Decorator {
  public timeout: number;

  constructor({ timeout = 5000, ...options }: TimeoutOptions = {}) {
    super({
      name: 'Timeout',
      ...options,
    });
    this.timeout = timeout;
    this.properties.timeout = timeout;
  }

  open(tick: Tick): void {
    const startTime = Date.now();
    tick.blackboard?.set('startTime', startTime, tick.tree!.id, this.id);
  }

  tick(tick: Tick): number {
    if (!this.child) {
      return ERROR;
    }

    const startTime = tick.blackboard?.get('startTime', tick.tree!.id, this.id);
    const currTime = Date.now();

    if (currTime - startTime > this.timeout) {
      return FAILURE;
    }

    const status = this.child._execute(tick);

    return status;
  }
}

