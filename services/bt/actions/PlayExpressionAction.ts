import Action from '../core/Action';
import { SUCCESS, RUNNING } from '../constants';
import Tick from '../core/Tick';
import { ExpressionType } from '../../../types';
import { NodeOptions } from '../core/BaseNode';

interface PlayExpressionOptions extends NodeOptions {
  expression?: ExpressionType;
  duration?: number;
  expressionKey?: string; // Optional: read expression from this blackboard key
}

/**
 * PlayExpressionAction sets the facial expression of the penguin.
 * Expressions can run independently of body animations and can be changed
 * at any time without interrupting body actions.
 */
export default class PlayExpressionAction extends Action {
  constructor(options: PlayExpressionOptions = {}) {
    const { expression = 'NEUTRAL', duration = 0, expressionKey, ...rest } = options;
    super({ 
      name: 'PlayExpressionAction',
      properties: { expression, duration, expressionKey },
      ...rest
    });
  }

  open(tick: Tick): void {
    const startTime = Date.now();
    tick.blackboard?.set('expressionStartTime', startTime, tick.tree?.id, this.id);
  }

  tick(tick: Tick): number {
    const { expressionKey, duration: durationProp } = this.properties;
    let expression = this.properties.expression as ExpressionType;
    const treeId = tick.tree?.id;
    
    // If expressionKey is provided, read from blackboard
    if (expressionKey) {
      const kv = tick.blackboard?.get(expressionKey, treeId);
      if (kv) {
        expression = kv as ExpressionType;
      } else {
        // No pending emotion, return SUCCESS without setting expression (idle state)
        return SUCCESS;
      }
    }

    const duration = (durationProp as number) * 1000;
    
    // Set expression output key (separate from body action)
    tick.blackboard?.set('bt_output_expression', expression);

    // If using expressionKey, clear it after applying to prevent continuous execution
    if (expressionKey) {
      tick.blackboard?.set(expressionKey, null, treeId);
    }

    if (duration > 0) {
      const startTime = tick.blackboard?.get('expressionStartTime', treeId, this.id);
      const now = Date.now();
      if (now - startTime < duration) {
        return RUNNING;
      } else {
        // 时长到了，自动重置回中性表情
        tick.blackboard?.set('bt_output_expression', 'NEUTRAL');
      }
    }
    
    return SUCCESS;
  }
}

