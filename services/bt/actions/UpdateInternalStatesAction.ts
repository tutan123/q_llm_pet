import Action from '../core/Action';
import { SUCCESS } from '../constants';
import Tick from '../core/Tick';

/**
 * UpdateInternalStatesAction ticks up hunger and boredom levels over time.
 * This makes the penguin "feel" things independently of user input.
 */
export default class UpdateInternalStatesAction extends Action {
  constructor(options = {}) {
    super({
      name: 'UpdateInternalStatesAction',
      ...options,
    });
  }

  tick(tick: Tick): number {
    const blackboard = tick.blackboard;
    const treeId = tick.tree?.id;

    // 1. 获取当前状态（改为全局作用域）
    let boredom = blackboard?.get('boredom') || 0;
    let energy = blackboard?.get('energy') || 100;
    const lastTickTime = blackboard?.get('lastStateTick', treeId) || Date.now();
    
    const now = Date.now();
    const deltaTime = (now - lastTickTime) / 1000; // 秒

    // 2. 随时间变化
    boredom += deltaTime * 1.0; // 稍微放慢一点增长速度，每秒 1 点
    
    const currentAction = blackboard?.get('bt_output_action');
    if (currentAction === 'SLEEP') {
      energy += deltaTime * 5.0; // 恢复速度翻倍，每秒 5 点
    }

    // 3. 边界限制
    boredom = Math.min(100, Math.max(0, boredom));
    energy = Math.min(100, Math.max(0, energy));

    // 4. 写回黑板
    blackboard?.set('boredom', boredom); // 全局
    blackboard?.set('energy', energy);   // 全局
    blackboard?.set('lastStateTick', now, treeId); // 计时器保留在树作用域

    // --- 重点修复：多维交互判定 ---
    const hasInput = blackboard?.get('hasNewInput');      // 有新文本指令
    const isDragging = blackboard?.get('isDragging');    // 正在被右键拖拽
    const isClicked = blackboard?.get('isClicked');      // 正在被左键点击
    const isProcessing = blackboard?.get('llm_status') === 'processing'; // LLM 正在思考
    
    // 获取当前真实的 React 状态
    const realCurrentAction = blackboard?.get('currentAction');
    const isBusy = realCurrentAction && (realCurrentAction !== 'IDLE' && realCurrentAction !== 'SLEEP' && realCurrentAction !== 'WALK');

    // 如果满足以上任何一个条件，说明用户正在交互或企鹅正在忙碌，立刻清空无聊度
    if (hasInput || isDragging || isClicked || isProcessing || isBusy) {
      blackboard?.set('boredom', 0);
    }

    return SUCCESS;
  }
}

