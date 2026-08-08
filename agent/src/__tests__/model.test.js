import { describe, it, expect, vi } from 'vitest';

vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: vi.fn((opts) => ({
    chatModel: (modelId) => ({ id: modelId, _provider: 'mock-chat', _opts: opts })
  }))
}));

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createModel } from '../model.js';

describe('createModel', () => {
  it('用传入的 baseURL/apiKey 构造 provider，并用 model 生成 LanguageModel', () => {
    const model = createModel({
      apiKey: 'sk-test',
      baseURL: 'https://api.example.com/v1',
      model: 'deepseek-chat'
    });

    expect(createOpenAICompatible).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com/v1',
      name: 'ggbpuppy-provider',
      apiKey: 'sk-test',
      transformRequestBody: expect.any(Function)
    });
    expect(model).toMatchObject({ id: 'deepseek-chat' });
  });

  it('disableThinking 时 transformRequestBody 注入 enable_thinking:false', () => {
    const model = createModel({
      apiKey: 'sk-test',
      baseURL: 'https://api.example.com/v1',
      model: 'deepseek-chat',
      disableThinking: true
    });
    const transformed = model._opts.transformRequestBody({ model: 'x', temperature: 0.7 });
    expect(transformed).toEqual({ model: 'x', temperature: 0.7, enable_thinking: false });
  });

  it('未开 disableThinking 时 transformRequestBody 原样返回', () => {
    const model = createModel({
      apiKey: 'sk-test',
      baseURL: 'https://api.example.com/v1',
      model: 'deepseek-chat'
    });
    const transformed = model._opts.transformRequestBody({ model: 'x' });
    expect(transformed).toEqual({ model: 'x' });
  });

  it('缺少 apiKey 或 model 时抛错', () => {
    expect(() => createModel({})).toThrow();
    expect(() => createModel({ apiKey: 'k', model: '' })).toThrow();
    expect(() => createModel(null)).toThrow();
  });

  it('model 缺失但 apiKey 存在时仍抛错', () => {
    expect(() => createModel({ apiKey: 'k', baseURL: 'https://x', model: '' })).toThrow();
  });
});
