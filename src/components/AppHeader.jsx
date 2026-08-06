import { useState, useEffect, useRef, useCallback } from 'react';
import PromptDialog from './PromptDialog';
import { LAYOUT } from '../config/appConfig';
import { GITHUB_URL } from '../config/promptConfig';
import { HeaderLeftActions, HeaderBrand, HeaderRightActions } from './header';

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

  const handleToggleDownload = useCallback(() => {
    setShowDownload((prev) => !prev);
  }, []);

  const handleOpenPrompt = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const handleClosePrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  return (
    <header
      className="flex flex-col items-center justify-center relative shrink-0"
      style={{ marginBottom: LAYOUT.headerMarginBottom }}
    >
      <HeaderLeftActions
        githubUrl={GITHUB_URL}
        onOpenPrompt={handleOpenPrompt}
      />

      <HeaderBrand />

      <HeaderRightActions
        isDark={isDark}
        showDownload={showDownload}
        onToggleDownload={handleToggleDownload}
        downloadRef={downloadRef}
        ggbApplet={ggbApplet}
        enable3D={enable3D}
        code={code}
        onCloseDownload={() => setShowDownload(false)}
        onShare={onShare}
        showSettings={showSettings}
        onToggleSettings={onToggleSettings}
        settingsTab={settingsTab}
        onSettingsTabChange={onSettingsTabChange}
        interval={interval}
        onIntervalChange={onIntervalChange}
        onEnable3DChange={onEnable3DChange}
        onToggleDark={onToggleDark}
      />

      <PromptDialog
        isOpen={showPrompt}
        onClose={handleClosePrompt}
      />
    </header>
  );
};

export default AppHeader;

