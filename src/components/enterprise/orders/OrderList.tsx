"use client";

import { Search } from "lucide-react";
import { Order } from "@/services/order-management.service";
import OrderRow from "./OrderRow";

interface OrderListProps {
  orders: Order[];
  onDelete: (orderId: string) => void;
  searchTerm: string;
  statusFilter: string;
}

export default function OrderList({ orders, onDelete, searchTerm, statusFilter }: OrderListProps) {
  if (orders.length > 0) {
    return (
      <div className="divide-y divide-gray-200">
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
      <p className="text-gray-500">
        {searchTerm || statusFilter !== "all" 
          ? "Try adjusting your search or filter criteria"
          : "Orders will appear here once customers start ordering"
        }
      </p>
    </div>
  );
}
