import { describe, it, expect, vi } from 'vitest';
import Priority from '../composites/Priority';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import BehaviorTree from '../core/BehaviorTree';
import Blackboard from '../core/Blackboard';
import BaseNode from '../core/BaseNode';

describe('Priority Node Logic', () => {
  it('should return SUCCESS if one child returns SUCCESS', () => {
    const child1 = { _execute: vi.fn().mockReturnValue(FAILURE), id: '1' } as any;
    const child2 = { _execute: vi.fn().mockReturnValue(SUCCESS), id: '2' } as any;
    const priority = new Priority({ children: [child1, child2] });
    
    const tick = new Tick();
    tick.tree = new BehaviorTree();
    tick.blackboard = new Blackboard();
    tick._recordStatus = vi.fn();

    const status = priority.tick(tick);
    expect(status).toBe(SUCCESS);
    expect(child1._execute).toHaveBeenCalled();
    expect(child2._execute).toHaveBeenCalled();
  });

  it('should return FAILURE if all children return FAILURE', () => {
    const child1 = { _execute: vi.fn().mockReturnValue(FAILURE), id: '1' } as any;
    const child2 = { _execute: vi.fn().mockReturnValue(FAILURE), id: '2' } as any;
    const priority = new Priority({ children: [child1, child2] });
    
    const tick = new Tick();
    tick.tree = new BehaviorTree();
    tick.blackboard = new Blackboard();
    tick._recordStatus = vi.fn();

    const status = priority.tick(tick);
    expect(status).toBe(FAILURE);
    expect(child1._execute).toHaveBeenCalled();
    expect(child2._execute).toHaveBeenCalled();
  });

  it('should return RUNNING if a child returns RUNNING', () => {
    const child1 = { _execute: vi.fn().mockReturnValue(FAILURE), id: '1' } as any;
    const child2 = { _execute: vi.fn().mockReturnValue(RUNNING), id: '2' } as any;
    const child3 = { _execute: vi.fn().mockReturnValue(SUCCESS), id: '3' } as any;
    const priority = new Priority({ children: [child1, child2, child3] });
    
    const tick = new Tick();
    tick.tree = new BehaviorTree();
    tick.blackboard = new Blackboard();
    tick._recordStatus = vi.fn();

    const status = priority.tick(tick);
    expect(status).toBe(RUNNING);
    expect(child1._execute).toHaveBeenCalled();
    expect(child2._execute).toHaveBeenCalled();
    expect(child3._execute).not.toHaveBeenCalled();
  });

  it('should stop executing children after a success', () => {
    const child1 = { _execute: vi.fn().mockReturnValue(SUCCESS), id: '1' } as any;
    const child2 = { _execute: vi.fn().mockReturnValue(SUCCESS), id: '2' } as any;
    const priority = new Priority({ children: [child1, child2] });
    
    const tick = new Tick();
    tick.tree = new BehaviorTree();
    tick.blackboard = new Blackboard();
    tick._recordStatus = vi.fn();

    const status = priority.tick(tick);
    expect(status).toBe(SUCCESS);
    expect(child1._execute).toHaveBeenCalled();
    expect(child2._execute).not.toHaveBeenCalled();
  });
});

