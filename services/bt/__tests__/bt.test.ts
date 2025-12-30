import { describe, it, expect, vi } from 'vitest';
import { 
  BehaviorTree, 
  Blackboard, 
  Sequence, 
  Priority, 
  SUCCESS, 
  FAILURE, 
  RUNNING,
  Action,
  Condition,
  Tick,
  PlayAnimationAction,
  ReturnToOriginAction,
  CheckBlackboardCondition
} from '../index';

// Mock Action that returns a status from properties
class MockAction extends Action {
  tick(tick: any) {
    return this.properties.status || SUCCESS;
  }
}

describe('Behavior Tree Core Logic', () => {
  it('Blackboard should store and retrieve global values', () => {
    const bb = new Blackboard();
    bb.set('key', 'value');
    expect(bb.get('key')).toBe('value');
  });

  it('Blackboard should store and retrieve tree-scoped values', () => {
    const bb = new Blackboard();
    bb.set('key', 'tree-value', 'tree1');
    expect(bb.get('key', 'tree1')).toBe('tree-value');
    expect(bb.get('key')).toBeUndefined();
  });

  it('Sequence should return SUCCESS only if all children succeed', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const seq = new Sequence({
      children: [
        new MockAction({ properties: { status: SUCCESS } }),
        new MockAction({ properties: { status: SUCCESS } })
      ]
    });

    const status = seq._execute(tick);
    expect(status).toBe(SUCCESS);
  });

  it('Sequence should return FAILURE if any child fails', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const seq = new Sequence({
      children: [
        new MockAction({ properties: { status: SUCCESS } }),
        new MockAction({ properties: { status: FAILURE } }),
        new MockAction({ properties: { status: SUCCESS } })
      ]
    });

    const status = seq._execute(tick);
    expect(status).toBe(FAILURE);
  });

  it('Priority (Selector) should return SUCCESS if any child succeeds', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const prio = new Priority({
      children: [
        new MockAction({ properties: { status: FAILURE } }),
        new MockAction({ properties: { status: SUCCESS } }),
        new MockAction({ properties: { status: FAILURE } })
      ]
    });

    const status = prio._execute(tick);
    expect(status).toBe(SUCCESS);
  });

  it('Priority (Selector) should return FAILURE if all children fail', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const prio = new Priority({
      children: [
        new MockAction({ properties: { status: FAILURE } }),
        new MockAction({ properties: { status: FAILURE } })
      ]
    });

    const status = prio._execute(tick);
    expect(status).toBe(FAILURE);
  });

  it('Sequence should return RUNNING if a child is running and stop there', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;
    
    const action3 = new MockAction({ properties: { status: SUCCESS } });
    const spy = vi.spyOn(action3, 'tick');

    const seq = new Sequence({
      children: [
        new MockAction({ properties: { status: SUCCESS } }),
        new MockAction({ properties: { status: RUNNING } }),
        action3
      ]
    });

    const status = seq._execute(tick);
    expect(status).toBe(RUNNING);
    expect(spy).not.toHaveBeenCalled();
  });

  it('PlayAnimationAction should return RUNNING for duration and then SUCCESS', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;

    const action = new PlayAnimationAction({ action: 'DAZZLE', duration: 0.1 }); // 100ms
    
    // First tick
    action._execute(tick); // Calls open
    let status = action._execute(tick); 
    expect(status).toBe(RUNNING);

    // Wait 150ms
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        status = action._execute(tick);
        expect(status).toBe(SUCCESS);
        resolve();
      }, 150);
    });
  });

  it('ReturnToOriginAction should move penguin towards [0, -1, 0]', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;

    const setPosition = vi.fn();
    bb.set('setPenguinPosition', setPosition);
    bb.set('penguinPosition', [1, 0, 1]); // Away from origin

    const action = new ReturnToOriginAction();
    const status = action._execute(tick);

    expect(status).toBe(RUNNING);
    expect(setPosition).toHaveBeenCalled();
    const callArgs = setPosition.mock.calls[0][0];
    // Should be closer to [0, -1, 0] than [1, 0, 1]
    expect(Math.abs(callArgs[0])).toBeLessThan(1);
    expect(callArgs[1]).toBeLessThan(0);
    expect(Math.abs(callArgs[2])).toBeLessThan(1);
  });

  it('Priority should reach subsequent branches when ReturnToOriginAction returns FAILURE (at origin)', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;

    bb.set('penguinPosition', [0, -1, 0]); // At origin
    bb.set('setPenguinPosition', vi.fn());

    const nextAction = new MockAction({ properties: { status: SUCCESS } });
    const spy = vi.spyOn(nextAction, 'tick');

    const prio = new Priority({
      children: [
        new ReturnToOriginAction(),
        nextAction
      ]
    });

    const status = prio._execute(tick);
    expect(status).toBe(SUCCESS);
    expect(spy).toHaveBeenCalled(); // Should be called because branch 1 failed
  });

  it('Priority should correctly fall through to LLM branches when idle', () => {
    const tree = new BehaviorTree();
    const bb = new Blackboard();
    const tick = new Tick();
    tick.tree = tree;
    tick.blackboard = bb;

    bb.set('penguinPosition', [0, -1, 0]);
    bb.set('isDragging', false);
    bb.set('isClicked', false);
    bb.set('hasNewInput', true); // Simulation: new message arrived

    const called = { value: false };
    class TestAction extends MockAction {
      tick(tick: any) {
        called.value = true;
        return super.tick(tick);
      }
    }
    const llmAction = new TestAction({ properties: { status: SUCCESS } });

    const root = new Priority({
      children: [
        new Sequence({ 
          children: [ 
            new CheckBlackboardCondition({ key: 'isDragging', value: true, scope: 'global' }), 
            new MockAction() 
          ] 
        }),
        new ReturnToOriginAction(),
        new Sequence({ 
          children: [ 
            new CheckBlackboardCondition({ key: 'hasNewInput', value: true, scope: 'global' }), 
            llmAction 
          ] 
        })
      ]
    });

    const status = root._execute(tick);
    expect(status).toBe(SUCCESS);
    expect(called.value).toBe(true);
  });
});

