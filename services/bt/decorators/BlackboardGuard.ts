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
    
    // 增强逻辑：支持函数判定、数字比较、以及普通相等判定
    if (typeof value === 'function') {
      if (value(actualValue)) return this.child._execute(tick);
    } else if (typeof actualValue === 'number' && typeof value === 'number') {
      // 针对 energy 这种数值，如果 key 是 energy 且实际值小于等于设定值，触发
      if (key === 'energy') {
        if (actualValue <= value) return this.child._execute(tick);
      } else {
        // 默认大于等于判定 (用于 boredom 等)
        if (actualValue >= value) return this.child._execute(tick);
      }
    } else if (actualValue === value) {
      return this.child._execute(tick);
    }
    
    return FAILURE;
  }
}

