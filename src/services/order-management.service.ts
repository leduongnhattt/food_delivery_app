import { apiClient } from "./api";

export interface Order {
    id: string;
    customerName: string;
    customerUsername?: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: number;
    deliveryAddress: string;
    phoneNumber?: string;
    customerAddress?: string;
    orderDetails: {
        dishName: string;
        quantity: number;
        subTotal: number;
    }[];
}

export interface OrderFilters {
    searchTerm: string;
    statusFilter: string;
    sortBy: string;
}

export interface OrderManagementService {
    fetchOrders(): Promise<Order[]>;
    deleteOrder(orderId: string): Promise<void>;
    formatCurrency(amount: number): string;
    formatDate(dateString: string): string;
    getStatusColor(status: string): string;
    filterOrders(orders: Order[], filters: OrderFilters): Order[];
    sortOrders(orders: Order[], sortBy: string): Order[];
}

class OrderManagementServiceImpl implements OrderManagementService {
    async fetchOrders(): Promise<Order[]> {
        try {
            const response = await apiClient.get("/enterprise/orders") as any;
            if (response.success === false) {
                throw new Error(response.error || "Failed to fetch orders");
            }
            return response.orders || [];
        } catch (error) {
            console.error("Error fetching orders:", error);
            throw error;
        }
    }

    async deleteOrder(orderId: string): Promise<void> {
        try {
            const response = await apiClient.delete(`/enterprise/orders/${orderId}`) as any;

            if (response.success === false) {
                throw new Error(response.error || "Failed to delete order");
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            throw error;
        }
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }

    filterOrders(orders: Order[], filters: OrderFilters): Order[] {
        return orders.filter(order => {
            const matchesSearch = order.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                order.id.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesStatus = filters.statusFilter === "all" || order.status.toLowerCase() === filters.statusFilter;
            return matchesSearch && matchesStatus;
        });
    }

    sortOrders(orders: Order[], sortBy: string): Order[] {
        return [...orders].sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "amount_high":
                    return b.totalAmount - a.totalAmount;
                case "amount_low":
                    return a.totalAmount - b.totalAmount;
                default:
                    return 0;
            }
        });
    }
}

export const orderManagementService = new OrderManagementServiceImpl();
