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
  // 1. 构造紧凑的工具声明（模仿 test_api_pet.py，使用 JSON.stringify 节省 Token）
  const TOOL_DECLARATION = `<start_function_declaration>declaration:animate_avatar{description:<escape>Controls the 3D penguin avatar to perform a sequence of actions on stage.<escape>,parameters:{properties:{actions:{description:<escape>An ordered list of actions for the avatar to perform.<escape>,items:{enum:${JSON.stringify(AVAILABLE_ACTIONS)},type:<escape>STRING<escape>},type:<escape>ARRAY<escape>}},required:[<escape>actions<escape>],type:<escape>OBJECT<escape>}}<end_function_declaration>`;

  const systemPrompt = `You are a model that can do function calling with the following functions\n${TOOL_DECLARATION}\n\n${SYSTEM_INSTRUCTION}`;

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

  // 3. 鲁棒的解析逻辑：从文本中提取 call:animate_avatar
  const callMatch = responseText.match(/call:animate_avatar\{actions:\[(.*?)(?:\]|$)/);
  if (callMatch) {
    const actionsRaw = callMatch[1];
    const actions = actionsRaw
        .split(',')
        .map((a: string) => a.replace(/<escape>/g, '').replace(/['"]/g, '').trim())
        .filter((a: string) => a.length > 0);
    
    if (actions.length > 0) {
      toolResult = { actions };
    }
    // 清理掉 XML 标签，让 UI 只显示人类能看懂的内容
    text = responseText.replace(/<start_function_call>[\s\S]*?(?:<end_function_call>|$)/g, '').trim();
  }

  return {
    text: text || (toolResult ? "[Performing actions]" : ""),
    toolResult
  };
};

