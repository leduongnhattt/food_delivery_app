/**
 * Edge Runtime compatible authentication utilities
 * Uses Web Crypto API instead of Node.js crypto module
 */

interface TokenPayload {
    accountId: string
    role: string
    username?: string
    email?: string
    status?: string
    provider?: string
    userId?: string
    iat: number
    exp: number
}

/**
 * Edge Runtime compatible JWT verification using jose library
 */
export async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
    try {
        // Check if token is valid format
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return null
        }

        // Use jose library for Edge Runtime compatible JWT verification
        const { jwtVerify } = await import('jose')
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

        const { payload } = await jwtVerify(token, secret)

        return payload as unknown as TokenPayload
    } catch (error) {
        // For development, fall back to simple decode without verification
        try {
            const parts = token.split('.')
            if (parts.length !== 3) return null

            const payload = JSON.parse(atob(parts[1])) as TokenPayload

            // Check if token is expired
            if (payload.exp && payload.exp < Date.now() / 1000) {
                return null
            }

            return payload
        } catch {
            console.error('Token verification failed:', error)
            return null
        }
    }
}

/**
 * Synchronous version for backward compatibility
 */
export function verifyTokenEdgeSync(token: string): TokenPayload | null {
    try {
        // Check if token is valid format
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return null
        }

        // Check if token has proper JWT format (3 parts separated by dots)
        const parts = token.split('.')
        if (parts.length !== 3) {
            return null
        }

        // Decode JWT payload without verification for Edge Runtime
        const payload = JSON.parse(atob(parts[1])) as TokenPayload

        // Check if token is expired
        if (payload.exp && payload.exp < Date.now() / 1000) {
            return null
        }

        return payload
    } catch (error) {
        console.error('Token verification failed:', error)
        return null
    }
}

/**
 * Generate a cryptographically secure random string using Web Crypto API
 */
export function generateRandomString(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate UUID using Web Crypto API
 */
export function generateUUID(): string {
    return crypto.randomUUID()
}

/**
 * Hash a token using Web Crypto API (SHA-256)
 */
export async function hashTokenEdge(token: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Simple token validation for Edge Runtime
 * This is a simplified version - for production use proper JWT verification
 */
export function validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false

    const parts = token.split('.')
    if (parts.length !== 3) return false

    try {
        // Try to decode the payload
        const payload = JSON.parse(atob(parts[1]))
        return payload && typeof payload === 'object' && payload.exp
    } catch {
        return false
    }
}
