"use client";

import { MapPin, Trash2 } from "lucide-react";
import { Order } from "@/services/order-management.service";
import { orderManagementService } from "@/services/order-management.service";

interface OrderRowProps {
  order: Order;
  onDelete: (orderId: string) => void;
}

export default function OrderRow({ order, onDelete }: OrderRowProps) {
  const displayAddress = order.deliveryAddress || order.customerAddress;

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 hover:border-purple-300/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
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
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${orderManagementService.getStatusColor(order.status)}`}>
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
            {displayAddress && (
              <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                <span className="truncate" title={displayAddress}>
                  {displayAddress}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Section - Amount & Actions */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">{orderManagementService.formatCurrency(order.totalAmount)}</div>
            <div className="text-xs text-gray-500">{orderManagementService.formatDate(order.createdAt)}</div>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => onDelete(order.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
              title="Delete Order"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
