"use client"

import { Ban, CheckCircle2, Timer, Users } from "lucide-react"

type Stats = {
  total: number
  active: number
  pending: number
  suspended: number
}

export function EnterpriseListStatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="space-y-1 flex-1">
            <p className="text-xs text-gray-500 font-medium">Total Enterprises</p>
            <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-blue-100">
            <Users className="size-5 text-sky-700" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="space-y-1 flex-1">
            <p className="text-xs text-gray-500 font-medium">Active</p>
            <p className="text-xl font-semibold text-gray-900">{stats.active}</p>
          </div>
          <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-green-100">
            <CheckCircle2 className="size-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="space-y-1 flex-1">
            <p className="text-xs text-gray-500 font-medium">Pending</p>
            <p className="text-xl font-semibold text-gray-900">{stats.pending}</p>
          </div>
          <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-yellow-100">
            <Timer className="size-5 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="space-y-1 flex-1">
            <p className="text-xs text-gray-500 font-medium">Suspended</p>
            <p className="text-xl font-semibold text-gray-900">{stats.suspended}</p>
          </div>
          <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-red-100">
            <Ban className="size-5 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
