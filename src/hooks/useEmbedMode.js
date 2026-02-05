import { useMemo } from 'react';
import { getEmbedConfig, getShareId } from '../lib/url';

/**
 * 嵌入模式 Hook
 * 根据 URL 参数返回嵌入配置
 * @returns {object} { isEmbed, shareId, isFullscreen, hideSidebar }
 */
export const useEmbedMode = () => {
  const result = useMemo(() => {
    const { isEmbed, isFullscreen, hideSidebar } = getEmbedConfig();
    const shareId = getShareId();

    return { isEmbed, shareId, isFullscreen, hideSidebar };
  }, []);

  return result;
};

export default useEmbedMode;
