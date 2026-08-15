import { createCopilotRuntimeHandler } from '@copilotkit/runtime/v2';
import { buildRuntime } from './runtime.js';

function optionalPositiveInteger(value) {
  if (value == null || value === '') return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Cloudflare Worker 入口（Pages / Workers 通用）。
 * 三个 env 变量（API_KEY / BASE_URL / MODEL）由外部注入，代码零写死。
 *
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<Response>}
 */
export default {
  async fetch(request, env) {
    console.log('[agent] request:', request.method, request.url);
    const runtime = buildRuntime({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
      model: env.OPENAI_MODEL,
      disableThinking: env.OPENAI_DISABLE_THINKING === 'true',
      maxOutputTokens: optionalPositiveInteger(env.AGENT_MAX_OUTPUT_TOKENS),
      maxRetries: optionalPositiveInteger(env.AGENT_MAX_RETRIES),
      contextPolicy: {
        maxTurns: optionalPositiveInteger(env.AGENT_CONTEXT_MAX_TURNS),
        maxMessages: optionalPositiveInteger(env.AGENT_CONTEXT_MAX_MESSAGES),
        maxChars: optionalPositiveInteger(env.AGENT_CONTEXT_MAX_CHARS),
        digestChars: optionalPositiveInteger(env.AGENT_CONTEXT_DIGEST_CHARS)
      }
    });

    const handler = createCopilotRuntimeHandler({
      runtime,
      basePath: '/api/copilotkit',
      cors: true
    });

    return handler(request);
  }
};
