import { StorageProvider } from './base.js';

/**
 * Cloudflare KV storage implementation.
 * Uses backend API endpoints provided by Worker/Pages.
 */
export class CloudflareKVStorage extends StorageProvider {
  constructor() {
    super();
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    this.maxReadRetries = 4;
    this.retryDelayMs = 350;
  }

  /**
   * Save share data to Cloudflare KV.
   * @param {string} key
   * @param {object} data
   * @returns {Promise<string>}
   */
  async save(key, data) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, data })
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Cloudflare KV save failed:', error);
      throw error;
    }
  }

  /**
   * Load share data from Cloudflare KV.
   * Retries short-lived 404/propagation windows after creation.
   * @param {string} key
   * @returns {Promise<object|null>}
   */
  async load(key) {
    const encodedKey = encodeURIComponent(key);
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxReadRetries; attempt += 1) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/share/${encodedKey}?t=${Date.now()}`, {
          cache: 'no-store'
        });

        if (response.status === 404) {
          if (attempt < this.maxReadRetries) {
            await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * (attempt + 1)));
            continue;
          }
          return null;
        }

        if (!response.ok) {
          throw new Error(`Load failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxReadRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * (attempt + 1)));
          continue;
        }

        console.error('Cloudflare KV load failed:', error);
      }
    }

    throw lastError || new Error('Load failed after retries.');
  }
}
