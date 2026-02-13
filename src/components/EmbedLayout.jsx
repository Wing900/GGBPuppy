import { useState, useCallback, useEffect, useRef } from 'react';
import { GGBViewer } from './index';
import { ArrowUpRight, Maximize2 } from 'lucide-react';
import { getShare, executeShareCode, restoreSceneData } from '../services/share';

const EmbedLayout = ({ shareId, isFullscreen, hideSidebar }) => {
  const [ggbApplet, setGgbApplet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [viewerEnable3D, setViewerEnable3D] = useState(false);
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
    if (!shareId) {
      setLoading(false);
      setError('缺少分享 ID');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const shareData = await getShare(shareId);
        if (!shareData) {
          setError('未找到分享数据');
        } else {
          setData(shareData);
        }
      } catch (err) {
        setError(`加载失败：${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shareId]);

  useEffect(() => {
    hasRunRef.current = false;
    setViewerEnable3D(false);
    setSceneRestored(false);
  }, [shareId]);

  useEffect(() => {
    if (!data || !ggbApplet || hasRunRef.current) {
      return;
    }

    if (typeof data.enable3D === 'boolean' && viewerEnable3D !== data.enable3D) {
      return;
    }

    if (!data.scene) {
      setSceneRestored(true);
      return;
    }

    let cancelled = false;

    const restore = async () => {
      const restored = await restoreSceneData(ggbApplet, data.scene);
      if (cancelled) {
        return;
      }

      if (restored) {
        ensurePrimaryViewVisible(ggbApplet, Boolean(data.enable3D));

        const hasCode = typeof data.code === 'string' && data.code.trim() !== '';
        if (!hasCode) {
          const visibleCount = getVisibleObjectCount(ggbApplet);
          if (visibleCount > 0) {
            hasRunRef.current = true;
          }
        }
      }

      setSceneRestored(true);
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [data, ggbApplet, viewerEnable3D, ensurePrimaryViewVisible, getVisibleObjectCount]);

  useEffect(() => {
    if (!ggbApplet || hasRunRef.current) return;
    if (!sceneRestored) return;

    if (typeof data?.enable3D === 'boolean' && viewerEnable3D !== data.enable3D) {
      return;
    }

    if (!data?.code || !data.code.trim()) {
      return;
    }

    let cancelled = false;

    const runCode = async () => {
      await sleep(120);
      if (cancelled || hasRunRef.current) {
        return;
      }

      const didRun = executeShareCode(ggbApplet, data.code);
      if (didRun) {
        ensurePrimaryViewVisible(ggbApplet, Boolean(data.enable3D));
        hasRunRef.current = true;
      }
    };

    runCode();

    return () => {
      cancelled = true;
    };
  }, [data, ggbApplet, viewerEnable3D, sceneRestored, sleep, ensurePrimaryViewVisible]);

  const handleGGBReady = useCallback((applet) => {
    setGgbApplet(applet);
    setViewerEnable3D(Boolean(data?.enable3D));
  }, [data?.enable3D]);

  const buildEditUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/share/${shareId}`;
  };

  return (
    <div className="embed-layout flex flex-col h-screen w-screen">
      {loading && (
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
      )}

      <div className="embed-layout-ggb">
        <GGBViewer
          key={data?.enable3D ? '3d' : '2d'}
          enable3D={data?.enable3D || false}
          hideSidebar={hideSidebar}
          onReady={handleGGBReady}
        />
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
