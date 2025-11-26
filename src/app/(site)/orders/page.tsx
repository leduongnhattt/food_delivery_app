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
import { useEffect, useState } from 'react'
import { useToast } from '@/contexts/toast-context'
import { OrderService } from '@/services/order.service'
import type { Order } from '@/services/order.service'
import { useRouter } from 'next/navigation'
import { addItemToCart } from '@/services/cart.service'
import { ConfirmCancelModal } from '@/components/orders/ConfirmCancelModal'
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal'

export default function OrdersPage() {
  const router = useRouter()
  const { orders, loading, error, hasMore, loadMore, refreshOrders, filterOrders } = useOrders()
  const [filters, setFilters] = useState<OrderFiltersType>({})
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const handleViewDetails = async (orderId: string) => {
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
    router.push(`/orders/${orderId}/track`)
  }

  const handleCancel = (orderId: string) => {
    setPendingCancelId(orderId)
    setConfirmOpen(true)
  }

  const confirmCancel = async () => {
    if (!pendingCancelId) return
    setSubmitting(true)
    try {
      const result = await OrderService.cancelOrder(pendingCancelId)
      if ((result as any)?.success) {
        showToast('Order cancelled successfully', 'success', 3000)
        await refreshOrders()
      } else {
        showToast((result as any)?.error || 'Failed to cancel order', 'error', 4000)
      }
    } catch (error) {
      console.error('Failed to cancel order', error)
      showToast('Failed to cancel order', 'error', 4000)
    } finally {
      setSubmitting(false)
      setConfirmOpen(false)
      setPendingCancelId(null)
    }
  }

  const handleFilterChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters)
    filterOrders(newFilters)
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

  // Auto-refresh when there are in-progress orders
  useEffect(() => {
    const inProgressStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery']
    const hasInProgress = orders.some(o => inProgressStatuses.includes(o.status))
    if (!hasInProgress) return

    const onFocus = () => refreshOrders()
    window.addEventListener('focus', onFocus)

    const intervalId = window.setInterval(() => {
      refreshOrders()
    }, 15000)

    return () => {
      window.removeEventListener('focus', onFocus)
      window.clearInterval(intervalId)
    }
  }, [orders, refreshOrders])

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
            <Button onClick={refreshOrders} className="flex items-center space-x-2">
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
              onClick={refreshOrders}
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
              <Package className="w-12 h-12 text-gray-400" />
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
                    {orders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        onViewDetails={handleViewDetails}
                        onReorder={handleReorder}
                        onTrack={handleTrack}
                        onCancel={handleCancel}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={handleViewDetails}
                  onReorder={handleReorder}
                  onTrack={handleTrack}
                  onCancel={handleCancel}
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
      <OrderDetailsModal open={detailsOpen} loading={detailLoading} order={selectedOrder} onClose={() => setDetailsOpen(false)} />
    </div>
  )
}
