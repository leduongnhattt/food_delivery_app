"use client";

import { useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { EnterprisePageHeader, ENTERPRISE_PANEL_CLASS } from "@/components/enterprise/EnterprisePageHeader";

export default function EnterpriseBankAccountsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 150);
    return () => window.clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
          <p className="text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Loading bank accounts…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EnterprisePageHeader
        title="Bank Accounts"
        description="Manage payout bank accounts for your shop"
      />

      <div className={`${ENTERPRISE_PANEL_CLASS} p-8 text-center`}>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
          <Landmark className="h-8 w-8 text-sky-700" aria-hidden />
        </div>
        <h2 className="text-[15px] leading-5 font-semibold text-slate-900">Bank Accounts Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-[18px] text-slate-600">
          This section will let you add and verify bank accounts, choose a default payout account, and view payout
          history.
        </p>
      </div>
    </div>
  );
}
