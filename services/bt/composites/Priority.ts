import Composite from '../core/Composite';
import { FAILURE } from '../constants';
import Tick from '../core/Tick';

/**
 * Priority ticks its children sequentially until one of them returns
 * `SUCCESS`, `RUNNING` or `ERROR`.
 **/
export default class Priority extends Composite {
  constructor({ children = [] } = {}) {
    super({
      name: 'Priority',
      children
    });
  }

  public tick(tick: Tick): number {
    for (let i = 0; i < this.children.length; i++) {
      const status = this.children[i]._execute(tick);

      if (status !== FAILURE) {
        return status;
      }
    }

    return FAILURE;
  }
}

