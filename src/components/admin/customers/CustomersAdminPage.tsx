"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAdminSearchInput } from "@/hooks/use-admin-search-input"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Check, ChevronDown, Lock, Search, Unlock } from "lucide-react"
import {
  listAdminCustomers,
  lockAdminCustomer,
  unlockAdminCustomer,
} from "@/services/admin.service"
import type { AdminCustomerListItem } from "@/types/admin-api.types"

export default function CustomersAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get("status") || "all") as "all" | "active" | "locked"
  const search = searchParams.get("search")?.trim() || ""

  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as Node | null
      if (openStatusMenu && statusMenuRef.current && target) {
        if (!statusMenuRef.current.contains(target)) setOpenStatusMenu(false)
      }
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [openStatusMenu])

  function setQuery(next: { status?: "all" | "active" | "locked"; search?: string }) {
    const p = new URLSearchParams()
    const s = (next.status ?? tab) || "all"
    const q = (next.search ?? search).trim()
    if (s && s !== "all") p.set("status", s)
    if (q) p.set("search", q)
    const qs = p.toString()
    router.push(qs ? `/admin/customers?${qs}` : "/admin/customers")
  }

  const { value: searchInput, onChange: onSearchChange } = useAdminSearchInput(
    search,
    (q) => setQuery({ search: q }),
  )

  const statusLabel = useMemo(() => {
    if (tab === "active") return "Active"
    if (tab === "locked") return "Locked"
    return "All Status"
  }, [tab])

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
      <div className="space-y-3">
        <div>
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            Customers
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Manage customer accounts and access.
          </p>
        </div>

        {/* Search & filter (card) */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="w-full flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 gap-2 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ps-10 text-[13px] py-2.5 ring-slate-200 bg-white"
                  placeholder="Search name / phone / email"
                  value={searchInput}
                  onChange={onSearchChange}
                  aria-label="Search customers"
                />
              </div>
            </div>

            <div className="w-full shrink-0 sm:w-40">
              <div ref={statusMenuRef} className="relative">
                <button
                  type="button"
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setOpenStatusMenu((v) => !v)
                  }}
                  className="relative group inline-flex items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] md:text-[13px] py-2.5 px-3 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200 w-full"
                >
                  <span className="truncate">{statusLabel}</span>
                  <ChevronDown
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                      openStatusMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openStatusMenu && (
                  <div
                    onClick={(ev) => ev.stopPropagation()}
                    className="absolute right-0 mt-2 w-full min-w-[160px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setQuery({ status: "all" })
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>All Status</span>
                      {tab === "all" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setQuery({ status: "active" })
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Active</span>
                      {tab === "active" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setQuery({ status: "locked" })
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Locked</span>
                      {tab === "locked" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {/* Table (framed like CMS) */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto px-4">
            {loading ? (
              <div className="text-center text-slate-500 py-10">Loading…</div>
            ) : (
              <table className="min-w-full text-[13px]">
                <thead>
                  <tr className="bg-[#f9fbfc] text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Name
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Email
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Phone
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Created
                    </th>
                    <th className="py-2 pr-4 w-28 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Status
                    </th>
                    <th className="py-2 pr-0 text-right w-36 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.CustomerID}>
                      <td className="py-2 pr-4 text-slate-700 font-medium">{c.FullName}</td>
                      <td className="py-2 pr-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                        {c.account.Email}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">{c.PhoneNumber}</td>
                      <td className="py-2 pr-4 text-slate-700">
                        {formatDate(String(c.account.CreatedAt)).split(",")[0]}
                      </td>
                      <td className="py-2 pr-4 w-28">
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
                      <td className="py-2 pr-0 text-right w-36">
                        {c.account.Status === "Active" ? (
                          <button
                            type="button"
                            disabled={pendingId === c.CustomerID}
                            onClick={() => void onLock(c.CustomerID)}
                            className="h-8 px-3 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 inline-flex items-center gap-1 text-rose-700"
                          >
                            <Lock className="w-3 h-3" /> Lock
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={pendingId === c.CustomerID}
                            onClick={() => void onUnlock(c.CustomerID)}
                            className="h-8 px-3 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 inline-flex items-center gap-1 text-emerald-700"
                          >
                            <Unlock className="w-3 h-3" /> Unlock
                          </button>
                        )}
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
    </div>
  )
}
