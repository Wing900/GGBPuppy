/**
 * Sleep for a duration.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Wrap async execution with timeout.
 * @template T
 * @param {(attempt: number) => Promise<T>} task
 * @param {number} timeoutMs
 * @param {string} [message]
 * @returns {Promise<T>}
 */
export async function withTimeout(task, timeoutMs, message = 'Operation timed out') {
  let timerId;

  try {
    return await Promise.race([
      task(),
      new Promise((_, reject) => {
        timerId = setTimeout(() => {
          reject(new Error(message));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timerId) {
      clearTimeout(timerId);
    }
  }
}

/**
 * Retry async task with linear/exponential backoff.
 * @template T
 * @param {() => Promise<T>} task
 * @param {object} [options]
 * @param {number} [options.retries]
 * @param {number} [options.delayMs]
 * @param {number} [options.backoffFactor]
 * @param {(error: unknown, attempt: number) => boolean} [options.shouldRetry]
 * @param {(error: unknown, attempt: number) => void} [options.onRetry]
 * @returns {Promise<T>}
 */
export async function retryAsync(task, options = {}) {
  const {
    retries = 2,
    delayMs = 300,
    backoffFactor = 1.5,
    shouldRetry = () => true,
    onRetry
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt >= retries;
      if (isLastAttempt || !shouldRetry(error, attempt)) {
        break;
      }

      onRetry?.(error, attempt + 1);

      const waitMs = Math.round(delayMs * (backoffFactor ** attempt));
      await sleep(waitMs);
    }
  }

  throw lastError || new Error('Retry task failed.');
}
