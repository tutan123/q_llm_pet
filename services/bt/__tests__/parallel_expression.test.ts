import { describe, it, expect, vi } from 'vitest';
import Parallel from '../composites/Parallel';
import PlayAnimationAction from '../actions/PlayAnimationAction';
import PlayExpressionAction from '../actions/PlayExpressionAction';
import { SUCCESS, RUNNING } from '../constants';
import Tick from '../core/Tick';
import BehaviorTree from '../core/BehaviorTree';
import Blackboard from '../core/Blackboard';

describe('Parallel: Expression + Action', () => {
  it('should execute expression and action simultaneously', () => {
    const parallel = new Parallel({
      title: 'Dance with Happy Expression',
      policy: 'SuccessOnAll',
      children: [
        new PlayAnimationAction({ action: 'DANCE', duration: 2 }),
        new PlayExpressionAction({ expression: 'HAPPY', duration: 2 })
      ]
    });
    
    const tick = new Tick();
    tick.tree = new BehaviorTree();
    tick.blackboard = new Blackboard();
    tick._recordStatus = vi.fn();

    // First tick: both should set their outputs
    const status1 = parallel.tick(tick);
    expect(status1).toBe(RUNNING);
    
    const action = tick.blackboard.get('bt_output_action');
    const expression = tick.blackboard.get('bt_output_expression');
    
    expect(action).toBe('DANCE');
    expect(expression).toBe('HAPPY');
  });

  it('should set both outputs in the same tick', () => {
    const parallel = new Parallel({
      policy: 'SuccessOnAll',
      children: [
        new PlayAnimationAction({ action: 'FLY' }), // No duration, returns SUCCESS immediately
        new PlayExpressionAction({ expression: 'SURPRISED' }) // No duration, returns SUCCESS immediately
      ]
    });
    
    const tick = new Tick();
    tick.tree = new BehaviorTree();
    tick.blackboard = new Blackboard();
    tick._recordStatus = vi.fn();

    const status = parallel.tick(tick);
    expect(status).toBe(SUCCESS);
    
    // Both should be set
    expect(tick.blackboard.get('bt_output_action')).toBe('FLY');
    expect(tick.blackboard.get('bt_output_expression')).toBe('SURPRISED');
  });
});

