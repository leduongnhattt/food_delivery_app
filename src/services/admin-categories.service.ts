import { buildAuthHeader, refreshAccessToken, getAuthToken } from '@/lib/auth-helpers'

export type CreateCategoryPayload = {
    categoryName: string
    description?: string
}

async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    let headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as any) }
    let token = getAuthToken()
    if (!token) token = await refreshAccessToken() || null
    const authHeader = buildAuthHeader()
    headers = { ...headers, ...authHeader }
    const res = await fetch(input, { ...init, headers, credentials: 'include' })
    if (res.status === 401) {
        const newToken = await refreshAccessToken()
        if (newToken) {
            const retryHeaders = { ...headers, ...buildAuthHeader() }
            return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' })
        }
    }
    return res
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Response> {
    return authorizedFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
}

export async function getAllCategories(): Promise<Response> {
    return authorizedFetch('/api/categories', {
        method: 'GET'
    })
}
