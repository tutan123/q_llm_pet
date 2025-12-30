import Action from '../core/Action';
import { SUCCESS, FAILURE, RUNNING } from '../constants';
import Tick from '../core/Tick';
import { sendMessageToLLM } from '../../llmService';
import { sendToFunctionGemma } from '../../functionGemmaService';

/**
 * LLMCallNode calls the LLM service asynchronously.
 */
export default class LLMCallNode extends Action {
  constructor() {
    super({ name: 'LLMCallNode' });
  }

  /**
   * open is called only once when the node is activated.
   */
  open(tick: Tick): void {
    const blackboard = tick.blackboard;
    const treeId = tick.tree?.id;
    
    console.log('BT: LLMCallNode - Opening node');
    // Initialize results only once
    blackboard?.set('llm_response', null, treeId, this.id);
    blackboard?.set('llm_error', null, treeId, this.id);
    blackboard?.set('llm_status', 'idle', treeId, this.id);
  }

  // enter() was removed because it's called every tick and was resetting our status

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    const treeId = tick.tree?.id;
    const status = blackboard?.get('llm_status', treeId, this.id);

    if (status === 'idle') {
      const chatHistory = blackboard?.get('chatHistory') || [];
      const userInput = blackboard?.get('lastUserInput');
      const settings = blackboard?.get('llmSettings');

      if (!userInput) return FAILURE;

      console.log('BT: LLMCallNode initiating call for:', userInput);
      blackboard?.set('llm_status', 'processing', treeId, this.id);
      
      // 注意：这里不再清除 hasNewInput，由序列末尾的节点负责清除，
      // 否则下一帧这个 Sequence 分支就会因为开头条件不满足而直接中断。

      // Use either unified service or FunctionGemma directly
      const call = settings.provider === 'custom' && settings.modelName.includes('gemma')
        ? sendToFunctionGemma(chatHistory, userInput, settings)
        : sendMessageToLLM(chatHistory, userInput, settings);

      call.then((response) => {
        console.log('BT: LLMCallNode Success', response);
        blackboard?.set('llm_response', response, treeId, this.id);
        blackboard?.set('llm_status', 'success', treeId, this.id);
      }).catch((error) => {
        console.error('BT: LLMCallNode Failed', error);
        blackboard?.set('llm_error', error, treeId, this.id);
        blackboard?.set('llm_status', 'failed', treeId, this.id);
      });

      return RUNNING;
    }

    if (status === 'processing') {
      return RUNNING;
    }

    if (status === 'success') {
      const response = blackboard?.get('llm_response', treeId, this.id);
      console.log('BT: LLMCallNode reporting SUCCESS. Result:', response);
      
      if (!response) {
        console.error('BT: LLMCallNode - Status is success but response is null!');
        blackboard?.set('llm_status', 'idle', treeId, this.id);
        return FAILURE;
      }

      blackboard?.set('lastLLMResult', response, treeId); // Save globally for FunctionExecNode
      // Reset for next time
      blackboard?.set('llm_status', 'idle', treeId, this.id);
      // Consume the data
      blackboard?.set('lastUserInput', null);
      return SUCCESS;
    }

    if (status === 'failed') {
      const error = blackboard?.get('llm_error', treeId, this.id);
      console.error('LLM Node Error:', error);
      blackboard?.set('llm_status', 'idle', treeId, this.id);
      return FAILURE;
    }

    return FAILURE;
  }
}
