import { getKeyJson, setKeyJson, deleteKey } from './redis';

// Cache keys for orders data
const ORDERS_CACHE_KEYS = {
    ENTERPRISE_ORDERS: (enterpriseId: string) => `enterprise:${enterpriseId}:orders`,
    ENTERPRISE_RECENT_ORDERS: (enterpriseId: string) => `enterprise:${enterpriseId}:recent_orders`,
    ENTERPRISE_STATS: (enterpriseId: string) => `enterprise:${enterpriseId}:stats`,
    ENTERPRISE_REVENUE: (enterpriseId: string) => `enterprise:${enterpriseId}:revenue`,
} as const;

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
    ORDERS: 5 * 60, // 5 minutes
    RECENT_ORDERS: 2 * 60, // 2 minutes
    STATS: 5 * 60, // 5 minutes
    REVENUE: 10 * 60, // 10 minutes
} as const;

export interface CachedOrder {
    id: string;
    customerName: string;
    customerUsername: string | null;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: number;
    deliveryAddress: string;
    phoneNumber: string | null;
    customerAddress: string | null;
    orderDetails: {
        dishName: string;
        quantity: number;
        subTotal: number;
    }[];
}

export interface CachedOrdersData {
    orders: CachedOrder[];
    lastUpdated: string;
    totalCount: number;
}

export interface CachedStatsData {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    completedOrders: number;
    averageRating: number;
    revenueGrowth: number;
    orderGrowth: number;
    lastUpdated: string;
}

export interface CachedRevenueData {
    data: {
        date: string;
        revenue: number;
    }[];
    lastUpdated: string;
}

// Orders Cache Functions
export async function getCachedOrders(enterpriseId: string): Promise<CachedOrdersData | null> {
    const key = ORDERS_CACHE_KEYS.ENTERPRISE_ORDERS(enterpriseId);
    return await getKeyJson<CachedOrdersData>(key);
}

export async function setCachedOrders(enterpriseId: string, ordersData: CachedOrdersData): Promise<void> {
    const key = ORDERS_CACHE_KEYS.ENTERPRISE_ORDERS(enterpriseId);
    await setKeyJson(key, ordersData, CACHE_TTL.ORDERS);
}

export async function getCachedRecentOrders(enterpriseId: string): Promise<CachedOrder[] | null> {
    const key = ORDERS_CACHE_KEYS.ENTERPRISE_RECENT_ORDERS(enterpriseId);
    return await getKeyJson<CachedOrder[]>(key);
}

export async function setCachedRecentOrders(enterpriseId: string, recentOrders: CachedOrder[]): Promise<void> {
    const key = ORDERS_CACHE_KEYS.ENTERPRISE_RECENT_ORDERS(enterpriseId);
    await setKeyJson(key, recentOrders, CACHE_TTL.RECENT_ORDERS);
}

// Stats Cache Functions
export async function getCachedStats(enterpriseId: string): Promise<CachedStatsData | null> {
    const key = ORDERS_CACHE_KEYS.ENTERPRISE_STATS(enterpriseId);
    return await getKeyJson<CachedStatsData>(key);
}

export async function setCachedStats(enterpriseId: string, statsData: CachedStatsData): Promise<void> {
    const key = ORDERS_CACHE_KEYS.ENTERPRISE_STATS(enterpriseId);
    await setKeyJson(key, statsData, CACHE_TTL.STATS);
}

// Revenue Cache Functions
export async function getCachedRevenue(enterpriseId: string): Promise<CachedRevenueData | null> {
    const key = ORDERS_CACHE_KEYS.ENTERPRISE_REVENUE(enterpriseId);
    return await getKeyJson<CachedRevenueData>(key);
}

export async function setCachedRevenue(enterpriseId: string, revenueData: CachedRevenueData): Promise<void> {
    const key = ORDERS_CACHE_KEYS.ENTERPRISE_REVENUE(enterpriseId);
    await setKeyJson(key, revenueData, CACHE_TTL.REVENUE);
}

// Cache Invalidation Functions
export async function invalidateOrdersCache(enterpriseId: string): Promise<void> {
    const ordersKey = ORDERS_CACHE_KEYS.ENTERPRISE_ORDERS(enterpriseId);
    const recentKey = ORDERS_CACHE_KEYS.ENTERPRISE_RECENT_ORDERS(enterpriseId);
    const statsKey = ORDERS_CACHE_KEYS.ENTERPRISE_STATS(enterpriseId);
    const revenueKey = ORDERS_CACHE_KEYS.ENTERPRISE_REVENUE(enterpriseId);

    await Promise.all([
        deleteKey(ordersKey),
        deleteKey(recentKey),
        deleteKey(statsKey),
        deleteKey(revenueKey)
    ]);
}

export async function invalidateSpecificCache(enterpriseId: string, cacheType: 'orders' | 'recent' | 'stats' | 'revenue'): Promise<void> {
    const key = ORDERS_CACHE_KEYS[`ENTERPRISE_${cacheType.toUpperCase()}` as keyof typeof ORDERS_CACHE_KEYS](enterpriseId);
    await deleteKey(key);
}

// Cache Refresh Functions
export async function refreshOrdersCache(enterpriseId: string, newOrders: CachedOrder[]): Promise<void> {
    const ordersData: CachedOrdersData = {
        orders: newOrders,
        lastUpdated: new Date().toISOString(),
        totalCount: newOrders.length
    };

    await setCachedOrders(enterpriseId, ordersData);

    // Also update recent orders (first 10)
    const recentOrders = newOrders.slice(0, 10);
    await setCachedRecentOrders(enterpriseId, recentOrders);
}

export async function refreshStatsCache(enterpriseId: string, newStats: Omit<CachedStatsData, 'lastUpdated'>): Promise<void> {
    const statsData: CachedStatsData = {
        ...newStats,
        lastUpdated: new Date().toISOString()
    };

    await setCachedStats(enterpriseId, statsData);
}

export async function refreshRevenueCache(enterpriseId: string, newRevenueData: { date: string; revenue: number }[]): Promise<void> {
    const revenueData: CachedRevenueData = {
        data: newRevenueData,
        lastUpdated: new Date().toISOString()
    };

    await setCachedRevenue(enterpriseId, revenueData);
}

// Cache Health Check
export async function isCacheValid(enterpriseId: string, cacheType: 'orders' | 'recent' | 'stats' | 'revenue'): Promise<boolean> {
    const key = ORDERS_CACHE_KEYS[`ENTERPRISE_${cacheType.toUpperCase()}` as keyof typeof ORDERS_CACHE_KEYS](enterpriseId);
    const cached = await getKeyJson(key);
    return cached !== null;
}

// Cache Statistics
export async function getCacheStats(enterpriseId: string): Promise<{
    orders: boolean;
    recent: boolean;
    stats: boolean;
    revenue: boolean;
}> {
    const [orders, recent, stats, revenue] = await Promise.all([
        isCacheValid(enterpriseId, 'orders'),
        isCacheValid(enterpriseId, 'recent'),
        isCacheValid(enterpriseId, 'stats'),
        isCacheValid(enterpriseId, 'revenue')
    ]);

    return { orders, recent, stats, revenue };
}
