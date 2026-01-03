import { describe, it, expect, vi } from 'vitest';
import AsyncAction from '../core/AsyncAction';
import BehaviorTree from '../core/BehaviorTree';
import Blackboard from '../core/Blackboard';
import Tick from '../core/Tick';
import { SUCCESS, RUNNING } from '../constants';
import { BTProfiler } from '../profiling';

class MockAsyncAction extends AsyncAction {
  public callCount = 0;
  public shouldSucceed = true;

  async performAsync(tick: Tick): Promise<number> {
    this.callCount++;
    return new Promise((resolve) => {
      // 在异步任务中模拟一点延迟
      setTimeout(() => {
        resolve(this.shouldSucceed ? SUCCESS : 0);
      }, 50);
    });
  }
}

describe('BT Advanced Features (Phase 4)', () => {
  describe('AsyncAction', () => {
    it('should manage lifecycle correctly', async () => {
      const node = new MockAsyncAction({ name: 'TestAsync' });
      const blackboard = new Blackboard();
      const tree = new BehaviorTree();
      tree.root = node;

      // 1. First tick -> status: idle -> starts async -> returns RUNNING
      const status1 = tree.tick(null, blackboard);
      expect(status1).toBe(RUNNING);
      expect(node.callCount).toBe(1);

      // 2. Second tick -> status: processing -> returns RUNNING
      const status2 = tree.tick(null, blackboard);
      expect(status2).toBe(RUNNING);
      expect(node.callCount).toBe(1);

      // 3. 等待异步任务真正完成
      await new Promise(r => setTimeout(r, 100));

      // 4. Third tick -> status: completed -> returns SUCCESS
      const status3 = tree.tick(null, blackboard);
      expect(status3).toBe(SUCCESS);
    });
  });

  describe('BTProfiler', () => {
    it('should measure and store node durations', async () => {
      const blackboard = new Blackboard();
      const tree = new BehaviorTree();
      
      class HeavyNode extends AsyncAction {
          async performAsync() { return SUCCESS; }
          tick() {
              // 简单的同步延迟模拟
              const end = Date.now() + 20;
              while(Date.now() < end) {} 
              return SUCCESS;
          }
      }

      tree.root = new HeavyNode();
      tree.tick(null, blackboard);

      const durations = BTProfiler.getAllDurations(blackboard, tree.id);
      expect(durations[tree.root.id]).toBeGreaterThanOrEqual(15);

      const summary = BTProfiler.getTickSummary(blackboard, tree.id);
      expect(summary.totalExecutionTime).toBeGreaterThanOrEqual(15);
      expect(summary.slowestNode.id).toBe(tree.root.id);
    });
  });
});
