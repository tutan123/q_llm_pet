import Action from '../core/Action';
import { FAILURE } from '../constants';
import Tick from '../core/Tick';

/**
 * AlwaysFailure is an action that always returns FAILURE.
 */
export default class AlwaysFailure extends Action {
  constructor(options = {}) {
    super({
      name: 'AlwaysFailure',
      ...options,
    });
  }

  tick(tick: Tick): number {
    return FAILURE;
  }
}

