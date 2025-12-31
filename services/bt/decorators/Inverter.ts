import Decorator, { DecoratorOptions } from '../core/Decorator';
import { SUCCESS, FAILURE, RUNNING, ERROR } from '../constants';
import Tick from '../core/Tick';

/**
 * The Inverter decorator inverts the result of its child.
 * If the child returns SUCCESS, the Inverter returns FAILURE.
 * If the child returns FAILURE, the Inverter returns SUCCESS.
 * If the child returns RUNNING, the Inverter returns RUNNING.
 */
export default class Inverter extends Decorator {
  constructor(options: DecoratorOptions = {}) {
    super({
      name: 'Inverter',
      ...options,
    });
  }

  tick(tick: Tick): number {
    if (!this.child) {
      return ERROR;
    }

    const status = this.child._execute(tick);

    if (status === SUCCESS) {
      return FAILURE;
    } else if (status === FAILURE) {
      return SUCCESS;
    }

    return status;
  }
}

