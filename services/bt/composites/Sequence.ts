import Composite from '../core/Composite';
import { SUCCESS } from '../constants';
import Tick from '../core/Tick';

/**
 * The Sequence node ticks its children sequentially until one of them
 * returns `FAILURE`, `RUNNING` or `ERROR`.
 **/
export default class Sequence extends Composite {
  constructor({ children = [] } = {}) {
    super({
      name: 'Sequence',
      children
    });
  }

  public tick(tick: Tick): number {
    for (let i = 0; i < this.children.length; i++) {
      const status = this.children[i]._execute(tick);

      if (status !== SUCCESS) {
        return status;
      }
    }

    return SUCCESS;
  }
}

