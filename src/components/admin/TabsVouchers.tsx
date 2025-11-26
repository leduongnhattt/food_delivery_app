"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

type TabKey = 'pending' | 'approved' | 'all'

export default function TabsVouchers({ current, search }: { current: TabKey; search: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const onSelect = (t: TabKey) => {
    if (t === current) return
    const p = new URLSearchParams(params.toString())
    p.set('status', t)
    if (search) p.set('q', search)
    else p.delete('q')
    startTransition(() => {
      router.replace(`/admin/discount?${p.toString()}`, { scroll: false })
    })
  }

  const btn = (t: TabKey, label: string) => (
    <button
      key={t}
      onClick={() => onSelect(t)}
      aria-current={current === t}
      className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
        current === t 
          ? 'bg-indigo-600 text-white border-indigo-600' 
          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
      } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center gap-2">
      {btn('all', 'All')}
      {btn('approved', 'Approved')}
      {btn('pending', 'Pending')}
    </div>
  )
}
