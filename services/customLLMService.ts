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
  }

  return { text, toolResult, rawToolCalls };
};
