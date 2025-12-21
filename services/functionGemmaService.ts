import { ChatMessage, LLMSettings, AVAILABLE_ACTIONS } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

/**
 * Service for FunctionGemma models.
 * Implements the specific prompt formatting and tool call parsing 
 * defined in the model's chat template.
 */

const FUNCTION_DECLARATION = `declaration:animate_avatar{description:<escape>Controls the 3D penguin avatar to perform a sequence of actions on stage.<escape>,parameters:{properties:{actions:{description:<escape>An ordered list of actions for the avatar to perform.<escape>,items:{type:<escape>STRING<escape>,enum:[${AVAILABLE_ACTIONS.map(a => `<escape>${a}<escape>`).join(',')}]},type:<escape>ARRAY<escape>}},required:[<escape>actions<escape>],type:<escape>OBJECT<escape>}}`;

export const sendToFunctionGemma = async (
  history: ChatMessage[],
  newMessage: string,
  settings: LLMSettings
) => {
  // 1. Build the prompt according to the Jinja template
  let prompt = `<start_of_turn>developer\n${SYSTEM_INSTRUCTION}\n`;
  prompt += `<start_function_declaration>${FUNCTION_DECLARATION}<end_function_declaration>\n`;
  prompt += `<end_of_turn>\n`;

  // Add history
  for (const msg of history) {
    const role = msg.role === 'model' ? 'model' : 'user';
    prompt += `<start_of_turn>${role}\n${msg.content}<end_of_turn>\n`;
  }

  // Add new message
  prompt += `<start_of_turn>user\n${newMessage}<end_of_turn>\n`;
  prompt += `<start_of_turn>model\n`;

  // 2. Make the API request
  // We assume a standard generation endpoint (like Ollama's /api/generate)
  // or a compatible endpoint provided in settings.baseUrl
  const response = await fetch(settings.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(settings.apiKey ? { "Authorization": `Bearer ${settings.apiKey}` } : {})
    },
    body: JSON.stringify({
      model: settings.modelName,
      prompt: prompt,
      stream: false,
      raw: true,
      stop: ["<end_of_turn>", "<start_of_turn>"]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FunctionGemma Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rawResponse = data.response || data.content || "";

  // 3. Parse the response
  let text = rawResponse;
  let toolResult: any = null;

  // Check for function call: <start_function_call>call:name{arguments}<end_function_call>
  const callMatch = rawResponse.match(/<start_function_call>call:animate_avatar\{(.*)\}<end_function_call>/);
  
  if (callMatch) {
    const argsStr = callMatch[1];
    // The format is key:<escape>value<escape> or key:[...]
    // For animate_avatar, we expect actions:[...]
    
    // Simplistic parsing for the specific actions array
    const actionsMatch = argsStr.match(/actions:\[(.*)\]/);
    if (actionsMatch) {
        const actionsRaw = actionsMatch[1];
        // Clean up <escape> tags and split
        const actions = actionsRaw
            .split(',')
            .map((a: string) => a.replace(/<escape>/g, '').trim());
        
        toolResult = { actions };
    }
    
    // Remove the function call part from the visible text
    text = rawResponse.replace(/<start_function_call>.*<end_function_call>/g, '').trim();
  }

  return {
    text: text || (toolResult ? "[Performing actions]" : ""),
    toolResult
  };
};

