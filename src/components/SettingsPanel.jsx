import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { INTERVAL_PRESETS, INTERVAL_RANGE } from '../config/appConfig';

const SettingsPanel = ({
  isOpen,
  isDark,
  settingsTab,
  onTabChange,
  interval,
  onIntervalChange,
  enable3D,
  onEnable3DChange
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="absolute right-0 top-14 w-80 rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(38,38,38,0.98)' : 'rgba(255,255,255,0.98)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div
            className="flex border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
          >
            <button
              onClick={() => onTabChange('timing')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative"
              style={{
                color: settingsTab === 'timing' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
              }}
            >
              <Clock size={16} />
              <span>执行时间</span>
              {settingsTab === 'timing' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-text-primary)' }}
                />
              )}
            </button>
            <button
              onClick={() => onTabChange('advanced')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative"
              style={{
                color: settingsTab === 'advanced' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
              }}
            >
              <Zap size={16} />
              <span>高级</span>
              {settingsTab === 'advanced' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-text-primary)' }}
                />
              )}
            </button>
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {settingsTab === 'timing' && (
                <motion.div
                  key="timing"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        执行间隔
                      </span>
                      <span
                        className="text-lg font-mono font-semibold px-3 py-1 rounded-xl"
                        style={{
                          color: 'var(--color-text-primary)',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
                        }}
                      >
                        {interval.toFixed(1)}s
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      调整逐行执行的时间
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <input
                      type="range"
                      min={INTERVAL_RANGE.min}
                      max={INTERVAL_RANGE.max}
                      step={INTERVAL_RANGE.step}
                      value={interval}
                      onChange={(e) => onIntervalChange(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-xl appearance-none cursor-pointer"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        accentColor: 'var(--color-text-primary)'
                      }}
                    />
                    <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      <span>{INTERVAL_RANGE.min.toFixed(1)}s 更快</span>
                      <span>{INTERVAL_RANGE.max.toFixed(1)}s 更慢</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-1">
                    {INTERVAL_PRESETS.map((val) => (
                      <button
                        key={val}
                        onClick={() => onIntervalChange(val)}
                        className="flex-1 py-2 text-xs font-medium rounded-xl transition-all"
                        style={{
                          backgroundColor: interval === val
                            ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
                            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                          color: interval === val ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                          border: `1px solid ${interval === val
                            ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')
                            : 'transparent'}`
                        }}
                      >
                        {val}s
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {settingsTab === 'advanced' && (
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {'3D \u89c6\u56fe'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {'\u5207\u6362\u540e\u4f1a\u91cd\u65b0\u8f7d\u5165 GeoGebra'}
                      </span>
                    </div>
                    <button
                      onClick={() => onEnable3DChange(!enable3D)}
                      className="px-3 py-2 text-xs font-medium rounded-xl transition-all"
                      style={{
                        backgroundColor: enable3D
                          ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
                          : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                        color: enable3D ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        border: `1px solid ${enable3D
                          ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')
                          : 'transparent'}`
                      }}
                    >
                      {enable3D ? '3D' : '2D'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
