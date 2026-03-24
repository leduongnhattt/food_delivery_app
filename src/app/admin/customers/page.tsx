import { Suspense } from "react"
import CustomersAdminPage from "@/components/admin/CustomersAdminPage"

export default function AdminCustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">Loading…</div>
      }
    >
      <CustomersAdminPage />
    </Suspense>
  )
}
