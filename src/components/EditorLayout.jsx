import { useState, useCallback, useEffect } from 'react';
import { CodeEditor, GGBViewer, ControlPanel, AppHeader, ShareDialog } from './index';
import { useGGBRunner, useDarkMode, useAppState } from '../hooks';
import { createShare, getShare } from '../services/share';
import { LAYOUT } from '../config/appConfig';

const EditorLayout = ({ shareId: initialShareId }) => {
  const [ggbApplet, setGgbApplet] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareId, setShareId] = useState(initialShareId || null);
  const {
    code,
    setCode,
    clearCode,
    interval,
    setInterval,
    enable3D,
    setEnable3D,
    showSettings,
    toggleSettings,
    settingsTab,
    setSettingsTab
  } = useAppState();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { isRunning, currentLine, progress, run, stop, reset } = useGGBRunner(ggbApplet);

  // 加载分享数据
  useEffect(() => {
    if (!initialShareId) return;

    const loadSharedData = async () => {
      try {
        const sharedData = await getShare(initialShareId);
        if (sharedData) {
          if (sharedData.code) {
            setCode(sharedData.code);
          }
          if (typeof sharedData.enable3D === 'boolean') {
            setEnable3D(sharedData.enable3D);
          }
        }
      } catch (error) {
        console.error('加载分享数据失败:', error);
      }
    };

    loadSharedData();
  }, [initialShareId, setCode, setEnable3D]);

  const handleGGBReady = useCallback((applet) => {
    setGgbApplet(applet);
  }, []);

  const handleRun = useCallback(() => {
    if (ggbApplet && code.trim()) {
      run(code, interval);
    }
  }, [ggbApplet, code, interval, run]);

  const handleClear = useCallback(() => {
    if (isRunning) {
      stop();
    }
    clearCode();
  }, [isRunning, stop, clearCode]);

  const handleClearCanvas = useCallback(() => {
    if (isRunning) {
      stop();
    }
    reset();
  }, [isRunning, stop, reset]);

  const handleShare = useCallback(async () => {
    try {
      const result = await createShare(code, { enable3D });
      setShareId(result.id);
      setShowShareDialog(true);
    } catch (error) {
      console.error('创建分享失败:', error);
      alert('创建分享失败，请稍后重试');
    }
  }, [code, enable3D]);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        padding: LAYOUT.pagePadding,
        overflow: 'hidden'
      }}
    >
      <AppHeader
        isDark={isDark}
        onToggleDark={toggleDark}
        showSettings={showSettings}
        onToggleSettings={toggleSettings}
        settingsTab={settingsTab}
        onSettingsTabChange={setSettingsTab}
        interval={interval}
        onIntervalChange={setInterval}
        enable3D={enable3D}
        onEnable3DChange={setEnable3D}
        onShare={handleShare}
      />

      <main
        className="flex-1 w-full max-w-[1600px] mx-auto grid gap-6"
        style={{
          gridTemplateColumns: `${LAYOUT.editorColumnWidth} 1fr`,
          height: LAYOUT.mainHeight
        }}
      >
        <div className="flex flex-col gap-4">
          <div
            className="editor-scroll-container"
            style={{
              height: '725px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-bg-tertiary)',
              borderRadius: '16px',
              overflow: 'auto',
              overscrollBehavior: 'contain'
            }}
          >
            <CodeEditor
              code={code}
              setCode={setCode}
              currentLine={currentLine}
              isRunning={isRunning}
            />
          </div>

          <div>
            <ControlPanel
              isRunning={isRunning}
              onRun={handleRun}
              onStop={stop}
              onClear={handleClear}
              onClearCanvas={handleClearCanvas}
              progress={progress}
            />
          </div>
        </div>

        <div className="overflow-hidden flex flex-col">
          <GGBViewer key={enable3D ? '3d' : '2d'} enable3D={enable3D} onReady={handleGGBReady} />
        </div>
      </main>

      <div
        className="fixed top-0 left-0 w-32 h-32 pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle at 0 0, var(--color-bg-tertiary) 0%, transparent 70%)'
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-32 h-32 pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle at 100% 100%, var(--color-bg-tertiary) 0%, transparent 70%)'
        }}
      />

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        shareId={shareId}
      />
    </div>
  );
};

export default EditorLayout;
