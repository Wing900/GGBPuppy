import { useMemo } from 'react';
import { getEmbedMode, getShareId } from '../lib/url';

/**
 * 嵌入模式 Hook
 * 检测 URL 参数并返回嵌入模式状态
 * @returns {object} { isEmbed, shareId }
 */
export const useEmbedMode = () => {
  const result = useMemo(() => {
    const isEmbed = getEmbedMode();
    const shareId = getShareId();

    return { isEmbed, shareId };
  }, []);

  return result;
};

export default useEmbedMode;
