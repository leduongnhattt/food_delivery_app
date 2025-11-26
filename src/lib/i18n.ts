import { useState, useEffect, useCallback, useMemo } from 'react';
import enFallback from '../../public/locales/en.json';

export type Locale = 'en' | 'vi';

interface Translations {
    [key: string]: any;
}

// Cache for loaded translations – seed English with the static JSON so we always
// have a default to fall back to even before async fetches finish.
const translationCache: Record<Locale, Translations> = {
    en: enFallback as Translations,
    vi: {}
};

// Default locale - Set to English
const DEFAULT_LOCALE: Locale = 'en';

// Get locale from localStorage or default
export const getStoredLocale = (): Locale => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;

    const stored = localStorage.getItem('locale') as Locale | null;
    return stored || DEFAULT_LOCALE;
};

// Set locale to localStorage
export const setStoredLocale = (locale: Locale): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('locale', locale);
};

// Force reset to default locale (English)
export const resetToDefaultLocale = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('locale');
    // Clear translation cache to force reload
    translationCache.en = {};
    translationCache.vi = {};
};

// Clear translation cache to force reload (useful for development)
export const clearTranslationCache = (): void => {
    translationCache.en = {};
    translationCache.vi = {};
};

// Load translations from JSON file
const loadTranslations = async (
    locale: Locale,
    options: { forceReload?: boolean } = {}
): Promise<Translations> => {
    const { forceReload = false } = options;

    if (!forceReload && translationCache[locale] && Object.keys(translationCache[locale]).length > 0) {
        return translationCache[locale];
    }

    try {
        const cacheBuster = forceReload ? `?t=${Date.now()}` : '';
        const response = await fetch(`/locales/${locale}.json${cacheBuster}`, {
            cache: forceReload ? 'no-store' : 'default'
        });
        if (!response.ok) {
            throw new Error(`Failed to load ${locale} translations`);
        }

        const translations = await response.json();
        translationCache[locale] = translations;
        return translations;
    } catch (error) {
        console.error(`Error loading translations for ${locale}:`, error);
        // Fallback to default locale if current locale fails
        if (locale !== DEFAULT_LOCALE) {
            return loadTranslations(DEFAULT_LOCALE, { forceReload });
        }
        return translationCache[DEFAULT_LOCALE];
    }
};

// Get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): string => {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            // If key not found, return the original path
            return path;
        }
    }

    return typeof current === 'string' ? current : path;
};

const getWithFallback = (locale: Locale, key: string): string => {
    const primary = translationCache[locale];
    const result = getNestedValue(primary, key);
    if (result !== key) return result;

    if (locale !== DEFAULT_LOCALE) {
        const fallback = getNestedValue(translationCache[DEFAULT_LOCALE], key);
        if (fallback !== key) return fallback;
    }
    return key;
};

// Translation function
export const t = (key: string, locale?: Locale): string => {
    const currentLocale = locale || getStoredLocale();
    return getWithFallback(currentLocale, key);
};

// Hook for using translations in components
export const useTranslations = (locale?: Locale) => {
    const [currentLocale, setCurrentLocale] = useState<Locale>(locale || getStoredLocale());
    const [isLoading, setIsLoading] = useState(true);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const loadTranslationsForLocale = async () => {
            setIsLoading(true);
            await loadTranslations(currentLocale, {
                forceReload: process.env.NODE_ENV !== 'production'
            });
            if (isMounted) {
                setIsLoading(false);
                setRevision(prev => prev + 1); // trigger re-render so `t` sees the latest cache
            }
        };

        loadTranslationsForLocale();

        return () => {
            isMounted = false;
        };
    }, [currentLocale]);

    const changeLocale = (newLocale: Locale) => {
        setCurrentLocale(newLocale);
        setStoredLocale(newLocale);
    };

    const translate = useCallback(
        (key: string) => {
            void revision; // reference to ensure hook updates when cache refreshes
            return getWithFallback(currentLocale, key);
        },
        [currentLocale, revision]
    );

    return {
        t: translate,
        locale: currentLocale,
        changeLocale,
        isLoading
    };
};

// Initialize translations on app start
export const initializeTranslations = async (locale: Locale = getStoredLocale()) => {
    await loadTranslations(locale, {
        forceReload: process.env.NODE_ENV !== 'production'
    });
};
