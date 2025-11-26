// Base service class with common functionality

import {
    buildQueryString,
    requestJson,
    handleApiError,
    createEmptyPaginatedResponse,
    type ApiResponse,
    type PaginatedResponse
} from './http-client'

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
