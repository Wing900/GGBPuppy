import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, MessageSquareText, Loader2 } from 'lucide-react';
import { PROMPT_CONFIG } from '../config/promptConfig';
import { DIALOG } from '../config/dialogConfig';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const PromptDialog = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 加载 prompt 内容
  useEffect(() => {
    if (!isOpen || content) {
      return undefined;
    }

    let cancelled = false;

    const loadPrompt = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(PROMPT_CONFIG.file);
        if (!res.ok) {
          throw new Error('加载失败');
        }

        const text = await res.text();
        if (!cancelled) {
          setContent(text);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPrompt();

    return () => {
      cancelled = true;
    };
  }, [isOpen, content]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), DIALOG.prompt.copyFeedbackMs);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [content]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
            style={{
              width: DIALOG.prompt.width,
              maxWidth: DIALOG.prompt.maxWidth,
              maxHeight: DIALOG.prompt.maxHeight
            }}
          >
            <div
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                maxHeight: DIALOG.prompt.maxHeight
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                style={{ borderColor: 'var(--color-bg-tertiary)' }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquareText size={20} style={{ color: 'var(--color-text-secondary)' }} />
                  <h2
                    className="text-lg font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {PROMPT_CONFIG.title}
                  </h2>
                </div>
                <MotionButton
                  onClick={onClose}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <X size={18} />
                </MotionButton>
              </div>

              {/* Content */}
              <div className="p-6 overflow-auto flex-1">
                {PROMPT_CONFIG.description && (
                  <p
                    className="text-sm mb-4"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {PROMPT_CONFIG.description}
                  </p>
                )}

                <div
                  className="relative rounded-xl p-4"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-bg-tertiary)',
                    minHeight: '200px'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2
                        size={24}
                        className="animate-spin"
                        style={{ color: 'var(--color-text-secondary)' }}
                      />
                    </div>
                  ) : error ? (
                    <div
                      className="text-sm text-center py-8"
                      style={{ color: '#ef4444' }}
                    >
                      {error}
                    </div>
                  ) : (
                    <pre
                      className="text-sm whitespace-pre-wrap break-words font-mono"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {content}
                    </pre>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div
                className="px-6 py-4 border-t shrink-0"
                style={{ borderColor: 'var(--color-bg-tertiary)' }}
              >
                <MotionButton
                  onClick={copyToClipboard}
                  disabled={loading || error || !content}
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: copied ? 'rgba(34, 197, 94, 0.1)' : 'var(--color-bg-primary)',
                    color: copied ? '#22c55e' : 'var(--color-text-primary)',
                    border: '1px solid var(--color-bg-tertiary)',
                    opacity: (loading || error || !content) ? 0.5 : 1
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>复制 Prompt</span>
                    </>
                  )}
                </MotionButton>
              </div>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default PromptDialog;
