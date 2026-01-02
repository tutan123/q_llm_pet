import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPenguinBT } from '../PenguinBT';
import Blackboard from '../core/Blackboard';
import Tick from '../core/Tick';
import { SUCCESS, FAILURE, RUNNING } from '../constants';

describe('PenguinBT Integration Test', () => {
  let bt: any;
  let blackboard: Blackboard;
  let tick: Tick;

  beforeEach(() => {
    bt = createPenguinBT();
    blackboard = new Blackboard();
    tick = new Tick();
    tick.blackboard = blackboard;
    tick.tree = bt;
    // 模拟 tick 内部的记录功能
    tick._recordStatus = vi.fn();
  });

  it('1. 默认状态：应执行 Idle 分支', () => {
    const status = bt.tick(null, blackboard);
    expect(status).toBe(SUCCESS); // PlayAnimationAction(IDLE) 返回 SUCCESS
    
    // 检查是否设置了动作输出
    expect(blackboard.get('bt_output_action')).toBe('IDLE');
  });

  it('2. 拖拽分支：当 isDragging 为 true 时，应执行 FollowPointer', () => {
    blackboard.set('isDragging', true);
    
    // 模拟鼠标位置
    blackboard.set('pointerPosition', { x: 10, y: 10, z: 0 });
    
    const status = bt.tick(null, blackboard);
    expect(status).toBe(RUNNING);
    
    // 检查是否输出了位置 (FollowPointerNode 输出的是数组)
    expect(blackboard.get('bt_output_position')).toEqual([10, 10, 0]);
  });

  it('3. 点击互动分支：当 isClicked 为 true 时，应执行 Dance 序列', () => {
    blackboard.set('isClicked', true);
    
    // 第一帧：开始跳舞
    const status1 = bt.tick(null, blackboard);
    expect(status1).toBe(RUNNING);
    expect(blackboard.get('bt_output_action')).toBe('DAZZLE');
    
    // 模拟时间流逝（假设持续时间是 2s）
    // 手动设置黑板里的 startTime，绕过假定时器可能存在的问题
    const treeId = bt.id;
    // 我们需要找到 PlayAnimationAction 的 nodeId。
    // 为了简单，我们直接修改黑板中存储的所有 startTime
    const states = (blackboard as any)._treeMemory[treeId].nodeMemory;
    for (const nodeId in states) {
      if (states[nodeId].startTime) {
        states[nodeId].startTime -= 3000; // 往前推 3s，确保超时
      }
    }
    
    // 下一帧：第一阶段完成，MemSequence 移动到下一个节点并完成整个序列
    const status2 = bt.tick(null, blackboard);
    expect([SUCCESS, RUNNING]).toContain(status2); 
    expect(blackboard.get('bt_output_action')).toBe('IDLE');
  });

  it('4. 回归原点分支：当不在原点且未拖拽时，应执行 ReturnToOrigin', () => {
    // 设置当前位置远离原点
    blackboard.set('penguinPosition', [5, 0, 5]);
    blackboard.set('isDragging', false);
    
    const status = bt.tick(null, blackboard);
    expect(status).toBe(RUNNING);
    
    // 检查是否产生了移动输出
    const nextPos = blackboard.get('bt_output_position');
    expect(nextPos).toBeDefined();
    expect(Array.isArray(nextPos)).toBe(true);
    expect(nextPos[0]).toBeLessThan(5); // 向 0 靠近
  });

  it('5. 指令输入分支：当 hasNewInput 为 true 时，应启动 LLM 流程', () => {
    blackboard.set('hasNewInput', true);
    blackboard.set('lastUserInput', '跳个舞');
    
    // 设置 LLM 配置，防止报错
    blackboard.set('llmSettings', { 
      provider: 'gemini', 
      apiKey: 'test-key',
      modelName: 'test-model'
    });
    
    // 模拟启动
    bt.tick(null, blackboard);
    
    // 检查黑板状态：由于我们不知道具体的 nodeId，我们遍历黑板的所有内存来验证是否有 "processing"
    const states = (blackboard as any)._treeMemory;
    let hasProcessing = false;
    for (const treeId in states) {
      const nodeMemory = states[treeId].nodeMemory;
      for (const nodeId in nodeMemory) {
        if (nodeMemory[nodeId].llm_status === 'processing') {
          hasProcessing = true;
          break;
        }
      }
    }
    expect(hasProcessing).toBe(true);
  });
});

