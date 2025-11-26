// Common HTTP client utilities for all services

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
 * Generic HTTP request handler
 */
export async function requestJson<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(url, {
        cache: 'no-store',
        ...options,
        headers: buildHeaders(options.headers as Record<string, string>)
    })

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`

        try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
            // If response is not JSON, use status text or default message
            errorMessage = response.statusText || errorMessage
        }

        // Create error object with status for better handling
        const error = new Error(errorMessage) as any
        error.status = response.status
        error.url = url
        throw error
    }

    return response.json()
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
