import { ChatMessage, LLMSettings, AVAILABLE_ACTIONS, AVAILABLE_EXPRESSIONS } from "../types";
import { OPENAI_INSTRUCTION } from "../constants";

/**
 * [第一套：OpenAI 标准协议 - 单轮指令版]
 * 专门针对 Kimi、GPT-4 等云端大模型优化。
 * 核心逻辑：不发送历史记录，彻底防止格式污染和协议报错。
 */

const TOOLS_DEFINITION = [
  {
    type: "function",
    function: {
      name: "animate_avatar",
      description: "Trigger physical animations and facial expressions for the 3D penguin.",
      parameters: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            items: { type: "string", enum: AVAILABLE_ACTIONS },
            description: "A sequence of actions to perform."
          },
          emotion: {
            type: "string",
            enum: AVAILABLE_EXPRESSIONS,
            description: "The facial expression to show."
          }
        },
        required: ["actions", "emotion"]
      }
    }
  }
];

export const sendToCustomLLM = async (
  _history: ChatMessage[], // 忽略历史记录
  newMessage: string, 
  settings: LLMSettings
) => {
  const dynamicSystemPrompt = `
${OPENAI_INSTRUCTION}

AVAILABLE ACTIONS: ${AVAILABLE_ACTIONS.join(", ")}
AVAILABLE EMOTIONS: ${AVAILABLE_EXPRESSIONS.join(", ")}
`.trim();

  // 【核心简化】只发送单轮消息，杜绝 400 错误和历史污染
  const messages = [
    { role: "system", content: dynamicSystemPrompt },
    { role: "user", content: newMessage }
  ];

  const payload = {
    model: settings.modelName || "gpt-3.5-turbo",
    messages: messages,
    tools: TOOLS_DEFINITION,
    tool_choice: "auto", 
    temperature: 0.1, 
  };

  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Model Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  let text = message?.content || "";
  let toolResult: any = null;
  let rawToolCalls: any[] | null = null;

  if (message?.tool_calls && message.tool_calls.length > 0) {
    rawToolCalls = message.tool_calls;
    const toolCall = message.tool_calls[0];
    if (toolCall.function.name === "animate_avatar") {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        toolResult = {
          actions: args.actions || [],
          emotion: args.emotion || 'NEUTRAL',
          toolCallId: toolCall.id 
        };
      } catch (e) {
        console.error("BT: Failed to parse tool arguments", e);
      }
    }
  } else {
    // Fallback: Try regex parsing for FunctionGemma format or [Performing: ...] format
    let parsed = false;
    
    // Try FunctionGemma format: call:animate_avatar{...}
    const callMatch = text.match(/call:animate_avatar\{(.*?)\}/);
    if (callMatch) {
      const paramsRaw = callMatch[1];
      
      const actionsMatch = paramsRaw.match(/actions:\[(.*?)\]/);
      if (actionsMatch) {
        const actions = actionsMatch[1]
            .split(',')
            .map((a: string) => a.replace(/<escape>/g, '').replace(/['"]/g, '').trim())
            .filter((a: string) => a.length > 0);
        
        if (actions.length > 0) {
          toolResult = { actions };
        }
      }

      const emotionMatch = paramsRaw.match(/emotion:(?:<escape>)?(['"])?(\w+)\1(?:<escape>)?/);
      if (emotionMatch && toolResult) {
        toolResult.emotion = emotionMatch[2].toUpperCase();
      }

      // Remove the function call from text
      text = text.replace(/<start_function_call>[\s\S]*?(?:<end_function_call>|$)/g, '').trim();
      text = text.replace(/call:animate_avatar\{.*?\}/g, '').trim();
      parsed = true;
    }
    
    // Try [Performing: ACTION1, ACTION2, EMOTION] format
    const performingMatch = text.match(/\[Performing:\s*([^\]]+)\]/);
    if (performingMatch && !parsed) {
      const content = performingMatch[1];
      const parts = content.split(',').map(p => p.trim());
      const actions: string[] = [];
      let emotion: string | undefined;
      
      for (const part of parts) {
        const upperPart = part.toUpperCase();
        // Check if it's an emotion
        if (['HAPPY', 'SAD', 'ANGRY', 'SURPRISED', 'EXCITED', 'SLEEPY', 'LOVING', 'CONFUSED', 'NEUTRAL'].includes(upperPart)) {
          emotion = upperPart;
        } else {
          // Assume it's an action
          actions.push(upperPart);
        }
      }
      
      if (actions.length > 0) {
        toolResult = { actions, emotion: emotion || 'NEUTRAL' };
      }
    }
    
    // Remove [Performing: ...] patterns from text
    text = text.replace(/\[Performing:.*?\]/g, '').trim();
  }

  return { text, toolResult, rawToolCalls };
};
