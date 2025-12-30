import Action from '../core/Action';
import { SUCCESS, FAILURE } from '../constants';
import Tick from '../core/Tick';

/**
 * FunctionExecNode executes the tool calling results from LLM.
 */
export default class FunctionExecNode extends Action {
  constructor() {
    super({ name: 'FunctionExecNode' });
  }

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    const treeId = tick.tree?.id;
    const result = blackboard?.get('lastLLMResult', treeId);
    
    // Get callbacks from global scope
    const addToQueue = blackboard?.get('addToQueue');
    const setChatHistory = blackboard?.get('setChatHistory');

    if (!result) {
      // console.log('BT: FunctionExecNode - No result to execute');
      return FAILURE;
    }

    console.log('BT: FunctionExecNode - Executing result:', result);

    // Handle text response
    if (result.text && setChatHistory) {
      console.log('BT: FunctionExecNode - Setting chat history text');
      setChatHistory((prev: any) => [...prev, { role: 'model', content: result.text }]);
    }

    // Handle tool results
    if (result.toolResult && result.toolResult.actions) {
      console.log('BT: FunctionExecNode - Setting pendingActions:', result.toolResult.actions);
      // 将动作存入黑板的待播放队列，让行为树的专门分支去处理，避免被 IDLE 覆盖
      blackboard?.set('pendingActions', result.toolResult.actions, treeId);
      
      if (setChatHistory) {
        setChatHistory((prev: any) => [...prev, { 
          role: 'model', 
          content: `[Performing: ${result.toolResult.actions.join(', ')}]`,
          isToolCall: true 
        }]);
      }
    }

    // Clear result so it doesn't execute twice
    blackboard?.set('lastLLMResult', null, treeId);
    
    // 整个指令流程结束，清除输入信号，让行为树下一帧回到 IDLE 分支
    console.log('BT: FunctionExecNode - Task complete, clearing hasNewInput signal.');
    blackboard?.set('hasNewInput', false);
    
    return SUCCESS;
  }
}
