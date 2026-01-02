import Action from '../core/Action';
import { SUCCESS } from '../constants';
import Tick from '../core/Tick';

/**
 * AlwaysSuccess is an action that always returns SUCCESS.
 */
export default class AlwaysSuccess extends Action {
  constructor(options = {}) {
    super({
      name: 'AlwaysSuccess',
      ...options,
    });
  }

  tick(tick: Tick): number {
    return SUCCESS;
  }
}

