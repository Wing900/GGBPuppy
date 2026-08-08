import { CopilotRuntime } from '@copilotkit/runtime/v2';
import { buildDefaultAgent } from './agent.js';

/**
 * 装配 CopilotRuntime，注册 default agent。
 *
 * @param {{ apiKey: string, baseURL: string, model: string, maxSteps?: number, disableThinking?: boolean }} config
 * @returns {import('@copilotkit/runtime/v2').CopilotRuntime}
 */
export function buildRuntime(config) {
  const agent = buildDefaultAgent(config);
  return new CopilotRuntime({
    agents: { default: agent }
  });
}
