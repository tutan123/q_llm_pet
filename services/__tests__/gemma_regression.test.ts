import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendToFunctionGemma } from '../functionGemmaService';
import FunctionExecNode from '../bt/actions/FunctionExecNode';
import Tick from '../bt/core/Tick';
import Blackboard from '../bt/core/Blackboard';
import BehaviorTree from '../bt/core/BehaviorTree';

// Mock global fetch
global.fetch = vi.fn();

describe('FunctionGemma Regression Test (专项回归测试)', () => {
  let tick: Tick;
  let blackboard: Blackboard;

  beforeEach(() => {
    blackboard = new Blackboard();
    tick = new Tick();
    tick.blackboard = blackboard;
    tick.tree = new BehaviorTree();
    vi.clearAllMocks();
  });

  it('Gemma 路径解析应依然保持正确且兼容新 ExecNode', async () => {
    // 1. 模拟 Gemma 原始返回 (正则路径)
    const mockResponse = {
      choices: [{
        message: {
          content: "我要跳舞啦！ <start_function_call>call:animate_avatar{actions:['DANCE'], emotion:'HAPPY'}<end_function_call>"
        }
      }]
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const settings: any = { provider: 'functiongemma', baseUrl: 'http://localhost:8000', modelName: 'pet-model' };
    const result = await sendToFunctionGemma([], "跳个舞", settings);
    
    // 验证 Service 解析没坏
    expect(result.text).toBe("我要跳舞啦！");
    expect(result.toolResult).toEqual({ actions: ['DANCE'], emotion: 'HAPPY' });

    // 2. 模拟行为树执行 (验证新 ExecNode 是否兼容)
    blackboard.set('lastLLMResult', result, tick.tree!.id);
    const execNode = new FunctionExecNode();
    execNode.tick(tick);

    const chatMsgs = blackboard.get('bt_output_chat_msgs');
    
    // 验证：Gemma 虽然没 toolCalls 数据，但依然能正确生成气泡
    expect(chatMsgs).toBeDefined();
    expect(chatMsgs.length).toBeGreaterThanOrEqual(2);
    expect(chatMsgs[0].content).toBe("我要跳舞啦！");
    expect(chatMsgs[1].isToolCall).toBe(true);
    expect(chatMsgs[1].content).toContain("DANCE");
    
    // 验证：3D 动作指令依然正确下发
    expect(blackboard.get('pendingActions', tick.tree!.id)).toEqual(['DANCE']);
    expect(blackboard.get('pendingEmotion', tick.tree!.id)).toBe('HAPPY');
  });
});

