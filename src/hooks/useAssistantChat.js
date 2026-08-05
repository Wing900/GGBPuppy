import { useState, useCallback, useRef } from 'react';

let idSeq = 0;
const nextId = () => `msg-${++idSeq}`;

/**
 * 默认 mock 回复器。
 * 解耦点：未来接入 CopilotKit / 后端 agent 时，用 setReplyer 替换即可，
 * hook 内部逻辑与 UI 都不需要改动。
 */
const createDefaultReplyer = () => async (text) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return `（mock 回复）已收到：「${text}」。接入 CopilotKit 后端后，我会实际构造 GeoGebra 图形。`;
};

/**
 * 浮动对话面板的状态与消息管理 hook。
 * 纯逻辑，不依赖 DOM / CopilotKit，便于单元测试。
 *
 * @param {object} [options]
 * @param {(text: string) => Promise<string|object>} [options.replyer] - 回复器
 * @param {boolean} [options.initialOpen=false] - 初始是否展开
 * @returns {object} 见下方字段
 */
const useAssistantChat = ({ replyer, initialOpen = false } = {}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const replyerRef = useRef(replyer || createDefaultReplyer());

  /** 展开面板 */
  const open = useCallback(() => setIsOpen(true), []);
  /** 收起面板 */
  const close = useCallback(() => setIsOpen(false), []);
  /** 切换开合 */
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  /**
   * 发送一条用户消息，等待回复器返回后追加 assistant 消息。
   * @param {string} text
   * @returns {Promise<void>}
   */
  const send = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', content: trimmed }
    ]);
    setIsTyping(true);
    try {
      const reply = await replyerRef.current(trimmed);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: String(reply) }
      ]);
    } catch (error) {
      // 第三方回复器失败不应让 UI 崩溃：记录但不追加消息
      console.warn('Assistant reply failed:', error);
    } finally {
      setIsTyping(false);
    }
  }, []);

  /** 运行时替换回复器（解耦点） */
  const setReplyer = useCallback((fn) => {
    replyerRef.current = fn || createDefaultReplyer();
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    messages,
    isTyping,
    send,
    setReplyer
  };
};

export default useAssistantChat;
export { createDefaultReplyer };
