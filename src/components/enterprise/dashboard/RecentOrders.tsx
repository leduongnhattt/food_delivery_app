"use client";

import { ShoppingCart } from "lucide-react";

interface RecentOrder {
  id: string;
  customerName: string;
  customerUsername?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: number;
  phoneNumber?: string;
  orderDetails: {
    dishName: string;
    quantity: number;
  }[];
}

interface RecentOrdersProps {
  orders: RecentOrder[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300';
      case 'processing':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
        <button 
          onClick={() => window.location.href = '/enterprise/orders'}
          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          View All
        </button>
      </div>
      
      <div className="divide-y divide-gray-200">
        {orders.length > 0 ? (
          orders.slice(0, 3).map((order) => (
            <div key={order.id} className="group relative bg-white rounded-lg border border-gray-200 hover:border-purple-300/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              {/* Single Row Layout */}
              <div className="flex items-center justify-between p-3">
                {/* Left Section - Customer Info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">
                      {order.customerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{order.customerName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                      <span>#{order.id.slice(-6)}</span>
                      <span>•</span>
                      <span>{order.items} items</span>
                      {order.phoneNumber && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">📞 {order.phoneNumber}</span>
                        </>
                      )}
                    </div>
                    {/* Food Items Preview */}
                    {order.orderDetails.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-400">Items:</span>
                        <div className="flex items-center space-x-1">
                          {order.orderDetails.slice(0, 2).map((detail, index) => (
                            <span key={index} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                              {detail.dishName}×{detail.quantity}
                            </span>
                          ))}
                          {order.orderDetails.length > 2 && (
                            <span className="text-xs text-gray-400">+{order.orderDetails.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right Section - Amount & Actions */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent orders found</p>
            <p className="text-sm text-gray-400 mt-2">Orders will appear here once customers start ordering</p>
          </div>
        )}
      </div>
    </div>
  );
}
