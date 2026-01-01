import { describe, it, expect, vi, beforeEach } from 'vitest';
import LLMCallNode from '../actions/LLMCallNode';
import FunctionExecNode from '../actions/FunctionExecNode';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import Blackboard from '../core/Blackboard';
import BehaviorTree from '../core/BehaviorTree';

// 模拟外部服务
vi.mock('../../llmService', () => ({
  sendMessageToLLM: vi.fn(),
}));

vi.mock('../../functionGemmaService', () => ({
  sendToFunctionGemma: vi.fn(),
}));

import { sendMessageToLLM } from '../../llmService';
import { sendToFunctionGemma } from '../../functionGemmaService';

describe('AI Interaction Nodes', () => {
  describe('LLMCallNode', () => {
    let tick: Tick;
    let blackboard: Blackboard;

    beforeEach(() => {
      blackboard = new Blackboard();
      tick = new Tick();
      tick.blackboard = blackboard;
      tick.tree = new BehaviorTree();
      vi.clearAllMocks();
    });

    it('如果没有 userInput，应返回 FAILURE', () => {
      const node = new LLMCallNode();
      node.open(tick);
      expect(node._execute(tick)).toBe(FAILURE);
    });

    it('第一次调用时应发起请求并返回 RUNNING', async () => {
      const node = new LLMCallNode();
      blackboard.set('lastUserInput', 'Hello');
      blackboard.set('llmSettings', { provider: 'gemini' });
      
      // 模拟成功返回的 Promise
      (sendMessageToLLM as any).mockReturnValue(Promise.resolve({ text: 'Hi' }));

      node.open(tick);
      const result = node._execute(tick);
      
      expect(result).toBe(RUNNING);
      expect(sendMessageToLLM).toHaveBeenCalled();
      expect(blackboard.get('llm_status', tick.tree!.id, node.id)).toBe('processing');
    });

    it('正在处理时应保持返回 RUNNING', () => {
      const node = new LLMCallNode();
      blackboard.set('lastUserInput', 'Hello');
      blackboard.set('llmSettings', { provider: 'gemini' });
      (sendMessageToLLM as any).mockReturnValue(new Promise(() => {}));
      
      node._execute(tick); // 第一次执行，触发 open 并发起请求
      expect(blackboard.get('llm_status', tick.tree!.id, node.id)).toBe('processing');
      
      expect(node._execute(tick)).toBe(RUNNING);
    });

    it('成功获取响应后应返回 SUCCESS 并清理状态', () => {
      const node = new LLMCallNode();
      blackboard.set('lastUserInput', 'Hello');
      blackboard.set('llmSettings', { provider: 'gemini' });
      (sendMessageToLLM as any).mockReturnValue(Promise.resolve({ text: 'Hi' }));

      node._execute(tick); // Open and start
      
      const mockResponse = { text: 'Hi' };
      blackboard.set('llm_status', 'success', tick.tree!.id, node.id);
      blackboard.set('llm_response', mockResponse, tick.tree!.id, node.id);
      
      const result = node._execute(tick);
      
      expect(result).toBe(SUCCESS);
      expect(blackboard.get('lastLLMResult', tick.tree!.id)).toBe(mockResponse);
      expect(blackboard.get('llm_status', tick.tree!.id, node.id)).toBe('idle');
      expect(blackboard.get('lastUserInput')).toBe(null);
    });

    it('调用失败时应返回 FAILURE', () => {
      const node = new LLMCallNode();
      node.open(tick);
      blackboard.set('llm_status', 'failed', tick.tree!.id, node.id);
      blackboard.set('llm_error', 'Network Error', tick.tree!.id, node.id);
      
      const result = node._execute(tick);
      
      expect(result).toBe(FAILURE);
      expect(blackboard.get('llm_status', tick.tree!.id, node.id)).toBe('idle');
    });
  });

  describe('FunctionExecNode', () => {
    let tick: Tick;
    let blackboard: Blackboard;

    beforeEach(() => {
      blackboard = new Blackboard();
      tick = new Tick();
      tick.blackboard = blackboard;
      tick.tree = new BehaviorTree();
    });

    it('如果没有 lastLLMResult，应返回 FAILURE', () => {
      const node = new FunctionExecNode();
      expect(node._execute(tick)).toBe(FAILURE);
    });

    it('应正确处理纯文本响应', () => {
      const node = new FunctionExecNode();
      const mockResult = { text: '你好呀' };
      blackboard.set('lastLLMResult', mockResult, tick.tree!.id);
      
      expect(node._execute(tick)).toBe(SUCCESS);
      expect(blackboard.get('bt_output_chat_msg')).toEqual({ role: 'model', content: '你好呀' });
      expect(blackboard.get('lastLLMResult', tick.tree!.id)).toBe(null);
      expect(blackboard.get('hasNewInput')).toBe(false);
    });

    it('应正确处理工具调用（动作和表情）', () => {
      const node = new FunctionExecNode();
      const mockResult = { 
        toolResult: { 
          actions: ['WAVE', 'JUMP'],
          emotion: 'HAPPY'
        } 
      };
      blackboard.set('lastLLMResult', mockResult, tick.tree!.id);
      
      expect(node._execute(tick)).toBe(SUCCESS);
      expect(blackboard.get('pendingActions', tick.tree!.id)).toEqual(['WAVE', 'JUMP']);
      expect(blackboard.get('pendingEmotion', tick.tree!.id)).toBe('HAPPY');
      expect(blackboard.get('bt_output_chat_msg')).toMatchObject({ 
        role: 'model', 
        isToolCall: true 
      });
    });

    it('当没有提供表情数据时，应默认为 NEUTRAL', () => {
      const node = new FunctionExecNode();
      const mockResult = { 
        toolResult: { 
          actions: ['WAVE']
        } 
      };
      blackboard.set('lastLLMResult', mockResult, tick.tree!.id);
      
      node._execute(tick);
      expect(blackboard.get('pendingEmotion', tick.tree!.id)).toBe('NEUTRAL');
    });
  });
});
