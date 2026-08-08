import { createCopilotRuntimeHandler } from '@copilotkit/runtime/v2';
import { buildRuntime } from './runtime.js';

/**
 * Cloudflare Worker 入口（Pages / Workers 通用）。
 * 三个 env 变量（API_KEY / BASE_URL / MODEL）由外部注入，代码零写死。
 *
 * @param {Request} request
 * @param {{ OPENAI_API_KEY: string, OPENAI_BASE_URL: string, OPENAI_MODEL: string, OPENAI_DISABLE_THINKING?: string }} env
 * @returns {Promise<Response>}
 */
export default {
  async fetch(request, env) {
    console.log('[agent] request:', request.method, request.url);
    const runtime = buildRuntime({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
      model: env.OPENAI_MODEL,
      disableThinking: env.OPENAI_DISABLE_THINKING === 'true'
    });

    const handler = createCopilotRuntimeHandler({
      runtime,
      basePath: '/api/copilotkit',
      cors: true
    });

    return handler(request);
  }
};
