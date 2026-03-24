"use client"

import { Button } from '@/components/ui/button'
import type { Order } from '@/services/order.service'

interface OrderDetailsModalProps {
  open: boolean
  loading: boolean
  order: Order | null
  onClose: () => void
}

const statusClasses = (status?: string) => {
  const s = (status || '').toLowerCase()
  if (s.includes('delivered') || s.includes('completed')) return 'bg-green-100 text-green-700 border-green-200'
  if (s.includes('pending') || s.includes('confirmed') || s.includes('preparing')) return 'bg-amber-100 text-amber-700 border-amber-200'
  if (s.includes('out_for_delivery')) return 'bg-blue-100 text-blue-700 border-blue-200'
  if (s.includes('cancel')) return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

export function OrderDetailsModal({ open, loading, order, onClose }: OrderDetailsModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">#</div>
              <div>
                <h3 className="text-xl font-bold text-white">Order Details</h3>
                {order && (
                  <p className="text-white/90 text-sm">{order.restaurantName}</p>
                )}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClasses(order?.status)}`}>
              {order ? order.status.replaceAll('_',' ') : '—'}
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
              Loading details...
            </div>
          ) : order ? (
            <div className="space-y-6 text-sm text-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-500">Order ID</p>
                      <p className="font-medium break-all">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Restaurant</p>
                      <p className="font-medium">{order.restaurantName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-gray-500 mb-1">Delivery Address</p>
                  <p className="font-medium break-words">{order.deliveryAddress}</p>
                  {order.deliveryInstructions && (
                    <p className="text-xs text-gray-500 mt-2">Note: {order.deliveryInstructions}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-gray-700 font-semibold mb-2">Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 bg-gray-50 text-gray-600 text-xs px-4 py-2">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                  </div>
                  {order.items.map((it) => (
                    <div key={it.id} className="grid grid-cols-12 items-center px-4 py-3 border-t">
                      <div className="col-span-6 pr-4">
                        <p className="font-medium">{it.foodName}</p>
                        {it.specialInstructions && (
                          <p className="text-xs text-gray-500 mt-0.5">{it.specialInstructions}</p>
                        )}
                      </div>
                      <div className="col-span-2 text-right">x{it.quantity}</div>
                      <div className="col-span-2 text-right">${it.price.toFixed(2)}</div>
                      <div className="col-span-2 text-right font-medium">${(it.price * it.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-6 px-4 py-3 bg-gray-50 border-t text-sm">
                    <div className="text-gray-600">Total</div>
                    <div className="font-semibold">${order.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No details available.</p>
          )}
        </div>
        <div className="p-4 bg-white border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}


