import { describe, it, expect } from 'vitest';
import { CopilotRuntime, BuiltInAgent } from '@copilotkit/runtime/v2';
import { buildRuntime } from '../runtime.js';

const baseConfig = {
  apiKey: 'sk-test',
  baseURL: 'https://api.example.com/v1',
  model: 'deepseek-chat'
};

describe('buildRuntime', () => {
  it('返回 CopilotRuntime 实例', () => {
    const runtime = buildRuntime(baseConfig);
    expect(runtime).toBeInstanceOf(CopilotRuntime);
  });

  it('注册 default agent 为 BuiltInAgent', () => {
    const runtime = buildRuntime(baseConfig);
    expect(runtime.agents.default).toBeInstanceOf(BuiltInAgent);
  });
});
