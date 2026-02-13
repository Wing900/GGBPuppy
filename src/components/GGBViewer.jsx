import { useEffect, useRef, useCallback } from 'react';
import { retryAsync, sleep, withTimeout } from '../lib/async/retry';

const GGB_DEPLOY_URL = 'https://www.geogebra.org/apps/deployggb.js';
const INIT_DEFAULTS = {
  maxRetries: 2,
  retryDelayMs: 600,
  scriptTimeoutMs: 9000,
  appletTimeoutMs: 10000,
  pollIntervalMs: 120
};

function appendDeployScript() {
  if (typeof document === 'undefined') {
    return null;
  }

  const script = document.createElement('script');
  script.src = `${GGB_DEPLOY_URL}?t=${Date.now()}`;
  script.async = true;
  script.dataset.ggbFallback = 'true';
  document.head.appendChild(script);
  return script;
}

function hasDeployScriptTag() {
  if (typeof document === 'undefined') {
    return false;
  }

  return Boolean(document.querySelector(`script[src*="${GGB_DEPLOY_URL}"]`));
}

async function waitForGGBAppletReady(timeoutMs, pollIntervalMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (typeof window !== 'undefined' && window.GGBApplet) {
      return;
    }
    await sleep(pollIntervalMs);
  }

  throw new Error('GeoGebra API load timeout');
}

const GGBViewer = ({
  onReady,
  onError,
  enable3D,
  hideSidebar = false,
  initOptions = INIT_DEFAULTS
}) => {
  const containerRef = useRef(null);
  const appletRef = useRef(null);
  const initTokenRef = useRef(0);

  const {
    maxRetries,
    retryDelayMs,
    scriptTimeoutMs,
    appletTimeoutMs,
    pollIntervalMs
  } = {
    ...INIT_DEFAULTS,
    ...initOptions
  };

  // 处理拖放 .ggb 文件
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.ggb')) {
      alert('请拖入 .ggb 文件');
      return;
    }

    if (!appletRef.current) {
      alert('GeoGebra 未就绪');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const base64 = event.target.result.split(',')[1];
        appletRef.current.setBase64(base64, () => {
          appletRef.current = window.ggbApplet;
          onReady?.(window.ggbApplet);
        });
      } catch (error) {
        console.error('加载 .ggb 文件失败:', error);
        alert('加载文件失败');
      }
    };
    reader.readAsDataURL(file);
  }, [onReady]);

  const applySidebarState = useCallback((targetApplet = appletRef.current) => {
    if (!hideSidebar || !targetApplet) return;

    try {
      const perspective = enable3D ? 'G3D' : 'G';
      if (targetApplet.setPerspective) {
        targetApplet.setPerspective(perspective);
      }
      if (targetApplet.setShowAlgebraInput) {
        targetApplet.setShowAlgebraInput(false);
      }
      if (targetApplet.setShowToolBar) {
        targetApplet.setShowToolBar(false);
      }
    } catch (error) {
      console.warn('隐藏侧边栏失败:', error);
    }
  }, [enable3D, hideSidebar]);

  const ensureGeoGebraApi = useCallback(async (attempt) => {
    if (window.GGBApplet) {
      return;
    }

    const hasScript = hasDeployScriptTag();
    if (!hasScript || attempt > 0) {
      appendDeployScript();
    }

    await waitForGGBAppletReady(scriptTimeoutMs, pollIntervalMs);
  }, [pollIntervalMs, scriptTimeoutMs]);

  const resetContainer = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    appletRef.current = null;
  }, []);

  const createApplet = useCallback(async () => withTimeout(
    () => new Promise((resolve, reject) => {
      if (!containerRef.current) {
        reject(new Error('GeoGebra container unavailable'));
        return;
      }

      const params = {
        appName: enable3D ? '3d' : 'classic',
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        showToolBar: false,
        showAlgebraInput: !hideSidebar,
        showMenuBar: false,
        showResetIcon: false,
        enable3D,
        enableLabelDrags: true,
        enableShiftDragZoom: true,
        enableRightClick: true,
        capturingThreshold: null,
        showToolBarHelp: false,
        errorDialogsActive: false,
        useBrowserForJS: false,
        language: 'zh',
        appletOnLoad: () => {
          const loadedApplet = window.ggbApplet || null;
          if (!loadedApplet) {
            reject(new Error('GeoGebra applet loaded without instance'));
            return;
          }

          resolve(loadedApplet);
        }
      };

      if (hideSidebar) {
        params.showAlgebraView = false;
      }

      try {
        const applet = new window.GGBApplet(params, true);
        applet.inject(containerRef.current);
      } catch (error) {
        reject(error);
      }
    }),
    appletTimeoutMs,
    'GeoGebra applet init timeout'
  ), [appletTimeoutMs, enable3D, hideSidebar]);

  useEffect(() => {
    const currentToken = initTokenRef.current + 1;
    initTokenRef.current = currentToken;
    let disposed = false;

    const initialize = async () => {
      try {
        await retryAsync(async (attempt) => {
          resetContainer();
          await ensureGeoGebraApi(attempt);

          if (disposed || initTokenRef.current !== currentToken) {
            throw new Error('GeoGebra init cancelled');
          }

          const applet = await createApplet();
          if (disposed || initTokenRef.current !== currentToken) {
            throw new Error('GeoGebra init cancelled');
          }

          appletRef.current = applet;
          onReady?.(applet);

          if (enable3D && applet.executeCommand) {
            applet.executeCommand('ShowView(5, true)');
          }
          applySidebarState(applet);
        }, {
          retries: maxRetries,
          delayMs: retryDelayMs,
          shouldRetry: (error) => error?.message !== 'GeoGebra init cancelled',
          onRetry: (error, attempt) => {
            console.warn(`GeoGebra init retry #${attempt}...`, error);
          }
        });
      } catch (error) {
        if (disposed) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        console.error('GeoGebra init failed:', error);
        onError?.(new Error(message));
      }
    };

    initialize();

    return () => {
      disposed = true;
      resetContainer();
    };
  }, [
    applySidebarState,
    createApplet,
    enable3D,
    ensureGeoGebraApi,
    maxRetries,
    onError,
    onReady,
    resetContainer,
    retryDelayMs
  ]);

  useEffect(() => {
    applySidebarState();
  }, [applySidebarState]);

  useEffect(() => {
    const handleResize = () => {
      if (appletRef.current && containerRef.current) {
        appletRef.current.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="flex flex-col h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ backgroundColor: '#FFFFFF' }}
      />
    </div>
  );
};

export default GGBViewer;
