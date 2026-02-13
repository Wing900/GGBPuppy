import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { SettingsTabButton, TimingSettingsTab, AdvancedSettingsTab } from './settings';

const MotionDiv = motion.div;

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
        <MotionDiv
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

          <div className="p-5">
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
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
