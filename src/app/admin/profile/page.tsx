import { Suspense } from "react";
import AdminProfilePage from "@/components/admin/profile/AdminProfilePage";

export default function AdminProfileRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-[13px]">Loading…</div>
      }
    >
      <AdminProfilePage />
    </Suspense>
  );
}
