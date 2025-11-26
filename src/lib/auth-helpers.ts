/**
 * Authentication helper functions for managing localStorage
 * Only stores access token, user data is fetched from server when needed
 */

const TOKEN_KEY = 'access_token';

export interface AuthUser {
    id: string;
    role: string;
    username?: string;
    email?: string;
    provider?: string; // 'email' | 'google' | 'facebook' etc.
}

/**
 * Set authentication token in localStorage
 */
export function setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
        // Dispatch custom event to notify auth state change
        window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { token } }));
    }
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
    }
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
    return getAuthToken() !== null;
}

/**
 * Get user profile from stored token (client-side)
 */
function safeDecodeJwt(token: string): any | null {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

/**
 * Attempt to refresh the access token using the refresh cookie
 * Returns the new token on success, otherwise null
 */
export async function refreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const existing = getAuthToken();
    // We can still decode expired token to get accountId
    const payload = existing ? safeDecodeJwt(existing) : null;
    const accountId = payload?.accountId || payload?.userId || localStorage.getItem('user_id') || '';
    if (!accountId) return null;

    try {
        const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'x-account-id': accountId },
            credentials: 'include'
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.accessToken) {
            setAuthToken(data.accessToken);
            return data.accessToken as string;
        }
        return null;
    } catch {
        return null;
    }
}

export function getCurrentUserFromToken(): AuthUser | null {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const payload = safeDecodeJwt(token);
        if (!payload) throw new Error('Invalid token');

        // If expired, try to refresh once synchronously by clearing token and letting caller retry via getCurrentUser()
        const isExpired = payload.exp && payload.exp < Date.now() / 1000;
        if (isExpired) {
            // We will not remove immediately; caller may trigger refresh path
            return null;
        }

        return {
            id: payload.accountId || payload.userId || '',
            role: payload.role,
            username: payload.username,
            email: payload.email,
            provider: payload.provider || 'email'
        };
    } catch (error) {
        console.error('Failed to decode token:', error);
        removeAuthToken();
        return null;
    }
}

/**
 * Get user profile from server using stored token (fallback)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    // First try to get user info from token (non-expired)
    const userFromToken = getCurrentUserFromToken();
    if (userFromToken) return userFromToken;

    // If token was expired or invalid, try to refresh once
    const maybeNew = await refreshAccessToken();
    if (maybeNew) {
        const refreshedPayload = safeDecodeJwt(maybeNew);
        if (refreshedPayload) {
            return {
                id: refreshedPayload.accountId || refreshedPayload.userId || '',
                role: refreshedPayload.role,
                username: refreshedPayload.username,
                email: refreshedPayload.email,
                provider: refreshedPayload.provider || 'email'
            };
        }
    }

    // Fallback: if we still have a token, try hitting profile
    const token = getAuthToken();
    if (!token) return null;

    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            return {
                id: userData.id,
                role: userData.role,
                username: userData.username,
                email: userData.email,
                provider: userData.provider || 'email'
            };
        } else {
            // Token is invalid, remove it
            removeAuthToken();
            return null;
        }
    } catch (error) {
        console.error('Failed to get current user:', error);
        removeAuthToken();
        return null;
    }
}

/**
 * Logout user by removing token and calling logout API
 */
export async function logoutUser(): Promise<void> {
    const token = getAuthToken();

    try {
        // Call logout API if token exists
        if (token) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error('Logout API error:', error);
    } finally {
        // Always remove token from localStorage
        removeAuthToken();
    }
}

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
    removeAuthToken();
}

// Server-side authentication helpers
import { NextRequest } from 'next/server';
import { verifyTokenEdgeSync } from '@/lib/auth-edge';

export interface AuthResult {
    success: boolean;
    user?: {
        id: string;
        role: string;
        username?: string;
        email?: string;
        provider?: string;
    };
    error?: string;
}

/**
 * Get authenticated user from request (server-side)
 */
export function getAuthenticatedUser(request: NextRequest): AuthResult {
    try {
        // Get token from Authorization header or cookies
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') ||
            request.cookies.get('refresh_token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'No authentication token provided'
            };
        }

        // Verify token
        const decoded = verifyTokenEdgeSync(token);
        if (!decoded) {
            return {
                success: false,
                error: 'Invalid or expired token'
            };
        }

        return {
            success: true,
            user: {
                id: decoded.accountId || decoded.userId || '',
                role: decoded.role,
                username: decoded.username,
                email: decoded.email,
                provider: decoded.provider || 'email'
            }
        };
    } catch {
        return {
            success: false,
            error: 'Authentication failed'
        };
    }
}

/**
 * Require customer authentication
 */
export function requireCustomer(request: NextRequest): AuthResult {
    const authResult = getAuthenticatedUser(request);

    if (!authResult.success) {
        return authResult;
    }

    const userRole = (authResult.user?.role || '').toLowerCase()
    if (userRole !== 'customer') {
        return {
            success: false,
            error: 'Customer access required'
        };
    }

    return authResult;
}

/**
 * Require admin authentication
 */
export function requireAdmin(request: NextRequest): AuthResult {
    const authResult = getAuthenticatedUser(request);

    if (!authResult.success) {
        return authResult;
    }

    const userRole = (authResult.user?.role || '').toLowerCase()
    if (userRole !== 'admin') {
        return {
            success: false,
            error: 'Admin access required'
        };
    }

    return authResult;
}

/**
 * Require enterprise authentication
 */
export function requireEnterprise(request: NextRequest): AuthResult {
    const authResult = getAuthenticatedUser(request);

    if (!authResult.success) {
        return authResult;
    }

    const userRole = (authResult.user?.role || '').toLowerCase()
    if (userRole !== 'enterprise') {
        return {
            success: false,
            error: 'Enterprise access required'
        };
    }

    return authResult;
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized') {
    return {
        success: false,
        error: message
    };
}

/**
 * Build authorization header
 */
export function buildAuthHeader(): Record<string, string> {
    const token = getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Common API response types
 */
export interface AuthResponse {
    success: boolean
    accessToken?: string
    refreshToken?: string
    user?: any
    error?: string
}

export interface LoginCredentials {
    username: string
    password: string
}

export interface RegisterCredentials {
    username: string
    email: string
    password: string
}

export interface PasswordResetRequest {
    email: string
}

export interface PasswordResetConfirm {
    tokenId: string
    newPassword: string
}

export interface VerifyCodeRequest {
    email: string
    code: string
}