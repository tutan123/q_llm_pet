import Composite from '../core/Composite';
import { SUCCESS, RUNNING } from '../constants';
import Tick from '../core/Tick';
import { CompositeOptions } from '../core/Composite';

/**
 * ReactiveSequence ticks its children sequentially until one of them
 * returns `FAILURE`, `RUNNING` or `ERROR`.
 * 
 * Unlike a regular Sequence, a ReactiveSequence ALWAYS ticks all children 
 * from the beginning every tick, even if a child returned SUCCESS in a previous tick.
 * This is useful for continuous condition monitoring.
 **/
export default class ReactiveSequence extends Composite {
  constructor(options: CompositeOptions = {}) {
    super({
      name: 'ReactiveSequence',
      ...options
    });
  }

  public tick(tick: Tick): number {
    for (let i = 0; i < this.children.length; i++) {
      const status = this.children[i]._execute(tick);

      // In a ReactiveSequence, we don't care if it succeeded before.
      // We must check everything from the start.
      if (status !== SUCCESS) {
        // If a child is RUNNING or FAILURE, we stop and return that status.
        // Importantly, we don't "close" the previously successful children 
        // because they might be conditions that need to stay "open".
        return status;
      }
    }

    return SUCCESS;
  }
}

