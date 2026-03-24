"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Lock, Unlock } from "lucide-react"
import TabsCustomers from "@/components/admin/TabsCustomers"
import CustomerSearch from "@/components/admin/CustomerSearch"
import {
  listAdminCustomers,
  lockAdminCustomer,
  unlockAdminCustomer,
} from "@/services/admin.service"
import type { AdminCustomerListItem } from "@/types/admin-api.types"

export default function CustomersAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get("status") || "all") as
    | "all"
    | "active"
    | "locked"
  const search = searchParams.get("search")?.trim() || ""

  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminCustomers({
        status: tab,
        search,
        limit: 50,
      })
      setCustomers(res.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers")
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => {
    void load()
  }, [load])

  async function onLock(customerId: string) {
    setPendingId(customerId)
    try {
      await lockAdminCustomer(customerId)
      router.push("/admin/customers?status=locked")
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lock failed")
    } finally {
      setPendingId(null)
    }
  }

  async function onUnlock(customerId: string) {
    setPendingId(customerId)
    try {
      await unlockAdminCustomer(customerId)
      router.push("/admin/customers?status=active")
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unlock failed")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Customers
          </h1>
          <p className="text-slate-600 mt-1">
            Manage customer accounts and access
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsCustomers current={tab} search={search} />
          <CustomerSearch currentTab={tab} currentSearch={search} />
        </div>

        {(search || tab !== "all") && !loading && (
          <div className="mt-4 mb-2 text-sm text-slate-600">
            {search ? (
              <span>
                Found {customers.length} customer
                {customers.length !== 1 ? "s" : ""} matching &quot;{search}
                &quot;
              </span>
            ) : (
              <span>
                Showing {customers.length} {tab} customer
                {customers.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4 w-28">Status</th>
                  <th className="py-2 pr-0 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.CustomerID} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {c.FullName}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {c.account.Email}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {c.PhoneNumber}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatDate(String(c.account.CreatedAt)).split(",")[0]}
                    </td>
                    <td className="py-3 pr-4 w-28">
                      {c.account.Status === "Active" ? (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-0 text-right w-36">
                      <div className="ml-[100px] inline-block">
                        {c.account.Status === "Active" ? (
                          <button
                            type="button"
                            disabled={pendingId === c.CustomerID}
                            onClick={() => void onLock(c.CustomerID)}
                            className="relative h-8 px-3 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 inline-flex items-center gap-1 text-rose-700"
                          >
                            {pendingId === c.CustomerID ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                                Locking...
                              </span>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" /> Lock
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={pendingId === c.CustomerID}
                            onClick={() => void onUnlock(c.CustomerID)}
                            className="relative h-8 px-3 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 inline-flex items-center gap-1 text-emerald-700"
                          >
                            {pendingId === c.CustomerID ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                                Unlocking...
                              </span>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3" /> Unlock
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && customers.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              {tab === "locked"
                ? "No locked customers"
                : tab === "active"
                  ? "No active customers"
                  : "No customers"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
