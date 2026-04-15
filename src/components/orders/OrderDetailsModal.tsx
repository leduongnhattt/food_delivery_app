"use client"

import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order } from '@/services/order.service'
import { ChevronDown, ChevronUp, MapPin, Phone } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface OrderDetailsModalProps {
  open: boolean
  loading: boolean
  order: Order | null
  onClose: () => void
}

const statusBadgeClasses = (status?: string) => {
  switch (status) {
    case 'delivered':
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'out_for_delivery':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'refunded':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'pending':
    case 'confirmed':
    case 'preparing':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

const statusTitle = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'Your order is pending'
    case 'confirmed':
      return 'Your order is confirmed'
    case 'preparing':
      return 'Your order is being prepared'
    case 'out_for_delivery':
      return 'Your order is on the way'
    case 'delivered':
      return 'Your order is delivered'
    case 'completed':
      return 'Your order is completed'
    case 'cancelled':
      return 'Your order is cancelled'
    case 'refunded':
      return 'Return / refund in progress'
    default:
      return 'Order details'
  }
}

const fmtStatus = (s?: string) => (s ? s.replaceAll('_', ' ') : '—')

const formatPhoneVN = (raw?: string | null) => {
  const input = (raw || '').trim()
  if (!input) return null
  if (input.startsWith('+')) return input
  const digits = input.replace(/\D/g, '')
  if (!digits) return input
  if (digits.startsWith('84')) return `+${digits}`
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`
  return input
}

export function OrderDetailsModal({ open, loading, order, onClose }: OrderDetailsModalProps) {
  const [mounted, setMounted] = useState(open)
  const [animateIn, setAnimateIn] = useState(false)

  const [copied, setCopied] = useState(false)
  const [metaExpanded, setMetaExpanded] = useState(false)
  useEffect(() => {
    if (open) {
      setMounted(true)
      // next frame to ensure transitions apply
      window.requestAnimationFrame(() => setAnimateIn(true))
      setCopied(false)
      setMetaExpanded(false)
      return
    }

    setAnimateIn(false)
    // Match exit transition duration to avoid abrupt unmount.
    const t = window.setTimeout(() => setMounted(false), 320)
    return () => window.clearTimeout(t)
  }, [open])

  if (!mounted) return null

  const copyOrderId = async () => {
    if (!order?.id) return
    try {
      await navigator.clipboard.writeText(order.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // no-op; clipboard might be blocked in some environments
    }
  }

  return (
    <div
      className={[
        "fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/35 backdrop-blur-[2px]",
        "transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        animateIn ? "opacity-100" : "opacity-0",
      ].join(" ")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={[
          "bg-white rounded-2xl w-full max-w-[640px] shadow-xl overflow-hidden max-h-[90vh] flex flex-col",
          "transform-gpu will-change-transform",
          "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          // Softer “sheet” entrance: fade + longer slide
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")}
      >
        <div className="bg-orange-600 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{statusTitle(order?.status)}</div>
              <div className="text-xs text-white/90 truncate">
                {order?.restaurantName || '—'}
              </div>
            </div>
            <div className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusBadgeClasses(order?.status)}`}>
              {fmtStatus(order?.status)}
            </div>
          </div>
        </div>

        <div className="p-4 overflow-auto">
          {loading ? (
            <div className="flex items-center gap-3 text-gray-600 text-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600" />
              Loading order details...
            </div>
          ) : order ? (
            <div className="space-y-3 text-sm text-gray-900">
              {/* Shipping information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold">Shipping Information</div>
                  <div className="text-xs text-gray-500">Standard delivery</div>
                </div>
              </div>

              {/* Delivery information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold">Delivery Information</div>

                  {(order.recipientName || order.recipientPhone) ? (
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-700">
                      {order.recipientName ? (
                        <span className="font-medium text-gray-900">{order.recipientName}</span>
                      ) : null}
                      {order.recipientPhone ? (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <Phone className="h-3.5 w-3.5" aria-hidden />
                          {formatPhoneVN(order.recipientPhone) ?? order.recipientPhone}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-1 flex items-start gap-2 text-xs text-gray-500">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-[1px]" aria-hidden />
                    <div className="break-words">{order.deliveryAddress}</div>
                  </div>
                  {order.deliveryInstructions ? (
                    <div className="text-xs text-gray-500 mt-1">Note: {order.deliveryInstructions}</div>
                  ) : null}
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {order.restaurantAvatarUrl ? (
                      <Image
                        src={order.restaurantAvatarUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover border border-gray-200 bg-gray-100"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-semibold">
                        {(order.restaurantName || 'R').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{order.restaurantName}</div>
                      <div className="text-xs text-gray-500">{order.items.length} item(s)</div>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {order.items.map((it) => (
                    <div key={it.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden">
                          {it.imageUrl ? (
                            <Image
                              src={it.imageUrl}
                              alt=""
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{it.foodName}</div>
                          {it.specialInstructions ? (
                            <div className="text-xs text-gray-500 mt-0.5 break-words line-clamp-2">
                              {it.specialInstructions}
                            </div>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-xs font-medium text-gray-900">x{it.quantity}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{formatPrice(it.price)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-700">Order Total</div>
                  <div className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</div>
                </div>
              </div>

              {/* Order meta */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">Order ID</div>
                    <div className="text-xs text-gray-500 truncate">{order.id}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyOrderId}
                    className="h-6 px-2 bg-white text-[11px] leading-none"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>

                <div className="px-4 py-3 text-xs text-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-500">Paid by</div>
                    <div className="font-medium text-gray-900">{order.paymentMethod || '—'}</div>
                  </div>

                  <div
                    className={[
                      "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                      metaExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between">
                          <div className="text-gray-500">Order Time</div>
                          <div className="font-medium text-gray-900">{formatDate(order.createdAt)}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-gray-500">Payment Time</div>
                          <div className="font-medium text-gray-900">{formatDate(order.updatedAt || order.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMetaExpanded(v => !v)}
                  className="w-full px-4 py-3 border-t border-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  {metaExpanded ? (
                    <>
                      View Less <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                    </>
                  ) : (
                    <>
                      View More <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No details available.</p>
          )}
        </div>
        <div className="p-4 bg-white border-t flex justify-end">
          <Button variant="outline" onClick={onClose} className="h-8 px-4 text-sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}


