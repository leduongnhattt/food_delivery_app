/**
 * Application Configuration
 * Centralized configuration for all app features and options
 */

export interface AppConfig {
    // Core Features
    features: {
        authentication: boolean
        internationalization: boolean
        theme: boolean
        cart: boolean
        analytics: boolean
        notifications: boolean
        offline: boolean
        pwa: boolean
    }

    // API Configuration
    api: {
        baseUrl: string
        timeout: number
        retryAttempts: number
        enableLogging: boolean
    }

    // UI Configuration
    ui: {
        defaultTheme: 'light' | 'dark' | 'system'
        animations: boolean
        compactMode: boolean
        showDebugger: boolean
    }

    // Localization
    locale: {
        default: string
        fallback: string
        supported: string[]
        autoDetect: boolean
    }

    // Performance
    performance: {
        enableCaching: boolean
        cacheTimeout: number
        lazyLoading: boolean
        imageOptimization: boolean
    }

    // Security
    security: {
        enableCSP: boolean
        enableHSTS: boolean
        tokenRefreshThreshold: number
        maxLoginAttempts: number
    }
}

// Default configuration
export const defaultConfig: AppConfig = {
    features: {
        authentication: true,
        internationalization: true,
        theme: true,
        cart: true,
        analytics: false,
        notifications: false,
        offline: false,
        pwa: false
    },

    api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        timeout: 10000,
        retryAttempts: 3,
        enableLogging: process.env.NODE_ENV === 'development'
    },

    ui: {
        defaultTheme: 'light',
        animations: true,
        compactMode: false,
        showDebugger: process.env.NODE_ENV === 'development'
    },

    locale: {
        default: 'en',
        fallback: 'en',
        supported: ['en', 'vi'],
        autoDetect: false
    },

    performance: {
        enableCaching: true,
        cacheTimeout: 300000, // 5 minutes
        lazyLoading: true,
        imageOptimization: true
    },

    security: {
        enableCSP: true,
        enableHSTS: true,
        tokenRefreshThreshold: 300000, // 5 minutes
        maxLoginAttempts: 5
    }
}

// Environment-specific overrides
const environmentOverrides: Record<string, Partial<AppConfig>> = {
    development: {
        features: {
            ...defaultConfig.features,
            analytics: false,
            notifications: false
        },
        ui: {
            ...defaultConfig.ui,
            showDebugger: true
        },
        api: {
            ...defaultConfig.api,
            enableLogging: true
        }
    },

    production: {
        features: {
            ...defaultConfig.features,
            analytics: true,
            notifications: true,
            pwa: true
        },
        ui: {
            ...defaultConfig.ui,
            showDebugger: false
        },
        api: {
            ...defaultConfig.api,
            enableLogging: false
        },
        security: {
            ...defaultConfig.security,
            enableCSP: true,
            enableHSTS: true
        }
    }
}

// Configuration manager
export class ConfigManager {
    private static instance: ConfigManager
    private config: AppConfig

    private constructor() {
        this.config = this.loadConfig()
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager()
        }
        return ConfigManager.instance
    }

    private loadConfig(): AppConfig {
        const env = process.env.NODE_ENV as keyof typeof environmentOverrides
        const envOverrides = environmentOverrides[env] || {}

        // Merge default config with environment overrides
        const config = this.deepMerge(defaultConfig, envOverrides)

        // Load user preferences from localStorage
        if (typeof window !== 'undefined') {
            const userPrefs = this.loadUserPreferences()
            return this.deepMerge(config, userPrefs)
        }

        return config
    }

    private loadUserPreferences(): Partial<AppConfig> {
        try {
            const stored = localStorage.getItem('app-config')
            return stored ? JSON.parse(stored) : {}
        } catch {
            return {}
        }
    }

    private deepMerge(target: any, source: any): any {
        const result = { ...target }

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key])
            } else {
                result[key] = source[key]
            }
        }

        return result
    }

    public getConfig(): AppConfig {
        return { ...this.config }
    }

    public updateConfig(updates: Partial<AppConfig>): void {
        this.config = this.deepMerge(this.config, updates)
        this.saveUserPreferences()
    }

    public resetConfig(): void {
        this.config = this.loadConfig()
        if (typeof window !== 'undefined') {
            localStorage.removeItem('app-config')
        }
    }

    private saveUserPreferences(): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('app-config', JSON.stringify(this.config))
            } catch (error) {
                console.error('Failed to save app-config preferences:', error)
            }
        }
    }

    // Feature flags
    public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
        return this.config.features[feature]
    }

    public enableFeature(feature: keyof AppConfig['features']): void {
        this.updateConfig({
            features: {
                ...this.config.features,
                [feature]: true
            }
        })
    }

    public disableFeature(feature: keyof AppConfig['features']): void {
        this.updateConfig({
            features: {
                ...this.config.features,
                [feature]: false
            }
        })
    }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance()

// Export convenience functions
export const getConfig = () => configManager.getConfig()
export const updateConfig = (updates: Partial<AppConfig>) => configManager.updateConfig(updates)
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => configManager.isFeatureEnabled(feature)
export const enableFeature = (feature: keyof AppConfig['features']) => configManager.enableFeature(feature)
export const disableFeature = (feature: keyof AppConfig['features']) => configManager.disableFeature(feature)
