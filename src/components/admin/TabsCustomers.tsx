"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

type TabKey = 'all' | 'active' | 'locked'

export default function TabsCustomers({ current, search }: { current: TabKey; search: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const onSelect = (t: TabKey) => {
    if (t === current) return
    const p = new URLSearchParams(params.toString())
    p.set('status', t)
    if (search) p.set('search', search)
    else p.delete('search')
    startTransition(() => {
      router.replace(`/admin/customers?${p.toString()}`, { scroll: false })
    })
  }

  const btn = (t: TabKey, label: string) => (
    <button
      key={t}
      onClick={() => onSelect(t)}
      aria-current={current === t}
      className={`px-4 py-2 text-sm transition-colors ${
        current === t ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-600 hover:bg-slate-50'
      } ${t !== 'locked' ? 'border-r border-slate-200' : ''} ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {label}
    </button>
  )

  return (
    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
      {btn('all', 'All')}
      {btn('active', 'Active')}
      {btn('locked', 'Locked')}
    </div>
  )
}








