import Action from '../core/Action';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';

/**
 * LLMCallNode calls FunctionGemma asynchronously.
 **/
export default class LLMCallNode extends Action {
  constructor({ name = 'LLMCallNode', properties = {} } = {}) {
    super({
      name,
      properties
    });
  }

  public enter(tick: Tick): void {
    // Skeleton implementation
    console.log('Entering LLMCallNode');
  }

  public tick(tick: Tick): number {
    // Skeleton implementation
    console.log('Ticking LLMCallNode');
    return SUCCESS;
  }
}

