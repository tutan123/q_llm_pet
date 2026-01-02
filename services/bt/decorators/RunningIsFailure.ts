import Decorator, { DecoratorOptions } from '../core/Decorator';
import { FAILURE, RUNNING, ERROR } from '../constants';
import Tick from '../core/Tick';

/**
 * RunningIsFailure is a decorator that returns FAILURE if the child returns RUNNING.
 */
export default class RunningIsFailure extends Decorator {
  constructor(options: DecoratorOptions = {}) {
    super({
      name: 'RunningIsFailure',
      ...options,
    });
  }

  tick(tick: Tick): number {
    if (!this.child) return ERROR;

    const status = this.child._execute(tick);
    if (status === RUNNING) return FAILURE;
    return status;
  }
}

