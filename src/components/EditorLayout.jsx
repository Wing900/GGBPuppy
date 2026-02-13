import { useState, useCallback, useEffect, useRef } from 'react';
import { CodeEditor, GGBViewer, ControlPanel, AppHeader, ShareDialog } from './index';
import { useGGBRunner, useDarkMode, useAppState } from '../hooks';
import {
  createShare,
  getShare,
  executeShareCode,
  captureSceneData,
  buildScenePayload,
  restoreSceneData
} from '../services/share';
import { LAYOUT } from '../config/appConfig';

const EditorLayout = ({ shareId: initialShareId }) => {
  const [ggbApplet, setGgbApplet] = useState(null);
  const hasRunRef = useRef(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareId, setShareId] = useState(initialShareId || null);
  const [shareData, setShareData] = useState(null);
  const [shareDataLoaded, setShareDataLoaded] = useState(!initialShareId);
  const [viewerEnable3D, setViewerEnable3D] = useState(false);
  const [sceneRestored, setSceneRestored] = useState(false);
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

  useEffect(() => {
    hasRunRef.current = false;
    setShareData(null);
    setShareDataLoaded(!initialShareId);
    setSceneRestored(false);
  }, [initialShareId]);

  useEffect(() => {
    if (!initialShareId) return;

    const loadSharedData = async () => {
      setShareDataLoaded(false);
      try {
        const sharedData = await getShare(initialShareId);
        setShareData(sharedData || null);

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
      } finally {
        setShareDataLoaded(true);
      }
    };

    loadSharedData();
  }, [initialShareId, setCode, setEnable3D]);

  useEffect(() => {
    if (!initialShareId || !ggbApplet || !shareDataLoaded || hasRunRef.current) {
      return;
    }

    if (!shareData?.scene) {
      setSceneRestored(true);
      return;
    }

    if (typeof shareData.enable3D === 'boolean' && viewerEnable3D !== shareData.enable3D) {
      return;
    }

    let cancelled = false;

    const restore = async () => {
      const restored = await restoreSceneData(ggbApplet, shareData.scene);
      if (cancelled) {
        return;
      }

      if (restored) {
        hasRunRef.current = true;
      }
      setSceneRestored(true);
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [initialShareId, ggbApplet, shareDataLoaded, shareData, viewerEnable3D]);

  useEffect(() => {
    if (!initialShareId || !ggbApplet || hasRunRef.current) return;
    if (!shareDataLoaded || !sceneRestored) return;

    const sharedCode = shareData?.code ?? code;
    if (!sharedCode.trim()) return;

    if (typeof shareData?.enable3D === 'boolean' && viewerEnable3D !== shareData.enable3D) {
      return;
    }

    const didRun = executeShareCode(ggbApplet, sharedCode);
    if (didRun) {
      hasRunRef.current = true;
    }
  }, [initialShareId, ggbApplet, shareDataLoaded, shareData, code, viewerEnable3D, sceneRestored]);

  const handleGGBReady = useCallback((applet) => {
    setGgbApplet(applet);
    setViewerEnable3D(enable3D);
  }, [enable3D]);

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
      const sceneBase64 = await captureSceneData(ggbApplet);
      const scene = buildScenePayload(sceneBase64);

      const result = await createShare(code, {
        enable3D,
        ...(scene ? { scene } : {})
      });

      setShareId(result.id);
      setShowShareDialog(true);
    } catch (error) {
      console.error('创建分享失败:', error);
      alert('创建分享失败，请稍后重试');
    }
  }, [code, enable3D, ggbApplet]);

  const handleDecompile = useCallback(() => {
    if (!ggbApplet) {
      alert('GeoGebra 未就绪');
      return;
    }

    try {
      const objectNames = ggbApplet.getAllObjectNames();
      if (!objectNames || objectNames.length === 0) {
        alert('画布中没有对象');
        return;
      }

      const commands = [];
      for (const name of objectNames) {
        const cmd = ggbApplet.getCommandString(name);
        if (cmd && cmd.trim()) {
          commands.push(cmd);
        }
      }

      if (commands.length === 0) {
        alert('无法提取命令');
        return;
      }

      const generatedCode = commands.join('\n');
      setCode(generatedCode);
    } catch (error) {
      console.error('逆向编译失败:', error);
      alert('逆向编译失败');
    }
  }, [ggbApplet, setCode]);

  return (
    <div
      className="flex flex-col relative"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        minHeight: 'var(--app-viewport-height)',
        padding: LAYOUT.pagePadding,
        overflowX: 'hidden'
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
        ggbApplet={ggbApplet}
        code={code}
      />

      <main
        className="flex-1 w-full max-w-[1600px] mx-auto grid gap-6"
        style={{
          gridTemplateColumns: `${LAYOUT.editorColumnWidth} 1fr`,
          minHeight: LAYOUT.mainHeight
        }}
      >
        <div className="flex flex-col gap-4">
          <div
            className="editor-scroll-container"
            style={{
              height: LAYOUT.editorHeight,
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
              onDecompile={handleDecompile}
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
