import { StorageProvider } from './base.js';
import { CloudflareKVStorage } from './cfkv.js';
import { MockStorage } from './mock.js';

/**
 * 根据环境选择存储实现
 */
const storageMode = import.meta.env.VITE_STORAGE_MODE || 'mock';

let storageProvider;

if (storageMode === 'cfkv') {
  storageProvider = new CloudflareKVStorage();
} else {
  storageProvider = new MockStorage();
}

export { storageProvider, StorageProvider };
export { CloudflareKVStorage };
export { MockStorage };
export { storageProvider as default };
