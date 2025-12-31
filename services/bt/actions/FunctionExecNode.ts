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
    
    if (!result) {
      // console.log('BT: FunctionExecNode - No result to execute');
      return FAILURE;
    }

    console.log('BT: FunctionExecNode - Executing result:', result);

    // Handle text response
    if (result.text) {
      console.log('BT: FunctionExecNode - Setting chat history text');
      // Set output key instead of calling a callback directly
      blackboard?.set('bt_output_chat_msg', { role: 'model', content: result.text });
    }

    // Handle tool results
    if (result.toolResult && result.toolResult.actions) {
      console.log('BT: FunctionExecNode - Setting pendingActions:', result.toolResult.actions);
      // 将动作存入黑板的待播放队列
      blackboard?.set('pendingActions', result.toolResult.actions, treeId);
      
      // 如果有表情数据，存入黑板
      if (result.toolResult.emotion) {
        console.log('BT: FunctionExecNode - Setting pendingEmotion:', result.toolResult.emotion);
        blackboard?.set('pendingEmotion', result.toolResult.emotion, treeId);
      } else {
        // 如果没传，默认设为 NEUTRAL
        blackboard?.set('pendingEmotion', 'NEUTRAL', treeId);
      }
      
      // Also send a text confirmation
      const actionsText = result.toolResult.actions.join(', ');
      const emotionText = result.toolResult.emotion ? ` with ${result.toolResult.emotion} expression` : '';
      
      blackboard?.set('bt_output_chat_msg', { 
        role: 'model', 
        content: `[Performing: ${actionsText}${emotionText}]`,
        isToolCall: true 
      });
    }

    // Clear result so it doesn't execute twice
    blackboard?.set('lastLLMResult', null, treeId);
    
    // 整个指令流程结束，清除输入信号，让行为树下一帧回到 IDLE 分支
    console.log('BT: FunctionExecNode - Task complete, clearing hasNewInput signal.');
    blackboard?.set('hasNewInput', false);
    
    return SUCCESS;
  }
}
