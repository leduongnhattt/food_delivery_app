"use client"

import { Search, Check, ChevronDown } from "lucide-react"
import type { EnterpriseListTab } from "@/components/admin/enterprises/enterprise-list-utils"
import { enterpriseListStatusLabel } from "@/components/admin/enterprises/enterprise-list-utils"

type SetQuery = (next: {
  status?: EnterpriseListTab
  search?: string
  page?: number
  limit?: number
}) => void

type Props = {
  searchInput: string
  onSearchChange: React.ChangeEventHandler<HTMLInputElement>
  tab: EnterpriseListTab
  openStatusMenu: boolean
  setOpenStatusMenu: (v: boolean | ((p: boolean) => boolean)) => void
  statusMenuRef: React.RefObject<HTMLDivElement | null>
  setQuery: SetQuery
}

export function EnterpriseListSearchFilter({
  searchInput,
  onSearchChange,
  tab,
  openStatusMenu,
  setOpenStatusMenu,
  statusMenuRef,
  setQuery,
}: Props) {
  const statusLabel = enterpriseListStatusLabel(tab)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="w-full flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full h-8 min-h-8 py-0 border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 gap-2 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ps-10 text-[13px] leading-normal ring-slate-200 bg-white"
              placeholder="Search Enterprise Name / Email"
              value={searchInput}
              onChange={onSearchChange}
              aria-label="Search enterprises"
            />
          </div>
        </div>

        <div className="w-full shrink-0 sm:w-40">
          <div ref={statusMenuRef} className="relative">
            <button
              type="button"
              onMouseDown={(ev) => {
                ev.stopPropagation()
              }}
              onClick={(ev) => {
                ev.stopPropagation()
                setOpenStatusMenu((v) => !v)
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
                    { id: "all" as const, label: "All Status" },
                    { id: "active" as const, label: "Active" },
                    { id: "pending" as const, label: "Pending" },
                    { id: "locked" as const, label: "Suspended" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setOpenStatusMenu(false)
                      setQuery({ status: opt.id, page: 1 })
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                  >
                    <span>{opt.label}</span>
                    {tab === opt.id && <Check className="w-4 h-4 text-slate-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
