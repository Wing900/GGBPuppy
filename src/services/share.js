import storageProvider from '../lib/storage';
import { parseCommandsWithLineIndex } from '../lib/code';
import { retryAsync, withTimeout } from '../lib/async/retry';

const SCENE_DATA_VERSION = 1;
const DEFAULT_SCENE_RESTORE_OPTIONS = {
  timeoutMs: 8000,
  retries: 2,
  retryDelayMs: 320
};

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
 * @param {object} [options]
 * @param {boolean} [options.throwOnError]
 * @returns {Promise<object|null>}
 */
export async function getShare(shareId, options = {}) {
  const { throwOnError = false } = options;

  try {
    return await storageProvider.load(shareId);
  } catch (error) {
    console.error('Load share failed:', error);
    if (throwOnError) {
      throw error;
    }
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
 * @param {object} [options]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.retries]
 * @param {number} [options.retryDelayMs]
 * @returns {Promise<boolean>}
 */
export async function restoreSceneData(ggbApplet, scene, options = {}) {
  if (!ggbApplet || !scene || scene.format !== 'ggb-base64' || typeof scene.data !== 'string') {
    return false;
  }

  if (typeof ggbApplet.setBase64 !== 'function') {
    return false;
  }

  const { timeoutMs, retries, retryDelayMs } = {
    ...DEFAULT_SCENE_RESTORE_OPTIONS,
    ...options
  };

  const restoreOnce = async () => withTimeout(
    () => new Promise((resolve, reject) => {
      try {
        ggbApplet.setBase64(scene.data, () => resolve());
      } catch (error) {
        reject(error);
      }
    }),
    timeoutMs,
    'setBase64 timeout'
  );

  try {
    await retryAsync(restoreOnce, {
      retries,
      delayMs: retryDelayMs,
      onRetry: (error, attempt) => {
        console.warn(`Restore scene retry #${attempt}...`, error);
      }
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
