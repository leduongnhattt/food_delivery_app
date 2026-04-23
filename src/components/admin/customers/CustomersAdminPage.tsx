"use client"

import { formatDate } from "@/lib/utils"
import { Check, ChevronDown, Lock, Search, Unlock } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"
import { ADMIN_MENU_TRIGGER_CLASS } from "@/components/admin/shared/admin-field-classes"
import { EnterpriseMenuSelect } from "@/components/enterprise/orders/shared/EnterpriseMenuSelect"
import { useAdminCustomersPage } from "@/hooks/use-admin-customers-page"

export default function CustomersAdminPage() {
  const {
    PAGE_SIZE_OPTIONS,
    statusFilter,
    searchField,
    currentCursor,
    pageSize,
    customers,
    nextCursor,
    cursorHistory,
    pageIndex,
    totalPagesHint,
    loading,
    error,
    pendingCustomerId,
    isStatusMenuOpen,
    setIsStatusMenuOpen,
    statusMenuRef,
    statusLabel,
    qModeOptions,
    searchInput,
    onSearchChange,
    searchPlaceholder,
    setSearchField,
    setFilters,
    goPrevPage,
    goNextPage,
    changePageSize,
    lockCustomer,
    unlockCustomer,
  } = useAdminCustomersPage()

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
            <div className="w-full flex-1 min-w-0">
              {/* Segmented search (match Orders list): mode select + input share one border */}
              <div className="flex min-w-0 flex-1 items-stretch rounded border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-300">
                <EnterpriseMenuSelect
                  value={searchField}
                  onChange={setSearchField}
                  options={qModeOptions}
                  className="w-40 shrink-0"
                  borderlessTrigger
                  triggerClassName="h-8 min-h-8 rounded-none rounded-l-md rounded-r-none"
                  aria-label="Search by field"
                  alignMenu="left"
                  menuClassName="min-w-[180px]"
                />
                <div className="relative min-w-0 flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-8 min-h-8 min-w-0 w-full rounded-none rounded-r-md border-0 border-l border-slate-200 bg-white px-3 ps-10 text-[13px] leading-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-75"
                    placeholder={searchPlaceholder}
                    value={searchInput}
                    onChange={onSearchChange}
                    aria-label="Search customers"
                  />
                </div>
              </div>
            </div>

            <div className="w-full shrink-0 sm:w-40">
              <div ref={statusMenuRef} className="relative">
                <button
                  type="button"
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setIsStatusMenuOpen((v) => !v)
                  }}
                  className={ADMIN_MENU_TRIGGER_CLASS}
                >
                  <span className="truncate">{statusLabel}</span>
                  <ChevronDown
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                      isStatusMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isStatusMenuOpen && (
                  <div
                    onClick={(ev) => ev.stopPropagation()}
                    className="absolute right-0 mt-2 w-full min-w-[160px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatusMenuOpen(false)
                        setFilters({ status: "all" })
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>All Status</span>
                      {statusFilter === "all" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatusMenuOpen(false)
                        setFilters({ status: "active" })
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Active</span>
                      {statusFilter === "active" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatusMenuOpen(false)
                        setFilters({ status: "locked" })
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Locked</span>
                      {statusFilter === "locked" && <Check className="w-4 h-4 text-slate-700" />}
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

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center text-slate-500 py-10">Loading…</div>
            ) : (
              <table className="min-w-full text-[12px] leading-4">
                <thead>
                  <tr className="bg-[#f9fbfc] text-left border-b border-slate-200">
                    <th className="py-2 pr-4 pl-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Name
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Email
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Phone
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Address
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Created
                    </th>
                    <th className="py-2 pr-4 w-28 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Status
                    </th>
                    <th className="py-2 pr-4 text-right w-36 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.CustomerID}>
                      <td className="py-2 pr-4 pl-4 text-slate-700 font-medium">{c.FullName}</td>
                      <td className="py-2 pr-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                        {c.account.Email}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">{c.PhoneNumber}</td>
                      <td className="py-2 pr-4 text-slate-700">
                        <span className="block max-w-[360px] truncate">{c.Address}</span>
                      </td>
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
                      <td className="py-2 pr-4 text-right w-36">
                        {c.account.Status === "Active" ? (
                          <button
                            type="button"
                            disabled={pendingCustomerId === c.CustomerID}
                            onClick={() => void lockCustomer(c.CustomerID)}
                            className="h-8 px-3 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 inline-flex items-center gap-1 text-rose-700"
                          >
                            <Lock className="w-3 h-3" /> Lock
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={pendingCustomerId === c.CustomerID}
                            onClick={() => void unlockCustomer(c.CustomerID)}
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
                {statusFilter === "locked"
                  ? "No locked customers"
                  : statusFilter === "active"
                    ? "No active customers"
                    : "No customers"}
              </div>
            )}
          </div>

          {!loading && (customers.length > 0 || currentCursor) && (
            <Pagination
              variant="cursor"
              canPrev={!!currentCursor || cursorHistory.length > 0}
              canNext={!!nextCursor}
              pageLabel={`${pageIndex} / ${totalPagesHint}`}
              onPrev={goPrevPage}
              onNext={goNextPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(n) => changePageSize(n as any)}
              leftSlot={
                <div className="text-[11px] font-normal leading-4 text-slate-600">
                  Showing <span className="text-slate-900">{customers.length}</span> customers
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
