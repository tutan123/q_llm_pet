import BehaviorTree from './core/BehaviorTree';
import Priority from './composites/Priority';
import Sequence from './composites/Sequence';
import Parallel from './composites/Parallel';
import PlayAnimationAction from './actions/PlayAnimationAction';
import FollowPointerNode from './actions/FollowPointerNode';
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
          new Parallel({
            policy: 'SuccessOnAll',
            children: [
              new PlayAnimationAction({ action: 'FLY' }), // 提起时播放飞行/挣扎动作
              new FollowPointerNode() // 位置跟随鼠标
            ]
          })
        ]
      }),

      // 2. 点击互动分支
      new Sequence({
        children: [
          new CheckBlackboardCondition({ key: 'isClicked', value: true, scope: 'global' }),
          new PlayAnimationAction({ action: 'DAZZLE' }),
          // 点击逻辑完成后重置
          new PlayAnimationAction({ action: 'IDLE' }) 
        ]
      }),

      // 3. 处理 pendingActions 序列（LLM 命令执行）
      // 这个分支会持续运行直到所有动作播完，确保不被 IDLE 打断
      new ExecuteActionSequence(),

      // 4. 文本指令输入分支 (LLM 决策)
      new Sequence({
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

