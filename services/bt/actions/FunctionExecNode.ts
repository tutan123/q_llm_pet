import Action from '../core/Action';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';

/**
 * FunctionExecNode executes tool calling results.
 **/
export default class FunctionExecNode extends Action {
  constructor({ name = 'FunctionExecNode', properties = {} } = {}) {
    super({
      name,
      properties
    });
  }

  public tick(tick: Tick): number {
    // Skeleton implementation
    console.log('Ticking FunctionExecNode');
    return SUCCESS;
  }
}

