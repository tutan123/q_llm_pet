export type ActionType = 
  | 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'WAVE' | 'DANCE' 
  | 'SPIN' | 'SHIVER' | 'SLEEP' | 'BOW' | 'NO' | 'YES'
  | 'EAT' | 'SURPRISE' | 'ANGRY' | 'SAD' | 'HAPPY' 
  | 'LOOK_LEFT' | 'LOOK_RIGHT' | 'ROLL' | 'BACKFLIP'
  | 'CLAP' | 'THINK' | 'SIT' | 'FIGHT' | 'SWIM' 
  | 'DAZZLE' | 'HIDE' | 'PEEK' | 'LOVE' 
  | 'FLY' | 'RUN_ACROSS' | 'SLIDE';

export interface AnimationRequest {
  id: string;
  type: ActionType;
  duration: number; // in seconds
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  isToolCall?: boolean;
}

export interface LLMSettings {
  provider: 'gemini' | 'custom' | 'functiongemma';
  apiKey: string;
  baseUrl: string; // Used for custom and functiongemma
  modelName: string; // Used for custom or gemini override
}

export const AVAILABLE_ACTIONS: ActionType[] = [
  'IDLE', 'WALK', 'RUN', 'JUMP', 'WAVE', 'DANCE', 
  'SPIN', 'SHIVER', 'SLEEP', 'BOW', 'NO', 'YES',
  'EAT', 'SURPRISE', 'ANGRY', 'SAD', 'HAPPY', 
  'LOOK_LEFT', 'LOOK_RIGHT', 'ROLL', 'BACKFLIP',
  'CLAP', 'THINK', 'SIT', 'FIGHT', 'SWIM', 
  'DAZZLE', 'HIDE', 'PEEK', 'LOVE',
  'FLY', 'RUN_ACROSS', 'SLIDE'
];
