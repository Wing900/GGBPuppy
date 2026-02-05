import storageProvider from '../lib/storage';

/**
 * 分享服务
 * 提供创建和获取分享数据的接口
 */

/**
 * 创建分享
 * @param {string} code - GeoGebra 代码
 * @param {object} options - 额外选项
 * @returns {Promise<{id: string, url: string}>}
 */
export async function createShare(code, options = {}) {
  try {
    // 生成唯一的分享 ID
    const id = storageProvider.generateId();

    // 准备要保存的数据
    const data = {
      code,
      createdAt: new Date().toISOString(),
      ...options
    };

    // 保存到存储层
    await storageProvider.save(id, data);

    return { id };
  } catch (error) {
    console.error('创建分享失败:', error);
    throw error;
  }
}

/**
 * 获取分享数据
 * @param {string} shareId - 分享 ID
 * @returns {Promise<{code: string, createdAt: string} | null>}
 */
export async function getShare(shareId) {
  try {
    return await storageProvider.load(shareId);
  } catch (error) {
    console.error('获取分享失败:', error);
    return null;
  }
}

/**
 * 加载分享数据并执行
 * @param {string} shareId - 分享 ID
 * @param {object} ggbApplet - GeoGebra Applet 实例
 * @returns {Promise<boolean>}
 */
export async function loadShareData(shareId, ggbApplet) {
  if (!ggbApplet) {
    console.warn('GeoGebra Applet 未就绪');
    return false;
  }

  try {
    const shareData = await getShare(shareId);

    if (!shareData || !shareData.code) {
      console.warn('未找到分享数据');
      return false;
    }

    // 执行代码
    ggbApplet.evalCommand(shareData.code);
    return true;
  } catch (error) {
    console.error('加载分享数据失败:', error);
    return false;
  }
}
