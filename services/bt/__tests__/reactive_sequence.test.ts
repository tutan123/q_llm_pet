import { describe, it, expect, vi } from 'vitest';
import ReactiveSequence from '../composites/ReactiveSequence';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import BehaviorTree from '../core/BehaviorTree';
import Blackboard from '../core/Blackboard';

describe('ReactiveSequence Node', () => {
  it('should re-tick the first child even if it succeeded before', () => {
    const child1 = { _execute: vi.fn().mockReturnValue(SUCCESS), id: '1' } as any;
    const child2 = { _execute: vi.fn().mockReturnValue(RUNNING), id: '2' } as any;
    const reactiveSeq = new ReactiveSequence({ children: [child1, child2] });
    
    const tick = new Tick();
    tick.tree = new BehaviorTree();
    tick.blackboard = new Blackboard();
    tick._recordStatus = vi.fn();

    // First tick
    reactiveSeq.tick(tick);
    expect(child1._execute).toHaveBeenCalledTimes(1);
    expect(child2._execute).toHaveBeenCalledTimes(1);

    // Second tick - child1 should be called again!
    reactiveSeq.tick(tick);
    expect(child1._execute).toHaveBeenCalledTimes(2);
    expect(child2._execute).toHaveBeenCalledTimes(2);
  });

  it('should interrupt immediately if the first child fails on second tick', () => {
    const child1 = { _execute: vi.fn(), id: '1' } as any;
    const child2 = { _execute: vi.fn().mockReturnValue(RUNNING), id: '2' } as any;
    const reactiveSeq = new ReactiveSequence({ children: [child1, child2] });
    
    const tick = new Tick();
    tick.tree = new BehaviorTree();
    tick.blackboard = new Blackboard();
    tick._recordStatus = vi.fn();

    // First tick: child1 succeeds, child2 runs
    child1._execute.mockReturnValue(SUCCESS);
    let status = reactiveSeq.tick(tick);
    expect(status).toBe(RUNNING);
    expect(child2._execute).toHaveBeenCalled();

    // Second tick: child1 suddenly fails (environment changed)
    child1._execute.mockReturnValue(FAILURE);
    status = reactiveSeq.tick(tick);
    
    expect(status).toBe(FAILURE);
    // Child 2 should NOT be called this time because child1 failed first
    expect(child2._execute).toHaveBeenCalledTimes(1); 
  });
});

