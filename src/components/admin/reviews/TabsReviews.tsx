"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

type TabKey = 'all' | 'active' | 'hidden'

export default function TabsReviews({ 
  current, 
  search,
  enterpriseId,
  startDate,
  endDate
}: { 
  current: TabKey
  search: string
  enterpriseId?: string
  startDate?: string
  endDate?: string
}) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleTabSelect = (nextTab: TabKey) => {
    if (nextTab === current) return
    const nextQuery = new URLSearchParams(currentSearchParams.toString())
    nextQuery.set('status', nextTab)
    if (enterpriseId) {
      nextQuery.set('enterpriseId', enterpriseId)
    }
    if (search) nextQuery.set('q', search)
    else nextQuery.delete('q')
    if (startDate) nextQuery.set('startDate', startDate)
    else nextQuery.delete('startDate')
    if (endDate) nextQuery.set('endDate', endDate)
    else nextQuery.delete('endDate')
    startTransition(() => {
      router.replace(`/admin/reviews?${nextQuery.toString()}`, { scroll: false })
    })
  }

  const renderTabButton = (tabKey: TabKey, label: string) => (
    <button
      key={tabKey}
      onClick={() => handleTabSelect(tabKey)}
      aria-current={current === tabKey}
      className={`px-3 py-1.5 rounded-md text-[13px] leading-4 font-medium border transition-colors ${
        current === tabKey 
          ? 'bg-indigo-600 text-white border-indigo-600' 
          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
      } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center gap-2">
      {renderTabButton('all', 'All')}
      {renderTabButton('active', 'Active')}
      {renderTabButton('hidden', 'Hidden')}
    </div>
  )
}

