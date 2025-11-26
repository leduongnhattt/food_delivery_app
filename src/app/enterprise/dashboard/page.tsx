"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/contexts/toast-context";
import { apiClient } from "@/services/api";
import { Activity } from "lucide-react";
import StatsCards from "@/components/enterprise/dashboard/StatsCards";
import RecentOrders from "@/components/enterprise/dashboard/RecentOrders";
import QuickActions from "@/components/enterprise/dashboard/QuickActions";

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

export default function EnterpriseDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const hasFetched = useRef(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const statsResponse = await apiClient.get("/enterprise/dashboard/stats") as any;
      if (statsResponse.success === false) {
        throw new Error(statsResponse.error || "Failed to fetch dashboard stats");
      }
      setStats(statsResponse);

      // Fetch recent orders
      const ordersResponse = await apiClient.get("/enterprise/orders/recent") as any;
      if (ordersResponse.success === false) {
        throw new Error(ordersResponse.error || "Failed to fetch recent orders");
      }
      setRecentOrders(ordersResponse.orders || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDashboardData();
    }
  }, [fetchDashboardData]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Activity className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Recent Orders */}
        <RecentOrders orders={recentOrders} />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}