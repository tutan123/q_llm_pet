import { describe, it, expect, vi } from 'vitest';
import IfThenElse from '../composites/IfThenElse';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import Blackboard from '../core/Blackboard';
import BehaviorTree from '../core/BehaviorTree';
import Action from '../core/Action';

// 模拟动作节点以便测试
class MockAction extends Action {
  status: number;
  tickCount: number = 0;
  constructor(status: number) {
    super({ name: 'MockAction' });
    this.status = status;
  }
  tick() {
    this.tickCount++;
    return this.status;
  }
}

describe('IfThenElse Node', () => {
  const createTick = () => {
    const tick = new Tick();
    tick.blackboard = new Blackboard();
    tick.tree = new BehaviorTree();
    return tick;
  };

  it('如果缺少条件或then分支，应返回 FAILURE', () => {
    const node = new IfThenElse({ children: [] });
    expect(node._execute(createTick())).toBe(FAILURE);

    const conditionOnly = new IfThenElse({ children: [new MockAction(SUCCESS)] });
    expect(conditionOnly._execute(createTick())).toBe(FAILURE);
  });

  it('当条件成功时，应执行 then 分支', () => {
    const condition = new MockAction(SUCCESS);
    const thenBranch = new MockAction(SUCCESS);
    const elseBranch = new MockAction(FAILURE);
    
    const node = new IfThenElse({ 
      children: [condition, thenBranch, elseBranch] 
    });
    
    expect(node._execute(createTick())).toBe(SUCCESS);
    expect(condition.tickCount).toBe(1);
    expect(thenBranch.tickCount).toBe(1);
    expect(elseBranch.tickCount).toBe(0); // else 应该不被执行
  });

  it('当条件失败时，应执行 else 分支', () => {
    const condition = new MockAction(FAILURE);
    const thenBranch = new MockAction(SUCCESS);
    const elseBranch = new MockAction(SUCCESS);
    
    const node = new IfThenElse({ 
      children: [condition, thenBranch, elseBranch] 
    });
    
    expect(node._execute(createTick())).toBe(SUCCESS);
    expect(condition.tickCount).toBe(1);
    expect(thenBranch.tickCount).toBe(0); // then 不应被执行
    expect(elseBranch.tickCount).toBe(1);
  });

  it('当条件失败且没有 else 分支时，应返回 FAILURE', () => {
    const condition = new MockAction(FAILURE);
    const thenBranch = new MockAction(SUCCESS);
    
    const node = new IfThenElse({ 
      children: [condition, thenBranch] 
    });
    
    expect(node._execute(createTick())).toBe(FAILURE);
    expect(condition.tickCount).toBe(1);
    expect(thenBranch.tickCount).toBe(0);
  });

  it('当条件处于 RUNNING 状态时，应返回 RUNNING', () => {
    const condition = new MockAction(RUNNING);
    const thenBranch = new MockAction(SUCCESS);
    
    const node = new IfThenElse({ 
      children: [condition, thenBranch] 
    });
    
    expect(node._execute(createTick())).toBe(RUNNING);
    expect(condition.tickCount).toBe(1);
    expect(thenBranch.tickCount).toBe(0);
  });
});

