import { Settings, Moon, Sun, Share2, Download } from 'lucide-react';
import DownloadMenu from '../DownloadMenu';
import SettingsPanel from '../SettingsPanel';
import IconButton from './IconButton';

const HeaderRightActions = ({
  isDark,
  showDownload,
  onToggleDownload,
  downloadRef,
  ggbApplet,
  enable3D,
  code,
  onCloseDownload,
  onShare,
  showSettings,
  onToggleSettings,
  settingsTab,
  onSettingsTabChange,
  interval,
  onIntervalChange,
  onEnable3DChange,
  onToggleDark
}) => {
  return (
    <div className="absolute right-0 top-0 flex items-center gap-2">
      <div ref={downloadRef} className="relative flex items-center">
        <IconButton
          onClick={onToggleDownload}
          title="导出"
          active={showDownload}
          isDark={isDark}
        >
          <Download size={20} />
        </IconButton>

        <DownloadMenu
          isOpen={showDownload}
          isDark={isDark}
          ggbApplet={ggbApplet}
          enable3D={enable3D}
          code={code}
          onClose={onCloseDownload}
        />
      </div>

      {onShare && (
        <IconButton onClick={onShare} title="分享">
          <Share2 size={20} />
        </IconButton>
      )}

      <div className="relative flex items-center">
        <IconButton
          onClick={onToggleSettings}
          title="设置"
          active={showSettings}
          isDark={isDark}
        >
          <Settings size={20} />
        </IconButton>

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

      <IconButton
        onClick={onToggleDark}
        title={isDark ? '亮色模式' : '暗色模式'}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </IconButton>
    </div>
  );
};

export default HeaderRightActions;

