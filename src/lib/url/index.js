/**
 * URL 工具函数
 */

/**
 * 获取嵌入配置
 * @returns {{ isEmbed: boolean, isFullscreen: boolean, hideSidebar: boolean }}
 */
export function getEmbedConfig() {
  if (typeof window === 'undefined') {
    return { isEmbed: false, isFullscreen: false, hideSidebar: false };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const isEmbed = urlParams.get('embed') === 'true';
  const isFullscreen = urlParams.get('fullscreen') === 'true';
  const sidebarParam = urlParams.get('sidebar');
  const hideSidebar = sidebarParam === 'false' || sidebarParam === '0';

  return { isEmbed, isFullscreen, hideSidebar };
}

/**
 * 从当前 URL 中提取分享 ID
 * 支持以下格式：
 * - 路径参数 /share/:id
 * - 查询参数 ?share=xxx
 * @returns {string|null}
 */
export function getShareId() {
  if (typeof window === 'undefined') {
    return null;
  }

  // 先尝试从路径中提取 /share/:id
  const pathMatch = window.location.pathname.match(/^\/share\/([a-zA-Z0-9_-]+)\/?$/);
  if (pathMatch) {
    return decodeURIComponent(pathMatch[1]);
  }

  // 再尝试从查询参数中提取 ?share=xxx
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('share');
}

/**
 * 构建分享链接
 * @param {string} shareId - 分享 ID
 * @returns {string}
 */
export function buildShareUrl(shareId) {
  if (typeof window === 'undefined') {
    return '';
  }

  const origin = window.location.origin;
  return `${origin}/share/${shareId}`;
}

/**
 * 构建嵌入链接
 * @param {string} shareId - 分享 ID
 * @returns {string}
 */
export function buildEmbedUrl(shareId) {
  if (typeof window === 'undefined') {
    return '';
  }

  const origin = window.location.origin;
  return `${origin}/share/${shareId}?embed=true`;
}

/**
 * 构建全屏嵌入链接
 * @param {string} shareId - 分享 ID
 * @returns {string}
 */
export function buildFullscreenEmbedUrl(shareId) {
  if (typeof window === 'undefined') {
    return '';
  }

  const origin = window.location.origin;
  return `${origin}/share/${shareId}?embed=true&fullscreen=true&sidebar=false`;
}

/**
 * 构建嵌入 HTML 代码
 * @param {string} shareId - 分享 ID
 * @param {object} options - 嵌入选项
 * @param {number} options.width - 宽度
 * @param {number} options.height - 高度
 * @returns {string}
 */
export function buildEmbedHtml(shareId, options = {}) {
  const { width = 800, height = 600 } = options;
  const embedUrl = buildEmbedUrl(shareId);

  return `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
}

/**
 * 构建全屏嵌入 iframe 代码
 * @param {string} shareId - 分享 ID
 * @returns {string}
 */
export function buildFullscreenEmbedHtml(shareId) {
  const embedUrl = buildFullscreenEmbedUrl(shareId);

  return `<iframe src="${embedUrl}" style="width:100%;height:100%;border:0;" frameborder="0" allowfullscreen></iframe>`;
}
