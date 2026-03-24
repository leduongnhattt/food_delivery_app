import { NextRequest, NextResponse } from 'next/server'

type StoreEntry = { count: number; resetAt: number }

// Simple in-memory store. For production, replace with Redis or Upstash implementation.
const store = new Map<string, StoreEntry>()

export type RateLimitOptions = {
    key: string // unique key per user/IP/route
    limit: number // max requests per window
    windowMs: number // window size in ms
}

export type RateLimitResult = {
    allowed: boolean
    remaining: number
    resetAt: number
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
    const now = Date.now()
    const entry = store.get(opts.key)
    if (!entry || now >= entry.resetAt) {
        const resetAt = now + opts.windowMs
        store.set(opts.key, { count: 1, resetAt })
        return { allowed: true, remaining: opts.limit - 1, resetAt }
    }
    if (entry.count >= opts.limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }
    entry.count += 1
    return { allowed: true, remaining: Math.max(0, opts.limit - entry.count), resetAt: entry.resetAt }
}

export function getClientIp(req: NextRequest): string {
    const xff = req.headers.get('x-forwarded-for')
    if (xff) return xff.split(',')[0].trim()
    try {
        // Some runtimes expose ip on the request object
        return (req as any).ip || 'unknown'
    } catch {
        return 'unknown'
    }
}

export function withRateLimit(
    handler: (req: NextRequest) => Promise<NextResponse>,
    getOptions: (req: NextRequest) => RateLimitOptions
) {
    return async (req: NextRequest) => {
        const opts = getOptions(req)
        const result = rateLimit(opts)
        if (!result.allowed) {
            const retryAfter = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))
            return new NextResponse(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(retryAfter)
                }
            })
        }
        const res = await handler(req)
        res.headers.set('X-RateLimit-Limit', String(getOptions(req).limit))
        res.headers.set('X-RateLimit-Remaining', String(result.remaining))
        res.headers.set('X-RateLimit-Reset', String(result.resetAt))
        return res
    }
}


