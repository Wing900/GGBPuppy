import { describe, it, expect, vi } from 'vitest';

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({
    chat: (modelId) => ({ id: modelId, _provider: 'mock-chat' })
  }))
}));

import { createOpenAI } from '@ai-sdk/openai';
import { createModel } from '../model.js';

describe('createModel', () => {
  it('用传入的 baseURL/apiKey 构造 provider，并用 model 生成 LanguageModel', () => {
    const model = createModel({
      apiKey: 'sk-test',
      baseURL: 'https://api.example.com/v1',
      model: 'deepseek-chat'
    });

    expect(createOpenAI).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com/v1',
      apiKey: 'sk-test'
    });
    expect(model).toMatchObject({ id: 'deepseek-chat' });
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
