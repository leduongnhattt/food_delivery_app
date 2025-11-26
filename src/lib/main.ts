import { initializeTranslations } from './i18n'

/**
 * Main Application Setup
 * Handles all initialization and configuration when the app starts
 */
export class AppSetup {
    private static instance: AppSetup
    private isInitialized = false
    private setupSteps: SetupStep[] = []

    private constructor() {
        this.registerDefaultSteps()
    }

    public static getInstance(): AppSetup {
        if (!AppSetup.instance) {
            AppSetup.instance = new AppSetup()
        }
        return AppSetup.instance
    }

    /**
     * Register default setup steps
     */
    private registerDefaultSteps(): void {
        this.setupSteps = [
            {
                name: 'locale',
                description: 'Initialize internationalization',
                handler: this.initializeLocale.bind(this),
                priority: 1,
                enabled: true
            },
            {
                name: 'theme',
                description: 'Initialize theme system',
                handler: this.initializeTheme.bind(this),
                priority: 2,
                enabled: true
            },
            {
                name: 'auth',
                description: 'Initialize authentication state',
                handler: this.initializeAuth.bind(this),
                priority: 3,
                enabled: true
            },
            {
                name: 'cart',
                description: 'Initialize shopping cart',
                handler: this.initializeCart.bind(this),
                priority: 4,
                enabled: true
            },
            {
                name: 'analytics',
                description: 'Initialize analytics tracking',
                handler: this.initializeAnalytics.bind(this),
                priority: 5,
                enabled: false // Disabled by default
            },
            {
                name: 'notifications',
                description: 'Initialize push notifications',
                handler: this.initializeNotifications.bind(this),
                priority: 6,
                enabled: false // Disabled by default
            }
        ]
    }

    /**
     * Initialize the entire application
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return
        }

        try {
            // Sort steps by priority
            const sortedSteps = this.setupSteps
                .filter(step => step.enabled)
                .sort((a, b) => a.priority - b.priority)

            // Execute setup steps
            for (const step of sortedSteps) {
                await step.handler()
            }

            this.isInitialized = true

            // Dispatch setup complete event
            this.dispatchSetupCompleteEvent()

        } catch (error) {
            throw error
        }
    }

    /**
     * Add a custom setup step
     */
    public addSetupStep(step: SetupStep): void {
        this.setupSteps.push(step)
    }

    /**
     * Enable/disable a setup step
     */
    public toggleSetupStep(stepName: string, enabled: boolean): void {
        const step = this.setupSteps.find(s => s.name === stepName)
        if (step) {
            step.enabled = enabled
        }
    }

    /**
     * Get setup status
     */
    public getSetupStatus(): SetupStatus {
        return {
            isInitialized: this.isInitialized,
            steps: this.setupSteps.map(step => ({
                name: step.name,
                description: step.description,
                priority: step.priority,
                enabled: step.enabled
            }))
        }
    }

    // Setup step handlers
    private async initializeLocale(): Promise<void> {
        try {
            // Initialize translations system
            await initializeTranslations()

            // Initialize Gemini Health AI locale
            await this.initializeGeminiHealthLocale()
        } catch (error) {
            throw error
        }
    }

    private async initializeGeminiHealthLocale(): Promise<void> {
        try {
            // Import and initialize Gemini Health AI service locale
            await import('@/services/gemini-health-ai.service')
            console.log('Gemini Health AI locale initialized with current system locale')
        } catch (error) {
            console.warn('Failed to initialize Gemini Health AI locale:', error)
            // Don't throw - this is not critical for app startup
        }
    }

    private async initializeTheme(): Promise<void> {
        try {
            // Initialize theme system
            const savedTheme = localStorage.getItem('theme') || 'light'
            document.documentElement.setAttribute('data-theme', savedTheme)
        } catch {
            // Don't throw - theme is not critical
        }
    }

    private async initializeAuth(): Promise<void> {
        try {
            // Check authentication state
            const token = localStorage.getItem('token')
            const userRole = localStorage.getItem('userRole')
            const userId = localStorage.getItem('userId')

            if (token && userRole && userId) {
                // Validate token if needed
                // await validateToken(token)
            }
        } catch {
            // Don't throw - auth can be handled later
        }
    }

    private async initializeCart(): Promise<void> {
        try {
            // Initialize cart state
            const cartData = localStorage.getItem('cart')
            if (cartData) {
                JSON.parse(cartData)
            }
        } catch {
            // Don't throw - cart can be handled later
        }
    }

    private async initializeAnalytics(): Promise<void> {
        try {
            // Initialize analytics (Google Analytics, etc.)
            // Implementation for analytics
        } catch {
            // Analytics initialization failed
        }
    }

    private async initializeNotifications(): Promise<void> {
        try {
            // Initialize push notifications
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    await Notification.requestPermission().catch(() => undefined)
                }
            }
        } catch {
            // Notifications initialization failed
        }
    }

    private dispatchSetupCompleteEvent(): void {
        const event = new CustomEvent('appSetupComplete', {
            detail: {
                timestamp: new Date().toISOString(),
                setupStatus: this.getSetupStatus()
            }
        })
        window.dispatchEvent(event)
    }
}

// Types
export interface SetupStep {
    name: string
    description: string
    handler: () => Promise<void>
    priority: number
    enabled: boolean
}

export interface SetupStatus {
    isInitialized: boolean
    steps: Array<{
        name: string
        description: string
        priority: number
        enabled: boolean
    }>
}

// Export singleton instance
export const appSetup = AppSetup.getInstance()

// Export convenience functions
export const initializeApp = () => appSetup.initialize()
export const addSetupStep = (step: SetupStep) => appSetup.addSetupStep(step)
export const toggleSetupStep = (stepName: string, enabled: boolean) =>
    appSetup.toggleSetupStep(stepName, enabled)
export const getSetupStatus = () => appSetup.getSetupStatus()