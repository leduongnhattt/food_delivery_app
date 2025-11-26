import { NextRequest, NextResponse } from 'next/server'

export interface TimeoutOptions {
    timeout?: number
    retryAttempts?: number
    retryDelay?: number
}

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const DEFAULT_RETRY_ATTEMPTS = 3
const DEFAULT_RETRY_DELAY = 1000 // 1 second

/**
 * Middleware to handle API timeouts with retry mechanism
 */
export function withTimeout<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>,
    options: TimeoutOptions = {}
) {
    const {
        timeout = DEFAULT_TIMEOUT,
        retryAttempts = DEFAULT_RETRY_ATTEMPTS,
        retryDelay = DEFAULT_RETRY_DELAY
    } = options

    return async (...args: T): Promise<NextResponse> => {
        let lastError: Error | null = null

        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                // Create timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Request timeout after ${timeout}ms`))
                    }, timeout)
                })

                // Race between handler and timeout
                const result = await Promise.race([
                    handler(...args),
                    timeoutPromise
                ])

                return result
            } catch (error) {
                lastError = error as Error

                // Don't retry on last attempt
                if (attempt === retryAttempts) {
                    break
                }

                // Check if it's a timeout error
                if (error instanceof Error && error.message.includes('timeout')) {
                    console.log(`Attempt ${attempt} timed out, retrying in ${retryDelay}ms...`)
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                } else {
                    // Don't retry on non-timeout errors
                    throw error
                }
            }
        }

        // All attempts failed
        console.error(`All ${retryAttempts} attempts failed. Last error:`, lastError)

        return NextResponse.json(
            {
                error: 'Request timeout',
                message: `Failed after ${retryAttempts} attempts`,
                details: lastError?.message
            },
            { status: 504 } // Gateway Timeout
        )
    }
}

/**
 * Timeout wrapper for GET requests
 */
export function withGetTimeout(
    handler: (request: NextRequest) => Promise<NextResponse>,
    options: TimeoutOptions = {}
) {
    return withTimeout(handler, {
        timeout: 20000, // 20 seconds for GET requests
        retryAttempts: 2,
        retryDelay: 1000,
        ...options
    })
}

/**
 * Timeout wrapper for POST requests
 */
export function withPostTimeout(
    handler: (request: NextRequest) => Promise<NextResponse>,
    options: TimeoutOptions = {}
) {
    return withTimeout(handler, {
        timeout: 30000, // 30 seconds for POST requests
        retryAttempts: 3,
        retryDelay: 2000,
        ...options
    })
}
