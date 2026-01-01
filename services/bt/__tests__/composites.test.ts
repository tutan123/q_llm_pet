import { describe, it, expect } from 'vitest';
import MemSequence from '../composites/MemSequence';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import Blackboard from '../core/Blackboard';
import BehaviorTree from '../core/BehaviorTree';
import Action from '../core/Action';

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

describe('BT Composites', () => {
  const createTick = () => {
    const tick = new Tick();
    tick.blackboard = new Blackboard();
    tick.tree = new BehaviorTree();
    return tick;
  };

  describe('MemSequence', () => {
    it('应按顺序执行子节点直到全部成功', () => {
      const c1 = new MockAction(SUCCESS);
      const c2 = new MockAction(SUCCESS);
      const seq = new MemSequence({ children: [c1, c2] });
      const tick = createTick();
      
      seq.open(tick);
      expect(seq._execute(tick)).toBe(SUCCESS);
      expect(c1.tickCount).toBe(1);
      expect(c2.tickCount).toBe(1);
    });

    it('当子节点返回 RUNNING 时，下次 Tick 应从该节点恢复执行', () => {
      const c1 = new MockAction(SUCCESS);
      const c2 = new MockAction([RUNNING, SUCCESS]);
      const c3 = new MockAction(SUCCESS);
      const seq = new MemSequence({ children: [c1, c2, c3] });
      const tick = createTick();
      
      seq.open(tick);
      
      // 第一帧：c1 成功，c2 返回 RUNNING
      expect(seq._execute(tick)).toBe(RUNNING);
      expect(c1.tickCount).toBe(1);
      expect(c2.tickCount).toBe(1);
      expect(c3.tickCount).toBe(0);
      
      // 第二帧：直接从 c2 开始，不应再次执行 c1
      expect(seq._execute(tick)).toBe(SUCCESS);
      expect(c1.tickCount).toBe(1); // 保持为 1
      expect(c2.tickCount).toBe(2);
      expect(c3.tickCount).toBe(1);
    });

    it('任何子节点失败时应立即停止并返回 FAILURE', () => {
      const c1 = new MockAction(FAILURE);
      const c2 = new MockAction(SUCCESS);
      const seq = new MemSequence({ children: [c1, c2] });
      const tick = createTick();
      
      seq.open(tick);
      expect(seq._execute(tick)).toBe(FAILURE);
      expect(c1.tickCount).toBe(1);
      expect(c2.tickCount).toBe(0);
    });
  });
});

