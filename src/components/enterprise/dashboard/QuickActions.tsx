"use client";

import { TrendingUp, ShoppingCart, Star } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <button 
        onClick={() => window.location.href = '/enterprise/analytics'}
        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <TrendingUp className="h-5 w-5" />
        <span>View Analytics</span>
      </button>
      <button 
        onClick={() => window.location.href = '/enterprise/orders'}
        className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <ShoppingCart className="h-5 w-5" />
        <span>Manage Orders</span>
      </button>
      <button 
        onClick={() => window.location.href = '/enterprise/reviews'}
        className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-4 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <Star className="h-5 w-5" />
        <span>View Reviews</span>
      </button>
    </div>
  );
}
