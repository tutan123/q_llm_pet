export type ActionType = 
  | 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'WAVE' | 'DANCE' 
  | 'SPIN' | 'SHIVER' | 'SLEEP' | 'BOW' | 'NO' | 'YES'
  | 'EAT' | 'SURPRISE' | 'ANGRY' | 'SAD' | 'HAPPY' 
  | 'LOOK_LEFT' | 'LOOK_RIGHT' | 'ROLL' | 'BACKFLIP'
  | 'CLAP' | 'THINK' | 'SIT' | 'FIGHT' | 'SWIM' 
  | 'DAZZLE' | 'HIDE' | 'PEEK' | 'LOVE' 
  | 'FLY' | 'RUN_ACROSS' | 'SLIDE'
  | 'KICK' | 'PUNCH' | 'KUNG_FU' | 'TAI_CHI' | 'MEDITATE'
  | 'BREAKDANCE' | 'BALLET' | 'SALSA' | 'HIP_HOP' | 'MOONWALK'
  | 'PRAY' | 'SALUTE' | 'CRY' | 'LAUGH' | 'YAWN' | 'SNEEZE' | 'SHOCKED';

// 表情类型（独立于肢体动作）
export type ExpressionType = 
  | 'NEUTRAL'    // 中性
  | 'HAPPY'      // 开心
  | 'SAD'        // 悲伤
  | 'ANGRY'      // 生气
  | 'SURPRISED'  // 惊讶
  | 'EXCITED'    // 兴奋
  | 'SLEEPY'     // 困倦
  | 'LOVING'     // 爱心
  | 'CONFUSED'   // 困惑
  | 'BLINK';     // 眨眼（用于保持生动感）

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
  'FLY', 'RUN_ACROSS', 'SLIDE',
  'KICK', 'PUNCH', 'KUNG_FU', 'TAI_CHI', 'MEDITATE',
  'BREAKDANCE', 'BALLET', 'SALSA', 'HIP_HOP', 'MOONWALK',
  'PRAY', 'SALUTE', 'CRY', 'LAUGH', 'YAWN', 'SNEEZE', 'SHOCKED'
];

export const AVAILABLE_EXPRESSIONS: ExpressionType[] = [
  'NEUTRAL', 'HAPPY', 'SAD', 'ANGRY', 'SURPRISED', 
  'EXCITED', 'SLEEPY', 'LOVING', 'CONFUSED', 'BLINK'
];
