import storageProvider from '../lib/storage';
import { parseCommandsWithLineIndex } from '../lib/code';

const SCENE_DATA_VERSION = 1;

/**
 * Create a share record.
 * @param {string} code
 * @param {object} options
 * @returns {Promise<{id: string}>}
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
    console.error('Create share failed:', error);
    throw error;
  }
}

/**
 * Load share record.
 * @param {string} shareId
 * @returns {Promise<object|null>}
 */
export async function getShare(shareId) {
  try {
    return await storageProvider.load(shareId);
  } catch (error) {
    console.error('Load share failed:', error);
    return null;
  }
}

/**
 * Get scene snapshot as base64 from applet.
 * @param {object|null} ggbApplet
 * @returns {string|null}
 */
export async function captureSceneData(ggbApplet) {
  if (!ggbApplet || typeof ggbApplet.getBase64 !== 'function') {
    return null;
  }

  try {
    const result = ggbApplet.getBase64();

    if (typeof result === 'string') {
      return result;
    }

    if (result && typeof result.then === 'function') {
      const resolved = await result;
      return typeof resolved === 'string' ? resolved : null;
    }

    return null;
  } catch (error) {
    console.warn('Capture scene data failed:', error);
    return null;
  }
}

/**
 * Build scene payload for share storage.
 * @param {string|null} base64
 * @returns {object|null}
 */
export function buildScenePayload(base64) {
  if (!base64 || typeof base64 !== 'string') {
    return null;
  }

  return {
    version: SCENE_DATA_VERSION,
    format: 'ggb-base64',
    data: base64
  };
}

/**
 * Restore scene payload into applet.
 * @param {object|null} ggbApplet
 * @param {object|null} scene
 * @returns {Promise<boolean>}
 */
export async function restoreSceneData(ggbApplet, scene) {
  if (!ggbApplet || !scene || scene.format !== 'ggb-base64' || typeof scene.data !== 'string') {
    return false;
  }

  if (typeof ggbApplet.setBase64 !== 'function') {
    return false;
  }

  try {
    await new Promise((resolve, reject) => {
      ggbApplet.setBase64(scene.data, () => resolve());

      setTimeout(() => {
        reject(new Error('setBase64 timeout'));
      }, 8000);
    });

    return true;
  } catch (error) {
    console.warn('Restore scene data failed:', error);
    return false;
  }
}

/**
 * Execute code on applet.
 * @param {object|null} ggbApplet
 * @param {string} code
 * @returns {boolean}
 */
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
    console.warn('Reset applet failed:', error);
  }

  commands.forEach(({ line, index }) => {
    try {
      ggbApplet.evalCommand(line);
    } catch (error) {
      console.warn(`Execute command failed [line ${index + 1}]:`, line, error);
    }
  });

  return true;
}

