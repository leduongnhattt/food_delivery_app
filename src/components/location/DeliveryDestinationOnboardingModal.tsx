'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  useDeliveryDestination,
  hasSavedDeliveryDestination,
} from '@/contexts/delivery-destination-context'

function onboardingStorageKey(accountId: string): string {
  return `hanala_delivery_onboarding_v1:${accountId}`
}

function readOnboardingDone(accountId: string): boolean {
  if (typeof window === 'undefined' || !accountId) return false
  try {
    return localStorage.getItem(onboardingStorageKey(accountId)) === '1'
  } catch {
    return false
  }
}

function writeOnboardingDone(accountId: string): void {
  if (typeof window === 'undefined' || !accountId) return
  try {
    localStorage.setItem(onboardingStorageKey(accountId), '1')
  } catch {
  }
}

function canAskGps() {
  return typeof window !== 'undefined' && 'geolocation' in navigator
}

export function DeliveryDestinationOnboardingModal() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { destination, status, update } = useDeliveryDestination()

  const [open, setOpen] = React.useState(false)
  const [addressDraft, setAddressDraft] = React.useState('')
  const [gpsStatus, setGpsStatus] = React.useState<'idle' | 'loading' | 'denied' | 'error' | 'unsupported'>(
    'idle',
  )

  const accountId = user?.id ?? ''

  React.useEffect(() => {
    if (!isAuthenticated || isLoading || !accountId) return
    if (typeof window === 'undefined') return

    if (status !== 'ready') {
      return
    }

    if (readOnboardingDone(accountId)) {
      setOpen(false)
      return
    }

    if (hasSavedDeliveryDestination(destination)) {
      writeOnboardingDone(accountId)
      setOpen(false)
      return
    }

    setAddressDraft(destination?.address ?? '')
    setOpen(true)
  }, [isAuthenticated, isLoading, accountId, status, destination])

  if (!open) return null
  if (!isAuthenticated || !accountId) return null

  const closeSkip = () => {
    writeOnboardingDone(accountId)
    setOpen(false)
  }

  const onUseCurrentLocation = async () => {
    if (!canAskGps()) {
      setGpsStatus('unsupported')
      return
    }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const ok = await update({
          address: addressDraft.trim() || undefined,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        if (ok) {
          writeOnboardingDone(accountId)
          setOpen(false)
          return
        }
        setGpsStatus('error')
      },
      (err) => {
        if (err?.code === 1) setGpsStatus('denied')
        else setGpsStatus('error')
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30_000 },
    )
  }

  const onSaveAddressOnly = async () => {
    const ok = await update({ address: addressDraft.trim() || undefined })
    if (ok) {
      writeOnboardingDone(accountId)
      setOpen(false)
      return
    }
  }

  const showBlockingLoader = status === 'loading'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={closeSkip} />

      <div className="relative w-[min(560px,calc(100vw-2rem))] rounded-2xl bg-white shadow-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-gray-900">Set your delivery location</div>
            <div className="text-sm text-gray-600 mt-1">
              We ask once to estimate delivery time accurately across the app.
            </div>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-gray-500 hover:text-gray-900"
            onClick={closeSkip}
          >
            Skip
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery address</label>
            <input
              value={addressDraft}
              onChange={(e) => setAddressDraft(e.target.value)}
              placeholder="Enter your address (optional but recommended)"
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" className="bg-orange-500 hover:bg-orange-600" onClick={onUseCurrentLocation}>
              Use current location
            </Button>
            <Button type="button" variant="outline" onClick={onSaveAddressOnly}>
              Save address only
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            {gpsStatus === 'unsupported'
              ? 'GPS is not supported on this browser/device.'
              : gpsStatus === 'denied'
                ? 'Location permission denied. You can still save an address.'
                : gpsStatus === 'error'
                  ? 'Failed to save location. Please try again.'
                  : 'You can update this later in Profile.'}
          </div>
        </div>

        {showBlockingLoader ? (
          <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
