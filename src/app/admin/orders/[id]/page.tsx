"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminOrderDetail } from "@/services/admin-order.service";
import type { AdminOrderDetail } from "@/types/admin-api.types";
import OrderDetailPage from "@/components/admin/orders/OrderDetailPage";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [data, setData] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminOrderDetail(orderId);
        setData(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) load();
  }, [orderId]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading order...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="text-rose-600 text-sm mb-3">
          {error || "Order not found"}
        </div>
        <button
          onClick={() => router.push("/admin/orders")}
          className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
        >
          ← Back to orders
        </button>
      </div>
    );
  }

  return <OrderDetailPage order={data} />;
}
