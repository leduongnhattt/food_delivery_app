/**
 * Retry utility for API calls with exponential backoff
 */

export interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    timeout?: number;
}

export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    totalTime: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    timeout: 30000, // 30 seconds
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<RetryResult<T>> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            // Create timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Timeout after ${opts.timeout}ms`)), opts.timeout);
            });

            // Race between function and timeout
            const data = await Promise.race([fn(), timeoutPromise]);

            return {
                success: true,
                data,
                attempts: attempt,
                totalTime: Date.now() - startTime,
            };
        } catch (error) {
            lastError = error as Error;

            // Don't retry on last attempt
            if (attempt === opts.maxAttempts) {
                break;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
                opts.maxDelay
            );

            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return {
        success: false,
        error: lastError!,
        attempts: opts.maxAttempts,
        totalTime: Date.now() - startTime,
    };
}

/**
 * Retry for database operations
 */
export async function withDatabaseRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const result = await withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 500,
        maxDelay: 5000,
        timeout: 15000,
        ...options,
    });

    if (!result.success) {
        throw new Error(`Database operation failed after ${result.attempts} attempts: ${result.error?.message}`);
    }

    return result.data!;
}

/**
 * Retry for external API calls
 */
export async function withApiRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const result = await withRetry(operation, {
        maxAttempts: 2,
        baseDelay: 1000,
        maxDelay: 8000,
        timeout: 20000,
        ...options,
    });

    if (!result.success) {
        throw new Error(`API call failed after ${result.attempts} attempts: ${result.error?.message}`);
    }

    return result.data!;
}

/**
 * Simple retry mechanism for database operations (legacy compatibility)
 * Used across all API endpoints to handle timeouts and connection issues
 */
export async function retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error as Error
            console.log(`Database operation attempt ${attempt} failed:`, error)

            if (attempt === maxAttempts) {
                throw lastError
            }

            // Exponential backoff: delay * attempt (1s, 2s, 3s...)
            await new Promise(resolve => setTimeout(resolve, delay * attempt))
        }
    }

    throw lastError!
}

/**
 * Retry with custom configuration for different operation types
 */
export const retryConfigs = {
    // Quick operations (count, findUnique)
    quick: {
        maxAttempts: 2,
        delay: 500
    },

    // Normal operations (findMany, create)
    normal: {
        maxAttempts: 3,
        delay: 1000
    },

    // Heavy operations (complex queries, bulk operations)
    heavy: {
        maxAttempts: 5,
        delay: 2000
    }
}

/**
 * Retry with predefined configuration
 */
export async function retryWithConfig<T>(
    operation: () => Promise<T>,
    config: keyof typeof retryConfigs = 'normal'
): Promise<T> {
    const { maxAttempts, delay } = retryConfigs[config]
    return retryDatabaseOperation(operation, maxAttempts, delay)
}