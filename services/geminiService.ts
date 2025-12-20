import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define the Tool
const animateAvatarTool: FunctionDeclaration = {
  name: 'animate_avatar',
  description: 'Controls the 3D penguin avatar to perform a sequence of actions on stage.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      actions: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          enum: [
            'IDLE', 'WALK', 'RUN', 'JUMP', 'WAVE', 'DANCE', 
            'SPIN', 'SHIVER', 'SLEEP', 'BOW', 'NO', 'YES',
            'EAT', 'SURPRISE', 'ANGRY', 'SAD', 'HAPPY', 
            'LOOK_LEFT', 'LOOK_RIGHT', 'ROLL', 'BACKFLIP',
            'CLAP', 'THINK', 'SIT', 'FIGHT', 'SWIM', 
            'DAZZLE', 'HIDE', 'PEEK', 'LOVE',
            'FLY', 'RUN_ACROSS', 'SLIDE'
          ]
        },
        description: 'An ordered list of actions for the avatar to perform.',
      },
    },
    required: ['actions'],
  },
};

const tools: Tool[] = [{ functionDeclarations: [animateAvatarTool] }];

export const sendMessageToGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
) => {
  if (!apiKey) throw new Error("API Key not found");

  // Using gemini-3-flash-preview as recommended for basic text tasks with function calling
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: tools,
      temperature: 0.7,
    },
    history: history.map(h => ({
      role: h.role,
      parts: h.parts,
    })),
  });

  const response = await chat.sendMessage({ message: newMessage });
  
  // Handle Function Calls
  const functionCalls = response.functionCalls;
  let toolResult: any = null;

  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    if (call.name === 'animate_avatar') {
       toolResult = call.args;
    }
  }

  return {
    text: response.text || "",
    toolResult: toolResult,
  };
};
