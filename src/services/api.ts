// Base API configuration
import { refreshAccessToken, setAuthToken } from '@/lib/auth-helpers'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T = any> {
    data?: T
    error?: string
    message?: string
    success?: boolean
    status?: number
}

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = 'ApiError'
    }
}

// Base API client
class ApiClient {
    private baseURL: string

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T | ApiResponse> {
        const url = `${this.baseURL}${endpoint}`

        // Get token from localStorage for authenticated requests
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        }

        try {
            let response = await fetch(url, { ...config, credentials: 'include' })

            // Attempt one auto-refresh on 401
            if (response.status === 401) {
                const newToken = await refreshAccessToken()
                if (newToken) {
                    setAuthToken(newToken)
                    response = await fetch(url, {
                        ...config,
                        headers: {
                            ...(config.headers || {}),
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${newToken}`,
                        },
                        credentials: 'include'
                    })
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                return {
                    success: false,
                    error: errorData.error || `HTTP error! status: ${response.status}`,
                    status: response.status
                }
            }

            return await response.json()
        } catch (error) {
            if (error instanceof ApiError) {
                return {
                    success: false,
                    error: error.message,
                    status: error.status
                }
            }
            return {
                success: false,
                error: 'Network error occurred',
                status: 500
            }
        }
    }

    // GET request
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T | ApiResponse> {
        const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint
        return this.request<T>(url, { method: 'GET' })
    }

    // POST request
    async post<T>(endpoint: string, data?: any): Promise<T | ApiResponse> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    // PUT request
    async put<T>(endpoint: string, data?: any): Promise<T | ApiResponse> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    // DELETE request
    async delete<T>(endpoint: string): Promise<T | ApiResponse> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }

    // PATCH request
    async patch<T>(endpoint: string, data?: any): Promise<T | ApiResponse> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        })
    }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiResponse, ApiError }
