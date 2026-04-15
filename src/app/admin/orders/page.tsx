import OrdersAdminPage from "@/components/admin/orders/OrdersAdminPage"
import { Suspense } from "react"

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">Loading…</div>
      }
    >
      <OrdersAdminPage />
    </Suspense>
  )
}
