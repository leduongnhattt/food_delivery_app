import { type Order } from './order-utils'

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
    newest: 'Newest First',
    oldest: 'Oldest First',
    amount_high: 'Amount: High to Low',
    amount_low: 'Amount: Low to High',
    customer_name: 'Customer Name',
    status: 'Status'
}

export const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
]

export const DATE_FILTER_OPTIONS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_30_days', label: 'Last 30 Days' }
]

export function filterOrders(orders: Order[], filters: OrderFilters): Order[] {
    return orders.filter(order => {
        // Search term filter
        const matchesSearch = !filters.searchTerm ||
            order.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            (isCustomerOrder(order) && order.restaurantName.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
            (isEnterpriseOrder(order) && order.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()))

        // Status filter
        const matchesStatus = filters.statusFilter === 'all' ||
            order.status.toLowerCase() === filters.statusFilter.toLowerCase()

        // Date filter
        const matchesDate = !filters.dateFilter || filters.dateFilter === 'all' ||
            matchesDateFilter(order.createdAt, filters.dateFilter)

        // Customer filter (for enterprise)
        const matchesCustomer = !filters.customerFilter ||
            (isEnterpriseOrder(order) && order.customerName.toLowerCase().includes(filters.customerFilter.toLowerCase()))

        return matchesSearch && matchesStatus && matchesDate && matchesCustomer
    })
}

export function sortOrders(orders: Order[], sortBy: string): Order[] {
    return [...orders].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            case 'oldest':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            case 'amount_high':
                return b.totalAmount - a.totalAmount
            case 'amount_low':
                return a.totalAmount - b.totalAmount
            case 'customer_name':
                if (isEnterpriseOrder(a) && isEnterpriseOrder(b)) {
                    return a.customerName.localeCompare(b.customerName)
                }
                return 0
            case 'status':
                return a.status.localeCompare(b.status)
            default:
                return 0
        }
    })
}

export function getOrderStats(orders: Order[]) {
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status.toLowerCase() === 'pending').length,
        confirmed: orders.filter(o => o.status.toLowerCase() === 'confirmed').length,
        preparing: orders.filter(o => o.status.toLowerCase() === 'preparing').length,
        outForDelivery: orders.filter(o => o.status.toLowerCase() === 'out_for_delivery').length,
        delivered: orders.filter(o => o.status.toLowerCase() === 'delivered').length,
        completed: orders.filter(o => o.status.toLowerCase() === 'completed').length,
        cancelled: orders.filter(o => o.status.toLowerCase() === 'cancelled').length,
        refunded: orders.filter(o => o.status.toLowerCase() === 'refunded').length
    }

    return {
        ...stats,
        active: stats.pending + stats.confirmed + stats.preparing + stats.outForDelivery,
        completed: stats.delivered + stats.completed,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0)
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
        case 'today':
            return date >= today
        case 'yesterday':
            return date >= yesterday && date < today
        case 'this_week':
            return date >= thisWeek
        case 'this_month':
            return date >= thisMonth
        case 'last_30_days':
            return date >= last30Days
        default:
            return true
    }
}

// Type guards
function isCustomerOrder(order: Order): order is import('./order-utils').CustomerOrder {
    return 'restaurantName' in order
}

function isEnterpriseOrder(order: Order): order is import('./order-utils').EnterpriseOrder {
    return 'customerName' in order
}

