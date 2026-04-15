"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/toast-context";
import { TrendingUp, BarChart3, Users, Star } from "lucide-react";
import { EnterprisePageHeader, ENTERPRISE_PANEL_CLASS } from "@/components/enterprise/EnterprisePageHeader";

export default function EnterpriseAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
          <p className="text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Loading analytics…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EnterprisePageHeader
        title="Analytics"
        description="Detailed insights into your business performance"
      />

      <div className={`${ENTERPRISE_PANEL_CLASS} p-8 text-center`}>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
          <BarChart3 className="h-8 w-8 text-sky-700" aria-hidden />
        </div>
        <h2 className="text-[15px] leading-5 font-semibold text-slate-900">Analytics Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-lg text-[13px] leading-[18px] text-slate-600">
          We&apos;re working on comprehensive analytics features including revenue trends, customer insights, and
          performance metrics.
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-sky-700" aria-hidden />
            <h3 className="text-[13px] font-semibold leading-4 text-slate-900">Revenue Trends</h3>
            <p className="mt-1 text-[12px] leading-4 text-slate-600">Track your sales performance</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <Users className="mx-auto mb-2 h-8 w-8 text-sky-700" aria-hidden />
            <h3 className="text-[13px] font-semibold leading-4 text-slate-900">Customer Insights</h3>
            <p className="mt-1 text-[12px] leading-4 text-slate-600">Understand your customers</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <Star className="mx-auto mb-2 h-8 w-8 text-amber-600" aria-hidden />
            <h3 className="text-[13px] font-semibold leading-4 text-slate-900">Performance Metrics</h3>
            <p className="mt-1 text-[12px] leading-4 text-slate-600">Monitor key indicators</p>
          </div>
        </div>
      </div>
    </div>
  );
}
