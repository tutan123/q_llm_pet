import { ChatMessage, LLMSettings, AVAILABLE_ACTIONS } from "../types";
import { GEMMA_INSTRUCTION } from "../constants";

/**
 * [第二套：FunctionGemma 私有协议 - 单轮指令版]
 * 专门针对本地微调模型优化。
 * 核心逻辑：不发送历史记录，确保每次生成都是纯净的单轮指令映射。
 */

export const sendToFunctionGemma = async (
  _history: ChatMessage[], // 忽略历史记录
  newMessage: string,
  settings: LLMSettings
) => {
  // 构造工具声明文本
  const TOOL_DECLARATION = `<start_function_declaration>declaration:animate_avatar{description:<escape>Controls the avatar animations.<escape>,parameters:{properties:{actions:{items:{enum:${JSON.stringify(AVAILABLE_ACTIONS)},type:<escape>STRING<escape>},type:<escape>ARRAY<escape>},emotion:{type:<escape>STRING<escape>}},required:[<escape>actions<escape>],type:<escape>OBJECT<escape>}}<end_function_declaration>`;

  const systemPrompt = `${GEMMA_INSTRUCTION}\n\nAvailable Tools:\n${TOOL_DECLARATION}`;

  const response = await fetch(`${settings.baseUrl.replace(/\/completions$/, '')}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(settings.apiKey ? { "Authorization": `Bearer ${settings.apiKey}` } : {})
    },
    body: JSON.stringify({
      model: settings.modelName,
      messages: [
        { role: "developer", content: systemPrompt },
        { role: "user", content: newMessage }
      ],
      stream: false,
      temperature: 0.1,
      max_tokens: 256,
      stop: ["<end_of_turn>", "<end_function_call>", "<bos>", "<eos>"]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FunctionGemma Local Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || "";
  
  let text = responseText;
  let toolResult: any = null;

  // 使用正则解析
  const callMatch = responseText.match(/call:animate_avatar\{(.*?)\}/);
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

    text = responseText.replace(/<start_function_call>[\s\S]*?(?:<end_function_call>|$)/g, '').trim();
    text = text.replace(/call:animate_avatar\{.*?\}/g, '').trim();
  }

  return {
    text: text || (toolResult ? "[Performing actions]" : ""),
    toolResult
  };
};
