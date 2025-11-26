"use client";

import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  averageRating: number;
  revenueGrowth: number;
  orderGrowth: number;
}

interface StatsCardsProps {
  stats: DashboardStats | null;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatCurrency(stats.totalRevenue) : '₫0'}
              </p>
              <div className="flex items-center mt-2">
                {stats?.revenueGrowth && stats.revenueGrowth > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stats?.revenueGrowth && stats.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats?.revenueGrowth ? `${Math.abs(stats.revenueGrowth)}%` : '0%'} from last month
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalOrders || 0}
              </p>
              <div className="flex items-center mt-2">
                {stats?.orderGrowth && stats.orderGrowth > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stats?.orderGrowth && stats.orderGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats?.orderGrowth ? `${Math.abs(stats.orderGrowth)}%` : '0%'} from last month
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalCustomers || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">Active customers</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
              </p>
              <div className="flex items-center mt-2">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm text-gray-500">out of 5.0</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
              <Star className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats?.pendingOrders || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed Orders</p>
              <p className="text-xl font-bold text-green-600">
                {stats?.completedOrders || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Products</p>
              <p className="text-xl font-bold text-blue-600">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>
    </>
  );
}
