import Action from '../core/Action';
import { SUCCESS, FAILURE } from '../constants';
import Tick from '../core/Tick';
import { NodeOptions } from '../core/BaseNode';

/**
 * FunctionExecNode executes the tool calling results from LLM.
 */
export default class FunctionExecNode extends Action {
  constructor(options: NodeOptions = {}) {
    super({ 
      name: 'FunctionExecNode',
      ...options
    });
  }

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    const treeId = tick.tree?.id;
    const result = blackboard?.get('lastLLMResult', treeId);
    const rawToolCalls = blackboard?.get('llm_raw_tool_calls', treeId);
    
    if (!result) {
      return FAILURE;
    }

    console.log('BT: FunctionExecNode - Executing result:', result);

    const outputs: any[] = [];

    // --- 1. 协议记录 (OpenAI Protocol Message) ---
    // 这一条消息必须存在，用于关联 tool_calls 数据，哪怕 content 为空。
    // 这条消息在 customLLMService 中会被还原为标准的 assistant 消息。
    outputs.push({ 
      role: 'model', 
      content: result.text || "", 
      toolCalls: rawToolCalls,
      isProtocol: true // 显式标记为协议消息
    });

    // --- 2. 交互逻辑与 UI 气泡 ---
    if (result.toolResult && result.toolResult.actions) {
      // 执行 3D 动作
      blackboard?.set('pendingActions', result.toolResult.actions, treeId);
      blackboard?.set('pendingEmotion', result.toolResult.emotion || 'NEUTRAL', treeId);
      
      const actionsText = result.toolResult.actions.join(', ');
      const emotionText = result.toolResult.emotion ? ` with ${result.toolResult.emotion} expression` : '';
      
      // 添加黄色 UI 气泡 (仅展示用)
      outputs.push({ 
        role: 'model', 
        content: `[Performing: ${actionsText}${emotionText}]`,
        isToolCall: true 
      });

      // --- 3. 协议确认 (OpenAI Tool Confirmation) ---
      if (result.toolResult.toolCallId) {
        outputs.push({
          role: 'tool',
          toolCallId: result.toolResult.toolCallId,
          content: "success",
          isProtocol: true
        });
      }
    }

    // 发送消息流到 UI
    if (outputs.length > 0) {
      blackboard?.set('bt_output_chat_msgs', outputs);
      // 为了向后兼容测试：
      // 1. 如果只有一条非协议消息，设置单数格式
      // 2. 如果只有一条协议消息且没有toolResult，也设置单数格式（纯文本响应）
      const nonProtocolOutputs = outputs.filter(o => !o.isProtocol);
      if (nonProtocolOutputs.length === 1) {
        blackboard?.set('bt_output_chat_msg', nonProtocolOutputs[0]);
      } else if (outputs.length === 1 && !result.toolResult && outputs[0].content) {
        // 纯文本响应：只有一条协议消息，且content不为空
        blackboard?.set('bt_output_chat_msg', { role: 'model', content: outputs[0].content });
      }
    }

    // 清理状态
    blackboard?.set('lastLLMResult', null, treeId);
    blackboard?.set('llm_raw_tool_calls', null, treeId);
    blackboard?.set('hasNewInput', false);
    
    return SUCCESS;
  }
}
