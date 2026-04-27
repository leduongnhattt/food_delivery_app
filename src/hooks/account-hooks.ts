"use client"

import { useEffect, useRef, useState } from "react"
import { apiCache } from "@/lib/api-cache"
import { buildAuthHeader } from "@/lib/auth-helpers"
import { getServerApiBase } from "@/lib/http"
import { useAuth } from "@/hooks/auth-hooks"
import { CustomerService } from "@/services/customer.service"

interface UseAPICacheOptions {
  key: string
  fetcher: () => Promise<any>
  ttl?: number
  enabled?: boolean
}

export function useAPICache<T>({ key, fetcher, ttl = 5 * 60 * 1000, enabled = true }: UseAPICacheOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const hasFetched = useRef(false)
  const isFetching = useRef(false)

  useEffect(() => {
    if (!enabled) return

    const loadData = async () => {
      if (apiCache.has(key)) {
        const cachedData = apiCache.get(key)
        setData(cachedData)
        return
      }

      if (isFetching.current) return
      if (hasFetched.current && !apiCache.has(key)) return

      isFetching.current = true
      setLoading(true)
      setError(null)

      try {
        const result = await fetcher()
        setData(result)
        apiCache.set(key, result, ttl)
        hasFetched.current = true
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setLoading(false)
        isFetching.current = false
      }
    }

    loadData()
  }, [key, enabled, ttl, fetcher])

  const refetch = async () => {
    apiCache.clear(key)
    hasFetched.current = false
    isFetching.current = false

    if (enabled) {
      setLoading(true)
      try {
        const result = await fetcher()
        setData(result)
        apiCache.set(key, result, ttl)
        hasFetched.current = true
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setLoading(false)
      }
    }
  }

  return { data, loading, error, refetch }
}

export type AccountHeader = {
  username: string | null
  email: string | null
  avatar: string | null
}

export function useAccountHeader(): AccountHeader {
  const { user } = useAuth()
  const [avatar, setAvatar] = useState<string | null>(null)

  const { data: accountData } = useAPICache({
    key: "account-me",
    fetcher: async () => {
      const base = getServerApiBase()
      const res = await fetch(`${base}/auth/profile`, {
        headers: { ...buildAuthHeader() },
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to fetch account data")
      const data = await res.json()
      return { avatar: data?.account?.avatar || data?.account?.Avatar || null }
    },
    ttl: 5 * 60 * 1000,
    enabled: !!user,
  })

  useEffect(() => {
    if (accountData && typeof accountData === "object" && accountData !== null && "avatar" in accountData) {
      setAvatar((accountData as any).avatar as string)
    }
  }, [accountData])

  useEffect(() => {
    const onAvatarUpdated = (e: any) => {
      if (e?.detail?.url) setAvatar(e.detail.url as string)
    }
    window.addEventListener("avatarUpdated", onAvatarUpdated)
    return () => window.removeEventListener("avatarUpdated", onAvatarUpdated)
  }, [])

  return { username: user?.username || null, email: user?.email || null, avatar }
}

export interface ProfileData {
  fullName: string
  email: string
  phone: string
  address: string
  avatar?: string
}

export interface Notification {
  type: "success" | "error"
  message: string
}

export function useProfileData() {
  const { user, isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const emptyProfile: ProfileData = { fullName: "", email: "", phone: "", address: "", avatar: "" }
  const [profileData, setProfileData] = useState<ProfileData>(emptyProfile)
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>(emptyProfile)
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => {
    const loadProfileData = async () => {
      if (!isAuthenticated || !user?.id) return
      try {
        const customer = await CustomerService.getByAccount(user.id)
        if (customer) {
          let avatarUrl = ""
          try {
            const base = getServerApiBase()
            const res = await fetch(`${base}/auth/profile`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` || "" },
              cache: "no-store",
            })
            if (res.ok) {
              const data = await res.json()
              avatarUrl = data?.account?.avatar || data?.account?.Avatar || ""
            }
          } catch {}

          const hydratedProfile: ProfileData = {
            fullName: customer.FullName || "",
            email: (user as any)?.email || "",
            phone: customer.PhoneNumber || "",
            address: customer.Address || "",
            avatar: avatarUrl,
          }
          setProfileData(hydratedProfile)
          setOriginalProfileData({ ...hydratedProfile })
        }
      } catch (error) {
        console.error("Failed to load profile data:", error)
      }
    }

    loadProfileData()
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 3000)
    return () => clearTimeout(timer)
  }, [notification])

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const saveProfile = async () => {
    try {
      const result = await CustomerService.updateSelf({
        fullName: profileData.fullName,
        phone: profileData.phone,
        address: profileData.address,
      })

      if (result.success) {
        setNotification({ type: "success", message: "Profile updated successfully!" })
        setIsEditing(false)
        setOriginalProfileData({ ...profileData })
        return true
      }

      setNotification({ type: "error", message: result.error || "Failed to update profile" })
      return false
    } catch (error) {
      console.error("Failed to update profile:", error)
      setNotification({ type: "error", message: "Failed to update profile" })
      return false
    }
  }

  const clearNotification = () => {
    setNotification(null)
  }

  const resetProfileChanges = () => {
    setProfileData({ ...originalProfileData })
    setIsEditing(false)
  }

  return {
    profileData,
    isEditing,
    notification,
    setIsEditing,
    updateField,
    saveProfile,
    clearNotification,
    resetProfileChanges,
  }
}

export interface DeliveryData {
  phone: string
  address: string
  lat?: number | null
  lng?: number | null
}

export function useDeliveryData() {
  const { user, isAuthenticated } = useAuth()
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    phone: "",
    address: "",
    lat: null,
    lng: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDeliveryData = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const me = await CustomerService.getMe()
        if (me) {
          setDeliveryData({
            phone: normalizePhone(me.phone),
            address: normalizeAddress(me.address),
            lat: me.lat,
            lng: me.lng,
          })
        }
      } catch (error) {
        console.error("Failed to load delivery data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDeliveryData()
  }, [isAuthenticated, user?.id])

  return { deliveryData, isLoading }
}

function normalizePhone(value: string | null | undefined): string {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^0+$/.test(trimmed)) return ""
  if (trimmed.length < 8) return ""
  return trimmed
}

function normalizeAddress(value: string | null | undefined): string {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.toLowerCase() === "default address") return ""
  if (trimmed.length < 5) return ""
  return trimmed
}

