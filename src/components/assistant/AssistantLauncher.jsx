import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CopilotChat } from '@copilotkit/react-core/v2';

const MotionButton = motion.button;
const MotionDiv = motion.div;

const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 520;
const FAB_SIZE = 56;
const EDGE = 24;

/**
 * 圆形 logo 浮动按钮 + 矩形对话面板（左侧边，垂直居中）。
 * 面板内部用 @copilotkit/react-core 的 CopilotChat 接入真实后端。
 *
 * @param {object} [options]
 * @param {object} [options.labels] - { title, placeholder }
 */
const AssistantLauncher = ({ labels = {} }) => {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, x: -12, y: '-50%', scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: '-50%', scale: 1 }}
            exit={{ opacity: 0, x: -12, y: '-50%', scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col overflow-hidden rounded-none"
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
                className="p-1.5 rounded-none hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </MotionButton>
            </div>

            {/* CopilotChat（真 AI 聊天，自带输入框与流式） */}
            <div className="flex-1 min-h-0">
              <CopilotChat
                labels={{
                  title: labels.title || 'GGBPuppy 助手',
                  placeholder: labels.placeholder || '输入想构造的几何图形…'
                }}
              />
            </div>
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
