import Decorator from '../core/Decorator';
import { SUCCESS, FAILURE } from '../constants';
import Tick from '../core/Tick';

/**
 * BlackboardGuard only ticks its child if a blackboard value matches the criteria.
 * This acts as a 'guard' or 'precondition' for a subtree.
 */
export default class BlackboardGuard extends Decorator {
  constructor({ key = '', value = true, scope = 'tree' as 'tree' | 'global', child = null, ...options }: any = {}) {
    super({
      child,
      name: 'BlackboardGuard',
      category: 'condition', // 视觉上标记为 condition 类型以应用琥珀色
      title: options.title || `Check: ${key}`,
      properties: { key, value, scope },
      ...options
    });
  }

  tick(tick: Tick): number {
    if (!this.child) {
      return SUCCESS;
    }

    const { key, value, scope } = this.properties;
    const blackboard = tick.blackboard;
    const treeId = scope === 'tree' ? tick.tree?.id : undefined;
    
    const actualValue = blackboard?.get(key, treeId);
    
    if (actualValue === value) {
      return this.child._execute(tick);
    }
    
    return FAILURE;
  }
}

