'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/auth-hooks'
import { CustomerService, type CustomerMe } from '@/services/customer.service'

export type DeliveryDestination = {
  address: string
  lat: number | null
  lng: number | null
}

type DeliveryDestinationState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  destination: DeliveryDestination | null
  refresh: () => Promise<void>
  update: (params: { address?: string; lat?: number; lng?: number }) => Promise<boolean>
}

const DeliveryDestinationContext = React.createContext<DeliveryDestinationState | null>(null)

export function normalizeDeliveryAddress(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.toLowerCase() === 'default address') return ''
  if (trimmed.length < 5) return ''
  return trimmed
}

/** True if customer has coords or a usable address for ETA (matches onboarding “done”). */
export function hasSavedDeliveryDestination(d: DeliveryDestination | null | undefined): boolean {
  if (!d) return false
  const latOk = d.lat != null && Number.isFinite(d.lat)
  const lngOk = d.lng != null && Number.isFinite(d.lng)
  if (latOk && lngOk) return true
  return normalizeDeliveryAddress(d.address).length > 0
}

export function DeliveryDestinationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [status, setStatus] = React.useState<DeliveryDestinationState['status']>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [destination, setDestination] = React.useState<DeliveryDestination | null>(null)

  const refresh = React.useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setDestination(null)
      setStatus('idle')
      setError(null)
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const me: CustomerMe | null = await CustomerService.getMe()
      if (!me) {
        setDestination(null)
        setStatus('ready')
        return
      }
      setDestination({
        address: normalizeDeliveryAddress(me.address),
        lat: me.lat,
        lng: me.lng,
      })
      setStatus('ready')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Failed to load destination')
    }
  }, [isAuthenticated, user?.id])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const update = React.useCallback(
    async (params: { address?: string; lat?: number; lng?: number }) => {
      if (!isAuthenticated) return false
      const res = await CustomerService.updateSelf({
        address: params.address,
        ...(Number.isFinite(params.lat) && Number.isFinite(params.lng)
          ? { lat: params.lat, lng: params.lng }
          : {}),
      })
      if (!res.success) return false
      await refresh()
      return true
    },
    [isAuthenticated, refresh],
  )

  const value: DeliveryDestinationState = React.useMemo(
    () => ({ status, error, destination, refresh, update }),
    [status, error, destination, refresh, update],
  )

  return <DeliveryDestinationContext.Provider value={value}>{children}</DeliveryDestinationContext.Provider>
}

export function useDeliveryDestination(): DeliveryDestinationState {
  const ctx = React.useContext(DeliveryDestinationContext)
  if (!ctx) {
    throw new Error('useDeliveryDestination must be used within DeliveryDestinationProvider')
  }
  return ctx
}

