import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Link, Copy, Check, Code, Globe, Maximize2 } from 'lucide-react';
import { buildShareUrl, buildEmbedUrl, buildEmbedHtml, buildFullscreenEmbedUrl, buildFullscreenEmbedHtml } from '../lib/url';

const ShareDialog = ({ isOpen, onClose, shareId }) => {
  const [copiedType, setCopiedType] = useState(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  const shareUrl = shareId ? buildShareUrl(shareId) : '';
  const embedUrl = shareId ? buildEmbedUrl(shareId) : '';
  const embedHtml = shareId ? buildEmbedHtml(shareId, { width, height }) : '';
  const fullscreenEmbedUrl = shareId ? buildFullscreenEmbedUrl(shareId) : '';
  const fullscreenEmbedHtml = shareId ? buildFullscreenEmbedHtml(shareId) : '';

  const copyToClipboard = useCallback(async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, []);

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
            style={{ width: '500px', maxWidth: '90vw' }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'var(--color-bg-tertiary)' }}
              >
                <div className="flex items-center gap-2">
                  <Share2 size={20} style={{ color: 'var(--color-text-secondary)' }} />
                  <h2
                    className="text-lg font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    分享项目
                  </h2>
                </div>
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Share URL */}
                <div>
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Globe size={16} />
                    <span className="text-sm font-medium">分享链接</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-bg-tertiary)'
                    }}
                  >
                    <span
                      className="flex-1 text-sm truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {shareUrl}
                    </span>
                    <motion.button
                      onClick={() => copyToClipboard(shareUrl, 'url')}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="复制链接"
                    >
                      {copiedType === 'url' ? <Check size={16} /> : <Copy size={16} />}
                    </motion.button>
                  </div>
                </div>

                {/* Embed URL */}
                <div>
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Link size={16} />
                    <span className="text-sm font-medium">嵌入链接</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-bg-tertiary)'
                    }}
                  >
                    <span
                      className="flex-1 text-sm truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {embedUrl}
                    </span>
                    <motion.button
                      onClick={() => copyToClipboard(embedUrl, 'embedUrl')}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded hover:bg-black/5"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="复制嵌入链接"
                    >
                      {copiedType === 'embedUrl' ? <Check size={16} /> : <Copy size={16} />}
                    </motion.button>
                  </div>
                </div>

                {/* Embed Code */}
                <div>
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Code size={16} />
                    <span className="text-sm font-medium">嵌入代码</span>
                  </div>

                  {/* Size Controls */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <label
                        className="text-xs"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        宽度
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value) || 800)}
                        className="w-20 px-2 py-1 text-sm rounded"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-bg-tertiary)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        className="text-xs"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        高度
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value) || 600)}
                        className="w-20 px-2 py-1 text-sm rounded"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-bg-tertiary)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-bg-tertiary)'
                    }}
                  >
                    <span
                      className="flex-1 text-xs font-mono truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {embedHtml}
                    </span>
                    <motion.button
                      onClick={() => copyToClipboard(embedHtml, 'html')}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded hover:bg-black/5"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="复制嵌入代码"
                    >
                      {copiedType === 'html' ? <Check size={16} /> : <Copy size={16} />}
                    </motion.button>
                  </div>

                </div>

                {/* Fullscreen Embed URL */}
                <div>
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Maximize2 size={16} />
                    <span className="text-sm font-medium">全屏嵌入链接</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-bg-tertiary)'
                    }}
                  >
                    <span
                      className="flex-1 text-sm truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {fullscreenEmbedUrl}
                    </span>
                    <motion.button
                      onClick={() => copyToClipboard(fullscreenEmbedUrl, 'fullscreenUrl')}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded hover:bg-black/5"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="复制全屏嵌入链接"
                    >
                      {copiedType === 'fullscreenUrl' ? <Check size={16} /> : <Copy size={16} />}
                    </motion.button>
                  </div>
                </div>

                {/* Fullscreen Embed Frame */}
                <div>
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Code size={16} />
                    <span className="text-sm font-medium">全屏嵌入 Frame</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-bg-tertiary)'
                    }}
                  >
                    <span
                      className="flex-1 text-xs font-mono truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {fullscreenEmbedHtml}
                    </span>
                    <motion.button
                      onClick={() => copyToClipboard(fullscreenEmbedHtml, 'fullscreenHtml')}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded hover:bg-black/5"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="复制全屏嵌入代码"
                    >
                      {copiedType === 'fullscreenHtml' ? <Check size={16} /> : <Copy size={16} />}
                    </motion.button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareDialog;
