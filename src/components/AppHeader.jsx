import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Share2, Download, Github, MessageSquareText } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import DownloadMenu from './DownloadMenu';
import PromptDialog from './PromptDialog';
import { LAYOUT } from '../config/appConfig';
import { GITHUB_URL } from '../config/promptConfig';

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
  onEnable3DChange,
  onShare,
  ggbApplet,
  code
}) => {
  const [showDownload, setShowDownload] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const downloadRef = useRef(null);

  // 点击外部关闭下载菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target)) {
        setShowDownload(false);
      }
    };
    if (showDownload) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownload]);

  return (
    <header
      className="flex flex-col items-center justify-center relative shrink-0"
      style={{ marginBottom: LAYOUT.headerMarginBottom }}
    >
      {/* 左上角图标 */}
      <div
        className="absolute top-0 flex items-center gap-2"
        style={{ left: '-36px' }}
      >
        <motion.a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
          title="GitHub"
        >
          <Github size={20} />
        </motion.a>

        <motion.button
          onClick={() => setShowPrompt(true)}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
          title="AI Prompt"
        >
          <MessageSquareText size={20} />
        </motion.button>
      </div>

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

      {/* 右上角图标 */}
      <div className="absolute right-0 top-0 flex items-center gap-2">
        {/* 下载按钮 */}
        <div ref={downloadRef} className="relative flex items-center">
          <motion.button
            onClick={() => setShowDownload(!showDownload)}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              color: showDownload ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              backgroundColor: showDownload
                ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                : 'transparent'
            }}
            title="导出"
          >
            <Download size={20} />
          </motion.button>

          <DownloadMenu
            isOpen={showDownload}
            isDark={isDark}
            ggbApplet={ggbApplet}
            enable3D={enable3D}
            code={code}
            onClose={() => setShowDownload(false)}
          />
        </div>

        {onShare && (
          <motion.button
            onClick={onShare}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)' }}
            title="分享"
          >
            <Share2 size={20} />
          </motion.button>
        )}

        {/* 设置按钮容器 */}
        <div className="relative flex items-center">
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
        </div>

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

      {/* Prompt Dialog */}
      <PromptDialog
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
      />
    </header>
  );
};

export default AppHeader;
