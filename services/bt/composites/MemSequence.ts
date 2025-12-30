import Composite from '../core/Composite';
import { SUCCESS, RUNNING } from '../constants';
import Tick from '../core/Tick';

/**
 * MemSequence (Memory Sequence) keeps track of its running child.
 * It will resume from the last RUNNING child in the next tick.
 */
export default class MemSequence extends Composite {
  constructor({ children = [] } = {}) {
    super({
      name: 'MemSequence',
      children
    });
  }

  open(tick: Tick): void {
    tick.blackboard?.set('runningChild', 0, tick.tree?.id, this.id);
  }

  tick(tick: Tick): number {
    let childIdx = tick.blackboard?.get('runningChild', tick.tree?.id, this.id) || 0;

    for (let i = childIdx; i < this.children.length; i++) {
      const status = this.children[i]._execute(tick);

      if (status !== SUCCESS) {
        if (status === RUNNING) {
          tick.blackboard?.set('runningChild', i, tick.tree?.id, this.id);
        }
        return status;
      }
    }

    return SUCCESS;
  }
}

