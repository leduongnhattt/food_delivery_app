import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
} from "lucide-react"

export interface OrderStatusConfig {
  color: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

export interface BaseOrder {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  items: number
}

export interface CustomerOrder extends Omit<BaseOrder, "items"> {
  restaurantName: string
  deliveryAddress: string
  items: Array<{
    foodName: string
    quantity: number
    price: number
  }>
}

export interface EnterpriseOrder extends BaseOrder {
  customerName: string
  customerUsername?: string
  phoneNumber?: string
  customerAddress?: string
  deliveryAddress: string
  orderDetails: Array<{
    dishName: string
    quantity: number
    subTotal: number
  }>
}

export type Order = CustomerOrder | EnterpriseOrder

export function getStatusConfig(status: string): OrderStatusConfig {
  switch (status.toLowerCase()) {
    case "pending":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Pending",
      }
    case "confirmed":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Package,
        label: "Confirmed",
      }
    case "preparing":
      return {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: Package,
        label: "Preparing",
      }
    case "readyforpickup":
      return {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Package,
        label: "Ready for Pickup",
      }
    case "outfordelivery":
    case "out_for_delivery":
      return {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Truck,
        label: "Out for Delivery",
      }
    case "delivered":
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Delivered",
      }
    case "completed":
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Completed",
      }
    case "cancelled":
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        label: "Cancelled",
      }
    case "refunded":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: XCircle,
        label: "Refunded",
      }
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Clock,
        label: status,
      }
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

/** Align with server `POST /cart/from-order` (Delivered | Completed). */
export function canReorderCustomerStatus(status: string): boolean {
  const s = status.toLowerCase()
  return s === "delivered" || s === "completed"
}

export function getOrderActions(order: Order) {
  const status = order.status.toLowerCase()

  return {
    canCancel: ["pending", "confirmed"].includes(status),
    canTrack: ["preparing", "outfordelivery", "out_for_delivery"].includes(status),
    canReorder: canReorderCustomerStatus(status),
    canViewDetails: true,
  }
}

export function isCustomerOrder(order: Order): order is CustomerOrder {
  return "restaurantName" in order
}

export function isEnterpriseOrder(order: Order): order is EnterpriseOrder {
  return "customerName" in order
}

export interface OrderFilters {
  searchTerm: string
  statusFilter: string
  sortBy: string
  dateFilter?: string
  customerFilter?: string
}

export interface OrderSortOptions {
  newest: string
  oldest: string
  amount_high: string
  amount_low: string
  customer_name: string
  status: string
}

export const SORT_OPTIONS: OrderSortOptions = {
  newest: "Newest First",
  oldest: "Oldest First",
  amount_high: "Amount: High to Low",
  amount_low: "Amount: Low to High",
  customer_name: "Customer Name",
  status: "Status",
}

export const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
]

export const DATE_FILTER_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_30_days", label: "Last 30 Days" },
]

export function filterOrders(orders: Order[], filters: OrderFilters): Order[] {
  return orders.filter((order) => {
    const matchesSearch =
      !filters.searchTerm ||
      order.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (isCustomerOrder(order) &&
        order.restaurantName.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
      (isEnterpriseOrder(order) &&
        order.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()))

    const matchesStatus =
      filters.statusFilter === "all" ||
      order.status.toLowerCase() === filters.statusFilter.toLowerCase()

    const matchesDate =
      !filters.dateFilter ||
      filters.dateFilter === "all" ||
      matchesDateFilter(order.createdAt, filters.dateFilter)

    const matchesCustomer =
      !filters.customerFilter ||
      (isEnterpriseOrder(order) &&
        order.customerName.toLowerCase().includes(filters.customerFilter.toLowerCase()))

    return matchesSearch && matchesStatus && matchesDate && matchesCustomer
  })
}

export function sortOrders(orders: Order[], sortBy: string): Order[] {
  return [...orders].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "amount_high":
        return b.totalAmount - a.totalAmount
      case "amount_low":
        return a.totalAmount - b.totalAmount
      case "customer_name":
        if (isEnterpriseOrder(a) && isEnterpriseOrder(b)) {
          return a.customerName.localeCompare(b.customerName)
        }
        return 0
      case "status":
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })
}

export function getOrderStats(orders: Order[]) {
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status.toLowerCase() === "pending").length,
    confirmed: orders.filter((o) => o.status.toLowerCase() === "confirmed").length,
    preparing: orders.filter((o) => o.status.toLowerCase() === "preparing").length,
    outForDelivery: orders.filter((o) => o.status.toLowerCase() === "out_for_delivery").length,
    delivered: orders.filter((o) => o.status.toLowerCase() === "delivered").length,
    completed: orders.filter((o) => o.status.toLowerCase() === "completed").length,
    cancelled: orders.filter((o) => o.status.toLowerCase() === "cancelled").length,
    refunded: orders.filter((o) => o.status.toLowerCase() === "refunded").length,
  }

  return {
    ...stats,
    active: stats.pending + stats.confirmed + stats.preparing + stats.outForDelivery,
    completed: stats.delivered + stats.completed,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
  }
}

function matchesDateFilter(dateString: string, filter: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  switch (filter) {
    case "today":
      return date >= today
    case "yesterday":
      return date >= yesterday && date < today
    case "this_week":
      return date >= thisWeek
    case "this_month":
      return date >= thisMonth
    case "last_30_days":
      return date >= last30Days
    default:
      return true
  }
}

/** Display labels for Prisma OrderStatus values (PascalCase from API). */
export function orderStatusLabel(status: string): string {
  const s = status.trim()
  const map: Record<string, string> = {
    Pending: "Pending",
    Confirmed: "Confirmed",
    Preparing: "Preparing",
    ReadyForPickup: "Ready for pickup",
    OutForDelivery: "Out for delivery",
    Delivered: "Delivered",
    Completed: "Completed",
    Cancelled: "Cancelled",
    Refunded: "Refunded",
  }
  return map[s] || s
}

export function orderStatusBadgeClass(status: string): string {
  const st = status.toLowerCase()
  if (st === "pending") return "bg-amber-100 text-amber-900 border-amber-200"
  if (st === "confirmed") return "bg-blue-100 text-blue-900 border-blue-200"
  if (st === "preparing" || st === "readyforpickup")
    return "bg-indigo-100 text-indigo-900 border-indigo-200"
  if (st === "outfordelivery") return "bg-purple-100 text-purple-900 border-purple-200"
  if (st === "delivered" || st === "completed")
    return "bg-green-100 text-green-900 border-green-200"
  if (st === "cancelled" || st === "refunded")
    return "bg-red-100 text-red-900 border-red-200"
  return "bg-gray-100 text-gray-800 border-gray-200"
}

// ==== order-limit.ts ====

import type { Locale } from "./i18n"

export const ITEM_ORDER_VALUE_LIMIT_USD = 100 // $10M per item (default currency)
export const ITEM_ORDER_VALUE_LIMIT_VND = 1_000_000 // 1M VND per item
export const ITEM_ORDER_VALUE_LIMIT = ITEM_ORDER_VALUE_LIMIT_USD

export const exceedsItemValueLimit = (unitPriceUsd: number, quantity: number): boolean => {
  if (!Number.isFinite(unitPriceUsd) || !Number.isFinite(quantity)) return false
  return unitPriceUsd * quantity > ITEM_ORDER_VALUE_LIMIT_USD
}

export const getOrderLimitLabel = (locale: Locale, formatUsd: (value: number) => string): string => {
  if (locale === "vi") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(ITEM_ORDER_VALUE_LIMIT_VND)
  }

  return formatUsd(ITEM_ORDER_VALUE_LIMIT_USD)
}

// ==== payment-method.ts ====

export const CHECKOUT_PAYMENT_METHOD = {
  Cash: "cash",
  Card: "card",
  Stripe: "stripe",
  VnPay: "vnpay",
} as const

export type CheckoutPaymentMethod =
  (typeof CHECKOUT_PAYMENT_METHOD)[keyof typeof CHECKOUT_PAYMENT_METHOD]

/** Order used in the checkout payment grid (matches previous UX). */
export const CHECKOUT_PAYMENT_METHOD_UI_ORDER: readonly CheckoutPaymentMethod[] = [
  CHECKOUT_PAYMENT_METHOD.Cash,
  CHECKOUT_PAYMENT_METHOD.Card,
  CHECKOUT_PAYMENT_METHOD.Stripe,
  CHECKOUT_PAYMENT_METHOD.VnPay,
]

export function getCheckoutPrimaryButtonLabel(
  method: CheckoutPaymentMethod,
  totalFormatted: string,
): string {
  switch (method) {
    case CHECKOUT_PAYMENT_METHOD.Stripe:
      return `Pay Now — ${totalFormatted}`
    case CHECKOUT_PAYMENT_METHOD.VnPay:
      return `Pay with VNPAY — ${totalFormatted}`
    case CHECKOUT_PAYMENT_METHOD.Cash:
      return `Confirm Order — ${totalFormatted}`
    default:
      return `Proceed to Payment — ${totalFormatted}`
  }
}

