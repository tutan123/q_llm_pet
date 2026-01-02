import { describe, it, expect } from 'vitest';
import Retry from '../decorators/Retry';
import Inverter from '../decorators/Inverter';
import Timeout from '../decorators/Timeout';
import BlackboardGuard from '../decorators/BlackboardGuard';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import Blackboard from '../core/Blackboard';
import Action from '../core/Action';
import BehaviorTree from '../core/BehaviorTree';

class MockAction extends Action {
  status: any;
  tickCount: number = 0;
  constructor(status: any) {
    super({ name: 'MockAction' });
    this.status = status;
  }
  tick() {
    const currentStatus = Array.isArray(this.status) 
        ? this.status[this.tickCount] 
        : this.status;
    this.tickCount++;
    return currentStatus;
  }
}

describe('BT Decorators', () => {
  const createTick = () => {
    const tick = new Tick();
    tick.blackboard = new Blackboard();
    tick.tree = new BehaviorTree(); // Retry 需要 tree.id
    return tick;
  };

  describe('Retry Decorator', () => {
    it('如果子节点成功，应立即返回 SUCCESS', () => {
      const child = new MockAction(SUCCESS);
      const retry = new Retry({ child, maxAttempts: 3 });
      const tick = createTick();
      
      retry.open(tick);
      expect(retry._execute(tick)).toBe(SUCCESS);
      expect(child.tickCount).toBe(1);
    });

    it('如果子节点失败，应重试直到达到 maxAttempts', () => {
      const child = new MockAction(FAILURE);
      const retry = new Retry({ child, maxAttempts: 3 });
      const tick = createTick();
      
      retry.open(tick);
      expect(retry._execute(tick)).toBe(FAILURE);
      expect(child.tickCount).toBe(3); // 执行了3次
    });

    it('如果在重试过程中子节点成功，应停止并返回 SUCCESS', () => {
      // 模拟前两次失败，第三次成功
      const child = new MockAction([FAILURE, FAILURE, SUCCESS]);
      const retry = new Retry({ child, maxAttempts: 5 });
      const tick = createTick();
      
      retry.open(tick);
      expect(retry._execute(tick)).toBe(SUCCESS);
      expect(child.tickCount).toBe(3);
    });

    it('如果子节点返回 RUNNING，应停止重试并返回 RUNNING', () => {
      const child = new MockAction(RUNNING);
      const retry = new Retry({ child, maxAttempts: 3 });
      const tick = createTick();
      
      retry.open(tick);
      expect(retry._execute(tick)).toBe(RUNNING);
      expect(child.tickCount).toBe(1);
    });
  });

  describe('Inverter Decorator', () => {
      it('应反转成功为失败，失败为成功', () => {
          const successAction = new MockAction(SUCCESS);
          const failureAction = new MockAction(FAILURE);
          const runningAction = new MockAction(RUNNING);

          expect(new Inverter({ child: successAction })._execute(createTick())).toBe(FAILURE);
          expect(new Inverter({ child: failureAction })._execute(createTick())).toBe(SUCCESS);
          expect(new Inverter({ child: runningAction })._execute(createTick())).toBe(RUNNING);
      });
  });

  describe('BlackboardGuard Decorator', () => {
    it('如果条件满足，应执行子节点', () => {
      const child = new MockAction(SUCCESS);
      const guard = new BlackboardGuard({ 
        child, 
        key: 'testKey', 
        value: 'testValue',
        scope: 'global' 
      });
      const tick = createTick();
      tick.blackboard.set('testKey', 'testValue');
      
      expect(guard._execute(tick)).toBe(SUCCESS);
      expect(child.tickCount).toBe(1);
    });

    it('如果条件不满足，应返回 FAILURE 且不执行子节点', () => {
      const child = new MockAction(SUCCESS);
      const guard = new BlackboardGuard({ 
        child, 
        key: 'testKey', 
        value: 'correctValue',
        scope: 'global' 
      });
      const tick = createTick();
      tick.blackboard.set('testKey', 'wrongValue');
      
      expect(guard._execute(tick)).toBe(FAILURE);
      expect(child.tickCount).toBe(0);
    });

    it('应支持 tree 作用域的检查', () => {
      const child = new MockAction(SUCCESS);
      const guard = new BlackboardGuard({ 
        child, 
        key: 'localKey', 
        value: true,
        scope: 'tree' 
      });
      const tick = createTick();
      tick.blackboard.set('localKey', true, tick.tree.id);
      
      expect(guard._execute(tick)).toBe(SUCCESS);
    });
  });
});

