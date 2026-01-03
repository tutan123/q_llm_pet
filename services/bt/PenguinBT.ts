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
import AlwaysFailure from './actions/AlwaysFailure';
import Wait from './actions/Wait';
import MoveToTargetAction from './actions/MoveToTargetAction';
import UpdateInternalStatesAction from './actions/UpdateInternalStatesAction';
import ProactiveLLMNode from './actions/ProactiveLLMNode';

/**
 * Creates and configures the Behavior Tree for the Penguin.
 */
export function createPenguinBT(): BehaviorTree {
  const tree = new BehaviorTree();

  // 将主逻辑包装在一个 Parallel 中，让感知层和决策层并行运行
  tree.root = new Parallel({
    title: 'Penguin Master Brain',
    policy: 'SuccessOnAll',
    children: [
      // 0. 感知层：每一帧都更新内部状态（能量、无聊度等）
      new UpdateInternalStatesAction({ title: 'Update Mood' }),

      // 1. 决策层：负责具体的交互行为
      new Priority({
        title: 'Decision Logic',
        children: [
          // 1.1 紧急中断 / 拖拽交互
          new BlackboardGuard({ 
            title: 'Is Being Dragged?',
            key: 'isDragging', 
            value: true, 
            scope: 'global',
            child: new FollowPointerNode({ title: 'Follow Cursor' })
          }),

          // 1.2 生存需求：累了去睡觉 (能量 < 20)
          new BlackboardGuard({
            title: 'Tired?',
            key: 'energy',
            value: 20, 
            scope: 'global',
            child: new MemSequence({
              title: 'Go to Sleep',
              children: [
                new MoveToTargetAction({ 
                  title: 'Walk to Home', 
                  targetPos: [4, 0.1, -3], // 抬高 Y 轴到 0.1，小窝的顶部表面位置
                  speed: 0.1 
                }),
                new PlayAnimationAction({ 
                  title: 'Sleeping...', 
                  action: 'SLEEP',
                  duration: 10 
                }),
                new PlayAnimationAction({
                  title: 'Waking up',
                  action: 'SURPRISE',
                  duration: 1
                }),
                new MoveToTargetAction({
                  title: 'Back to Center',
                  targetPos: [0, -1, 0],
                  speed: 0.1
                })
              ]
            })
          }),

          // 1.3 自动回归原点分支 (优先级调高：必须在舞台内才能进行后续交互)
          new ReturnToOriginAction({ title: 'Return to Stage Center' }),

          // 1.4 点击互动分支
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
                }),
                new PlayAnimationAction({ 
                  title: 'Back to Idle',
                  action: 'IDLE' 
                }) 
              ]
            })
          }),

          // 1.5 处理指令序列（Parallel 表情 + 动作）
          new Parallel({
            title: 'Execute LLM Action Chain',
            policy: 'SuccessOnAll',
            children: [
              new ExecuteActionSequence({ title: 'Step-by-Step Action sequence' }),
              new PlayExpressionAction({ 
                title: 'Apply LLM Emotion',
                expressionKey: 'pendingEmotion',
                duration: 3 // 表情持续 3 秒后重置
              })
            ]
          }),

          // 1.6 文本指令输入分支 (LLM 决策)
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

          // 1.7 主动决策层：当无聊度太高时，随机做点什么 (去聊天化：只做动作)
          new BlackboardGuard({
            title: 'Feel Lonely?',
            key: 'boredom',
            value: 70, 
            scope: 'global',
            child: new BlackboardGuard({
              title: 'Not Sleeping?',
              key: 'energy',
              value: (val: any) => val > 30,
              scope: 'global',
              child: new MemSequence({
                title: 'Physical Idle Variety',
                children: [
                  // 动作 1: 挥手打招呼
                  new PlayAnimationAction({ action: 'WAVE', duration: 2, title: 'Physical Greet' }),
                  new Wait({ milliseconds: 10000 }), 

                  // 动作 2: 原地思考
                  new PlayAnimationAction({ action: 'THINK', duration: 3, title: 'Contemplating' }),
                  new Wait({ milliseconds: 8000 }), 

                  // 动作 3: 左右张望
                  new PlayAnimationAction({ action: 'LOOK_LEFT', duration: 1, title: 'Look Around' }),
                  new PlayAnimationAction({ action: 'LOOK_RIGHT', duration: 1 }),
                  new Wait({ milliseconds: 15000 }) 
                ]
              })
            })
          }),

          // 1.8 默认闲置行为
          new PlayAnimationAction({ 
            title: 'Idle / Do Nothing',
            action: 'IDLE' 
          })
        ]
      })
    ]
  });

  return tree;
}

