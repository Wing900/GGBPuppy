import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, FileImage, FileCode, Loader2, Shapes } from 'lucide-react';
import { exportAsGGB, exportAsHTML, exportAsPNG, exportAsSVG } from '../services/export';

const MotionDiv = motion.div;

const EXPORT_OPTIONS = [
  {
    id: 'ggb',
    label: 'GeoGebra 文件',
    description: '完全离线，用 GeoGebra 打开',
    icon: FileDown,
    extension: '.ggb',
    handler: exportAsGGB
  },
  {
    id: 'html',
    label: 'HTML 网页',
    description: '嵌入数据，浏览器打开',
    icon: FileCode,
    extension: '.html',
    handler: exportAsHTML
  },
  {
    id: 'png',
    label: 'PNG 图片',
    description: '导出当前画布截图',
    icon: FileImage,
    extension: '.png',
    handler: exportAsPNG
  },
  {
    id: 'svg',
    label: 'SVG 矢量图',
    description: '无损缩放，适合印刷',
    icon: Shapes,
    extension: '.svg',
    handler: exportAsSVG
  }
];

const DownloadMenu = ({ isOpen, isDark, ggbApplet, enable3D, code, onClose }) => {
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);

  const handleExport = async (option) => {
    if (!ggbApplet) {
      setMessage({ type: 'error', text: 'GeoGebra 未就绪' });
      return;
    }

    setLoading(option.id);
    setMessage(null);

    try {
      const filename = await option.handler(ggbApplet, { enable3D, code });
      setMessage({ type: 'success', text: `已下载 ${filename}` });
      setTimeout(() => {
        setMessage(null);
        onClose?.();
      }, 1500);
    } catch (error) {
      console.error('导出失败:', error);
      setMessage({ type: 'error', text: error.message || '导出失败' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="absolute right-0 top-14 w-72 rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(38,38,38,0.98)' : 'rgba(255,255,255,0.98)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              导出画布
            </span>
          </div>

          {/* Options */}
          <div className="p-2">
            {EXPORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isLoading = loading === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleExport(option)}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                  style={{
                    backgroundColor: 'transparent',
                    opacity: loading !== null && !isLoading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (loading === null) {
                      e.currentTarget.style.backgroundColor = isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
                    }}
                  >
                    {isLoading ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                        style={{ color: 'var(--color-text-secondary)' }}
                      />
                    ) : (
                      <Icon size={18} style={{ color: 'var(--color-text-secondary)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {option.label}
                      <span
                        className="ml-1.5 text-xs font-normal"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {option.extension}
                      </span>
                    </div>
                    <div
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <MotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-2 text-xs text-center"
                style={{
                  color: message.type === 'error' ? '#ef4444' : '#22c55e',
                  backgroundColor: message.type === 'error'
                    ? (isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)')
                    : (isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.05)')
                }}
              >
                {message.text}
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default DownloadMenu;
