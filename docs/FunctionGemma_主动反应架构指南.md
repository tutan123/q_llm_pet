# FunctionGemma 驱动的主动反应（Proactive Interaction）架构指南 v2.2

## 目录
1. [平衡之道：混合上下文架构 (Hybrid Architecture)](#1-平衡之道混合上下文架构)
2. [宏观逻辑：人工场景锚点 (Manual Scenario Anchors)](#2-宏观逻辑人工场景锚点)
3. [微观决策：AI 特征泛化 (AI Feature Generalization)](#3-微观决策ai-特征泛化)
4. [数据集构建：人工标签引导 (Guided Labeling)](#4-数据集构建人工标签引导)
5. [集成架构：行为树作为“向导”](#5-集成架构行为树作为向导)
6. [总结：为什么这是 270M 模型的终极形态](#6-总结为什么这是-270m-模型的终极形态)

---

## 1. 平衡之道：混合上下文架构 (Hybrid Architecture)

针对 FunctionGemma (270M) 模型的性能约束，我们采用“双层控制”策略：

- **第一层：硬逻辑触发 (Rule-based Trigger)**：行为树负责捕捉宏观场景（如：电量危急、长时间冷落）。这解决了**“触发准确性”**问题。
- **第二层：软逻辑表达 (LLM-driven Selection)**：FunctionGemma 负责在已知场景下生成具体的表情、动作组合和台词。这解决了**“行为丰富性”**问题。

### 1.1 架构公式
`主动反应 = 人工场景锚点 (@context) + 实时特征快照 (@env) -> AI 动作映射`

---

## 2. 宏观逻辑：人工场景锚点 (Manual Scenario Anchors)

行为树不再计算复杂的“显著性分数”，而是识别几个核心的“灵魂时刻”：

| 锚点标签 (@context) | 触发条件 (BT Rule) | 业务意义 |
| :--- | :--- | :--- |
| `ENERGY_LOW` | battery < 10% | 强制求生模式 |
| `IDLE_LONELY` | idleTime > 60s | 求关注模式 |
| `USER_BUSY` | mouseSpeed > high | 啦啦队/静默观察模式 |
| `NIGHT_MODE` | time > 23:00 | 困倦模式 |
| `HEALTH_REMINDER` | workDuration > 2h | 关怀模式 |

---

## 3. 微观决策：AI 特征泛化 (AI Feature Generalization)

即使在同一个锚点下，AI 也会根据细微的特征给出不同的反馈。

**快照格式升级**：
```typescript
[Snapshot] 
@context: ENERGY_LOW  // 人工给出的“锚点”，大幅降低模型推理压力
@env: { battery: 5, charging: false, time: "23:30" }
```

**模型表现预测**：
- 如果 `battery: 9`：模型可能决定做一个 `SHIVER` 动作。
- 如果 `battery: 3`：模型可能决定直接 `SLEEP`。
- 如果 `charging: true`：模型即使在低电量场景也会因为看到充电特征而返回 `HAPPY`。

---

## 4. 数据集构建：人工标签引导 (Guided Labeling)

这种模式下的数据集不再需要覆盖全空间，只需覆盖**锚点下的子空间**。

### 4.1 混合样本样例

```json
{
  "messages": [
    {
      "role": "user", 
      "content": "[Snapshot] @context: IDLE_LONELY, @env: { idle: 120, mood: \"sad\" }"
    },
    {
      "role": "assistant", 
      "content": "<start_function_call>call:animate_avatar{actions:['PEEK', 'HIDE'], emotion:'SAD'}<end_function_call> 主人是不是把我忘了..."
    }
  ]
}
```

### 4.2 鲁棒性样本（针对错误锚点）
如果 BT 误触了锚点，模型可以通过查看 `@env` 修正行为：
- **输入**：`[Snapshot] @context: ENERGY_LOW, @env: { battery: 95 }` (BT 逻辑偶发 Bug)
- **输出**：`NOP // 检查电量充足，不执行虚弱动作`

---

## 5. 集成架构：行为树作为“向导”

行为树通过 `IfThenElse` 或 `Priority` 快速定位场景，然后“打包”数据发给 AI。

```typescript
new Priority({
  title: 'Hybrid Brain',
  children: [
    // 场景 A：低电量锚点
    new Sequence({
      children: [
        new CheckBlackboardCondition({ key: 'battery', operator: '<', value: 10 }),
        new LLMCallNode({ context: 'ENERGY_LOW' }),
        new FunctionExecNode()
      ]
    }),
    
    // 场景 B：长时间冷落锚点
    new Sequence({
      children: [
        new CheckBlackboardCondition({ key: 'idleTime', operator: '>', value: 60 }),
        new LLMCallNode({ context: 'IDLE_LONELY' }),
        new FunctionExecNode()
      ]
    }),
    
    // 兜底
    new PlayAnimationAction({ action: 'IDLE' })
  ]
})
```

---

## 6. 结论：为什么这是 270M 模型的终极形态

1.  **极低推理压力**：有了 `@context` 引导，模型只需要完成“填空”任务，而不是“阅读理解”任务。
2.  **易于微调**：你可以针对每个锚点准备 200 条数据，总共 1000 条就能训练出一个非常有“灵性”的企鹅。
3.  **开发效率**：你不需要在代码里写具体的表情控制，只需要定好触发场景。AI 负责让每个场景的反馈都“不一样”。

---
*文档版本: v2.2 (Hybrid Guided Schema)*  
*最后更新: 2025-01-01*
