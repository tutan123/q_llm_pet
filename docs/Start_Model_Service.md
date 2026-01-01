# 🚀 模型服务快速启动指南

本文档提供启动微调后的 **pet-model** 服务的核心步骤。

## 1. 环境准备 (WSL2 / Linux)

首先进入 Conda 虚拟环境：

```bash
conda activate infer_vllm
```

## 2. 启动 vLLM 服务

执行以下命令启动模型服务（已根据您的显存配置优化）：

```bash
vllm serve EdgeAI/outputs/official_lora_pet_merged_20251228_210849/ \
  --served-model-name pet-model \
  --trust-remote-code \
  --dtype bfloat16 \
  --gpu-memory-utilization 0.3 \
  --max-model-len 1024
```

### 参数简要说明：
*   `--served-model-name`: 定义模型名称为 `pet-model`（需在前端 Settings 中匹配）。
*   `--gpu-memory-utilization`: 设置为 `0.3`（占用 30% 显存），适合在运行其他程序时节省资源。
*   `--max-model-len`: 限制上下文长度为 `1024`，提高响应速度。

## 3. 前端配置连接

启动服务后，在网页的 **Configuration** 面板进行如下配置：

*   **Provider**: 选择 `Gemma` 或 `OpenAI`。
*   **API Endpoint**: `http://localhost:8000/v1/completions` (Gemma) 或 `http://localhost:8000/v1` (OpenAI)。
*   **Model Name**: `pet-model`。

---
*Last Updated: 2026-01-01*

