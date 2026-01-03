import AsyncAction from '../core/AsyncAction';
import { SUCCESS, FAILURE } from '../constants';
import Tick from '../core/Tick';
import { sendMessageToLLM } from '../../llmService';
import { NodeOptions } from '../core/BaseNode';

/**
 * ProactiveLLMNode triggers an LLM call based on the penguin's INTERNAL STATE,
 * not from a user message. It "invents" a reason to talk.
 */
export default class ProactiveLLMNode extends AsyncAction {
  constructor(options: NodeOptions = {}) {
    super({ 
      name: 'ProactiveLLMNode',
      ...options
    });
    this.statusKey = 'proactive_llm_status';
  }

  async performAsync(tick: Tick): Promise<number> {
    const blackboard = tick.blackboard;
    const boredom = blackboard?.get('boredom', tick.tree?.id) || 0;
    const energy = blackboard?.get('energy', tick.tree?.id) || 100;
    const settings = blackboard?.get('llmSettings');

    // 构建一个“自主意识”的 Prompt
    const internalPrompt = `
      [INTERNAL STATE MONITOR]
      Boredom: ${boredom.toFixed(0)}/100
      Energy: ${energy.toFixed(0)}/100
      User status: Silent for a while.

      [INSTRUCTION]
      You are feeling a bit ${boredom > 70 ? 'lonely and bored' : 'active'}. 
      Proactively say something cute to the user to get their attention, 
      or perform an action. Don't mention these numbers, just act natural.
    `.trim();

    console.log('BT: Proactive LLM thinking...');
    
    try {
      // 发送一个系统级的虚拟消息给 LLM
      const response = await sendMessageToLLM([], internalPrompt, settings);

      console.log('BT: Proactive Thought SUCCESS', response);
      
      const treeId = tick.tree?.id;
      blackboard?.set('lastLLMResult', response, treeId);
      
      // 重置无聊度，因为我们已经采取行动了
      blackboard?.set('boredom', 0, treeId);
      
      return SUCCESS;
    } catch (error) {
      console.error('BT: Proactive Thought FAILED', error);
      return FAILURE;
    }
  }
}

