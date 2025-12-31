import { describe, it, expect, vi } from 'vitest';
import { 
  BehaviorTree, 
  Blackboard, 
  SUCCESS, 
  FAILURE, 
  RUNNING,
  Action,
  Tick,
  Inverter,
  Timeout,
  Wait
} from '../index';

class MockAction extends Action {
  tick(tick: any) {
    return this.properties.status || SUCCESS;
  }
}

describe('Extended Behavior Tree Logic (Decorators & Actions)', () => {
  it('Inverter should invert SUCCESS to FAILURE', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const node = new Inverter({
      child: new MockAction({ properties: { status: SUCCESS } })
    });

    expect(node._execute(tick)).toBe(FAILURE);
  });

  it('Inverter should invert FAILURE to SUCCESS', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const node = new Inverter({
      child: new MockAction({ properties: { status: FAILURE } })
    });

    expect(node._execute(tick)).toBe(SUCCESS);
  });

  it('Inverter should keep RUNNING as RUNNING', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const node = new Inverter({
      child: new MockAction({ properties: { status: RUNNING } })
    });

    expect(node._execute(tick)).toBe(RUNNING);
  });

  it('Wait should return RUNNING then SUCCESS after time passes', async () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const node = new Wait({ milliseconds: 100 });

    // Initial tick
    expect(node._execute(tick)).toBe(RUNNING);

    // Wait 150ms
    await new Promise(resolve => setTimeout(resolve, 150));

    // Subsequent tick
    expect(node._execute(tick)).toBe(SUCCESS);
  });

  it('Timeout should return FAILURE if child takes too long', async () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const node = new Timeout({
      timeout: 100,
      child: new MockAction({ properties: { status: RUNNING } })
    });

    // Initial tick
    expect(node._execute(tick)).toBe(RUNNING);

    // Wait 150ms
    await new Promise(resolve => setTimeout(resolve, 150));

    // Subsequent tick
    expect(node._execute(tick)).toBe(FAILURE);
  });

  it('Timeout should return SUCCESS if child finishes in time', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const node = new Timeout({
      timeout: 1000,
      child: new MockAction({ properties: { status: SUCCESS } })
    });

    expect(node._execute(tick)).toBe(SUCCESS);
  });
});

