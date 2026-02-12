import { motion } from 'framer-motion';
import { INTERVAL_PRESETS, INTERVAL_RANGE } from '../../config/appConfig';

const TimingSettingsTab = ({ isDark, interval, onIntervalChange }) => {
  return (
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
        {INTERVAL_PRESETS.map((val) => {
          const isActive = interval === val;
          return (
            <button
              key={val}
              onClick={() => onIntervalChange(val)}
              className="flex-1 py-2 text-xs font-medium rounded-xl transition-all"
              style={{
                backgroundColor: isActive
                  ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
                  : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                border: `1px solid ${isActive
                  ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')
                  : 'transparent'}`
              }}
            >
              {val}s
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TimingSettingsTab;

