// Simple debounce utility
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            func(...args)
        }, delay)
    }
}

// Debounced API call wrapper that returns a Promise
export function createDebouncedApiCall<T extends (...args: any[]) => Promise<any>>(
    apiCall: T,
    delay: number = 300
): T {
    let timeoutId: NodeJS.Timeout | null = null

    return ((...args: Parameters<T>) => {
        return new Promise((resolve, reject) => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }

            timeoutId = setTimeout(async () => {
                try {
                    const result = await apiCall(...args)
                    resolve(result)
                } catch (error) {
                    reject(error)
                }
            }, delay)
        })
    }) as T
}
