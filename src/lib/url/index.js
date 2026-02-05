/**
 * URL 工具函数
 */

/**
 * 解析当前 URL，判断是否为嵌入模式
 * @returns {boolean}
 */
export function getEmbedMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('embed') === 'true';
}

/**
 * 解析当前 URL，获取分享 ID
 * 支持两种格式：
 * - 路径参数：/share/:id
 * - 查询参数：?share=xxx
 * @returns {string|null}
 */
export function getShareId() {
  if (typeof window === 'undefined') {
    return null;
  }

  // 先尝试从路径获取 /share/:id
  const pathMatch = window.location.pathname.match(/^\/share\/([a-zA-Z0-9_-]+)$/);
  if (pathMatch) {
    return pathMatch[1];
  }

  // 再尝试从查询参数获取 ?share=xxx
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
