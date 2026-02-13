import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GGBViewer } from './index';
import { ArrowUpRight, Maximize2, RefreshCw } from 'lucide-react';
import { getShare, executeShareCode, restoreSceneData } from '../services/share';
import { retryAsync } from '../lib/async/retry';

const SHARE_LOAD_RETRY_OPTIONS = {
  retries: 2,
  delayMs: 380,
  backoffFactor: 1.6
};

const SCENE_RESTORE_OPTIONS = {
  timeoutMs: 9000,
  retries: 2,
  retryDelayMs: 380
};
const SHARE_LOG_PREFIX = '[EmbedShare]';

const EmbedLayout = ({ shareId, isFullscreen, hideSidebar }) => {
  const [ggbApplet, setGgbApplet] = useState(null);
  const [shareLoading, setShareLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [viewerError, setViewerError] = useState(null);
  const [data, setData] = useState(null);
  const [viewerEnable3D, setViewerEnable3D] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [sceneRestored, setSceneRestored] = useState(false);
  const hasRunRef = useRef(false);

  const sleep = useCallback((ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }), []);

  const getVisibleObjectCount = useCallback((applet) => {
    if (!applet || typeof applet.getAllObjectNames !== 'function') {
      return 0;
    }

    const names = applet.getAllObjectNames() || [];
    if (typeof applet.getVisible !== 'function') {
      return names.length;
    }

    return names.reduce((count, name) => {
      try {
        return applet.getVisible(name) ? count + 1 : count;
      } catch {
        return count;
      }
    }, 0);
  }, []);

  const ensurePrimaryViewVisible = useCallback((applet, is3D) => {
    if (!applet) return;

    try {
      if (applet.setPerspective) {
        applet.setPerspective(is3D ? 'G3D' : 'G');
      }

      if (applet.evalCommand) {
        applet.evalCommand(is3D ? 'ShowView(5, true)' : 'ShowView(1, true)');
      }
    } catch (error) {
      console.warn('Ensure primary view failed:', error);
    }
  }, []);

  useEffect(() => {
    hasRunRef.current = false;
    setData(null);
    setGgbApplet(null);
    setViewerEnable3D(false);
    setViewerReady(false);
    setSceneRestored(false);
    setDataError(null);
    setViewerError(null);
  }, [shareId]);

  useEffect(() => {
    if (!shareId) {
      console.warn(`${SHARE_LOG_PREFIX} missing shareId`);
      setShareLoading(false);
      setDataError('缺少分享 ID');
      return;
    }

    let disposed = false;

    const loadData = async () => {
      console.info(`${SHARE_LOG_PREFIX} start loading`, { shareId });
      setShareLoading(true);
      setDataError(null);
      setViewerError(null);

      try {
        const shareData = await retryAsync(
          () => getShare(shareId, { throwOnError: true }),
          {
            ...SHARE_LOAD_RETRY_OPTIONS,
            onRetry: (error, attempt) => {
              console.warn(`${SHARE_LOG_PREFIX} load retry #${attempt}`, { shareId, error });
            }
          }
        );

        if (disposed) {
          return;
        }

        if (!shareData) {
          console.warn(`${SHARE_LOG_PREFIX} share not found`, { shareId });
          setDataError('未找到分享数据');
          return;
        }

        console.info(`${SHARE_LOG_PREFIX} loaded`, {
          shareId,
          enable3D: shareData.enable3D,
          hasScene: Boolean(shareData.scene),
          codeLength: typeof shareData.code === 'string' ? shareData.code.length : 0
        });
        setData(shareData);
      } catch (error) {
        if (disposed) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        console.error(`${SHARE_LOG_PREFIX} load failed`, { shareId, error });
        setDataError(`加载失败：${message}`);
      } finally {
        if (!disposed) {
          console.info(`${SHARE_LOG_PREFIX} load finished`, { shareId });
          setShareLoading(false);
        }
      }
    };

    loadData();

    return () => {
      disposed = true;
    };
  }, [shareId]);

  useEffect(() => {
    if (!data || !ggbApplet || !viewerReady || hasRunRef.current) {
      return;
    }

    if (typeof data.enable3D === 'boolean' && viewerEnable3D !== data.enable3D) {
      return;
    }

    if (!data.scene) {
      console.info(`${SHARE_LOG_PREFIX} skip scene restore(no scene)`, { shareId });
      setSceneRestored(true);
      return;
    }

    let cancelled = false;

    const restore = async () => {
      console.info(`${SHARE_LOG_PREFIX} restoring scene`, { shareId });
      const restored = await restoreSceneData(ggbApplet, data.scene, SCENE_RESTORE_OPTIONS);
      if (cancelled) {
        return;
      }

      if (restored) {
        console.info(`${SHARE_LOG_PREFIX} scene restored`, { shareId });
        ensurePrimaryViewVisible(ggbApplet, Boolean(data.enable3D));

        const hasCode = typeof data.code === 'string' && data.code.trim() !== '';
        if (!hasCode) {
          const visibleCount = getVisibleObjectCount(ggbApplet);
          if (visibleCount > 0) {
            hasRunRef.current = true;
          }
        }
      } else {
        console.warn(`${SHARE_LOG_PREFIX} scene restore failed`, { shareId });
        const hasCode = typeof data.code === 'string' && data.code.trim() !== '';
        if (!hasCode) {
          setViewerError('场景恢复失败，请刷新后重试。');
        }
      }

      setSceneRestored(true);
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [data, ggbApplet, viewerEnable3D, viewerReady, ensurePrimaryViewVisible, getVisibleObjectCount, shareId]);

  useEffect(() => {
    if (!ggbApplet || hasRunRef.current) return;
    if (!sceneRestored) return;

    if (typeof data?.enable3D === 'boolean' && viewerEnable3D !== data.enable3D) {
      return;
    }

    if (!data?.code || !data.code.trim()) {
      console.info(`${SHARE_LOG_PREFIX} skip code execution(empty code)`, { shareId });
      return;
    }

    let cancelled = false;

    const runCode = async () => {
      console.info(`${SHARE_LOG_PREFIX} execute shared code`, { shareId, codeLength: data.code.length });
      await sleep(120);
      if (cancelled || hasRunRef.current) {
        return;
      }

      const didRun = executeShareCode(ggbApplet, data.code);
      if (didRun) {
        console.info(`${SHARE_LOG_PREFIX} code executed`, { shareId });
        ensurePrimaryViewVisible(ggbApplet, Boolean(data.enable3D));
        hasRunRef.current = true;
      } else {
        console.warn(`${SHARE_LOG_PREFIX} code execution produced no commands`, { shareId });
      }
    };

    runCode();

    return () => {
      cancelled = true;
    };
  }, [data, ggbApplet, viewerEnable3D, sceneRestored, sleep, ensurePrimaryViewVisible, shareId]);

  const handleGGBReady = useCallback((applet) => {
    console.info(`${SHARE_LOG_PREFIX} viewer ready`, { shareId });
    setGgbApplet(applet);
    setViewerEnable3D(Boolean(data?.enable3D));
    setViewerReady(true);
    setViewerError(null);
  }, [data?.enable3D, shareId]);

  const handleGGBError = useCallback((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${SHARE_LOG_PREFIX} viewer init failed`, { shareId, error });
    setViewerReady(false);
    setViewerError(`GeoGebra 初始化失败：${message}`);
  }, [shareId]);

  const handleReload = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  const buildEditUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return shareId ? `${origin}/share/${shareId}` : origin;
  };

  const error = dataError || viewerError;
  const isLoading = useMemo(() => {
    if (error) {
      return false;
    }

    if (shareLoading) {
      return true;
    }

    if (!data) {
      return false;
    }

    if (!viewerReady) {
      return true;
    }

    if (data.scene && !sceneRestored) {
      return true;
    }

    return false;
  }, [data, error, sceneRestored, shareLoading, viewerReady]);

  return (
    <div className="embed-layout flex flex-col h-screen w-screen">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              加载中...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="text-center px-4">
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              {error}
            </p>
            <div className="inline-flex items-center gap-3">
              <button
                type="button"
                onClick={handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                style={{
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-bg-secondary)'
                }}
              >
                <RefreshCw size={16} />
                刷新重试
              </button>
              <a
                href={buildEditUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-bg-secondary)'
                }}
              >
                <ArrowUpRight size={16} />
                在 GGBPuppy 中打开
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="embed-layout-ggb">
        {data && (
          <GGBViewer
            key={data.enable3D ? '3d' : '2d'}
            enable3D={data.enable3D || false}
            hideSidebar={hideSidebar}
            onReady={handleGGBReady}
            onError={handleGGBError}
          />
        )}
      </div>

      {data && !isFullscreen && (
        <div className="absolute top-4 right-4 z-10">
          <a
            href={buildEditUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-black/10"
            style={{
              color: 'var(--color-text-primary)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <Maximize2 size={16} />
            <span>在 GGBPuppy 里编辑</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default EmbedLayout;
