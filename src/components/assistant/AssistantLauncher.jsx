import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CopilotChat } from '@copilotkit/react-core/v2';

const MotionButton = motion.button;
const MotionDiv = motion.div;

const FAB_SIZE = 56;
const EDGE = 24;
const PANEL_WIDTH = 400;   // = 代码区列宽
const PANEL_HEIGHT = 725;  // = 代码区高度

/**
 * 圆形 logo 浮动按钮（左下角）+ 从左侧滑出的对话面板。
 * 面板大小 = 代码区大小（覆盖代码区位置），从左边拉出来。
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
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col overflow-hidden"
            style={{
              position: 'fixed',
              left: EDGE,
              top: EDGE,
              bottom: EDGE + FAB_SIZE + 16,
              zIndex: 50,
              width: PANEL_WIDTH,
              maxWidth: 'calc(100vw - 48px)',
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

            {/* CopilotChat */}
            <div className="flex-1 min-h-0">
              <CopilotChat
                labels={{
                  title: labels.title || 'GGBPuppy 助手',
                  placeholder: labels.placeholder || '输入想构造的几何图形…',
                  welcomeMessageText: '',
                  chatDisclaimerText: ''
                }}
              />
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* 圆形 logo FAB — 左下角 */}
      <MotionButton
        onClick={toggle}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        className="overflow-hidden rounded-full"
        style={{
          position: 'fixed',
          left: EDGE,
          bottom: EDGE,
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