import { BuiltInAgent } from '@copilotkit/runtime/v2';
import { createModel } from './model.js';

/**
 * 装配默认 BuiltInAgent。
 * - model：来自 createModel（env 驱动的第三方 API）
 * - apiKey：显式传入（不依赖 process.env）
 * - maxSteps：允许 agent 多步工具循环（前端 tool 会往返多次）
 *
 * @param {{ apiKey: string, baseURL: string, model: string, maxSteps?: number }} config
 * @returns {import('@copilotkit/runtime/v2').BuiltInAgent}
 */
export function buildDefaultAgent(config) {
  const model = createModel(config);
  return new BuiltInAgent({
    model,
    apiKey: config.apiKey,
    maxSteps: config.maxSteps ?? 8
  });
}
