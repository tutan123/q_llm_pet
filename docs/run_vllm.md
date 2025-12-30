# Q-Penguin Pet Model 运行流程

本文档记录了启动模型服务端及前端展示界面的完整流程。

## 1. 启动模型服务端 (WSL2)

请在 WSL 终端中执行以下命令，确保已安装 `vLLM` 和相关环境。

### 激活环境
```bash
conda activate infer_vllm
```

### 启动 vLLM 服务
使用以下参数运行经过微调合并后的 Pet 模型：

```bash
vllm serve EdgeAI/outputs/official_lora_pet_merged_20251228_210849/ \
    --served-model-name pet-model \
    --trust-remote-code \
    --dtype bfloat16 \
    --gpu-memory-utilization 0.7 \
    --max-model-len 1024
```

*注意：`--gpu-memory-utilization 0.7` 可根据显存情况调整（例如 0.3 到 0.9）。*

---

## 2. 启动前端展示界面 (Windows)

在本地 PowerShell 或 CMD 中，进入项目目录并启动 Vite 开发服务器。

### 进入目录
```powershell
cd G:\Projects\Research\AVATAR\q_llm_pet
```

### 启动服务
```powershell
npm run dev
```

启动后，访问浏览器显示的地址（通常是 `http://localhost:5173`）。

---

## 3. 网页端配置连接

进入网页后，需要将前端连接到刚才启动的 vLLM 服务：

1.  点击页面右上角的 **⚙️ (Settings)** 图标。
2.  **Provider**: 选择 `Custom / OpenAI`。
3.  **Base URL**: 输入 `http://localhost:8000/v1` (WSL2 默认会将端口映射到 localhost)。
4.  **API Key**: 随便填写（vLLM 默认不需要）。
5.  **Model Name**: 必须填写 `pet-model`。
6.  点击 **Save Settings**。

现在你可以开始与 3D 企鹅互动了！

---

**Write by xu**
**Last Edited: 2025-12-31**

