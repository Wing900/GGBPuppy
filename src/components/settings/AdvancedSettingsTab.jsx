import { motion } from 'framer-motion';

const AdvancedSettingsTab = ({ isDark, enable3D, onEnable3DChange }) => {
  return (
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
            3D 视图
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            切换后会重新载入 GeoGebra
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
  );
};

export default AdvancedSettingsTab;

