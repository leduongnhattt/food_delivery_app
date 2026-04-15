"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/contexts/toast-context";
import { Activity } from "lucide-react";
import StatsCards from "@/components/enterprise/dashboard/StatsCards";
import RecentOrders from "@/components/enterprise/dashboard/RecentOrders";
import QuickActions from "@/components/enterprise/dashboard/QuickActions";
import { getServerApiBase } from "@/lib/http-client";
import { buildAuthHeader } from "@/lib/auth-helpers";
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader";

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

      const base = getServerApiBase();
      const statsRes = await fetch(`${base}/enterprise/dashboard/stats`, {
        headers: { ...buildAuthHeader() },
        cache: "no-store",
      });
      if (!statsRes.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      const statsResponse = await statsRes.json();
      setStats(statsResponse);

      const ordersRes = await fetch(`${base}/enterprise/orders/recent`, {
        headers: { ...buildAuthHeader() },
        cache: "no-store",
      });
      if (!ordersRes.ok) {
        throw new Error("Failed to fetch recent orders");
      }
      const ordersResponse = await ordersRes.json();
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
          <p className="text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EnterprisePageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your business."
        actions={
          <button
            type="button"
            onClick={fetchDashboardData}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 shadow-sm hover:bg-slate-50"
          >
            <Activity className="h-4 w-4 text-slate-600" />
            Refresh
          </button>
        }
      />

      <StatsCards stats={stats} />
      <RecentOrders orders={recentOrders} />
      <QuickActions />
    </div>
  );
}
