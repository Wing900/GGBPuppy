import { StorageProvider } from './base.js';

/**
 * Mock 存储实现
 * 使用 localStorage 模拟，用于开发和降级
 */
export class MockStorage extends StorageProvider {
  constructor() {
    super();
    this.storagePrefix = 'ggbpuppy-share-';
  }

  /**
   * 保存数据到 localStorage
   * @param {string} key - 存储键
   * @param {object} data - 要存储的数据
   * @returns {Promise<string>} - 返回存储的 ID
   */
  async save(key, data) {
    try {
      const storageKey = this.storagePrefix + key;
      const value = JSON.stringify({
        data,
        timestamp: Date.now(),
      });
      localStorage.setItem(storageKey, value);
      return key;
    } catch (error) {
      console.error('Mock Storage 保存失败:', error);
      throw error;
    }
  }

  /**
   * 从 localStorage 加载数据
   * @param {string} key - 存储键
   * @returns {Promise<object|null>} - 返回存储的数据或 null
   */
  async load(key) {
    try {
      const storageKey = this.storagePrefix + key;
      const value = localStorage.getItem(storageKey);

      if (!value) {
        return null;
      }

      const parsed = JSON.parse(value);
      return parsed.data;
    } catch (error) {
      console.error('Mock Storage 加载失败:', error);
      return null;
    }
  }
}
