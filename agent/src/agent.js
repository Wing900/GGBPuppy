import { BuiltInAgent } from '@copilotkit/runtime/v2';
import { createModel } from './model.js';
import { AGENT_PROMPT } from './prompt.js';
import { createContextPolicyMiddleware } from './context-policy.js';

/**
 * 装配默认 BuiltInAgent。
 * - model：来自 createModel（env 驱动的第三方 API）
 * - apiKey：显式传入（不依赖 process.env）
 * - maxSteps：允许 agent 多步工具循环（前端 tool 会往返多次）
 * - prompt：GGB 建模助手系统提示（自动执行版）
 *
 * @param {{
 *   apiKey: string,
 *   baseURL: string,
 *   model: string,
 *   maxSteps?: number,
 *   maxOutputTokens?: number,
 *   maxRetries?: number,
 *   disableThinking?: boolean,
 *   contextPolicy?: { maxTurns?: number, maxMessages?: number, maxChars?: number, digestChars?: number }
 * }} config
 * @returns {import('@copilotkit/runtime/v2').BuiltInAgent}
 */
export function buildDefaultAgent(config) {
  const model = createModel(config);
  const agent = new BuiltInAgent({
    model,
    apiKey: config.apiKey,
    maxSteps: config.maxSteps ?? 8,
    maxOutputTokens: config.maxOutputTokens ?? 4096,
    maxRetries: config.maxRetries ?? 2,
    prompt: AGENT_PROMPT
  });

  agent.use(createContextPolicyMiddleware(config.contextPolicy));
  return agent;
}
