import { CopilotRuntime } from '@copilotkit/runtime/v2';
import { buildDefaultAgent } from './agent.js';

/**
 * 装配 CopilotRuntime，注册 default agent。
 *
 * @param {Parameters<typeof buildDefaultAgent>[0]} config
 * @returns {import('@copilotkit/runtime/v2').CopilotRuntime}
 */
export function buildRuntime(config) {
  const agent = buildDefaultAgent(config);
  return new CopilotRuntime({
    agents: { default: agent }
  });
}
