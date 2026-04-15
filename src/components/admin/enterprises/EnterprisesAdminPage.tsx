"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDate } from "@/lib/utils"
import TabsEnterprises from "./TabsEnterprises"
import EnterpriseSearch from "./EnterpriseSearch"
import { Lock, Unlock, MapPin, Clock } from "lucide-react"
import AddEnterpriseModal from "./AddEnterpriseModal"
import {
  listAdminEnterprises,
  lockAdminEnterpriseAccount,
  unlockAdminEnterpriseAccount,
} from "@/services/admin.service"
import type { AdminEnterpriseListItem } from "@/types/admin-api.types"

export default function EnterprisesAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get("status") || "all") as
    | "all"
    | "active"
    | "locked"
  const search = searchParams.get("search")?.trim() || ""

  const [enterprises, setEnterprises] = useState<AdminEnterpriseListItem[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(
    null,
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminEnterprises({ status: tab, search })
      setEnterprises(res.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load enterprises")
      setEnterprises([])
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => {
    void load()
  }, [load])

  async function onLock(accountId: string) {
    setPendingAccountId(accountId)
    try {
      await lockAdminEnterpriseAccount(accountId)
      router.push("/admin/enterprises?status=locked")
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lock failed")
    } finally {
      setPendingAccountId(null)
    }
  }

  async function onUnlock(accountId: string) {
    setPendingAccountId(accountId)
    try {
      await unlockAdminEnterpriseAccount(accountId)
      router.push("/admin/enterprises?status=active")
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unlock failed")
    } finally {
      setPendingAccountId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Enterprises
          </h1>
          <p className="text-slate-600 mt-1">
            Manage enterprise accounts and onboarding
          </p>
        </div>
        <AddEnterpriseModal
          onCreated={() => void load()}
          triggerClassName="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-indigo-700 hover:bg-indigo-50"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsEnterprises current={tab} search={search} />
          <EnterpriseSearch currentTab={tab} currentSearch={search} />
        </div>

        {(search || tab !== "all") && !loading && (
          <div className="mt-4 mb-2 text-sm text-slate-600">
            {search ? (
              <span>
                Found {enterprises.length} enterprise
                {enterprises.length !== 1 ? "s" : ""} matching &quot;{search}
                &quot;
              </span>
            ) : (
              <span>
                Showing {enterprises.length} {tab} enterprise
                {enterprises.length !== 1 ? "s" : ""}
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
                  <th className="py-2 pr-4">Open/Close</th>
                  <th className="py-2 pr-4">Address</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-2 w-28">Status</th>
                  <th className="py-2 pr-0 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enterprises.map((e) => (
                  <tr key={e.EnterpriseID} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {e.EnterpriseName}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {e.account.Email}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {e.PhoneNumber}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {e.OpenHours} - {e.CloseHours}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {e.Address}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatDate(String(e.CreatedAt)).split(",")[0]}
                    </td>
                    <td className="py-3 pr-2 w-28">
                      {e.account.Status === "Active" ? (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-0 text-right w-32">
                      {e.account.Status === "Active" ? (
                        <button
                          type="button"
                          disabled={
                            pendingAccountId === e.account.AccountID
                          }
                          onClick={() => void onLock(e.account.AccountID)}
                          className="relative h-8 px-3 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 inline-flex items-center gap-1 text-rose-700"
                        >
                          {pendingAccountId === e.account.AccountID ? (
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
                          disabled={
                            pendingAccountId === e.account.AccountID
                          }
                          onClick={() => void onUnlock(e.account.AccountID)}
                          className="relative h-8 px-3 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 inline-flex items-center gap-1 text-emerald-700"
                        >
                          {pendingAccountId === e.account.AccountID ? (
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && enterprises.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              No enterprises
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
