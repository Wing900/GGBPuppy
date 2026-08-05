import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import useAssistantChat from '../../hooks/useAssistantChat';

const MotionButton = motion.button;
const MotionDiv = motion.div;

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 460;
const FAB_SIZE = 56;
const EDGE = 24;

/**
 * 圆形 logo 浮动按钮 + 矩形对话面板。
 * 复用现有 UI 令牌（--color-bg-* / --color-text-* / --color-border）与 framer-motion。
 *
 * @param {object} [options]
 * @param {(text: string) => Promise<string|object>} [options.replyer] - 回复器（可空，走 mock）
 * @param {object} [options.labels] - { title, placeholder, inputPlaceholder }
 */
const AssistantLauncher = ({ replyer, labels = {} }) => {
  const { isOpen, toggle, close, messages, isTyping, send } =
    useAssistantChat({ replyer });

  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!input.trim()) {
        return;
      }
      send(input);
      setInput('');
    },
    [input, send]
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, x: -12, y: '-50%', scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: '-50%', scale: 1 }}
            exit={{ opacity: 0, x: -12, y: '-50%', scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col overflow-hidden rounded-2xl"
            style={{
              position: 'fixed',
              left: EDGE + FAB_SIZE + 16,
              top: '50%',
              zIndex: 50,
              width: PANEL_WIDTH,
              maxWidth: 'calc(100vw - 48px)',
              height: PANEL_HEIGHT,
              maxHeight: 'calc(100vh - 140px)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.16)'
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="GGBPuppy"
                  className="w-7 h-7 rounded-full"
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {labels.title || 'GGBPuppy 助手'}
                </span>
              </div>
              <MotionButton
                onClick={close}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </MotionButton>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-auto px-4 py-3 space-y-2"
            >
              {messages.length === 0 && (
                <div
                  className="text-center text-xs py-6"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {labels.placeholder || '输入想构造的几何图形…'}
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words"
                    style={
                      m.role === 'user'
                        ? {
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-primary)'
                          }
                        : {
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)'
                          }
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div
                    className="px-3 py-2 rounded-2xl text-sm"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      color: 'var(--color-text-tertiary)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    正在思考…
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t flex gap-2 shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={labels.inputPlaceholder || '输入消息…'}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)'
                }}
              />
              <MotionButton
                type="submit"
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)'
                }}
                title="发送"
              >
                <Send size={18} />
              </MotionButton>
            </form>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Circular logo FAB */}
      <MotionButton
        onClick={toggle}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        className="overflow-hidden rounded-full"
        style={{
          position: 'fixed',
          left: EDGE,
          top: 'calc(50% - 28px)',
          width: FAB_SIZE,
          height: FAB_SIZE,
          zIndex: 50,
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
        }}
        title="GGBPuppy 助手"
      >
        <img
          src="/logo.svg"
          alt="GGBPuppy 助手"
          className="w-full h-full object-cover rounded-full"
        />
      </MotionButton>
    </>
  );
};

export default AssistantLauncher;
