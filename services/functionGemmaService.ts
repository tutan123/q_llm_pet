import { ChatMessage, LLMSettings, AVAILABLE_ACTIONS } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

/**
 * Service for FunctionGemma models.
 */

export const sendToFunctionGemma = async (
  history: ChatMessage[],
  newMessage: string,
  settings: LLMSettings
) => {
  // 1. 构造紧凑的工具声明（包含表情支持）
  const TOOL_DECLARATION = `<start_function_declaration>declaration:animate_avatar{description:<escape>Controls the avatar to perform actions and an optional facial expression.<escape>,parameters:{properties:{actions:{description:<escape>Ordered list of actions.<escape>,items:{enum:${JSON.stringify(AVAILABLE_ACTIONS)},type:<escape>STRING<escape>},type:<escape>ARRAY<escape>},emotion:{description:<escape>Optional facial expression.<escape>,enum:[<escape>HAPPY<escape>,<escape>SAD<escape>,<escape>ANGRY<escape>,<escape>SURPRISED<escape>,<escape>EXCITED<escape>,<escape>LOVING<escape>,<escape>CONFUSED<escape>],type:<escape>STRING<escape>}},required:[<escape>actions<escape>],type:<escape>OBJECT<escape>}}<end_function_declaration>`;

  const systemPrompt = `You are a model that can do function calling with the following functions\n${TOOL_DECLARATION}\n\n${SYSTEM_INSTRUCTION}\n\nIMPORTANT: When appropriate, include an "emotion" parameter to reflect the penguin's feelings.`;

  // 2. Make the API request
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
      // 不传递 tools 参数，避免触发服务器的 "auto" tool choice 限制错误
      stream: false,
      temperature: 0.1,
      max_tokens: 256,
      stop: ["<end_of_turn>", "<end_function_call>", "<bos>", "<eos>"]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FunctionGemma Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const responseText = choice?.message?.content || "";
  
  let text = responseText;
  let toolResult: any = null;

  // 3. 增强的解析逻辑：从文本中提取 call:animate_avatar 及其参数
  const callMatch = responseText.match(/call:animate_avatar\{(.*?)\}/);
  if (callMatch) {
    const paramsRaw = callMatch[1];
    
    // 提取 actions
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

    // 提取 emotion
    const emotionMatch = paramsRaw.match(/emotion:(?:<escape>)?(\w+)(?:<escape>)?/);
    if (emotionMatch && toolResult) {
      toolResult.emotion = emotionMatch[1].toUpperCase();
    }

    // 清理掉 XML 标签，让 UI 只显示人类能看懂的内容
    text = responseText.replace(/<start_function_call>[\s\S]*?(?:<end_function_call>|$)/g, '').trim();
  }

  return {
    text: text || (toolResult ? "[Performing actions]" : ""),
    toolResult
  };
};

