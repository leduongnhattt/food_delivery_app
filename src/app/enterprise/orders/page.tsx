"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/toast-context";
import { orderManagementService, Order } from "@/services/order-management.service";
import { RefreshCw } from "lucide-react";
import { UnifiedOrderRow } from "@/components/orders/UnifiedOrderRow";
import { filterOrders, sortOrders, getOrderStats, type OrderFilters } from "@/lib/order-filters";
import { type Order as UnifiedOrder } from "@/lib/order-utils";
import DeleteOrderPopup from "@/components/enterprise/orders/DeleteOrderPopup";

export default function EnterpriseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const orders = await orderManagementService.fetchOrders();
      setOrders(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeletePopup(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      await orderManagementService.deleteOrder(orderToDelete);
      showToast("Order deleted successfully", "success");
      fetchOrders(); // Refresh the orders list
      setShowDeletePopup(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      showToast("Failed to delete order", "error");
    }
  };

  const cancelDeleteOrder = () => {
    setShowDeletePopup(false);
    setOrderToDelete(null);
  };

  const filters: OrderFilters = {
    searchTerm,
    statusFilter,
    sortBy
  };

  const filteredOrders = filterOrders(orders as UnifiedOrder[], filters);
  const sortedOrders = sortOrders(filteredOrders, sortBy);
  const stats = getOrderStats(sortedOrders);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Order Management
              </h1>
              <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Orders</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-blue-600">${stats.totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
              <option value="customer_name">Customer Name</option>
              <option value="status">Status</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">
                {sortedOrders.length} of {orders.length} orders
              </span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
          <div className="divide-y divide-gray-200">
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <UnifiedOrderRow
                  key={order.id}
                  order={order as UnifiedOrder}
                  variant="enterprise"
                  onDelete={handleDeleteOrder}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Orders will appear here once customers start ordering"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      <DeleteOrderPopup
        isOpen={showDeletePopup}
        onConfirm={confirmDeleteOrder}
        onCancel={cancelDeleteOrder}
      />
    </div>
  );
}
