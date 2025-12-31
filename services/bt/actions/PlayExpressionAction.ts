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
    
    // If expressionKey is provided, override default expression with blackboard value
    if (expressionKey) {
      const kv = tick.blackboard?.get(expressionKey, tick.tree?.id);
      if (kv) expression = kv as ExpressionType;
    }

    const duration = (durationProp as number) * 1000;
    
    // Set expression output key (separate from body action)
    tick.blackboard?.set('bt_output_expression', expression);

    if (duration > 0) {
      const startTime = tick.blackboard?.get('expressionStartTime', tick.tree?.id, this.id);
      const now = Date.now();
      if (now - startTime < duration) {
        return RUNNING;
      }
    }
    
    return SUCCESS;
  }
}

