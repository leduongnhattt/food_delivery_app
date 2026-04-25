import { refreshAccessToken } from '@/lib/auth-helpers'

export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginationParams {
    page?: number
    limit?: number
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface SearchFilters {
    search?: string
    category?: string
    isAvailable?: boolean
    isOpen?: boolean
    minRating?: number
    maxPrice?: number
}

/**
 * Base URL of the Nest API server (for direct client calls).
 * Use NEXT_PUBLIC_API_URL (e.g. http://localhost:3001/api) in .env.
 */
export function getServerApiBase(): string {
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    }
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    try {
        return localStorage.getItem('access_token')
    } catch {
        return null
    }
}

/**
 * Build headers with optional authorization
 */
export function buildHeaders(extra?: Record<string, string>): HeadersInit {
    const token = getAccessToken()
    const base: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(extra || {})
    }
    if (token) base['Authorization'] = `Bearer ${token}`
    return base
}

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString())
        }
    })

    return searchParams.toString()
}

/**
 * Generic HTTP request handler.
 */
export async function requestJson<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const method = (options.method || 'GET').toUpperCase()
    const dedupeKey = `${method}:${url}`
    const globalAny = globalThis as any
    const inflight: Map<string, Promise<any>> =
        globalAny.__httpClientInflight ||
        (globalAny.__httpClientInflight = new Map<string, Promise<any>>())

    const performFetch = () =>
        fetch(url, {
            cache: 'no-store',
            mode: 'cors',
            credentials: 'include',
            ...options,
            headers: buildHeaders(options.headers as Record<string, string>),
        })

    if (typeof window !== 'undefined' && method === 'GET') {
        const existing = inflight.get(dedupeKey)
        if (existing) {
            return existing as Promise<T>
        }
    }

    let response: Response
    const task = (async () => {
        try {
            response = await performFetch()
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            const hint =
                url.startsWith('http') && typeof window !== 'undefined'
                    ? ' (Check CORS on the server or ensure the server is running with the correct URL/port)'
                    : ''
            const error = new Error(`Failed to fetch${hint}: ${message}`) as Error & { url?: string; cause?: unknown }
            error.url = url
            error.cause = err
            throw error
        }

        if (response.status === 401) {
            const headersAny = (options.headers || {}) as any
            const skipRefresh =
                headersAny['x-skip-refresh'] === '1' ||
                headersAny['X-Skip-Refresh'] === '1'
            if (!skipRefresh) {
                const refreshed = await refreshAccessToken()
                if (refreshed) {
                    response = await performFetch()
                }
            }
        }

        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`
            let errorData: any = undefined

            try {
                errorData = await response.json()
                const msg = errorData?.message
                if (Array.isArray(msg)) {
                    errorMessage = msg.filter(Boolean).join('; ') || errorMessage
                } else if (typeof msg === 'string' && msg.trim()) {
                    errorMessage = msg
                } else if (typeof errorData?.error === 'string' && errorData.error.trim()) {
                    errorMessage = errorData.error
                } else {
                    errorMessage = errorMessage
                }
            } catch {
                errorMessage = response.statusText || errorMessage
            }

            const error = new Error(errorMessage) as Error & { status: number; url: string; data?: any }
            error.status = response.status
            error.url = url
            if (errorData !== undefined) error.data = errorData
            throw error
        }

        return response.json()
    })()

    if (typeof window !== 'undefined' && method === 'GET') {
        inflight.set(dedupeKey, task)
        try {
            return (await task) as T
        } finally {
            inflight.delete(dedupeKey)
        }
    }

    return (await task) as T
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any, defaultMessage: string): string {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return defaultMessage
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
    data: T[],
    page: number = 1,
    limit: number = 10,
    total: number = 0
): PaginatedResponse<T> {
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
}

/**
 * Create empty paginated response
 */
export function createEmptyPaginatedResponse<T>(): PaginatedResponse<T> {
    return createPaginatedResponse([], 1, 10, 0)
}

// ==== base-service.ts ====

// Base service class with common functionality

export abstract class BaseService {
    protected baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    /**
     * Generic GET request
     */
    protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const queryString = params ? buildQueryString(params) : ''
        const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`

        return requestJson<T>(url, {
            method: 'GET'
        })
    }

    /**
     * Generic POST request
     */
    protected async post<T>(endpoint: string, data?: any): Promise<T> {
        return requestJson<T>(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        })
    }

    /**
     * Generic PUT request
     */
    protected async put<T>(endpoint: string, data?: any): Promise<T> {
        return requestJson<T>(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        })
    }

    /**
     * Generic PATCH request
     */
    protected async patch<T>(endpoint: string, data?: any): Promise<T> {
        return requestJson<T>(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        })
    }

    /**
     * Generic DELETE request
     */
    protected async delete<T>(endpoint: string): Promise<T> {
        return requestJson<T>(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE'
        })
    }

    /**
     * Handle API errors with fallback
     */
    protected handleError(error: any, fallbackMessage: string, fallbackData?: any): ApiResponse {
        const errorMessage = handleApiError(error, fallbackMessage)
        console.error('Service error:', error)

        return {
            success: false,
            error: errorMessage,
            data: fallbackData
        }
    }

    /**
     * Create success response
     */
    protected createSuccessResponse<T>(data: T): ApiResponse<T> {
        return {
            success: true,
            data
        }
    }

    /**
     * Get paginated data with error handling
     */
    protected async getPaginatedData<T>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<PaginatedResponse<T>> {
        try {
            return await this.get<PaginatedResponse<T>>(endpoint, params)
        } catch (error) {
            console.error('Error fetching paginated data:', error)
            return createEmptyPaginatedResponse<T>()
        }
    }

    /**
     * Get single item with error handling
     */
    protected async getItem<T>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<T | null> {
        try {
            return await this.get<T>(endpoint, params)
        } catch (error) {
            console.error('Error fetching item:', error)
            return null
        }
    }

    /**
     * Update item with error handling
     */
    protected async updateItem<T>(
        endpoint: string,
        data: any
    ): Promise<ApiResponse<T>> {
        try {
            const result = await this.put<T>(endpoint, data)
            return this.createSuccessResponse(result)
        } catch (error) {
            return this.handleError(error, 'Failed to update item')
        }
    }

    /**
     * Create item with error handling
     */
    protected async createItem<T>(
        endpoint: string,
        data: any
    ): Promise<ApiResponse<T>> {
        try {
            const result = await this.post<T>(endpoint, data)
            return this.createSuccessResponse(result)
        } catch (error) {
            return this.handleError(error, 'Failed to create item')
        }
    }

    /**
     * Delete item with error handling
     */
    protected async deleteItem<T>(
        endpoint: string
    ): Promise<ApiResponse<T>> {
        try {
            const result = await this.delete<T>(endpoint)
            return this.createSuccessResponse(result)
        } catch (error) {
            return this.handleError(error, 'Failed to delete item')
        }
    }
}

// ==== retry-utils.ts ====

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

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
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
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
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

// ==== debounce.ts ====

// Simple debounce utility
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            func(...args)
        }, delay)
    }
}

// Debounced API call wrapper that returns a Promise
export function createDebouncedApiCall<T extends (...args: any[]) => Promise<any>>(
    apiCall: T,
    delay: number = 300
): T {
    let timeoutId: NodeJS.Timeout | null = null

    return ((...args: Parameters<T>) => {
        return new Promise((resolve, reject) => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }

            timeoutId = setTimeout(async () => {
                try {
                    const result = await apiCall(...args)
                    resolve(result)
                } catch (error) {
                    reject(error)
                }
            }, delay)
        })
    }) as T
}

