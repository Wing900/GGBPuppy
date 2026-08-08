import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * 模型工厂：把第三方 API 的 baseURL / apiKey / model 三要素组合成一个
 * Vercel AI SDK LanguageModel。三个值全部来自外部传入（env），代码零写死，
 * 换 provider 只改 env 不改代码。
 *
 * 用 @ai-sdk/openai-compatible 而非 @ai-sdk/openai，是因为它支持
 * transformRequestBody：阿里云 qwen reasoning 模型默认开启深度思考，
 * 复杂任务（如勾股树）思考会爆炸（实测 15 万字符 / 16 分钟），
 * 通过注入 enable_thinking:false 关闭思考，让模型直接输出代码。
 *
 * @param {{ apiKey: string, baseURL: string, model: string, disableThinking?: boolean }} config
 * @returns {import('@ai-sdk/openai-compatible').OpenAICompatibleChatLanguageModel}
 */
export function createModel(config) {
  if (!config || !config.apiKey || !config.model) {
    throw new Error('createModel requires apiKey and model');
  }
  const provider = createOpenAICompatible({
    baseURL: config.baseURL,
    name: 'ggbpuppy-provider',
    apiKey: config.apiKey,
    transformRequestBody: (args) => {
      if (config.disableThinking) {
        return { ...args, enable_thinking: false };
      }
      return args;
    }
  });
  return provider.chatModel(config.model);
}
