"use client";

import { useEffect, useState } from "react";
import { buildAuthHeader } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/use-auth";
import { useAPICache } from "@/hooks/use-api-cache";

export type AccountHeader = {
    username: string | null;
    email: string | null;
    avatar: string | null;
};

export function useAccountHeader(): AccountHeader {
    const { user } = useAuth();
    const [avatar, setAvatar] = useState<string | null>(null);

    const { data: accountData } = useAPICache({
        key: 'account-me',
        fetcher: async () => {
            const res = await fetch("/api/account/me", {
                headers: { ...buildAuthHeader() },
                cache: "no-store"
            });
            if (!res.ok) throw new Error('Failed to fetch account data');
            return await res.json();
        },
        ttl: 5 * 60 * 1000, // 5 minutes
        enabled: !!user
    });

    useEffect(() => {
        if (accountData && typeof accountData === 'object' && accountData !== null && 'avatar' in accountData) {
            setAvatar((accountData as any).avatar as string);
        }
    }, [accountData]);

    useEffect(() => {
        const onAvatarUpdated = (e: any) => {
            if (e?.detail?.url) setAvatar(e.detail.url as string);
        };
        window.addEventListener("avatarUpdated", onAvatarUpdated);

        return () => {
            window.removeEventListener("avatarUpdated", onAvatarUpdated);
        };
    }, []);

    return {
        username: user?.username || null,
        email: user?.email || null,
        avatar,
    };
}


