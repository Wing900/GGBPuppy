import { FunctionMiddleware } from '@ag-ui/client';

const DEFAULT_MAX_TURNS = 6;
const DEFAULT_MAX_MESSAGES = 32;
const DEFAULT_MAX_CHARS = 48_000;
const DEFAULT_DIGEST_CHARS = 4_000;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function estimateSize(value) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return String(value).length;
  }
}

function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n');
}

/**
 * 以 user message 为边界切分对话。每组携带其后的 assistant/tool 链，
 * 裁剪时不会制造孤立 tool result。
 */
function groupConversation(messages) {
  const prefix = [];
  const turns = [];
  let current = null;

  for (const message of messages) {
    if (message.role === 'user') {
      current = [message];
      turns.push(current);
    } else if (current) {
      current.push(message);
    } else {
      prefix.push(message);
    }
  }

  return { prefix, turns };
}

function buildDroppedDigest(turns, maxChars) {
  const entries = turns
    .map((turn) => textFromContent(turn.find((message) => message.role === 'user')?.content).trim())
    .filter(Boolean)
    .map((text) => text.slice(0, 600));

  if (entries.length === 0) return '';
  const digest = entries.map((text, index) => `${index + 1}. ${text}`).join('\n');
  return digest.slice(-maxChars);
}

/**
 * 给模型输入建立有界窗口。浏览器消息、threadId、画布状态均不修改。
 * 最新 user turn 总会保留；更早的完整 turn 按容量倒序装入。
 */
export function applyContextPolicy(input, options = {}) {
  const maxTurns = positiveInteger(options.maxTurns, DEFAULT_MAX_TURNS);
  const maxMessages = positiveInteger(options.maxMessages, DEFAULT_MAX_MESSAGES);
  const maxChars = positiveInteger(options.maxChars, DEFAULT_MAX_CHARS);
  const digestChars = positiveInteger(options.digestChars, DEFAULT_DIGEST_CHARS);
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const { prefix, turns } = groupConversation(messages);

  if (turns.length <= 1 && messages.length <= maxMessages && estimateSize(messages) <= maxChars) {
    return input;
  }

  const retainedTurns = [];
  let retainedMessages = 0;
  let retainedChars = 0;

  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    const turnChars = estimateSize(turn);
    const isLatest = index === turns.length - 1;
    const fits =
      retainedTurns.length < maxTurns &&
      retainedMessages + turn.length <= maxMessages &&
      retainedChars + turnChars <= maxChars;

    if (!isLatest && !fits) break;
    retainedTurns.unshift(turn);
    retainedMessages += turn.length;
    retainedChars += turnChars;
  }

  const retained = retainedTurns.flat();
  const retainedSet = new Set(retained);
  const droppedTurns = turns.filter((turn) => !turn.some((message) => retainedSet.has(message)));
  const digest = buildDroppedDigest(droppedTurns, digestChars);
  const context = [...(input.context ?? [])];

  if (digest) {
    context.push({
      description: 'Earlier user requests omitted by the context window',
      value: digest
    });
  }

  console.log('[agent] context policy:', {
    inputMessages: messages.length,
    retainedMessages: prefix.length + retained.length,
    droppedTurns: droppedTurns.length,
    retainedChars
  });

  return {
    ...input,
    messages: [...prefix, ...retained],
    context
  };
}

export function createContextPolicyMiddleware(options) {
  return new FunctionMiddleware((input, next) => next.run(applyContextPolicy(input, options)));
}

export const CONTEXT_POLICY_DEFAULTS = Object.freeze({
  maxTurns: DEFAULT_MAX_TURNS,
  maxMessages: DEFAULT_MAX_MESSAGES,
  maxChars: DEFAULT_MAX_CHARS,
  digestChars: DEFAULT_DIGEST_CHARS
});
