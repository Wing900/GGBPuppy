# GGBPuppy Agent（CopilotKit 后端）

解耦的 Cloudflare Worker，提供 CopilotKit Runtime + BuiltInAgent，作为 GGBPuppy 前端的 AI 后端。

## 环境变量（全部外部注入，代码零写死）

| 变量 | 说明 |
| --- | --- |
| `OPENAI_API_KEY` | 任意 OpenAI 协议兼容平台的 key |
| `OPENAI_BASE_URL` | 任意 OpenAI 协议兼容端点（DeepSeek / Moonshot / 硅基流动 / OpenRouter / 自建中转） |
| `OPENAI_MODEL` | 该平台下的 model id（与 BASE_URL 配套，如 `deepseek-chat`） |

换 provider 只改这三个值，不改代码。

## 本地运行测试

```bash
cd agent
npm install
npm test          # vitest run
```

当前覆盖：`model` 工厂、`agent` 装配、`runtime` 装配、Worker 入口集成冒烟（CORS + 装配）。全部不依赖真实 LLM / API key。

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
