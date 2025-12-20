# 🐧 Q-Penguin 3D AI Avatar 本地部署指南

本文档将指导你如何在本地环境运行 Q-Penguin 项目，并连接到 Google Gemini 或本地 Ollama 模型。

## 1. 环境准备

确保你的电脑上安装了以下软件：
*   **Node.js** (推荐版本 v18 或更高): [下载地址](https://nodejs.org/)
*   **代码编辑器**: 推荐 VS Code。

## 2. 初始化项目

打开终端（Terminal 或 CMD），执行以下命令创建一个新的 Vite React TypeScript 项目：

```bash
# 创建项目文件夹
npm create vite@latest q-penguin-3d -- --template react-ts

# 进入文件夹
cd q-penguin-3d

# 安装核心依赖
npm install three @types/three @react-three/fiber @react-three/drei @google/genai
```

## 3. 配置文件结构

Vite 项目创建后，你需要将我之前生成的代码复制到对应的文件中。请按照以下目录结构组织文件：

**项目根目录结构：**
```text
q-penguin-3d/
├── index.html          <-- 替换为下面的内容
├── package.json
├── tsconfig.json
├── vite.config.ts      <-- 需要修改 (见第4步)
└── src/
    ├── main.tsx        <-- 原 index.tsx 内容放这里
    ├── App.tsx
    ├── types.ts
    ├── constants.ts
    ├── metadata.json
    ├── components/
    │   ├── Penguin3D.tsx
    │   ├── Stage.tsx
    │   └── SettingsModal.tsx
    └── services/
        ├── geminiService.ts
        ├── customLLMService.ts
        └── llmService.ts
    └── docs/
        └── guide.md    <-- 本文件
```

### 关键文件修改说明

**A. `index.html` (位于根目录)**
直接使用你提供的 `index.html` 内容覆盖 Vite 生成的默认文件。
*注意：Vite 默认会在 `<body>` 里引用 `/src/main.tsx`，确保你的 HTML 里保留或添加这行：*
```html
<!-- 在 body 结束标签前添加 -->
<script type="module" src="/src/main.tsx"></script>
```
*如果你使用 CDN 的 Tailwind (如你代码所示)，确保 `<script src="https://cdn.tailwindcss.com"></script>` 在 `<head>` 中。*

**B. `src/main.tsx`**
将你提供的 `index.tsx` 内容复制到这里。

**C. `src/vite-env.d.ts` (可选)**
如果在代码中看到 TS 报错 `process.env`，可以在此文件中添加 `declare const process: any;`，或者忽略它，通过第 4 步解决。

## 4. 解决 `process.env` 问题

你的代码中使用了 `process.env.API_KEY`。在浏览器环境（Vite）中通常使用 `import.meta.env`。为了不修改现有业务代码，我们在 `vite.config.ts` 中做一个简单的兼容配置。

修改 **`vite.config.ts`**：

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 这是一个简单的 polyfill，让代码里的 process.env 不会报错
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY || '') 
      }
    }
  }
})
```

## 5. 启动项目

在终端中运行：

```bash
npm run dev
```

终端会显示一个地址，通常是 `http://localhost:5173/`。按住 Ctrl 点击链接或在浏览器输入该地址。

你现在应该能看到：
1.  **3D 舞台**：有灯光、红幕布和小企鹅。
2.  **UI 界面**：右侧的聊天框和底部的输入框。
3.  **设置按钮**：右上角的齿轮图标。

---

## 6. 如何连接大模型

### 方式 A：使用 Google Gemini (云端)
1.  点击右上角 **⚙️ (设置)** 按钮。
2.  Provider 选择 **Google Gemini**。
3.  项目代码默认会读取环境变量，或者你也可以后续修改代码让它支持在弹窗里输入 Key。
    *   *提示：由于 Google GenAI SDK 在前端直接用 Key 不安全，如果你只是本地测试，可以在项目根目录新建 `.env` 文件，写入 `API_KEY=你的_GEMINI_KEY`，重启 `npm run dev` 即可。*

### 方式 B：使用本地 Ollama (完全免费/本地)
这是你提到的重点需求。

1.  **安装 Ollama**: 访问 [ollama.com](https://ollama.com/) 下载并安装。
2.  **拉取模型**: 在终端运行一个支持 Function Calling 的模型（推荐 `llama3` 或 `qwen2.5`）。
    ```bash
    ollama run llama3
    ```
3.  **解决跨域问题 (CORS)**:
    Ollama 默认只允许本地访问，且对浏览器跨域有严格限制。你需要设置环境变量启动 Ollama。
    *   **Mac/Linux**:
        ```bash
        OLLAMA_ORIGINS="*" ollama serve
        ```
    *   **Windows (PowerShell)**:
        ```powershell
        $env:OLLAMA_ORIGINS="*"; ollama serve
        ```
4.  **在网页中配置**:
    *   点击网页右上角 **⚙️** 设置。
    *   Provider 选择: **Custom / OpenAI**。
    *   Base URL: `http://localhost:11434/v1` (这是 Ollama 的 OpenAI 兼容接口)。
    *   API Key: 随便填 (Ollama 不需要，填 `ollama` 即可)。
    *   Model Name: `llama3` (必须和你 `ollama run` 的名字一致)。
    *   点击 **Save Settings**。

### 方式 C：使用 vLLM / SGLang
只要服务端的 API 兼容 OpenAI 格式（`/v1/chat/completions`）：
1.  Provider 选择: **Custom / OpenAI**。
2.  Base URL: 填你的服务器地址，例如 `http://192.168.1.100:8000/v1`。
3.  API Key: 如果设了就填，没设随便填。
4.  Model Name: 填部署的模型名称。
