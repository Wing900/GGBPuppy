import { motion } from 'framer-motion';
import { Settings, Moon, Sun } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { LAYOUT } from '../config/appConfig';

const AppHeader = ({
  isDark,
  onToggleDark,
  showSettings,
  onToggleSettings,
  settingsTab,
  onSettingsTabChange,
  interval,
  onIntervalChange,
  enable3D,
  onEnable3DChange
}) => {
  return (
    <header
      className="flex flex-col items-center justify-center relative shrink-0"
      style={{ marginBottom: LAYOUT.headerMarginBottom }}
    >
      <div className="flex items-center gap-3 mb-3">
        <img src="/logo.svg" alt="GGBPuppy Logo" className="w-14 h-14" />
        <h1
          className="text-3xl font-normal tracking-wider"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          GGBPuppy
        </h1>
      </div>

      <div className="absolute right-0 top-0 flex items-center gap-2">
        <motion.button
          onClick={onToggleSettings}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{
            color: showSettings ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            backgroundColor: showSettings
              ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
              : 'transparent'
          }}
          title="设置"
        >
          <Settings size={20} />
        </motion.button>

        <SettingsPanel
          isOpen={showSettings}
          isDark={isDark}
          settingsTab={settingsTab}
          onTabChange={onSettingsTabChange}
          interval={interval}
          onIntervalChange={onIntervalChange}
          enable3D={enable3D}
          onEnable3DChange={onEnable3DChange}
        />

        <motion.button
          onClick={onToggleDark}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
          title={isDark ? '亮色模式' : '暗色模式'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
      </div>
    </header>
  );
};

export default AppHeader;
