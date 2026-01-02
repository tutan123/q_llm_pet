import Decorator, { DecoratorOptions } from '../core/Decorator';
import { SUCCESS, RUNNING, ERROR } from '../constants';
import Tick from '../core/Tick';

/**
 * RunningIsSuccess is a decorator that returns SUCCESS if the child returns RUNNING.
 */
export default class RunningIsSuccess extends Decorator {
  constructor(options: DecoratorOptions = {}) {
    super({
      name: 'RunningIsSuccess',
      ...options,
    });
  }

  tick(tick: Tick): number {
    if (!this.child) return ERROR;

    const status = this.child._execute(tick);
    if (status === RUNNING) return SUCCESS;
    return status;
  }
}

