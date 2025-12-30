import Condition from '../core/Condition';
import { SUCCESS, FAILURE } from '../constants';
import Tick from '../core/Tick';

/**
 * CheckBlackboardCondition checks if a value in the blackboard matches a criteria.
 */
export default class CheckBlackboardCondition extends Condition {
  constructor({ key = '', value = true, scope = 'tree' as 'tree' | 'global' } = {}) {
    super({ 
      name: 'CheckBlackboardCondition', 
      properties: { key, value, scope } 
    });
  }

  tick(tick: Tick): number {
    const { key, value, scope } = this.properties;
    const blackboard = tick.blackboard;
    const treeId = scope === 'tree' ? tick.tree?.id : undefined;
    
    const actualValue = blackboard?.get(key, treeId);
    
    return actualValue === value ? SUCCESS : FAILURE;
  }
}

