"use client"

import { useOrders } from '@/hooks/use-orders'
import { OrderRow, OrderCard } from '@/components/orders/order-row'
import { OrderFilters } from '@/components/orders/order-filters'
import { OrderFilters as OrderFiltersType } from '@/services/order.service'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  RefreshCw, 
  AlertCircle, 
  ShoppingBag,
  Clock,
  CheckCircle
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/contexts/toast-context'
import { OrderService } from '@/services/order.service'
import type { Order } from '@/services/order.service'
import { useRouter } from 'next/navigation'
import { addItemToCart } from '@/services/cart.service'
import { ConfirmCancelModal } from '@/components/orders/ConfirmCancelModal'
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal'
import { ReturnRequestModal } from '@/components/orders/ReturnRequestModal'

export default function OrdersPage() {
  const router = useRouter()
  const { orders, loading, error, hasMore, loadMore, refreshOrders, filterOrders } = useOrders()
  const [filters, setFilters] = useState<OrderFiltersType>({})
  const [pageSize, setPageSize] = useState<12 | 24 | 48>(12)
  const [page, setPage] = useState(1)
  const pagerRef = useRef<HTMLDivElement | null>(null)
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnLoading, setReturnLoading] = useState(false)
  const [returnOrder, setReturnOrder] = useState<Order | null>(null)

  const handleViewDetails = async (orderId: string) => {
    // Restore existing modal UX; keep full page route as optional fallback.
    setDetailsOpen(true)
    setDetailLoading(true)
    setSelectedOrder(null)
    try {
      const order = await OrderService.getOrderById(orderId)
      setSelectedOrder(order as Order)
    } catch (error) {
      console.error('Failed to load order details', error)
      showToast('Failed to load order details', 'error', 4000)
      setDetailsOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReorder = async (orderId: string) => {
    try {
      setSubmitting(true)
      const order = await OrderService.getOrderById(orderId)
      const items = (order as Order).items || []
      for (const it of items) {
        await addItemToCart({ foodId: it.foodId, quantity: it.quantity })
      }
      showToast('Items added to cart. Redirecting to checkout...', 'success', 2500)
      router.push('/checkout')
    } catch (error) {
      console.error('Failed to reorder items', error)
      showToast('Failed to reorder items', 'error', 4000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTrack = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  const handleCancel = (orderId: string) => {
    setPendingCancelId(orderId)
    setConfirmOpen(true)
  }

  const handleRequestRefund = (orderId: string) => {
    setReturnOpen(true)
    setReturnLoading(true)
    setReturnOrder(null)
    ;(async () => {
      try {
        const order = await OrderService.getOrderById(orderId)
        setReturnOrder(order as Order)
      } catch (error) {
        console.error('Failed to load order for return request', error)
        showToast('Failed to load order details for return', 'error', 4000)
        setReturnOpen(false)
      } finally {
        setReturnLoading(false)
      }
    })()
  }

  const confirmCancel = async () => {
    if (!pendingCancelId) return
    setSubmitting(true)
    try {
      const result = await OrderService.cancelOrder(pendingCancelId)
      if ((result as any)?.success) {
        showToast('Order cancelled successfully', 'success', 3000)
        await refreshOrders({ force: true })
      } else {
        showToast((result as any)?.error || 'Failed to cancel order', 'error', 4000)
      }
    } catch (error) {
      console.error('Failed to cancel order', error)
      const message = error instanceof Error ? error.message : 'Failed to cancel order'
      showToast(message, 'error', 4000)
    } finally {
      setSubmitting(false)
      setConfirmOpen(false)
      setPendingCancelId(null)
    }
  }

  const handleFilterChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters)
    filterOrders(newFilters)
    setPage(1)
  }

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    }
    return stats
  }

  const stats = getOrderStats()

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(orders.length / pageSize)),
    [orders.length, pageSize],
  )

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return orders.slice(start, start + pageSize)
  }, [orders, page, pageSize])

  const scrollPagerIntoView = () => {
    if (typeof window === 'undefined') return
    window.requestAnimationFrame(() => {
      pagerRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    })
  }

  // Auto-refresh when there are in-progress orders
  useEffect(() => {
    const inProgressStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery']
    const hasInProgress = orders.some(o => inProgressStatuses.includes(o.status))
    if (!hasInProgress) return

    const onFocus = () => {
      void refreshOrders({ force: true })
    }
    window.addEventListener('focus', onFocus)

    const intervalId = window.setInterval(() => {
      void refreshOrders({ force: true })
    }, 2000)

    return () => {
      window.removeEventListener('focus', onFocus)
      window.clearInterval(intervalId)
    }
  }, [orders, refreshOrders])

  // Keep the details modal updated while it is open.
  useEffect(() => {
    if (!detailsOpen) return
    if (!selectedOrder?.id) return
    const watchStatuses: Array<Order['status']> = ['pending', 'confirmed', 'preparing', 'out_for_delivery']
    if (!watchStatuses.includes(selectedOrder.status)) return

    let cancelled = false
    const tick = async () => {
      try {
        const latest = await OrderService.getOrderById(selectedOrder.id)
        if (!cancelled) setSelectedOrder(latest as Order)
      } catch {
        // keep modal open; next tick may succeed
      }
    }

    void tick()
    const id = window.setInterval(() => void tick(), 2000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [detailsOpen, selectedOrder?.id, selectedOrder?.status])

  // Handle authentication errors
  if (error && error.includes('sign in')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex space-x-4">
              <Button onClick={() => router.push('/signin')} className="bg-orange-600 hover:bg-orange-700">
                Sign In
              </Button>
              <Button onClick={() => router.push('/')} variant="outline">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => {
                void refreshOrders({ force: true })
              }}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">
                Track your order history and current orders
              </p>
            </div>
            <Button
              onClick={() => {
                void refreshOrders({ force: true })
              }}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-600">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.delivered}</p>
                <p className="text-xs text-gray-600">Delivered</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.cancelled}</p>
                <p className="text-xs text-gray-600">Cancelled</p>
              </div>
            </div>
          </div>
        </div>


        {/* Filters */}
        <OrderFilters
          onFilterChange={handleFilterChange}
          currentFilters={filters}
        />

        {/* Orders List */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600 mb-6">
              {Object.keys(filters).length > 0 
                ? "No orders match your current filters. Try adjusting your search criteria."
                : "You haven't placed any orders yet. Start by exploring our restaurants!"
              }
            </p>
            {Object.keys(filters).length > 0 ? (
              <Button onClick={() => handleFilterChange({})} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => router.push('/restaurants')}>
                Browse Restaurants
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedOrders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        onViewDetails={handleViewDetails}
                        onReorder={handleReorder}
                        onTrack={handleTrack}
                        onCancel={handleCancel}
                        onRequestRefund={handleRequestRefund}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination (inside table container) */}
              {orders.length > pageSize && (
                <div
                  ref={pagerRef}
                  className="flex items-center justify-end gap-2 bg-white px-4 py-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1))
                      scrollPagerIntoView()
                    }}
                    disabled={page <= 1}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded border text-sm ${
                      page <= 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>

                  <div className="text-xs tabular-nums text-gray-700">
                    {page} / {totalPages}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1))
                      scrollPagerIntoView()
                    }}
                    disabled={page >= totalPages}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded border text-sm ${
                      page >= totalPages
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label="Next page"
                  >
                    ›
                  </button>

                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value) as 12 | 24 | 48)
                      setPage(1)
                      scrollPagerIntoView()
                    }}
                    className="h-7 rounded border border-gray-300 bg-white px-2 text-xs text-gray-900"
                    aria-label="Rows per page"
                  >
                    <option value={12}>12 / page</option>
                    <option value={24}>24 / page</option>
                    <option value={48}>48 / page</option>
                  </select>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {pagedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={handleViewDetails}
                  onReorder={handleReorder}
                  onTrack={handleTrack}
                  onCancel={handleCancel}
                  onRequestRefund={handleRequestRefund}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  className="px-8 py-3"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Load More Orders'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmCancelModal open={confirmOpen} submitting={submitting} onClose={() => { setConfirmOpen(false); setPendingCancelId(null) }} onConfirm={confirmCancel} />
      <OrderDetailsModal
        open={detailsOpen}
        loading={detailLoading}
        order={selectedOrder}
        onClose={() => setDetailsOpen(false)}
      />
      <ReturnRequestModal
        open={returnOpen}
        order={returnOrder}
        onClose={() => {
          if (returnLoading) return
          setReturnOpen(false)
          setReturnOrder(null)
        }}
        onSubmitted={async () => {
          showToast('Return request submitted', 'success', 3000)
          await refreshOrders({ force: true })
        }}
      />
    </div>
  )
}
