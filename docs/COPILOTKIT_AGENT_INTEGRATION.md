# GGBPuppy × CopilotKit 集成开发文档（函数级）

> 面向：写代码的人（博士）。本文不写实现代码，只给到函数签名、文件清单、数据流、风险点。
> 依据：CopilotKit 官方 MDX 源码（`showcase/shell-docs/src/content/docs/*`）+ GitHub 示例
> `examples/v2/runtime/cf-workers`、`examples/v2/node-express`、`examples/v2/react/demo`
> + `@copilotkit/react-core@1.66.2` / `@copilotkit/runtime@1.66.2` 的 package.json。

---

## 0. TL;DR（沈括核）

- **可行性：成立。** GGBPuppy 是 Vite + React 19 SPA，部署在 Cloudflare Pages（带 `_worker.js`）。CopilotKit v2 的 `createCopilotRuntimeHandler` 是纯 Fetch API，官方就有 cf-workers 示例，可直接复用。
- **必纠：Built-in Agent 不是浏览器里的 Agent。** 它在 **CopilotRuntime 进程内** 运行，Runtime 必须挂在你自己的 server。GGBPuppy 必须新增一个后端端点。ChatGPT 那份评估把图画错了。
- **推荐架构：独立 Cloudflare Worker 跑 Runtime，Pages SPA 只做前端。** 跨域 + `cors: true`。这样不动 Pages 的静态资源 worker，不动 Vite 构建，前后端独立部署。
- **前端体积：会涨。** `@copilotkit/react-core` 依赖 lit / radix / katex / react-markdown / tailwind-merge / web-components 等，不是微型库。可接受（你已是 React 应用）。
- **Agent 能力：真 agentic loop。** BuiltInAgent 在 server 端跑多步循环，frontend tools 通过 AG-UI 协议被 relay 到浏览器执行，结果回传给模型继续推理。符合博士「自己决定下一步」的判断标准。
- **新增依赖：** `@copilotkit/react-core`、`@copilotkit/runtime`、`openai`（peer）、`zod`（peer，前端也要）。
- **新增基础设施：** 一个 Cloudflare Worker + 一个 `OPENAI_API_KEY` secret。免费额度够用。

---

## 1. 可行性评估

### 1.1 能力对照

| 需求 | CopilotKit v2 是否满足 | 证据 |
| --- | --- | --- |
| 真 Agent（多步、自决下一步、调工具） | ✅ | `BuiltInAgent` 在 Runtime 进程内跑 agent loop；frontend tools 经 AG-UI relay 回浏览器执行，结果回传模型 |
| Frontend tools 访问 React state / 浏览器 API / 第三方库（ggbApplet） | ✅ | `frontend-tools.mdx`：「handler executes on the frontend, direct access to component state, browser APIs, any third-party UI library」 |
| 不引入 LangGraph / CrewAI / Vector DB / Sandbox | ✅ | BuiltInAgent 即「no external framework」 |
| 部署在 Cloudflare | ✅ | `examples/v2/runtime/cf-workers/src/index.ts` 官方示例 |
| React 19 兼容 | ✅ | `react-core` peerDependencies: `react: '^18 || ^19 || ^19.0.0-rc'` |
| 极致轻量前端 bundle | ⚠️ 不满足 | react-core 依赖链庞大（见 1.3） |

### 1.2 关键架构事实（必须先消化）

```text
浏览器 (GGBPuppy SPA)                      Cloudflare Worker (ggbpuppy-agent)
┌──────────────────────────┐               ┌─────────────────────────────────┐
│ <CopilotKitProvider       │  HTTP POST    │ createCopilotRuntimeHandler       │
│   runtimeUrl=            │ ─────────────▶│  → CopilotRuntime                  │
│   "https://agent…/api/    │  AG-UI 事件流 │     agents.default =              │
│    copilotkit">          │ ◀─────────────│       new BuiltInAgent({           │
│                          │  SSE 流回前端 │         model: "openai/gpt-4.1",   │
│  <CopilotSidebar/>       │               │         tools: [serverTools…],     │
│                          │               │         instructions: …          │
│  useFrontendTool ×4      │               │       })                           │
│   ├ read_code            │  ① 模型调     │                                    │
│   ├ write_code           │ ◀────────────│  ② Runtime 经 AG-UI 把 tool call    │
│   ├ run_code             │  relay 到前端 │     relay 到浏览器                  │
│   └ inspect_construction │ ─────────────▶│  ③ 浏览器执行 handler（操作        │
│     (handler 闭包持有     │  tool result │     ggbApplet / CodeMirror）       │
│      ggbApplet / code)   │               │  ④ result 回传 Runtime → 模型       │
│                          │               │  ⑤ 模型决定是否再调工具（loop）     │
└──────────────────────────┘               └─────────────────────────────────┘
                                            ↑ OPENAI_API_KEY 只活在这里（secret）
```

要点：
1. **agent loop 在 Worker 里跑**，不在浏览器。浏览器只是「工具执行器 + UI」。
2. **frontend tool 的 handler 在浏览器执行**，但调用决定是 Worker 里的 LLM 做的。每次 tool call 是一次浏览器↔Worker 往返。
3. **`OPENAI_API_KEY` 永远不进浏览器**。只作为 Worker secret。

### 1.3 体积/依赖代价（诚实告知）

`@copilotkit/react-core` 1.66.2 的 dependencies（节选）：`lit`、`@radix-ui/*`、`katex`、`react-markdown`、`tailwind-merge`、`@tanstack/react-virtual`、`@copilotkit/web-components`、`streamdown`、`use-stick-to-bottom`、`rxjs`…。生产 bundle gzip 后预估 **150–250 KB 量级**（未实测，装完用 `vite build` 报告为准）。

`@copilotkit/runtime` 1.66.2 依赖 `graphql-yoga`、`hono`、`ai`（Vercel AI SDK）、`@ai-sdk/openai`、`type-graphql`、`pino`、`ws` 等——**只在 Worker 端**，不进前端 bundle。Worker bundle 体积大但 Cloudflare Workers 限额（compressed 3MB）够用。

### 1.4 风险与坑（必须看）

| # | 坑 | 说明 | 对策 |
| --- | --- | --- | --- |
| R1 | ChatGPT 评估的架构图错 | BuiltInAgent 是 server 进程内 Agent，不是浏览器 | 按本文 §2 架构走 |
| R2 | ggbApplet 生命周期 | applet 未就绪时 frontend tool handler 拿到 null | handler 必须判空并返回结构化「未就绪」消息让 agent 等待/重试 |
| R3 | 现有 `useGGBRunner.run` 是慢动作演示（带 `interval` 延时） | agent 调 `run_code` 会很慢且阻塞 | 新增 `execFast`：无延时、逐行 `evalCommand`、收集成功/失败，给 agent 用；保留 `run` 给人类演示 |
| R4 | `evalCommand` 返回值未捕获 | 现有 `useGGBRunner` 忽略返回值，无法告诉 agent 哪行失败 | `execFast` 用 `ggbApplet.evalCommand(line)` 的 boolean 返回 + `getAllObjectNames` 复核 |
| R5 | frontend tool handler 闭包需访问 `ggbApplet`、`code`、`setCode` | `useFrontendTool` 注册在哪个组件很关键 | 新建 `GgbAgentBridge` 组件，吃一个 `useGgbAgentApi()` hook 返回的句柄；或用 Context |
| R6 | 跨域 | Worker 域名 ≠ Pages 域名 | `createCopilotRuntimeHandler({ cors: true })`；`runtimeUrl` 用绝对 URL |
| R7 | React 19 + Vite | react-core peer 支持 19，但内部用了 lit web-components | 装完先跑 `vite build` 验证无 SSR/`window` 报错；必要时 `optimizeDeps.include` |
| R8 | Worker bundle 太大 | runtime 依赖一堆 node-ish 包 | 用 wrangler（esbuild）打包；若超限再考虑 dynamic import / external |
| R9 | API key 成本/滥用 | Worker 暴露在公网 | 加 `forwardHeaders` allowlist + 可选简单鉴权头；监控用量 |
| R10 | GeoGebra 3D / 2D applet 切换会重建 applet | `EditorLayout` 用 `key={enable3D ? '3d':'2d'}` 重建 `GGBViewer`，applet 实例会变 | `GgbAgentBridge` 的 `ggbApplet` 句柄要从 `EditorLayout` 的 state 取，确保重建后同步 |
| R11 | 系统提示已有 `public/prompt.txt` | 现成 GGB 建模助手 prompt V3.1 | BuiltInAgent 的 `instructions` 直接复用/扩展它，不要重写 |

---

## 2. 目标架构

### 2.1 部署方案二选一

**方案 A（推荐）：独立 Cloudflare Worker**
- 新建 Worker `ggbpuppy-agent`，跑 `CopilotRuntime` + `BuiltInAgent`。
- Pages SPA 不变，只把 `runtimeUrl` 指向 `https://ggbpuppy-agent.<subdomain>.workers.dev/api/copilotkit`。
- 优点：前后端独立部署；Pages 构建/构建产物零侵入；Worker 可独立扩缩。
- 代价：多一个 Worker + 跨域配置。

**方案 B：嵌入现有 Pages `_worker.js`**
- 在 `_worker.js` 里加 `/api/copilotkit` 分支，调 `createCopilotRuntimeHandler`。
- 问题：现有 `_worker.js` 是未打包的纯 JS；`@copilotkit/runtime` 是 ESM 大包，必须改用 wrangler 打包构建（`functions/` 目录或打包后的 `_worker.js`）。Vite 不打包 worker。
- 优点：同域、无跨域。
- 代价：改造 Pages 构建管线；asset 路由与 agent 路由耦合。

**结论：走方案 A。** 除非博士明确要同域，否则不碰 Pages 构建。

### 2.2 组件树（前端）

```text
main.jsx
  └─ <App/>
       └─ <EditorLayout/>                       (已有，改造)
            ├─ <AppHeader/>
            ├─ <CodeEditor/>
            ├─ <ControlPanel/>
            ├─ <GGBViewer onReady={setGgbApplet}/>
            └─ <CopilotKitProvider               (新增，包住 EditorLayout 或更上层)
                 runtimeUrl={AGENT_RUNTIME_URL}
                 agent="default">
                 <GgbAgentBridge                  (新增)
                   ggbApplet={ggbApplet}
                   code={code}
                   setCode={setCode}
                   run={run}
                   reset={reset}
                   enable3D={enable3D}/>
                 <CopilotSidebar                  (新增)
                   defaultOpen={false}
                   labels={{...}}/>
               </CopilotKitProvider>
```

> 注意：`CopilotKitProvider` 必须包住「注册 frontend tool 的组件」和「聊天 UI」二者。`GgbAgentBridge` 调 `useFrontendTool`，所以它必须在 Provider 内。`CopilotSidebar` 也在 Provider 内。
> 推荐把 Provider 提到 `EditorLayout` 的最外层 div 内，包住现有 main + 新增 sidebar。

---

## 3. 后端规格（Cloudflare Worker）

### 3.1 文件清单（新建独立 Worker 仓库或 monorepo 子目录）

```
ggbpuppy-agent/                   (新建，可独立 repo 或 ggbpuppy/agent/)
├─ src/
│  └─ index.ts                    (Worker 入口)
├─ src/prompt.ts                  (系统提示，复用 public/prompt.txt)
├─ src/tools.ts                   (可选：server-side tools，defineTool)
├─ wrangler.toml
├─ package.json
├─ tsconfig.json
└─ .dev.vars                      (本地 OPENAI_API_KEY，不入库)
```

### 3.2 `src/index.ts` 函数级签名

```ts
// 入口：export default { fetch(request, env, ctx) }
//   1. 实例化 CopilotRuntime，agents.default = new BuiltInAgent({...})
//   2. createCopilotRuntimeHandler({ runtime, basePath, cors: true })
//   3. return handler(request)
//
// env 类型：
export interface Env {
  OPENAI_API_KEY: string;          // secret，wrangler secret put OPENAI_API_KEY
  // 可选：自定义鉴权头
  AGENT_TOKEN?: string;            // 可选：前端配 x-agent-token 校验
}
```

**实例化要点：**
- `model: "openai/gpt-4.1"`（格式 `provider/model`，Vercel AI SDK 风格；可选 `openai/gpt-4o-mini`、`anthropic/claude-...`）。
- `instructions`: import 自 `prompt.ts`（导出 `GGB_SYSTEM_PROMPT` 字符串，内容来自 `public/prompt.txt`，按需补一句「你有 4 个 frontend tools：read_code / write_code / run_code / inspect_construction，按需多步调用」）。
- `tools`: 第一版可空数组（全部交给 frontend tools）。如需 server 端纯计算工具（如解方程、坐标几何计算）再用 `defineTool` 加。
- 模型 API key 通过 env 注入；BuiltInAgent 默认从 `env.OPENAI_API_KEY` 读（与 cf-workers 示例一致）。若需显式传 `apiKey`，按 `BuiltInAgent` 构造选项补。

### 3.3 `wrangler.toml` 关键项

```toml
name = "ggbpuppy-agent"
main = "src/index.ts"
compatibility_date = "2025-02-01"   # 与官方示例对齐
```

`OPENAI_API_KEY` 用 `wrangler secret put OPENAI_API_KEY` 注入，不写进 toml。

### 3.4 可选 server tools（`src/tools.ts`）

```ts
// defineTool({ name, description, parameters: z.object({...}), execute: async (args) => {...} })
// 第一版不需要。留空文件 + 注释说明何时用。
```

### 3.5 自定义第三方 API 与环境变量（关键，博士必看）

源码依据：`packages/runtime/src/agent/index.ts` 第 197–246 行（`resolveModel`）+ 第 810–817 行（`BuiltInAgentClassicConfig`）。

#### 3.5.1 能用第三方 OpenAI 兼容端点吗？能。

BuiltInAgent 解析 `model: "openai/<modelId>"` 时，源码是这样读配置的：

```ts
// 源码节选（agent/index.ts:197-210）
case "openai":
  return openai(model, {
    apiKey: apiKey || process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL,   // ← 自定义端点入口
  });
```

所以 **任何 OpenAI 协议兼容端点**都能用，只要设 `OPENAI_BASE_URL` 环境变量：
- DeepSeek：`OPENAI_BASE_URL=https://api.deepseek.com`
- Moonshot：`OPENAI_BASE_URL=https://api.moonshot.cn/v1`
- 硅基流动：`OPENAI_BASE_URL=https://api.siliconflow.cn/v1`
- OpenRouter：`OPENAI_BASE_URL=https://openrouter.ai/api/v1`
- 自建中转 / OneAPI / NewAPI：`OPENAI_BASE_URL=https://your-proxy.com/v1`

Anthropic / Google 同理各有 `ANTHROPIC_BASE_URL` / `GOOGLE_GENERATIVE_AI_BASE_URL`。

#### 3.5.2 两条实现路线

**路线 1（简单，env 驱动）**：在 Worker 入口把 `env` 写进 `process.env`，再靠 BuiltInAgent 自己读。
```ts
// src/index.ts fetch 体内，new BuiltInAgent 之前：
process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
process.env.OPENAI_BASE_URL = env.OPENAI_BASE_URL; // 可选，自定义端点时设
```
- 优点：一行 model 字符串 `"openai/gpt-4.1"` 就行。
- 代价：依赖 `process.env`，wrangler.toml 必须加 `compatibility_flags = ["nodejs_compat"]`，否则 Workers 上 `process is not defined`。
- ⚠️ 官方 `examples/v2/runtime/cf-workers` 示例的 `wrangler.toml` **漏了这行 flag**，照抄会炸。这是示例疏漏，不是 CopilotKit 不支持。

**路线 2（干净，显式传 LanguageModel，推荐用于第三方 API）**：用 `@ai-sdk/openai` 的 `createOpenAI` 自己造一个 model 对象传进 BuiltInAgent，完全绕开 `process.env`。
```ts
import { createOpenAI } from "@ai-sdk/openai"; // runtime 已带此 dep，无需额外装

const openai = createOpenAI({
  baseURL: env.OPENAI_BASE_URL,   // 第三方端点
  apiKey: env.OPENAI_API_KEY,
});
const model = openai("gpt-4.1"); // 或 "deepseek-chat" 等第三方模型 id

new BuiltInAgent({ model, apiKey: env.OPENAI_API_KEY });
```
- 优点：baseURL/apiKey 全显式，不依赖 `process.env`，不需要 `nodejs_compat`。第三方 API 走这条最稳。
- `model` 字段类型是 `BuiltInAgentModel | LanguageModel`（源码 812 行），接受 LanguageModel 对象。

#### 3.5.3 环境变量怎么配（Cloudflare 事实）

- **明文变量**（非敏感）：`wrangler.toml` 的 `[vars]` 段，或 Pages Dashboard → Settings → Environment variables。
- **secret（敏感，如 API key）**：`wrangler secret put OPENAI_API_KEY`（Worker）或 Pages Dashboard → Settings → Environment variables → Encrypt。secret 不进 git，只在运行时注入 `env`。
- Worker `fetch(request, env, ctx)` 的 `env.OPENAI_API_KEY` 即读到 secret。
- **不需要** OpenAI 官方 key：用第三方端点时，`OPENAI_API_KEY` 填第三方平台发给你的 key 即可。

#### 3.5.4 本项目推荐配置

```toml
# wrangler.toml
name = "ggbpuppy-agent"
main = "src/index.ts"
compatibility_date = "2025-02-01"
compatibility_flags = ["nodejs_compat"]   # 路线 1 需要；路线 2 可不加但加了无害

[vars]
# 明文、非敏感可放这里；敏感的别放，用 secret
```

```bash
wrangler secret put OPENAI_API_KEY      # 第三方平台的 key
wrangler secret put OPENAI_BASE_URL     # 可选，仅路线 1 需要
```

---

### 3.6 部署后产出

- `https://ggbpuppy-agent.<subdomain>.workers.dev/api/copilotkit` ← 前端 `runtimeUrl` 指向它。
- 健康检查：`curl -X POST https://.../api/copilotkit -H 'content-type: application/json' -d '{}'` 应返回 AG-UI 协议错误体（说明路由通）。

---

## 4. 前端规格（GGBPuppy SPA）

### 4.1 新增依赖

```
npm i @copilotkit/react-core zod
```
- `@copilotkit/runtime` 只装在 Worker 侧，**不装** 在 SPA。
- `zod` 前端要（`useFrontendTool` 的 `parameters` 用 zod schema）。

### 4.2 环境变量

`.env.development` / `.env.production` 加：
```
VITE_AGENT_RUNTIME_URL=https://ggbpuppy-agent.<subdomain>.workers.dev/api/copilotkit
```
（开发期可用本地 `wrangler dev` 的 `http://localhost:4006/api/copilotkit`。）

### 4.3 新增文件清单

```
src/
├─ agent/
│  ├─ GgbAgentBridge.jsx          (注册 4 个 useFrontendTool)
│  ├─ useGgbAgentApi.js           (把 ggbApplet/code/run 封成稳定句柄)
│  ├─ execFast.js                 (无延时执行 GGB 代码 + 收集结果)
│  ├─ inspectConstruction.js      (读取画布对象列表 + 命令串)
│  └─ agentConfig.js               (runtimeUrl、labels、suggestions 常量)
└─ components/
   └─ AgentSidebar.jsx             (CopilotSidebar 薄封装，可选)
```

### 4.4 函数级签名

#### 4.4.1 `src/agent/execFast.js`

```js
/**
 * 无延时逐行执行 GeoGebra 指令，收集每行成功/失败。
 * 给 agent 的 run_code 工具用（区别于人类慢动作演示的 useGGBRunner.run）。
 *
 * @param {object} ggbApplet - GeoGebra applet 实例（必须已就绪）
 * @param {string} code      - GeoGebra 指令文本（可含 // 注释与空行）
 * @returns {{
 *   ok: boolean,
 *   total: number,
 *   succeeded: number,
 *   failed: Array<{ line: number, index: number, command: string, error: string }>,
 *   executed: Array<{ index: number, command: string }>
 * }}
 *   - ok: 全部成功为 true
 *   - 失败不中断，继续执行后续行（agent 可据此判断整体结果）
 *   - 不调用 ggbApplet.reset()（由调用方决定是否先 reset）
 */
export function execFast(ggbApplet, code) { /* 用 parseCommandsWithLineIndex + evalCommand */ }
```

实现要点：
- 复用 `src/lib/code/commands.js` 的 `parseCommandsWithLineIndex`。
- 每行 `const ok = ggbApplet.evalCommand(cmd)`；`ok === false` 记失败。
- 失败时尝试 `ggbApplet.getError()`（若 applet 支持）补充 error 文本；不支持则 `"evalCommand returned false"`。
- **不 reset**、**不 sleep**、**不 setCurrentLine**（agent 不需要高亮）。

#### 4.4.2 `src/agent/inspectConstruction.js`

```js
/**
 * 读取当前画布的对象清单与定义串，供 agent 「看」画布状态。
 * @param {object} ggbApplet
 * @returns {{
 *   ready: boolean,
 *   objectCount: number,
 *   objects: Array<{ name: string, commandString: string, type: string, visible: boolean }>,
 *   xml?: string   // 可选：ggbApplet.getXML() 精简版，用于深度诊断
 * }}
 */
export function inspectConstruction(ggbApplet) { /* getAllObjectNames + getCommandString + getObjectType + getVisible */ }
```

#### 4.4.3 `src/agent/useGgbAgentApi.js`

```js
/**
 * 把 EditorLayout 的 ggbApplet / code / setCode / run / reset / enable3D
 * 封成一个引用稳定的 api 对象，供 GgbAgentBridge 注册 tool 时闭包使用。
 *
 * 关键：ggbApplet 会因 3D/2D 切换而重建，必须用 ref 持有最新值，
 * 否则 useFrontendTool 的 handler 闭包会捕获到旧的 null。
 *
 * @param {object} input - { ggbApplet, code, setCode, run, reset, enable3D }
 * @returns {object} api - { getCode, setCode, runCode, resetCanvas, getApplet, isReady, enable3D }
 */
export function useGgbAgentApi(input) { /* useRef + useMemo */ }
```

要点：
- `ggbApplet` 用 `useRef` 持有，每次 render 同步 `ref.current = ggbApplet`。
- `code` 同理用 ref 持有最新值（handler 调用时读 `codeRef.current`，避免闭包陈旧）。
- 返回的 api 对象引用稳定（`useMemo([])`），保证 `useFrontendTool` 不重复注册。

#### 4.4.4 `src/agent/GgbAgentBridge.jsx`

```jsx
/**
 * 注册 4 个 frontend tool。不渲染任何 UI（return null）。
 * 必须挂在 <CopilotKitProvider> 内部。
 *
 * @param {object} api - useGgbAgentApi() 返回值
 */
export default function GgbAgentBridge({ api }) {
  // ① read_code：读当前编辑器代码
  useFrontendTool({
    name: "read_code",
    description: "读取当前 GeoGebra 代码编辑器中的全部指令。在动手写代码前先调用，了解现状。",
    parameters: z.object({}).strict(),
    handler: async () => ({
      code: api.getCode(),
      lineCount: api.getCode().split("\n").length,
      ready: api.isReady()
    })
  });

  // ② write_code：覆盖编辑器代码（不执行）
  useFrontendTool({
    name: "write_code",
    description: "用新内容覆盖代码编辑器。不会执行，需另调 run_code。code 为完整 GeoGebra 指令文本。",
    parameters: z.object({
      code: z.string().describe("完整 GeoGebra 指令，每行一条，支持 // 注释")
    }),
    handler: async ({ code }) => {
      api.setCode(code);
      return { written: true, lineCount: code.split("\n").length };
    }
  });

  // ③ run_code：执行当前编辑器代码（快速、无延时）
  useFrontendTool({
    name: "run_code",
    description: "执行当前编辑器里的 GeoGebra 指令。可选 reset=true 先清空画布。返回每行成功/失败汇总。",
    parameters: z.object({
      reset: z.boolean().default(true).describe("执行前是否先清空画布")
    }),
    handler: async ({ reset }) => {
      if (!api.isReady()) return { ok: false, error: "GeoGebra applet 未就绪" };
      if (reset) api.resetCanvas();
      const res = execFast(api.getApplet(), api.getCode());
      return res; // { ok, total, succeeded, failed, executed }
    }
  });

  // ④ inspect_construction：读取画布对象
  useFrontendTool({
    name: "inspect_construction",
    description: "读取当前画布上所有几何对象（名称、定义串、类型、可见性）。用于确认构造结果是否符合预期。",
    parameters: z.object({}).strict(),
    handler: async () => inspectConstruction(api.getApplet())
  });

  return null;
}
```

> 4 个 tool 名称、参数、返回结构即上面写死的契约。`z` 从 `zod` import。`useFrontendTool` 从 `@copilotkit/react-core/v2` import。

#### 4.4.5 `src/agent/agentConfig.js`

```js
export const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL;
export const AGENT_ID = "default";
export const AGENT_LABELS = {
  title: "GGBPuppy 助手",
  placeholder: "描述你要构造的几何图形…",
  // 见 CopilotSidebar labels 文档
};
export const AGENT_SUGGESTIONS = [
  { title: "画三角形外接圆", message: "帮我画一个三角形 ABC 的外接圆" },
  { title: "单位圆动点", message: "画单位圆，作点 A=(cos(t),sin(t))，t 加滑动条" }
];
```

### 4.5 `EditorLayout.jsx` 改造点（最小侵入）

1. import `CopilotKitProvider`、`CopilotSidebar`（`@copilotkit/react-core/v2`）、`useGgbAgentApi`、`GgbAgentBridge`、`agentConfig`。
2. 在组件内调 `const agentApi = useGgbAgentApi({ ggbApplet, code, setCode, run, reset, enable3D })`。
3. 在最外层 `<div>` 内包一层 `<CopilotKitProvider runtimeUrl={AGENT_RUNTIME_URL} agent={AGENT_ID}>`，其内放 `<GgbAgentBridge api={agentApi}/>` 和 `<CopilotSidebar .../>`，其余 DOM 不动。
4. import `@copilotkit/react-core/v2/styles.css`（放 `main.jsx` 或 `index.css` 旁）。

> 不要把 `CopilotKitProvider` 放到 `App.jsx` 之上——`EmbedLayout`（嵌入分享页）不需要 agent，避免无谓加载。

### 4.6 样式与暗色

- react-core v2 用 oklch CSS 变量（见 react demo）。暗色模式可在 `<CopilotSidebar className="dark"/>` 或父容器加 `dark` class。
- 与现有 `useDarkMode` 联动：`<CopilotSidebar className={isDark ? "dark" : undefined}/>`。

---

## 5. 数据流走查：「画三角形 ABC 的外接圆」

```text
用户: "画三角形 ABC 的外接圆"
  │
  ▼
CopilotSidebar → POST runtimeUrl → Worker
  │ BuiltInAgent 收到 message，读 instructions（含 public/prompt.txt）
  ▼
模型 step 1: 调 read_code()
  ◀ AG-UI tool_call relay 到浏览器
  GgbAgentBridge handler: 返回 { code: "...", ready: true }
  ▶ result 回传 → 模型
  │
模型 step 2: 调 write_code({ code: "A=(0,0)\nB=(4,0)\nC=(2,3)\nCircumCircle(A,B,C)" })
  ◀ relay → handler: api.setCode(code) → CodeMirror 更新
  ▶ { written: true, lineCount: 4 }
  │
模型 step 3: 调 run_code({ reset: true })
  ◀ relay → handler: api.resetCanvas(); execFast(applet, code)
     → ggbApplet.evalCommand 逐行 → A/B/C/外接圆生成
  ▶ { ok: true, total: 4, succeeded: 4, failed: [] }
  │
模型 step 4: 调 inspect_construction()
  ◀ relay → handler: getAllObjectNames → 返回 4 对象
  ▶ { ready: true, objectCount: 4, objects: [...] }
  │
模型 step 5: 确认成功 → 文本回复用户
  ▶ CopilotSidebar 渲染: "已构造三角形 ABC 及其外接圆。"
```

失败分支：若 step 3 `failed: [{command:"CircumCircle(A,B,C)", error:"..."}]`，模型据 `failed` 自行修代码，再 write_code + run_code。

---

## 6. 实施阶段（建议顺序）

| 阶段 | 内容 | 验证 |
| --- | --- | --- |
| P0 | 装依赖：SPA 装 `@copilotkit/react-core` + `zod`；Worker 装 `@copilotkit/runtime` + `openai` | `vite build` 通过；`wrangler deploy` 通过 |
| P1 | 起 Worker：`src/index.ts` 用官方 cf-workers 示例抄，model `openai/gpt-4.1-mini`，instructions 空串 | `curl POST /api/copilotkit` 路由通 |
| P2 | SPA 接 Provider + 空 `<CopilotSidebar/>`，`runtimeUrl` 指向 Worker | 侧栏能出，能聊（无工具） |
| P3 | 实现 `execFast` + `inspectConstruction`（纯函数，先单测/手测） | 在控制台手调成功 |
| P4 | `useGgbAgentApi` + `GgbAgentBridge` 注册 4 tool，接进 `EditorLayout` | 让模型调 read_code 看返回 |
| P5 | 把 `public/prompt.txt` 接进 Worker `instructions` | 模型按 GGB 规范写代码 |
| P6 | 联调「外接圆」「单位圆动点」两个示例 | 端到端成功 |
| P7 | 暗色联动、suggestions、错误文案、applet 未就绪处理 | 体验打磨 |

---

## 7. 验收清单

- [ ] `vite build` 成功，bundle 体积记录（决策是否接受）。
- [ ] `wrangler deploy` 成功，`https://.../api/copilotkit` 可达。
- [ ] `OPENAI_API_KEY` 仅存于 Worker secret，`wrangler secret list` 可见，前端 bundle 里 grep 不到。
- [ ] 侧栏输入「画三角形 ABC 的外接圆」，模型依次调用 read_code→write_code→run_code→inspect_construction，画布出现三角形与外接圆。
- [ ] 故意输入错误指令时，模型据 `run_code` 返回的 `failed` 自行修复并重跑。
- [ ] applet 未就绪时（刷新瞬间），tool 返回「未就绪」而非崩溃。
- [ ] 3D/2D 切换后，agent 仍能操作新 applet（句柄同步验证）。
- [ ] 暗色模式下侧栏可读。

---

## 8. 待博士拍板的开放问题

1. **模型选型**：`openai/gpt-4.1` vs `gpt-4.1-mini` vs `anthropic/claude-...`？影响成本与质量。GGB 代码生成建议先用 `gpt-4.1-mini` 跑通，再升。
2. **方案 A vs B**：是否接受新增一个独立 Worker（推荐）？还是坚持同域、要改造 Pages 构建？
3. **API key 费用**：谁出、限额多少？是否要加简单鉴权（前端带 `x-agent-token`，Worker 校验）防滥用？
4. **server tools**：第一版是否完全交给 frontend tools？还是把「解方程/坐标计算」做成 server tool（省一次往返、确定性更高）？
5. **嵌入页 `EmbedLayout`**：分享/嵌入页要不要也带 agent？默认建议「不带」，保持嵌入轻量。

---

## 9. 参考源（已核对）

- 官方 MDX：`showcase/shell-docs/src/content/docs/{built-in-agent,frontend-tools,concepts/architecture,concepts/which-hook,backend/copilot-runtime,prebuilt-components/sidebar,prebuilt-components/chat,shared-state,agent-config}.mdx`
- 官方示例：`examples/v2/runtime/cf-workers/src/index.ts`（Worker 入口范式）、`examples/v2/node-express/src/index.ts`（`defineTool` 范式）、`examples/v2/react/demo/src/app/{page,sidebar/page}.tsx`（`CopilotKitProvider`/`useFrontendTool`/`CopilotSidebar` 范式）
- 包元数据：`packages/react-core/package.json`（peer: react ^19, zod>=3）、`packages/runtime/package.json`（peer: openai ^4.85||^5）
- 现有可复用：`src/lib/code/commands.js`（`parseCommandsWithLineIndex`）、`src/hooks/useGGBRunner.js`（人类演示用，agent 不直接用）、`public/prompt.txt`（系统提示素材）、`src/components/GGBViewer.jsx`（`onReady` 给出 applet）