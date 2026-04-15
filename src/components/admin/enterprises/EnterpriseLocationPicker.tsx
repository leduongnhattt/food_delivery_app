"use client"

import { LocateFixed, MapPinned, Maximize2, Minimize2, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'

type Coordinates = {
  latitude: number | null
  longitude: number | null
}

type Props = {
  address: string
  onAddressChange: (nextAddress: string) => void
  latitude: number | null
  longitude: number | null
  onLocationChange: (coords: Coordinates) => void
  addressError?: string
  locationError?: string
}

const DEFAULT_CENTER = { latitude: 16.0544, longitude: 108.2022 } // Da Nang
const MAP_ZOOM_DEFAULT = 13
const MAP_ZOOM_FOCUSED = 16

function clampPrecision(value: number): number {
  return Number(value.toFixed(7))
}

function parseNominatimNumber(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function EnterpriseLocationPicker({
  address,
  onAddressChange,
  latitude,
  longitude,
  onLocationChange,
  addressError,
  locationError,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markerRef = useRef<Leaflet.CircleMarker | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const onLocationChangeRef = useRef(onLocationChange)
  const onAddressChangeRef = useRef(onAddressChange)
  const applyLocationRef = useRef<((nextLatitude: number, nextLongitude: number, zoom?: number) => void) | null>(null)
  const updateMarkerRef = useRef<((nextLatitude: number, nextLongitude: number) => void) | null>(null)
  const initialCoordinatesRef = useRef<Coordinates>({
    latitude,
    longitude,
  })
  const [mapReady, setMapReady] = useState(false)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [searchMessage, setSearchMessage] = useState<string | null>(null)
  const [expandedMap, setExpandedMap] = useState(false)

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    onAddressChangeRef.current = onAddressChange
  }, [onAddressChange])

  const updateMarker = useCallback((nextLatitude: number, nextLongitude: number) => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L) return

    const latlng: Leaflet.LatLngExpression = [nextLatitude, nextLongitude]
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(latlng, {
        radius: 8,
        color: '#0f766e',
        fillColor: '#14b8a6',
        fillOpacity: 0.85,
        weight: 2,
      }).addTo(map)
      return
    }

    markerRef.current.setLatLng(latlng)
  }, [])

  const applyLocation = useCallback((nextLatitude: number, nextLongitude: number, zoom?: number) => {
    const normalizedLatitude = clampPrecision(nextLatitude)
    const normalizedLongitude = clampPrecision(nextLongitude)
    onLocationChangeRef.current({
      latitude: normalizedLatitude,
      longitude: normalizedLongitude,
    })
    updateMarker(normalizedLatitude, normalizedLongitude)

    const map = mapRef.current
    if (map) {
      map.setView([normalizedLatitude, normalizedLongitude], zoom ?? map.getZoom(), {
        animate: true,
      })
    }
  }, [updateMarker])

  useEffect(() => {
    applyLocationRef.current = applyLocation
  }, [applyLocation])

  useEffect(() => {
    updateMarkerRef.current = updateMarker
  }, [updateMarker])

  useEffect(() => {
    let isDisposed = false

    async function initializeMap() {
      if (!mapContainerRef.current || mapRef.current) return
      const L = await import('leaflet')
      if (isDisposed || !mapContainerRef.current) return

      const initialLatitude = initialCoordinatesRef.current.latitude ?? DEFAULT_CENTER.latitude
      const initialLongitude = initialCoordinatesRef.current.longitude ?? DEFAULT_CENTER.longitude

      leafletRef.current = L
      const map = L.map(mapContainerRef.current, {
        center: [initialLatitude, initialLongitude],
        zoom: MAP_ZOOM_DEFAULT,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      map.on('click', (event: Leaflet.LeafletMouseEvent) => {
        const lat = event.latlng.lat
        const lon = event.latlng.lng
        applyLocationRef.current?.(lat, lon, MAP_ZOOM_FOCUSED)
        setSearchMessage(null)

        void (async () => {
          try {
            const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`
            const response = await fetch(endpoint, { headers: { Accept: 'application/json' } })
            if (!response.ok) return
            const payload = (await response.json()) as { display_name?: string }
            if (payload.display_name) {
              onAddressChangeRef.current(payload.display_name)
            }
          } catch {
            // Keep coordinates; address can be filled manually if reverse fails.
          }
        })()
      })

      mapRef.current = map
      setMapReady(true)

      const initialCoords = initialCoordinatesRef.current
      if (initialCoords.latitude !== null && initialCoords.longitude !== null) {
        updateMarkerRef.current?.(initialCoords.latitude, initialCoords.longitude)
      }
    }

    initializeMap()
    return () => {
      isDisposed = true
      markerRef.current = null
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapReady || latitude === null || longitude === null) return
    updateMarker(latitude, longitude)
  }, [latitude, longitude, mapReady, updateMarker])

  useEffect(() => {
    if (!mapReady) return
    if (latitude !== null && longitude !== null) return
    mapRef.current?.setView([DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude], MAP_ZOOM_DEFAULT, {
      animate: false,
    })
  }, [latitude, longitude, mapReady])

  useEffect(() => {
    if (!mapReady) return
    const timeoutId = window.setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 150)
    return () => window.clearTimeout(timeoutId)
  }, [expandedMap, mapReady])

  useEffect(() => {
    if (!expandedMap) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [expandedMap])

  const searchAddress = useCallback(async () => {
    const trimmedAddress = address.trim()
    if (!trimmedAddress) {
      setSearchMessage('Enter an address before searching.')
      return
    }

    setSearching(true)
    setSearchMessage(null)
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(trimmedAddress)}`
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Location search failed')
      }

      const rows = (await response.json()) as Array<{
        lat?: string
        lon?: string
        display_name?: string
      }>

      if (!rows.length) {
        setSearchMessage('Address not found. Try adding district/city details.')
        return
      }

      const topResult = rows[0]
      const nextLatitude = parseNominatimNumber(topResult.lat)
      const nextLongitude = parseNominatimNumber(topResult.lon)
      if (nextLatitude === null || nextLongitude === null) {
        setSearchMessage('Could not resolve location coordinates.')
        return
      }

      applyLocation(nextLatitude, nextLongitude, MAP_ZOOM_FOCUSED)
      if (topResult.display_name) {
        onAddressChange(topResult.display_name)
      }
      setSearchMessage('Location found. You can click map to fine-tune the pin.')
    } catch {
      setSearchMessage('Unable to search location right now. Please try again.')
    } finally {
      setSearching(false)
    }
  }, [address, applyLocation, onAddressChange])

  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setSearchMessage('Browser does not support geolocation.')
      return
    }

    setLocating(true)
    setSearchMessage(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLatitude = position.coords.latitude
        const nextLongitude = position.coords.longitude
        applyLocation(nextLatitude, nextLongitude, MAP_ZOOM_FOCUSED)

        try {
          const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(nextLatitude))}&lon=${encodeURIComponent(String(nextLongitude))}`
          const response = await fetch(endpoint, {
            headers: { Accept: 'application/json' },
          })
          if (response.ok) {
            const payload = (await response.json()) as { display_name?: string }
            if (payload.display_name) {
              onAddressChange(payload.display_name)
            }
          }
        } catch {
          // Keep coordinates even if reverse-geocoding fails.
        } finally {
          setLocating(false)
        }

        setSearchMessage('Current location selected. Adjust pin if needed.')
      },
      () => {
        setLocating(false)
        setSearchMessage('Location permission denied or unavailable.')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    )
  }, [applyLocation, onAddressChange])

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-teal-600" />
          <p className="text-sm font-semibold text-slate-800">Precise store location</p>
        </div>
        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700">
          Required
        </span>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          className={`h-10 w-full rounded-md border px-3 text-sm ${
            addressError ? 'border-rose-300' : 'border-slate-200'
          } focus:ring-2 focus:ring-cyan-200`}
          placeholder="Search street, ward, city"
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
        />
        <button
          type="button"
          onClick={searchAddress}
          disabled={searching}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {searching ? 'Searching...' : 'Search'}
        </button>
        <button
          type="button"
          onClick={detectCurrentLocation}
          disabled={locating}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-cyan-600 px-3 text-sm font-medium text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          {locating ? 'Locating...' : 'Use GPS'}
        </button>
      </div>

      <div className={expandedMap ? 'fixed inset-0 z-[80] bg-black/55 p-4 sm:p-8' : 'relative'}>
        <div className={expandedMap ? 'mx-auto flex h-full w-full max-w-5xl flex-col rounded-2xl bg-white p-3 shadow-2xl sm:p-4' : 'relative'}>
          <div className={`mb-2 flex items-center justify-between ${expandedMap ? '' : 'absolute left-2 right-2 top-2 z-[81] mb-0'}`}>
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm">
              {expandedMap ? 'Large map mode' : 'Map'}
            </span>
            <button
              type="button"
              onClick={() => setExpandedMap((value) => !value)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {expandedMap ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {expandedMap ? 'Done' : 'Expand'}
            </button>
          </div>

          <div
            ref={mapContainerRef}
            className={expandedMap
              ? 'h-full min-h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100'
              : 'h-52 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-56'}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Latitude</p>
          <p className="text-sm font-medium text-slate-800">
            {latitude === null ? '--' : latitude.toFixed(7)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Longitude</p>
          <p className="text-sm font-medium text-slate-800">
            {longitude === null ? '--' : longitude.toFixed(7)}
          </p>
        </div>
      </div>

      {(addressError || locationError || searchMessage) && (
        <div className="mt-2 text-xs">
          {addressError && <p className="text-rose-600">{addressError}</p>}
          {locationError && <p className="text-rose-600">{locationError}</p>}
          {!addressError && !locationError && searchMessage && (
            <p className="text-slate-600">{searchMessage}</p>
          )}
        </div>
      )}
    </div>
  )
}
