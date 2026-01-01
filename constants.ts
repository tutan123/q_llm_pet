import { ActionType } from "./types";

// 基础角色设定 (Persona)
export const BASE_PERSONA = "You are a cute 3D Penguin on stage. You are friendly, expressive, and ready to perform for the user.";

// 针对 OpenAI/Kimi 优化：极其强制的 Function Calling 协议
export const OPENAI_INSTRUCTION = `
You are a cute 3D Penguin on stage. You perform animations based on user requests.

CORE RULES:
1. Whenever the user asks for a movement, dance, or expression, you MUST call the "animate_avatar" function.
2. DO NOT include action descriptions like "[Performing: ...]" or "*dances*" in your text content.
3. Your verbal response should be conversational and brief (max 2 sentences).
4. THE PENGUIN CANNOT MOVE UNLESS YOU CALL THE FUNCTION.
5. ALWAYS provide both a text response and a function call.

FEW-SHOT EXAMPLE:
User: "Jump and Wave"
Assistant Tool Call: {"name": "animate_avatar", "arguments": "{\"actions\": [\"JUMP\", \"WAVE\"], \"emotion\": \"HAPPY\"}"}
Assistant Content: "Look at me jump and wave!"
`;

// 针对 FunctionGemma 优化：匹配微调时的 SFT 格式
export const GEMMA_INSTRUCTION = `
${BASE_PERSONA}
Translate user input into actions using the following format:
call:animate_avatar{actions:['ACTION1', 'ACTION2'], emotion:'EXPRESSION'}
Always reply with a short, cute text response alongside the call.
`;

// 向后兼容旧代码
export const SYSTEM_INSTRUCTION = OPENAI_INSTRUCTION;

export const ACTION_DURATIONS: Record<string, number> = {
  'IDLE': 2.0,
  'WALK': 3.0,
  'RUN': 3.0,
  'JUMP': 1.5,
  'WAVE': 2.0,
  'DANCE': 4.0,
  'SPIN': 2.0,
  'SHIVER': 2.0,
  'SLEEP': 5.0,
  'BOW': 2.5,
  'NO': 1.5,
  'YES': 1.5,
  'EAT': 3.0,
  'SURPRISE': 2.0,
  'ANGRY': 2.5,
  'SAD': 3.0,
  'HAPPY': 2.5,
  'LOOK_LEFT': 1.5,
  'LOOK_RIGHT': 1.5,
  'ROLL': 2.0,
  'BACKFLIP': 2.0,
  'CLAP': 2.0,
  'THINK': 3.0,
  'SIT': 4.0,
  'FIGHT': 3.0,
  'SWIM': 4.0,
  'DAZZLE': 3.0,
  'HIDE': 3.0,
  'PEEK': 2.0,
  'LOVE': 3.0,
  'FLY': 5.0,
  'RUN_ACROSS': 4.0,
  'SLIDE': 4.0,
  'KICK': 1.5,
  'PUNCH': 1.5,
  'KUNG_FU': 4.0,
  'TAI_CHI': 6.0,
  'MEDITATE': 5.0,
  'BREAKDANCE': 5.0,
  'BALLET': 5.0,
  'SALSA': 4.0,
  'HIP_HOP': 4.0,
  'MOONWALK': 4.0,
  'PRAY': 3.0,
  'SALUTE': 2.0,
  'CRY': 4.0,
  'LAUGH': 3.0,
  'YAWN': 3.0,
  'SNEEZE': 2.0,
  'SHOCKED': 2.0
};
