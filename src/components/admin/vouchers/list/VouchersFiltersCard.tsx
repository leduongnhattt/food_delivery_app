"use client"

import VoucherSearch from "@/components/admin/vouchers/list/VoucherSearch"
import { Check, ChevronDown, Plus } from "lucide-react"
import type { CreatedRangeFilter, StatusFilter } from "@/components/admin/vouchers/list/utils"

export function VouchersFiltersCard({
  status,
  statusLabel,
  openStatusMenu,
  setOpenStatusMenu,
  statusMenuRef,
  onSelectStatus,
  createdRange,
  rangeLabel,
  openRangeMenu,
  setOpenRangeMenu,
  rangeMenuRef,
  onSelectRange,
  searchQuery,
  visibleCount,
  onOpenCreate,
}: {
  status: StatusFilter
  statusLabel: string
  openStatusMenu: boolean
  setOpenStatusMenu: (v: boolean) => void
  statusMenuRef: React.RefObject<HTMLDivElement | null>
  onSelectStatus: (nextStatus: StatusFilter) => void
  createdRange: CreatedRangeFilter
  rangeLabel: string
  openRangeMenu: boolean
  setOpenRangeMenu: (v: boolean) => void
  rangeMenuRef: React.RefObject<HTMLDivElement | null>
  onSelectRange: (nextRange: CreatedRangeFilter) => void
  searchQuery: string
  visibleCount: number
  onOpenCreate: () => void
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="w-full flex-1">
            <VoucherSearch currentStatus={status} currentSearch={searchQuery} />
          </div>

          <div className="w-full sm:w-[200px] shrink-0">
            <div ref={statusMenuRef} className="relative">
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation()
                  setOpenStatusMenu(!openStatusMenu)
                  setOpenRangeMenu(false)
                }}
                className="relative group inline-flex h-8 min-h-8 items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] md:text-[13px] px-3 py-0 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200 w-full"
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
                  {(
                    [
                      { id: "all", label: "All Status" },
                      { id: "approved", label: "Approved" },
                      { id: "pending", label: "Pending" },
                      { id: "rejected", label: "Rejected" },
                      { id: "expired", label: "Expired" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        onSelectStatus(opt.id)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>{opt.label}</span>
                      {status === opt.id && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full sm:w-[200px] shrink-0">
            <div ref={rangeMenuRef} className="relative">
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation()
                  setOpenRangeMenu(!openRangeMenu)
                  setOpenStatusMenu(false)
                }}
                className="relative group inline-flex h-8 min-h-8 items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] md:text-[13px] px-3 py-0 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200 w-full"
              >
                <span className="truncate">{rangeLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openRangeMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openRangeMenu && (
                <div
                  onClick={(ev) => ev.stopPropagation()}
                  className="absolute right-0 mt-2 w-full min-w-[160px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
                >
                  {(
                    [
                      { id: "all", label: "All time" },
                      { id: "7d", label: "Last 7 days" },
                      { id: "30d", label: "Last 30 days" },
                      { id: "90d", label: "Last 90 days" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setOpenRangeMenu(false)
                        onSelectRange(opt.id)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>{opt.label}</span>
                      {createdRange === opt.id && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 sm:w-auto">
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-[13px] leading-4 font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create voucher
            </button>
          </div>
        </div>

        {(searchQuery || status !== "all" || createdRange !== "all") && (
          <div className="text-[13px] leading-4 font-normal text-slate-600">
            {searchQuery ? (
              <span>
                Found {visibleCount} voucher{visibleCount !== 1 ? "s" : ""} matching "{searchQuery}"
              </span>
            ) : (
              <span>
                Showing {visibleCount} voucher{visibleCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

