import Composite from '../core/Composite';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';

/**
 * Parallel ticks its children simultaneously.
 **/
export default class Parallel extends Composite {
  public policy: 'SuccessOnAll' | 'SuccessOnOne';

  constructor({ policy = 'SuccessOnAll', children = [] }: { policy?: 'SuccessOnAll' | 'SuccessOnOne', children?: any[] } = {}) {
    super({
      name: 'Parallel',
      children
    });
    this.policy = policy;
  }

  public tick(tick: Tick): number {
    let successCount = 0;
    let failureCount = 0;
    const childCount = this.children.length;

    for (let i = 0; i < childCount; i++) {
      const status = this.children[i]._execute(tick);

      if (status === SUCCESS) {
        successCount++;
      } else if (status === FAILURE) {
        failureCount++;
      }
    }

    if (this.policy === 'SuccessOnOne' && successCount > 0) {
      return SUCCESS;
    }
    
    if (this.policy === 'SuccessOnAll' && successCount === childCount) {
      return SUCCESS;
    }

    if (failureCount > 0 && (this.policy === 'SuccessOnAll' || (successCount + failureCount === childCount))) {
      return FAILURE;
    }

    return RUNNING;
  }
}

