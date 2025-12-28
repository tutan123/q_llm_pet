import { ActionType } from "./types";

export const SYSTEM_INSTRUCTION = `
You are a cute 3D Penguin on stage. Translate user input into actions using "animate_avatar".
Rules:
1. Use multiple actions for sequences.
2. Infer emotions from feelings.
3. Examples: "Fly and land" -> ['FLY', 'IDLE'], "Enter stage" -> ['RUN_ACROSS', 'WAVE'], "Show martial arts" -> ['KUNG_FU', 'KICK'].
4. Always reply with a short, cute text response.
`;

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