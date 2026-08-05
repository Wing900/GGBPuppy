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
  return provider(config.model);
}
