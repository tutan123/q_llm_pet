import BehaviorTree from './core/BehaviorTree';
import Priority from './composites/Priority';
import Sequence from './composites/Sequence';
import MemSequence from './composites/MemSequence';
import Parallel from './composites/Parallel';
import PlayAnimationAction from './actions/PlayAnimationAction';
import PlayExpressionAction from './actions/PlayExpressionAction';
import FollowPointerNode from './actions/FollowPointerNode';
import ReturnToOriginAction from './actions/ReturnToOriginAction';
import LLMCallNode from './actions/LLMCallNode';
import FunctionExecNode from './actions/FunctionExecNode';
import ExecuteActionSequence from './actions/ExecuteActionSequence';
import CheckBlackboardCondition from './conditions/CheckBlackboardCondition';
import BlackboardGuard from './decorators/BlackboardGuard';
import Retry from './decorators/Retry';

/**
 * Creates and configures the Behavior Tree for the Penguin.
 */
export function createPenguinBT(): BehaviorTree {
  const tree = new BehaviorTree();

  tree.root = new Priority({
    title: 'Penguin Master Brain',
    children: [
      // 1. 紧急中断 / 拖拽交互 (最高优先级)
      new BlackboardGuard({ 
        title: 'Is Being Dragged?',
        key: 'isDragging', 
        value: true, 
        scope: 'global',
        child: new FollowPointerNode({ title: 'Follow Cursor' })
      }),

      // 2. 自动回归原点分支
      // 当不再拖拽，且位置不在原点时触发
      new ReturnToOriginAction({ title: 'Return to Stage Center' }),

      // 3. 点击互动分支
      new BlackboardGuard({ 
        title: 'Is Penguin Clicked?',
        key: 'isClicked', 
        value: true, 
        scope: 'global',
        child: new MemSequence({
          title: 'Click Interaction Flow',
          children: [
            new PlayAnimationAction({ 
              title: 'Dance Happily',
              action: 'DAZZLE', 
              duration: 2 
            }), // 播放 2 秒
            new PlayAnimationAction({ 
              title: 'Back to Idle',
              action: 'IDLE' 
            }) 
          ]
        })
      }),

      // 3. 处理 pendingActions 序列（LLM 命令执行）
      // 使用 Parallel 让表情和动作序列并行执行
      new Parallel({
        title: 'Execute LLM Action Chain',
        policy: 'SuccessOnAll',
        children: [
          new ExecuteActionSequence({ title: 'Step-by-Step Action sequence' }),
          new PlayExpressionAction({ 
            title: 'Apply LLM Emotion',
            expressionKey: 'pendingEmotion' 
          })
        ]
      }),

      // 4. 文本指令输入分支 (LLM 决策)
      new BlackboardGuard({ 
        title: 'New Command Received?',
        key: 'hasNewInput', 
        value: true, 
        scope: 'global',
        child: new MemSequence({
          title: 'Process User Command Flow',
          children: [
            new Retry({
              title: 'LLM Call (Retry up to 2x)',
              maxAttempts: 2,
              child: new LLMCallNode({ title: 'Asking LLM for Actions' })
            }),
            new FunctionExecNode({ title: 'Parse & Enqueue Actions' })
          ]
        })
      }),

      // 5. 默认闲置行为
      new PlayAnimationAction({ 
        title: 'Idle / Do Nothing',
        action: 'IDLE' 
      })
    ]
  });

  return tree;
}

