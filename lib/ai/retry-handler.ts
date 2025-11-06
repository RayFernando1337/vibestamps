/**
 * Retry handler with exponential backoff for AI operations
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000, // 1 second base delay
};

/**
 * Execute an async operation with exponential backoff retry logic
 */
export async function withExponentialRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Call retry callback if provided
      if (config.onRetry) {
        config.onRetry(attempt + 1, lastError);
      }

      // Don't retry on the last attempt
      if (attempt < config.maxRetries - 1) {
        const delayMs = config.baseDelayMs * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Waiting ${delayMs}ms before retry ${attempt + 2}/${config.maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error("Failed after all retries");
}
