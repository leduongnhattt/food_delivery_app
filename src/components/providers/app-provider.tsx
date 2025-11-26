'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAppSetup } from '@/hooks/use-app-setup'
import { SetupStatus } from '@/lib/main'
import { CartProvider } from '@/hooks/use-cart'
import { ToastProvider } from '@/contexts/toast-context'

interface AppContextType {
    isLoading: boolean
    isInitialized: boolean
    setupStatus: SetupStatus | null
    error: string | null
    retrySetup: () => Promise<void>
    toggleSetupStep: (stepName: string, enabled: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
    children: ReactNode
    fallback?: ReactNode
    errorFallback?: (error: string, retry: () => void) => ReactNode
}

export function AppProvider({ 
    children, 
    fallback,
    errorFallback 
}: AppProviderProps) {
    const appSetup = useAppSetup()

    // Show loading fallback
    if (appSetup.isLoading) {
        return (
            <>
                {fallback || (
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing App</h2>
                            <p className="text-gray-600">Setting up your experience...</p>
                        </div>
                    </div>
                )}
            </>
        )
    }

    // Show error fallback
    if (appSetup.error) {
        return (
            <>
                {errorFallback ? errorFallback(appSetup.error, appSetup.retrySetup) : (
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center max-w-md mx-auto p-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Setup Failed</h2>
                            <p className="text-gray-600 mb-4">{appSetup.error}</p>
                            <button
                                onClick={appSetup.retrySetup}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Retry Setup
                            </button>
                        </div>
                    </div>
                )}
            </>
        )
    }

    // App is ready, render children
    return (
        <AppContext.Provider value={appSetup}>
            <ToastProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </ToastProvider>
        </AppContext.Provider>
    )
}

export function useAppContext(): AppContextType {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider')
    }
    return context
}

// Convenience hook for checking if app is ready
export function useAppReady(): boolean {
    const { isInitialized, isLoading, error } = useAppContext()
    return isInitialized && !isLoading && !error
}
