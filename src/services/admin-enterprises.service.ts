import { buildAuthHeader, refreshAccessToken, getAuthToken } from '@/lib/auth-helpers'
export type CreateEnterprisePayload = {
    username: string
    email: string
    password: string
    enterpriseName: string
    phoneNumber: string
    address: string
    openHours: string
    closeHours: string
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

export async function createEnterprise(payload: CreateEnterprisePayload): Promise<Response> {
    return authorizedFetch('/api/admin/enterprises', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
}


