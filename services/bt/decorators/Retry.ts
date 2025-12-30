import Decorator from '../core/Decorator';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';

/**
 * Retry is a decorator that repeats the tick signal until the child returns
 * `SUCCESS` or a maximum number of repetitions is reached.
 **/
export default class Retry extends Decorator {
  public maxAttempts: number;

  constructor({ maxAttempts = 3, child = null }: { maxAttempts?: number, child?: any } = {}) {
    super({
      child,
      name: 'Retry',
      properties: { maxAttempts }
    });
    this.maxAttempts = maxAttempts;
  }

  public open(tick: Tick): void {
    tick.blackboard?.set('retry_count', 0, tick.tree!.id, this.id);
  }

  public tick(tick: Tick): number {
    if (!this.child) {
      return FAILURE;
    }

    let retryCount = tick.blackboard?.get('retry_count', tick.tree!.id, this.id) || 0;

    while (retryCount < this.maxAttempts) {
      const status = (this.child as any)._execute(tick);

      if (status === SUCCESS) {
        return SUCCESS;
      } else if (status === FAILURE) {
        retryCount++;
        tick.blackboard?.set('retry_count', retryCount, tick.tree!.id, this.id);
      } else {
        return RUNNING;
      }
    }

    return FAILURE;
  }
}

