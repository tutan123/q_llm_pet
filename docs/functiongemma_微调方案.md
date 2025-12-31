# Q-Penguin 3D 形象 - FunctionGemma 微调设计方案

## 1. 核心目标
提升模型在以下三个维度的表现：
- **语义对齐**：将模糊的指令（如“给我表演个绝活”）精准映射到具体的动作序列（`BACKFLIP` -> `SPIN` -> `DAZZLE`）。
- **格式稳定性**：确保模型 100% 产出合规的 `<start_function_call>` 标签，不产生废话。
- **意图理解**：在多轮对话中，能够根据心情决定动作。

## 2. 数据集设计 (JSONL 格式)
我们需要准备约 200-500 条高质量样本。参考 `finetuning-with-functiongemma.ipynb` 中的格式：

### 样本类型 A：简单动作
```json
{
  "messages": [
    {"role": "user", "content": "跳一下！"},
    {"role": "assistant", "tool_calls": [{"type": "function", "function": {"name": "animate_avatar", "arguments": {"actions": ["JUMP"]}}}]}
  ]
}
```

### 样本类型 B：复杂组合动作
```json
{
  "messages": [
    {"role": "user", "content": "企鹅，来一段炫酷的开场表演！"},
    {"role": "assistant", "tool_calls": [{"type": "function", "function": {"name": "animate_avatar", "arguments": {"actions": ["RUN_ACROSS", "BACKFLIP", "DAZZLE"]}}}]}
  ]
}
```

### 样本类型 C：多轮对话
```json
{
  "messages": [
    {"role": "user", "content": "你累了吗？"},
    {"role": "assistant", "content": "有点累了，我想睡会儿。"},
    {"role": "user", "content": "那去休息吧。"},
    {"role": "assistant", "tool_calls": [{"type": "function", "function": {"name": "animate_avatar", "arguments": {"actions": ["WALK", "SLEEP"]}}}]}
  ]
}
```

## 3. 微调关键参数 (TRL/SFTTrainer)
- **Model**: `google/functiongemma-270m-it` (适合本地低功耗运行)
- **Epochs**: 5-8 次循环。
- **Learning Rate**: 5e-5。
- **Chat Template**: 必须使用项目中的 `chat_template.jinja`，这包含 `<escape>` 标签的处理。

## 4. 数据准备 (使用 easy_dataset)

针对 270M 模型的稳定性问题，我们需要通过 `easy_dataset` 构造以下三类数据，总计建议 **300-500 条**。

### 4.1 数据构造类型

| 数据类型 | 占比 | 示例内容 | 预期动作 |
| :--- | :--- | :--- | :--- |
| **基础指令** | 40% | "向前跑"、"转个圈"、"飞起来" | `RUN`, `SPIN`, `FLY` |
| **情绪映射** | 30% | "我好伤心啊"、"太棒了！"、"别理我" | `SAD`, `HAPPY`, `SHIVER` |
| **组合动作** | 20% | "先滑行然后跳个舞"、"跑过去再空翻" | `[SLIDE, DANCE]`, `[RUN_ACROSS, BACKFLIP]` |
| **否定/修正** | 10% | "不是跑，是飞"、"停下来" | `FLY`, `IDLE` |

### 4.2 使用 easy-dataset 的具体实战步骤

`easy-dataset` 是一个功能强大的可视化数据集创建工具。你可以通过它将非结构化的业务文档（如动作说明书、企鹅性格设定）转化为结构化的微调数据。

#### 1. 启动与配置
- **启动方式**：你可以直接下载其 [Release 客户端](https://github.com/ConardLi/easy-dataset/releases) 运行，或者在本项目同级目录下使用命令启动：
  ```bash
  cd AVATAR/easy-dataset
  npm install
  npm run dev
  # 访问 http://localhost:1717
  ```
- **创建项目**：在 UI 中点击“Create Project”，配置你的教师模型（建议使用 GPT-4o），它将负责生成“标准答案”。

#### 2. 知识注入 (Text Split)
- **准备文档**：编写一个简单的 `actions_doc.md`，列出所有支持的动作及其含义。
- **上传处理**：在“Text Split”模块上传该文档，系统会自动分块。

#### 3. 批量生成 (Question & Dataset)
- **问题生成**：利用“Intelligent Question Generation”功能。设置提示词为：“模拟用户想看 3D 企鹅表演时的各种口语指令，涵盖基础动作、组合动作和情绪指令。”
- **答案生成**：在“Datasets”模块，配置教师模型。你需要给教师模型设置一个 System Prompt，告诉它必须输出特定的工具调用格式：
  > "你是一个 3D 企鹅动作控制专家。对于用户的指令，请严格返回如下格式：<start_function_call>call:animate_avatar{actions:[...]}<end_function_call>"

#### 4. 导出数据
- 点击“Export”，选择 **JSONL** 格式。

## 5. 关键部署认知 (Ollama 用户必读)

在适配 `functiongemma` 时，我们发现了一个关键的技术细节：

### 5.1 接口选择：/api/generate vs /v1
- **原因**：Ollama 的 `/v1` 接口是 OpenAI 兼容层，它会自动对 Prompt 进行二次模板包裹。对于 `functiongemma` 这种对特殊 Token（如 `<start_of_turn>`）极其敏感的模型，二次包裹会导致模型失效（表现为模型开始道歉或输出胡言乱语）。
- **方案**：**必须使用 Ollama 原生的 `/api/generate` 接口**。
- **配置**：在项目设置中，将 API Endpoint 设为 `http://localhost:11434/api/generate`，并确保代码中开启了 `raw: true` 模式。

## 6. 为什么微调后效果会很好？
针对 3D 形象场景，微调将原本属于“逻辑推理”的任务转化为了“模式识别”。270M 模型将不再去思考“我该怎么回答”，而是学会了“看到这类输入就直接触发这个工具”。这能解决你遇到的输入一样但结果不一样的不确定性问题。

