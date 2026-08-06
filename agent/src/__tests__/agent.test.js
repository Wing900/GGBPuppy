import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockBuiltInAgent = vi.fn();
vi.mock('@copilotkit/runtime/v2', () => ({
  BuiltInAgent: function BuiltInAgent(...args) {
    return new mockBuiltInAgent(...args);
  }
}));

import { buildDefaultAgent } from '../agent.js';

const baseConfig = {
  apiKey: 'sk-test',
  baseURL: 'https://api.example.com/v1',
  model: 'deepseek-chat'
};

beforeEach(() => mockBuiltInAgent.mockClear());

describe('buildDefaultAgent', () => {
  it('以 model / apiKey / maxSteps 构造 BuiltInAgent', () => {
    buildDefaultAgent(baseConfig);

    expect(mockBuiltInAgent).toHaveBeenCalledTimes(1);
    const [opts] = mockBuiltInAgent.mock.calls[0];
    expect(opts.apiKey).toBe('sk-test');
    expect(opts.model).toBeTruthy();
    expect(opts.maxSteps).toBe(8);
    expect(opts.prompt).toBeTruthy();
    expect(typeof opts.prompt).toBe('string');
  });

  it('默认 maxSteps 为 8', () => {
    buildDefaultAgent(baseConfig);
    const [opts] = mockBuiltInAgent.mock.calls[0];
    expect(opts.maxSteps).toBe(8);
  });

  it('可用 config.maxSteps 覆盖', () => {
    buildDefaultAgent({ ...baseConfig, maxSteps: 3 });
    const [opts] = mockBuiltInAgent.mock.calls[0];
    expect(opts.maxSteps).toBe(3);
  });
});
