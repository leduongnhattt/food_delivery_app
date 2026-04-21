import { getServerApiBase, requestJson } from "@/lib/http-client";
import type { EnterpriseOrderListItem } from "@/lib/enterprise-order-buckets";

/** List row from GET /enterprise/orders (includes latest payment fields). */
export type Order = EnterpriseOrderListItem;

export interface EnterpriseOrderDetailCustomer {
  fullName: string | null;
  username: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
}

export interface EnterpriseOrderDetailLine {
  orderDetailId: string;
  foodId: string;
  dishName: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
  imageUrl: string | null;
}

export interface EnterpriseOrderDetailPayment {
  paymentId: string;
  status: string;
  method: string | null;
  paymentDate: string;
  transactionId: string | null;
}

export interface EnterpriseOrderDetail {
  orderId: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  deliveryAddress: string;
  deliveryNote: string;
  estimatedDeliveryTime: string | null;
  deliveredAt: string | null;
  commissionAmount: number | null;
  metadata: unknown;
  customer: EnterpriseOrderDetailCustomer;
  orderDetails: EnterpriseOrderDetailLine[];
  payments: EnterpriseOrderDetailPayment[];
}

export interface OrderFilters {
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
}

export interface OrderManagementService {
  fetchOrders(params?: {
    searchField?: string;
    search?: string;
  }): Promise<Order[]>;
  fetchOrderById(orderId: string): Promise<EnterpriseOrderDetail>;
  updateDeliveryMethod(
    orderId: string,
    deliveryMethod: "SelfDelivery" | "ThirdParty",
  ): Promise<{ success: boolean; orderId: string; deliveryMethod: string }>;
  updateOrderStatus(
    orderId: string,
    status:
      | "Confirmed"
      | "Preparing"
      | "ReadyForPickup"
      | "OutForDelivery"
      | "Delivered"
      | "Cancelled",
  ): Promise<{ success: boolean; orderId: string; status: string; unchanged?: boolean }>;
  deleteOrder(orderId: string): Promise<void>;
  formatCurrency(amount: number): string;
  formatDate(dateString: string): string;
  getStatusColor(status: string): string;
  filterOrders(orders: Order[], filters: OrderFilters): Order[];
  sortOrders(orders: Order[], sortBy: string): Order[];
}

class OrderManagementServiceImpl implements OrderManagementService {
  async fetchOrders(params?: {
    searchField?: string;
    search?: string;
  }): Promise<Order[]> {
    try {
      const base = getServerApiBase();
      const qs = new URLSearchParams();
      qs.set("force", "1");
      const searchField = (params?.searchField ?? "").trim();
      const searchQuery = (params?.search ?? "").trim();
      if (searchField) qs.set("searchField", searchField);
      if (searchQuery) qs.set("search", searchQuery);
      const response = await requestJson<{ orders: Order[] }>(
        `${base}/enterprise/orders?${qs.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      return response.orders || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  async fetchOrderById(orderId: string): Promise<EnterpriseOrderDetail> {
    const base = getServerApiBase();
    const res = await requestJson<{
      success: boolean;
      order: EnterpriseOrderDetail;
    }>(`${base}/enterprise/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res?.order) {
      throw new Error("Order not found");
    }
    return res.order;
  }

  async updateDeliveryMethod(
    orderId: string,
    deliveryMethod: "SelfDelivery" | "ThirdParty",
  ): Promise<{ success: boolean; orderId: string; deliveryMethod: string }> {
    const base = getServerApiBase();
    return requestJson(
      `${base}/enterprise/orders/${encodeURIComponent(orderId)}/delivery-method`,
      {
        method: "PATCH",
        body: JSON.stringify({ deliveryMethod }),
        cache: "no-store",
      },
    );
  }

  async updateOrderStatus(
    orderId: string,
    status:
      | "Confirmed"
      | "Preparing"
      | "ReadyForPickup"
      | "OutForDelivery"
      | "Delivered"
      | "Cancelled",
  ): Promise<{ success: boolean; orderId: string; status: string; unchanged?: boolean }> {
    const base = getServerApiBase();
    return requestJson(`${base}/enterprise/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      cache: "no-store",
    });
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      const base = getServerApiBase();
      await requestJson(`${base}/enterprise/orders/${orderId}`, {
        method: "DELETE",
        cache: "no-store",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  filterOrders(orders: Order[], filters: OrderFilters): Order[] {
    return orders.filter((order) => {
      const matchesSearch =
        order.customerName
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        order.orderDetails.some((d) =>
          d.dishName.toLowerCase().includes(filters.searchTerm.toLowerCase()),
        );
      const matchesStatus =
        filters.statusFilter === "all" ||
        order.status.toLowerCase() === filters.statusFilter.toLowerCase();
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
