import storageProvider from '../lib/storage';
import { parseCommandsWithLineIndex } from '../lib/code';

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
    const id = storageProvider.generateId();

    const data = {
      code,
      createdAt: new Date().toISOString(),
      ...options
    };

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

export function executeShareCode(ggbApplet, code) {
  if (!ggbApplet || !code) {
    return false;
  }

  const commands = parseCommandsWithLineIndex(code);
  if (commands.length === 0) {
    return false;
  }

  try {
    ggbApplet.reset();
  } catch (error) {
    console.warn('重置画布失败:', error);
  }

  commands.forEach(({ line, index }) => {
    try {
      ggbApplet.evalCommand(line);
    } catch (error) {
      console.warn(`执行指令失败 [第 ${index + 1} 行]:`, line, error);
    }
  });

  return true;
}
