import { createOpenAI } from '@ai-sdk/openai';

/**
 * 模型工厂：把第三方 API 的 baseURL / apiKey / model 三要素组合成一个
 * Vercel AI SDK LanguageModel。三个值全部来自外部传入（env），代码零写死，
 * 换 provider 只改 env 不改代码。
 *
 * @param {{ apiKey: string, baseURL: string, model: string }} config
 * @returns {import('@ai-sdk/openai').OpenAIProviderLanguageModel}
 */
export function createModel(config) {
  if (!config || !config.apiKey || !config.model) {
    throw new Error('createModel requires apiKey and model');
  }
  const provider = createOpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey
  });
  // AI SDK 5 的 createOpenAI 默认走 responses API（v4 规范），
  // 第三方 OpenAI 兼容端点（Ollama/DeepSeek 等）只实现 chat completions（v2 规范）。
  // 必须显式用 provider.chat() 切到 chat completions。
  return provider.chat(config.model);
}
