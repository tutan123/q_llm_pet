import Composite, { CompositeOptions } from '../core/Composite';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import BaseNode from '../core/BaseNode';

/**
 * IfThenElse node.
 * children[0] is the condition.
 * children[1] is the 'then' branch.
 * children[2] is the 'else' branch (optional).
 */
export default class IfThenElse extends Composite {
  constructor({ children = [], ...options }: CompositeOptions = {}) {
    super({
      name: 'IfThenElse',
      children,
      ...options,
    });
  }

  tick(tick: Tick): number {
    const condition = this.children[0];
    const thenBranch = this.children[1];
    const elseBranch = this.children[2];

    if (!condition || !thenBranch) {
      return FAILURE;
    }

    const conditionStatus = condition._execute(tick);

    if (conditionStatus === SUCCESS) {
      return thenBranch._execute(tick);
    } else if (conditionStatus === FAILURE) {
      if (elseBranch) {
        return elseBranch._execute(tick);
      }
      return FAILURE;
    }

    return conditionStatus; // RUNNING or ERROR
  }
}

