import { StorageProvider } from './base.js';

/**
 * Cloudflare KV 存储实现
 * 通过 API 调用 Cloudflare Workers 后端来访问 KV
 */
export class CloudflareKVStorage extends StorageProvider {
  constructor() {
    super();
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  }

  /**
   * 保存数据到 Cloudflare KV
   * @param {string} key - 存储键
   * @param {object} data - 要存储的数据
   * @returns {Promise<string>} - 返回存储的 ID
   */
  async save(key, data) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, data }),
      });

      if (!response.ok) {
        throw new Error(`保存失败: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Cloudflare KV 保存失败:', error);
      throw error;
    }
  }

  /**
   * 从 Cloudflare KV 加载数据
   * @param {string} key - 存储键
   * @returns {Promise<object|null>} - 返回存储的数据或 null
   */
  async load(key) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/share/${key}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`加载失败: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Cloudflare KV 加载失败:', error);
      return null;
    }
  }
}
