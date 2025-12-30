import BehaviorTree from './core/BehaviorTree';
import Priority from './composites/Priority';
import Sequence from './composites/Sequence';
import MemSequence from './composites/MemSequence';
import Parallel from './composites/Parallel';
import PlayAnimationAction from './actions/PlayAnimationAction';
import FollowPointerNode from './actions/FollowPointerNode';
import ReturnToOriginAction from './actions/ReturnToOriginAction';
import LLMCallNode from './actions/LLMCallNode';
import FunctionExecNode from './actions/FunctionExecNode';
import ExecuteActionSequence from './actions/ExecuteActionSequence';
import CheckBlackboardCondition from './conditions/CheckBlackboardCondition';
import Retry from './decorators/Retry';

/**
 * Creates and configures the Behavior Tree for the Penguin.
 */
export function createPenguinBT(): BehaviorTree {
  const tree = new BehaviorTree();

  tree.root = new Priority({
    children: [
      // 1. 紧急中断 / 拖拽交互 (最高优先级)
      new Sequence({
        children: [
          new CheckBlackboardCondition({ key: 'isDragging', value: true, scope: 'global' }),
          new FollowPointerNode() // 仅位置跟随，不再强加 FLY 动作
        ]
      }),

      // 2. 自动回归原点分支
      // 当不再拖拽，且位置不在原点时触发
      new ReturnToOriginAction(),

      // 3. 点击互动分支
      new MemSequence({
        children: [
          new CheckBlackboardCondition({ key: 'isClicked', value: true, scope: 'global' }),
          new PlayAnimationAction({ action: 'DAZZLE', duration: 2 }), // 播放 2 秒
          new PlayAnimationAction({ action: 'IDLE' }) 
        ]
      }),

      // 3. 处理 pendingActions 序列（LLM 命令执行）
      // 这个分支会持续运行直到所有动作播完，确保不被 IDLE 打断
      new ExecuteActionSequence(),

      // 4. 文本指令输入分支 (LLM 决策)
      new MemSequence({
        children: [
          new CheckBlackboardCondition({ key: 'hasNewInput', value: true, scope: 'global' }),
          new Retry({
            maxAttempts: 2,
            child: new LLMCallNode()
          }),
          new FunctionExecNode()
        ]
      }),

      // 5. 默认闲置行为
      new PlayAnimationAction({ action: 'IDLE' })
    ]
  });

  return tree;
}

