"use client"

import React from "react"
import { Search } from "lucide-react"
import {
  AdminFilterMenu,
} from "@/components/admin/shared/AdminFilterMenu"
import { mergeClasses } from "@/lib/utils"
import type { AdminFilterOption } from "@/components/admin/shared/AdminFilterMenu"
import { RANGE_FILTER_OPTIONS } from "@/components/admin/platform/audit-logs/constants"

export function AuditLogsFiltersCard({
  search,
  setSearch,
  module,
  setModule,
  action,
  setAction,
  rowStatus,
  setRowStatus,
  user,
  setUser,
  role,
  setRole,
  moduleOptions,
  actionOptions,
  statusOptions,
  userOptions,
  roleOptions,
  selectedRangeValue,
  setRangeQueryParam,
  openFilterMenuId,
  setOpenFilterMenuId,
  onAnyChange,
}: {
  search: string
  setSearch: (v: string) => void
  module: string
  setModule: (v: string) => void
  action: string
  setAction: (v: string) => void
  rowStatus: string
  setRowStatus: (v: string) => void
  user: string
  setUser: (v: string) => void
  role: string
  setRole: (v: string) => void
  moduleOptions: readonly AdminFilterOption[]
  actionOptions: readonly AdminFilterOption[]
  statusOptions: readonly AdminFilterOption[]
  userOptions: readonly AdminFilterOption[]
  roleOptions: readonly AdminFilterOption[]
  selectedRangeValue: (typeof RANGE_FILTER_OPTIONS)[number]["value"]
  setRangeQueryParam: (v: string) => void
  openFilterMenuId: string | null
  setOpenFilterMenuId: (v: string | null | ((p: string | null) => string | null)) => void
  onAnyChange: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="px-4 py-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    onAnyChange()
                  }}
                  aria-label="Search by description or IP address"
                  placeholder="Search by description or IP address"
                  className={mergeClasses(
                    "h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs shadow-sm",
                    "placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-colors",
                  )}
                />
              </div>
            </div>

            <div className="min-w-0 lg:col-span-3">
              <AdminFilterMenu
                menuId="user"
                ariaLabel="Users"
                value={user}
                options={userOptions}
                onChange={(v) => {
                  setUser(v)
                  onAnyChange()
                }}
                openMenuId={openFilterMenuId}
                setOpenMenuId={setOpenFilterMenuId}
              />
            </div>
            <div className="min-w-0 lg:col-span-3">
              <AdminFilterMenu
                menuId="role"
                ariaLabel="Roles"
                value={role}
                options={roleOptions}
                onChange={(v) => {
                  setRole(v)
                  onAnyChange()
                }}
                openMenuId={openFilterMenuId}
                setOpenMenuId={setOpenFilterMenuId}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-3">
              <AdminFilterMenu
                menuId="module"
                ariaLabel="Modules"
                value={module}
                options={moduleOptions}
                onChange={(v) => {
                  setModule(v)
                  onAnyChange()
                }}
                openMenuId={openFilterMenuId}
                setOpenMenuId={setOpenFilterMenuId}
              />
            </div>
            <div className="min-w-0 lg:col-span-3">
              <AdminFilterMenu
                menuId="action"
                ariaLabel="Actions"
                value={action}
                options={actionOptions}
                onChange={(v) => {
                  setAction(v)
                  onAnyChange()
                }}
                openMenuId={openFilterMenuId}
                setOpenMenuId={setOpenFilterMenuId}
              />
            </div>
            <div className="min-w-0 lg:col-span-3">
              <AdminFilterMenu
                menuId="rowStatus"
                ariaLabel="Statuses"
                value={rowStatus}
                options={statusOptions}
                onChange={(v) => {
                  setRowStatus(v)
                  onAnyChange()
                }}
                openMenuId={openFilterMenuId}
                setOpenMenuId={setOpenFilterMenuId}
              />
            </div>
            <div className="min-w-0 lg:col-span-3">
              <AdminFilterMenu
                menuId="range"
                ariaLabel="Date range"
                value={selectedRangeValue}
                options={[...RANGE_FILTER_OPTIONS]}
                onChange={(v) => {
                  setRangeQueryParam(v)
                  onAnyChange()
                }}
                openMenuId={openFilterMenuId}
                setOpenMenuId={setOpenFilterMenuId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

