import { ChatMessage, LLMSettings } from "../types";
import { sendMessageToGemini } from "./geminiService";
import { sendToCustomLLM } from "./customLLMService";

export const sendMessageToLLM = async (
  history: ChatMessage[],
  newMessage: string,
  settings: LLMSettings
) => {
  if (settings.provider === 'custom') {
    return await sendToCustomLLM(history, newMessage, settings);
  } else {
    // Transform simple ChatMessage[] to the specific format expected by geminiService
    const geminiHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));
    return await sendMessageToGemini(geminiHistory, newMessage);
  }
};
