import Action from './Action';
import { SUCCESS, FAILURE, RUNNING, ERROR } from '../constants';
import Tick from './Tick';
import { NodeOptions } from './BaseNode';

/**
 * AsyncAction provides a standard way to handle asynchronous operations
 * like LLM calls, API requests, or complex computations.
 * 
 * It automatically manages the lifecycle: idle -> processing -> success/failed.
 */
export default abstract class AsyncAction extends Action {
  protected statusKey: string = 'async_status';
  protected resultStatusKey: string = 'async_result_status';
  protected errorKey: string = 'async_error';

  constructor(options: NodeOptions = {}) {
    super(options);
  }

  /**
   * Subclasses must implement this to start the async operation.
   * Return a Promise that resolves to SUCCESS or FAILURE.
   */
  abstract performAsync(tick: Tick): Promise<number>;

  /**
   * Subclasses can optionally implement this to handle the result
   * after the promise resolves.
   */
  onAsyncComplete(tick: Tick, status: number, result: any): void {}

  open(tick: Tick): void {
    const treeId = tick.tree?.id;
    tick.blackboard?.set(this.statusKey, 'idle', treeId, this.id);
    tick.blackboard?.set(this.resultStatusKey, null, treeId, this.id);
    tick.blackboard?.set(this.errorKey, null, treeId, this.id);
  }

  tick(tick: Tick): number {
    const treeId = tick.tree?.id;
    const blackboard = tick.blackboard;
    const status = blackboard?.get(this.statusKey, treeId, this.id);

    if (status === 'idle') {
      blackboard?.set(this.statusKey, 'processing', treeId, this.id);
      
      this.performAsync(tick)
        .then((resultStatus) => {
          blackboard?.set(this.statusKey, 'completed', treeId, this.id);
          blackboard?.set(this.resultStatusKey, resultStatus, treeId, this.id);
          this.onAsyncComplete(tick, resultStatus, null);
        })
        .catch((error) => {
          blackboard?.set(this.statusKey, 'failed', treeId, this.id);
          blackboard?.set(this.errorKey, error, treeId, this.id);
          console.error(`AsyncAction [${this.name}] failed:`, error);
        });

      return RUNNING;
    }

    if (status === 'processing') {
      return RUNNING;
    }

    if (status === 'completed') {
      const resultStatus = blackboard?.get(this.resultStatusKey, treeId, this.id);
      blackboard?.set(this.statusKey, 'idle', treeId, this.id); // Reset for next activation
      return resultStatus;
    }

    if (status === 'failed') {
      blackboard?.set(this.statusKey, 'idle', treeId, this.id);
      return FAILURE;
    }

    return ERROR;
  }
}


