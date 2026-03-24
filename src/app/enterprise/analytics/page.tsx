"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/toast-context";
import { 
  TrendingUp, 
  BarChart3,
  Users,
  Star
} from "lucide-react";

export default function EnterpriseAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      // Analytics data will be fetched here
      console.log("Fetching analytics data...");
    } catch (error) {
      console.error("Error fetching analytics:", error);
      showToast("Failed to load analytics", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
                Analytics
              </h1>
              <p className="text-gray-600 mt-1">Detailed insights into your business performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Coming Soon */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-lg text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Coming Soon</h2>
          <p className="text-gray-600 mb-8">
            We're working on comprehensive analytics features including revenue trends, 
            customer insights, and performance metrics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Revenue Trends</h3>
              <p className="text-sm text-gray-600">Track your sales performance</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Customer Insights</h3>
              <p className="text-sm text-gray-600">Understand your customers</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
              <p className="text-sm text-gray-600">Monitor key indicators</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
