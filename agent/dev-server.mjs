/**
 * 本地开发用 Node server，把 BuiltInAgent runtime 跑在普通 Node 上。
 * 目的：绕开 workerd 对 @copilotkit/runtime 的 createRequire 兼容 bug，
 * 便于本地端到端验证（部署到 Cloudflare 需另行解决 workerd 兼容）。
 *
 * 用法：node dev-server.mjs   （监听 http://localhost:8787/api/copilotkit）
 * 三个 env 值从 .dev.vars 读取（不进 git）。
 */
import http from 'node:http';
import fs from 'node:fs';
import { createCopilotRuntimeHandler } from '@copilotkit/runtime/v2';
import { buildRuntime } from './src/runtime.js';

function loadDevVars() {
  const raw = fs.readFileSync(new URL('.dev.vars', import.meta.url), 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    if (!line.includes('=')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i)] = line.slice(i + 1);
  }
  return out;
}

const vars = loadDevVars();
const runtime = buildRuntime({
  apiKey: vars.OPENAI_API_KEY,
  baseURL: vars.OPENAI_BASE_URL,
  model: vars.OPENAI_MODEL
});
const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: '/api/copilotkit',
  cors: true
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost:8787');
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');
    const request = new Request(url, {
      method: req.method ?? 'GET',
      headers: req.headers,
      body: body ? body : undefined
    });
    const response = await handler(request);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const text = await response.text();
    res.end(text);
  } catch (error) {
    console.error('handler error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(error && error.message || error) }));
  }
});

const PORT = Number(process.env.PORT || 8787);
server.listen(PORT, '127.0.0.1', () => {
  console.log(`ggbpuppy-agent node server on http://127.0.0.1:${PORT}/api/copilotkit`);
});
