import {
    Clock,
    Package,
    Truck,
    CheckCircle,
    XCircle
} from 'lucide-react'

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

export interface CustomerOrder extends Omit<BaseOrder, 'items'> {
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
        case 'pending':
            return {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: Clock,
                label: 'Pending'
            }
        case 'confirmed':
            return {
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                icon: Package,
                label: 'Confirmed'
            }
        case 'preparing':
            return {
                color: 'bg-orange-100 text-orange-800 border-orange-200',
                icon: Package,
                label: 'Preparing'
            }
        case 'readyforpickup':
            return {
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                icon: Package,
                label: 'Ready for Pickup'
            }
        case 'outfordelivery':
        case 'out_for_delivery':
            return {
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                icon: Truck,
                label: 'Out for Delivery'
            }
        case 'delivered':
            return {
                color: 'bg-green-100 text-green-800 border-green-200',
                icon: CheckCircle,
                label: 'Delivered'
            }
        case 'completed':
            return {
                color: 'bg-green-100 text-green-800 border-green-200',
                icon: CheckCircle,
                label: 'Completed'
            }
        case 'cancelled':
            return {
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: XCircle,
                label: 'Cancelled'
            }
        case 'refunded':
            return {
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: XCircle,
                label: 'Refunded'
            }
        default:
            return {
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: Clock,
                label: status
            }
    }
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount)
}

export function getOrderActions(order: Order) {
    const status = order.status.toLowerCase()

    return {
        canCancel: ['pending', 'confirmed'].includes(status),
        canTrack: ['preparing', 'outfordelivery', 'out_for_delivery'].includes(status),
        canReorder: status === 'delivered' || status === 'completed',
        canViewDetails: true
    }
}

export function isCustomerOrder(order: Order): order is CustomerOrder {
    return 'restaurantName' in order
}

export function isEnterpriseOrder(order: Order): order is EnterpriseOrder {
    return 'customerName' in order
}
