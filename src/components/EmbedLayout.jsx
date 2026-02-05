import { useState, useCallback, useEffect, useRef } from 'react';
import { GGBViewer } from './index';
import { ArrowUpRight, Maximize2 } from 'lucide-react';
import { getShare, executeShareCode } from '../services/share';

const EmbedLayout = ({ shareId, isFullscreen, hideSidebar }) => {
  const [ggbApplet, setGgbApplet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const hasRunRef = useRef(false);

  // 加载分享数据
  useEffect(() => {
    if (!shareId) {
      setLoading(false);
      setError('未提供分享 ID');
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
        setError('加载失败：' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shareId]);

  // 当 ggbApplet 变更时自动执行一次
  useEffect(() => {
    hasRunRef.current = false;
  }, [shareId]);

  useEffect(() => {
    if (!data?.code || !ggbApplet || hasRunRef.current) return;
    const didRun = executeShareCode(ggbApplet, data.code);
    if (didRun) {
      hasRunRef.current = true;
    }
  }, [data, ggbApplet]);

  const handleGGBReady = useCallback((applet) => {
    setGgbApplet(applet);
  }, []);

  // 返回编辑地址
  const buildEditUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/share/${shareId}`;
  };

  return (
    <div className="embed-layout flex flex-col h-screen w-screen">
      {/* 加载状态 */}
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

      {/* 错误状态 */}
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
              在 GGBPuppy 打开
            </a>
          </div>
        </div>
      )}

      {/* GeoGebra 画板 */}
      <div className="embed-layout-ggb">
        <GGBViewer
          enable3D={data?.enable3D || false}
          hideSidebar={hideSidebar}
          onReady={handleGGBReady}
        />
      </div>

      {/* 编辑按钮 */}
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
