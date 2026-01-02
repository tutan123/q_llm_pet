import Decorator, { DecoratorOptions } from '../core/Decorator';
import { SUCCESS, FAILURE, ERROR } from '../constants';
import Tick from '../core/Tick';

/**
 * FailureIsSuccess is a decorator that returns SUCCESS if the child returns FAILURE.
 */
export default class FailureIsSuccess extends Decorator {
  constructor(options: DecoratorOptions = {}) {
    super({
      name: 'FailureIsSuccess',
      ...options,
    });
  }

  tick(tick: Tick): number {
    if (!this.child) return ERROR;

    const status = this.child._execute(tick);
    if (status === FAILURE) return SUCCESS;
    return status;
  }
}

