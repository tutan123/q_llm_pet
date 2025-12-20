import { ChatMessage, LLMSettings, AVAILABLE_ACTIONS } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Definition of the tool in OpenAI JSON Schema format
const TOOLS_DEFINITION = [
  {
    type: "function",
    function: {
      name: "animate_avatar",
      description: "Controls the 3D penguin avatar to perform a sequence of actions on stage.",
      parameters: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            items: {
              type: "string",
              enum: AVAILABLE_ACTIONS
            },
            description: "An ordered list of actions for the avatar to perform.",
          },
        },
        required: ["actions"],
      },
    },
  },
];

export const sendToCustomLLM = async (
  history: ChatMessage[],
  newMessage: string,
  settings: LLMSettings
) => {
  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.content })),
    { role: "user", content: newMessage }
  ];

  const payload = {
    model: settings.modelName || "gpt-3.5-turbo",
    messages: messages,
    tools: TOOLS_DEFINITION,
    tool_choice: "auto", // Let the model decide
    temperature: 0.7,
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
    throw new Error(`Custom LLM Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  let text = message?.content || "";
  let toolResult: any = null;

  // Check for tool calls
  if (message?.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.function.name === "animate_avatar") {
      try {
        toolResult = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool arguments", e);
      }
    }
  }

  return {
    text,
    toolResult
  };
};
