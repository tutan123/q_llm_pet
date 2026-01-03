import AsyncAction from '../core/AsyncAction';
import { SUCCESS, FAILURE } from '../constants';
import Tick from '../core/Tick';
import { sendMessageToLLM } from '../../llmService';
import { sendToFunctionGemma } from '../../functionGemmaService';
import { NodeOptions } from '../core/BaseNode';

/**
 * LLMCallNode calls the LLM service asynchronously.
 * Inherits from AsyncAction to handle the complex async state management.
 */
export default class LLMCallNode extends AsyncAction {
  constructor(options: NodeOptions = {}) {
    super({ 
      name: 'LLMCallNode',
      ...options
    });
    // Override keys to maintain backward compatibility with tests and UI
    this.statusKey = 'llm_status';
    this.resultStatusKey = 'llm_result_status';
    this.errorKey = 'llm_error';
  }

  /**
   * Implementation of the abstract performAsync method.
   */
  async performAsync(tick: Tick): Promise<number> {
    const blackboard = tick.blackboard;
    const chatHistory = blackboard?.get('chatHistory') || [];
    const userInput = blackboard?.get('lastUserInput');
    const settings = blackboard?.get('llmSettings');

    if (!userInput) return FAILURE;

    console.log('BT: LLMCallNode initiating call for:', userInput);
    
    try {
      const response = await (settings.provider === 'custom' && settings.modelName.includes('gemma')
        ? sendToFunctionGemma(chatHistory, userInput, settings)
        : sendMessageToLLM(chatHistory, userInput, settings));

      console.log('BT: LLMCallNode Success', response);
      
      const treeId = tick.tree?.id;
      // Save results to blackboard for other nodes (like FunctionExecNode)
      blackboard?.set('llm_response', response, treeId, this.id);
      blackboard?.set('llm_raw_tool_calls', (response as any).rawToolCalls, treeId, this.id);
      blackboard?.set('lastLLMResult', response, treeId); // Global save
      
      // Consume the user input
      blackboard?.set('lastUserInput', null);
      
      return SUCCESS;
    } catch (error) {
      console.error('BT: LLMCallNode Failed', error);
      return FAILURE;
    }
  }
}
