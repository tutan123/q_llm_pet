import Decorator, { DecoratorOptions } from '../core/Decorator';
import { SUCCESS, FAILURE, ERROR } from '../constants';
import Tick from '../core/Tick';

/**
 * SuccessIsFailure is a decorator that returns FAILURE if the child returns SUCCESS.
 */
export default class SuccessIsFailure extends Decorator {
  constructor(options: DecoratorOptions = {}) {
    super({
      name: 'SuccessIsFailure',
      ...options,
    });
  }

  tick(tick: Tick): number {
    if (!this.child) return ERROR;

    const status = this.child._execute(tick);
    if (status === SUCCESS) return FAILURE;
    return status;
  }
}

