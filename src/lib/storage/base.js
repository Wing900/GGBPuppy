/**
 * Storage Provider 抽象基类
 * 定义后端存储的统一接口，便于切换不同的存储实现
 */
export class StorageProvider {
  /**
   * 保存数据
   * @param {string} key - 存储键
   * @param {object} data - 要存储的数据
   * @returns {Promise<string>} - 返回存储的 ID
   */
  async save() {
    throw new Error('save() method must be implemented');
  }

  /**
   * 加载数据
   * @param {string} key - 存储键
   * @returns {Promise<object|null>} - 返回存储的数据或 null
   */
  async load() {
    throw new Error('load() method must be implemented');
  }

  /**
   * 生成唯一的 ID
   *   @returns {string} - 唯一 ID
   */
  generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
}
