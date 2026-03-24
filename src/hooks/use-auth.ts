"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart'
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    logoutUser,
    isAuthenticated,
    type AuthUser
} from '@/lib/auth-helpers';

interface AuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    isLoading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        isLoading: true
    });
    const router = useRouter();
    const { resetAfterLogout } = useCart()

    // Check authentication status
    const checkAuth = async () => {
        try {
            if (!isAuthenticated()) {
                setAuthState({
                    isAuthenticated: false,
                    user: null,
                    isLoading: false
                });
                return;
            }

            // Get user data from server
            const user = await getCurrentUser();
            setAuthState({
                isAuthenticated: user !== null,
                user,
                isLoading: false
            });
        } catch (error) {
            console.error('Auth check failed:', error);
            setAuthState({
                isAuthenticated: false,
                user: null,
                isLoading: false
            });
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await logoutUser();
            // Ensure cart state switches to guest immediately without page refresh
            await resetAfterLogout();
            setAuthState({
                isAuthenticated: false,
                user: null,
                isLoading: false
            });
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Check auth on mount and when token changes
    useEffect(() => {
        checkAuth();

        // Listen for storage changes (when user logs in from another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token') {
                checkAuth();
            }
        };

        // Listen for custom auth token change event (same tab)
        const handleAuthTokenChange = () => {
            checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('authTokenChanged', handleAuthTokenChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authTokenChanged', handleAuthTokenChange);
        };
    }, []);

    return {
        ...authState,
        logout,
        checkAuth
    };
}
