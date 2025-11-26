import Redis from 'ioredis'

// Create a single Redis client instance for the entire app
// REDIS_URL examples:
// - Local Docker: redis://127.0.0.1:6379
// - Upstash/Redis Cloud: rediss://:<password>@<host>:<port>
const redisConnectionUrl = process.env.REDIS_URL

if (!redisConnectionUrl) {
    // Do not throw during build in case env is missing for preview.
    // Consumers should guard their calls if Redis is optional.
    console.warn('[redis] REDIS_URL is not set; Redis features will be disabled')
}

// Primary client instance used across the app
export const redisClient = redisConnectionUrl
    ? new Redis(redisConnectionUrl, {
        // Optional: tune reconnects; defaults are generally fine
        maxRetriesPerRequest: 3,
        enableAutoPipelining: true,
    })
    : (null as unknown as Redis)

// Backward-compatible alias (if some modules import `redis`)
export const redis = redisClient

// --- JSON KV helpers ---

export async function getKeyJson<T>(key: string): Promise<T | null> {
    if (!redisClient) return null
    const raw = await redisClient.get(key)
    if (!raw) return null
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

export async function setKeyJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!redisClient) return
    const payload = JSON.stringify(value)
    if (ttlSeconds && ttlSeconds > 0) {
        await redisClient.set(key, payload, 'EX', ttlSeconds)
    } else {
        await redisClient.set(key, payload)
    }
}

export async function deleteKey(key: string): Promise<void> {
    if (!redisClient) return
    await redisClient.del(key)
}

// Voucher cache helpers
export const VOUCHERS_APPROVED_CACHE_KEY = 'vouchers:approved:list'

export async function invalidateApprovedVouchersCache(): Promise<void> {
    // Best-effort deletion; ignore errors to not break request flow
    try {
        await deleteKey(VOUCHERS_APPROVED_CACHE_KEY)
    } catch {
        // no-op
    }
}

export async function expireKey(key: string, ttlSeconds: number): Promise<void> {
    if (!redisClient) return
    if (ttlSeconds > 0) await redisClient.expire(key, ttlSeconds)
}

// --- JSON Hash helpers ---

export async function getHashFieldJson<T>(hashKey: string, field: string): Promise<T | null> {
    if (!redisClient) return null
    const raw = await redisClient.hget(hashKey, field)
    if (!raw) return null
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

export async function setHashFieldJson(hashKey: string, field: string, value: unknown): Promise<void> {
    if (!redisClient) return
    const payload = JSON.stringify(value)
    await redisClient.hset(hashKey, field, payload)
}

export async function deleteHashField(hashKey: string, field: string): Promise<void> {
    if (!redisClient) return
    await redisClient.hdel(hashKey, field)
}

export async function getAllHashJson<T>(hashKey: string): Promise<Record<string, T>> {
    if (!redisClient) return {}
    const entries = await redisClient.hgetall(hashKey)
    const result: Record<string, T> = {}
    for (const [k, v] of Object.entries(entries)) {
        try {
            result[k] = JSON.parse(v) as T
        } catch {
            // skip malformed
        }
    }
    return result
}

// Utility to safely close the connection in edge cases/tests
export async function closeRedis(): Promise<void> {
    if (!redisClient) return
    try {
        await redisClient.quit()
    } catch {
        await redisClient.disconnect()
    }
}

// Backward-compatible named exports (optional). Remove later if unused.
export const getJson = getKeyJson
export const setJson = setKeyJson
export const delKey = deleteKey
export const expire = expireKey
export const hgetJson = getHashFieldJson
export const hsetJson = setHashFieldJson
export const hdel = deleteHashField
export const hgetAllJson = getAllHashJson


