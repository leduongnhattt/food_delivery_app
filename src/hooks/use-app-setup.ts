import { useState, useEffect } from 'react'
import { appSetup, SetupStatus } from '@/lib/main'

/**
 * Hook for managing application setup state
 */
export const useAppSetup = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [isInitialized, setIsInitialized] = useState(false)
    const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const initializeApp = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Initialize the app
                await appSetup.initialize()

                // Get setup status
                const status = appSetup.getSetupStatus()
                setSetupStatus(status)
                setIsInitialized(status.isInitialized)

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to initialize app'
                setError(errorMessage)
                console.error('App initialization error:', err)
            } finally {
                setIsLoading(false)
            }
        }

        // Listen for setup complete event
        const handleSetupComplete = (event: CustomEvent) => {
            console.log('App setup completed:', event.detail)
            setIsInitialized(true)
            setSetupStatus(event.detail.setupStatus)
        }

        // Add event listener
        window.addEventListener('appSetupComplete', handleSetupComplete as EventListener)

        // Initialize app
        initializeApp()

        // Cleanup
        return () => {
            window.removeEventListener('appSetupComplete', handleSetupComplete as EventListener)
        }
    }, [])

    const retrySetup = async () => {
        setError(null)
        setIsLoading(true)

        try {
            await appSetup.initialize()
            const status = appSetup.getSetupStatus()
            setSetupStatus(status)
            setIsInitialized(status.isInitialized)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to retry setup'
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleSetupStep = (stepName: string, enabled: boolean) => {
        appSetup.toggleSetupStep(stepName, enabled)
        const status = appSetup.getSetupStatus()
        setSetupStatus(status)
    }

    return {
        isLoading,
        isInitialized,
        setupStatus,
        error,
        retrySetup,
        toggleSetupStep
    }
}

/**
 * Hook for checking if app is ready
 */
export const useAppReady = () => {
    const { isInitialized, isLoading, error } = useAppSetup()

    return {
        isReady: isInitialized && !isLoading && !error,
        isLoading,
        error
    }
}
