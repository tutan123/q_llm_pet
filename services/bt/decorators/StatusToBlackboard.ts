import Decorator, { DecoratorOptions } from '../core/Decorator';
import Tick from '../core/Tick';

interface StatusToBlackboardOptions extends DecoratorOptions {
  key: string;
}

/**
 * StatusToBlackboard decorator.
 * Writes the status of the child to the blackboard.
 */
export default class StatusToBlackboard extends Decorator {
  public key: string;

  constructor({ key, ...options }: StatusToBlackboardOptions) {
    super({
      name: 'StatusToBlackboard',
      ...options,
    });
    this.key = key;
    this.properties.key = key;
  }

  tick(tick: Tick): number {
    if (!this.child) return 2; // FAILURE

    const status = this.child._execute(tick);
    tick.blackboard?.set(this.key, status, tick.tree?.id, this.id);
    return status;
  }
}

