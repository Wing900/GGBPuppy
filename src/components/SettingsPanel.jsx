import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings } from 'lucide-react';
import { Clock, Zap } from 'lucide-react';
import { SettingsTabButton, TimingSettingsTab, AdvancedSettingsTab } from './settings';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const SettingsPanel = ({
  isOpen,
  isDark,
  settingsTab,
  onTabChange,
  interval,
  onIntervalChange,
  enable3D,
  onEnable3DChange,
  onClose
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* 居中弹窗 */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[calc(100vw-48px)]"
          >
            <div
              className="overflow-hidden flex flex-col"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-8 py-4 border-b shrink-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <Settings size={20} style={{ color: 'var(--color-text-secondary)' }} />
                  <h2
                    className="text-lg font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    设置
                  </h2>
                </div>
                <MotionButton
                  onClick={onClose}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-none hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <X size={18} />
                </MotionButton>
              </div>

              {/* Tabs */}
              <div
                className="flex border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <SettingsTabButton
                  Icon={Clock}
                  label="执行时间"
                  active={settingsTab === 'timing'}
                  onClick={() => onTabChange('timing')}
                />
                <SettingsTabButton
                  Icon={Zap}
                  label="高级"
                  active={settingsTab === 'advanced'}
                  onClick={() => onTabChange('advanced')}
                />
              </div>

              {/* Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {settingsTab === 'timing' ? (
                    <TimingSettingsTab
                      isDark={isDark}
                      interval={interval}
                      onIntervalChange={onIntervalChange}
                    />
                  ) : (
                    <AdvancedSettingsTab
                      isDark={isDark}
                      enable3D={enable3D}
                      onEnable3DChange={onEnable3DChange}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;