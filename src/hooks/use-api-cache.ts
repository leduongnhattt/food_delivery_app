"use client";

import { useState, useEffect, useRef } from "react";
import { apiCache } from "@/lib/api-cache";

interface UseAPICacheOptions {
    key: string;
    fetcher: () => Promise<any>;
    ttl?: number; // Time to live in milliseconds
    enabled?: boolean;
}

export function useAPICache<T>({
    key,
    fetcher,
    ttl = 5 * 60 * 1000, // 5 minutes default
    enabled = true
}: UseAPICacheOptions) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const hasFetched = useRef(false);
    const isFetching = useRef(false);

    useEffect(() => {
        if (!enabled) return;

        const loadData = async () => {
            // Check if we already have valid cached data
            if (apiCache.has(key)) {
                const cachedData = apiCache.get(key);
                setData(cachedData);
                return;
            }

            // Prevent duplicate calls
            if (isFetching.current) return;
            if (hasFetched.current && !apiCache.has(key)) return;

            isFetching.current = true;
            setLoading(true);
            setError(null);

            try {
                const result = await fetcher();
                setData(result);
                apiCache.set(key, result, ttl);
                hasFetched.current = true;
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
                isFetching.current = false;
            }
        };

        loadData();
    }, [key, enabled, ttl, fetcher]);

    const refetch = async () => {
        apiCache.clear(key);
        hasFetched.current = false;
        isFetching.current = false;

        if (enabled) {
            setLoading(true);
            try {
                const result = await fetcher();
                setData(result);
                apiCache.set(key, result, ttl);
                hasFetched.current = true;
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        }
    };

    return { data, loading, error, refetch };
}
