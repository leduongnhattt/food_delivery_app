"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

type TabKey = 'all' | 'active' | 'locked'

export default function TabsCustomers({ current, search }: { current: TabKey; search: string }) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleTabSelect = (nextTab: TabKey) => {
    if (nextTab === current) return
    const nextQuery = new URLSearchParams(currentSearchParams.toString())
    nextQuery.set('status', nextTab)
    if (search) nextQuery.set('search', search)
    else nextQuery.delete('search')
    startTransition(() => {
      router.replace(`/admin/customers?${nextQuery.toString()}`, { scroll: false })
    })
  }

  const renderTabButton = (tabKey: TabKey, label: string) => (
    <button
      key={tabKey}
      onClick={() => handleTabSelect(tabKey)}
      aria-current={current === tabKey}
      className={`px-4 py-2 text-sm transition-colors ${
        current === tabKey ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600 hover:bg-slate-50'
      } ${tabKey !== 'locked' ? 'border-r border-slate-200' : ''} ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {label}
    </button>
  )

  return (
    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
      {renderTabButton('all', 'All')}
      {renderTabButton('active', 'Active')}
      {renderTabButton('locked', 'Locked')}
    </div>
  )
}








