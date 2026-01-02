import Decorator, { DecoratorOptions } from '../core/Decorator';
import { SUCCESS, FAILURE, RUNNING, ERROR } from '../constants';
import Tick from '../core/Tick';

interface RepeatOptions extends DecoratorOptions {
  count?: number;
}

/**
 * The Repeat decorator will repeat the child node a specific number of times.
 * If the count is not provided, it will repeat once.
 */
export default class Repeat extends Decorator {
  public count: number;

  constructor({ count = 1, ...options }: RepeatOptions = {}) {
    super({
      name: 'Repeat',
      ...options,
    });
    this.count = count;
    this.properties.count = count;
  }

  open(tick: Tick): void {
    tick.blackboard?.set('count', 0, tick.tree!.id, this.id);
  }

  tick(tick: Tick): number {
    if (!this.child) {
      return ERROR;
    }

    let count = tick.blackboard?.get('count', tick.tree!.id, this.id) || 0;

    if (count >= this.count) {
      return SUCCESS;
    }

    const status = this.child._execute(tick);

    if (status === SUCCESS || status === FAILURE) {
      count++;
      tick.blackboard?.set('count', count, tick.tree!.id, this.id);
      
      if (count < this.count) {
        return RUNNING;
      }
      return SUCCESS;
    }

    return status;
  }
}

