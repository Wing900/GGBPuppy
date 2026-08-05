# GGBPuppy Agent（CopilotKit 后端）

解耦的 Cloudflare Worker，提供 CopilotKit Runtime + BuiltInAgent，作为 GGBPuppy 前端的 AI 后端。

## 环境变量（全部外部注入，代码零写死）

| 变量 | 说明 |
| --- | --- |
| `OPENAI_API_KEY` | 任意 OpenAI 协议兼容平台的 key |
| `OPENAI_BASE_URL` | 任意 OpenAI 协议兼容端点（DeepSeek / Moonshot / 硅基流动 / OpenRouter / 自建中转） |
| `OPENAI_MODEL` | 该平台下的 model id（与 BASE_URL 配套，如 `deepseek-chat`） |

换 provider 只改这三个值，不改代码。

## Cloudflare Worker 部署（已解决 workerd 兼容）

`wrangler.toml` 必须包含 `define`，否则 workerd 起不来：

```toml
name = "ggbpuppy-agent"
main = "src/index.js"
compatibility_date = "2025-06-01"
compatibility_flags = ["nodejs_compat"]
# 关键：workerd 不提供 import.meta.url。esbuild 打 CJS 依赖（@copilotkit/runtime 等）时
# 会生成顶层 createRequire(import.meta.url)，在 workerd 里 import.meta.url 为 undefined 而崩溃。
# define 把它替换为有效路径即可。
define = { "import.meta.url" = "\"file:///worker.js\"" }
```

> ⚠️ `wrangler.toml` 被 `.gitignore` 忽略（含敏感配置），部署前需手动重建上述文件。

## 部署步骤

```bash
cd agent
npx wrangler login          # 需浏览器登录 Cloudflare
npx wrangler secret put OPENAI_API_KEY     # 粘贴 API key
npx wrangler secret put OPENAI_BASE_URL    # 如 https://api.deepseek.com/v1
npx wrangler secret put OPENAI_MODEL       # 如 deepseek-chat（模型名务必以实际端点支持为准）
npx wrangler deploy         # 产出 https://<worker>.workers.dev/api/copilotkit
```

前端 `VITE_AGENT_RUNTIME_URL` 指向该 worker 地址。

## 本地运行测试

```bash
cd agent
npm install
npm test          # vitest run
```

当前覆盖：`model` 工厂、`agent` 装配、`runtime` 装配、Worker 入口集成冒烟（CORS + 装配）。全部不依赖真实 LLM / API key。

## 本地端到端验证（已跑通）

方式 A（Cloudflare 运行时，推荐）：

```bash
cd agent
npx wrangler dev            # 起本地 worker（含 define 修复）
# 另开终端
npm run dev                 # 起前端，.env.development 指向 127.0.0.1:8787
node scripts/e2e-assistant.mjs  # 自动化：点 logo → 输入 → 验证真回复
```

方式 B（纯 Node 运行时，绕开 workerd）：

```bash
cd agent && node dev-server.mjs   # 起 http://127.0.0.1:8787/api/copilotkit（读 .dev.vars）
```

两种方式均已验证：前端 CopilotChat → 后端 → BuiltInAgent → 第三方 API → 真回复。


## 部署

```bash
cd agent
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_BASE_URL
npx wrangler secret put OPENAI_MODEL
npx wrangler deploy
```

产出端点：`https://<worker>.workers.dev/api/copilotkit`

## 架构

```text
GGBPuppy SPA  ──runtimeUrl──▶  Worker /api/copilotkit
                                  └─ CopilotRuntime
                                       └─ BuiltInAgent
                                            └─ createOpenAI({ baseURL, apiKey })(model)
```

前端 tool（read_code / write_code / run_code / inspect_construction）在浏览器执行，
通过 AG-UI 协议被 relay 到浏览器，结果回传模型继续推理（agentic loop）。

## 前端接线（把 mock 换成真 agent）

`src/hooks/useAssistantChat.js` 的默认 replyer 是 mock。接入后端时用 `setReplyer`
替换为对 `/api/copilotkit` 的调用（或引入 `@copilotkit/react-core` 用 `useFrontendTool`
注册 4 个 tool）。详见 `docs/COPILOTKIT_AGENT_INTEGRATION.md`。
