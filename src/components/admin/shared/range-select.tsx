'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

type RangeOption = '7d' | '30d' | '90d' | '1y'

export default function RangeSelect({ current }: { current?: string | undefined }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = useCallback<React.ChangeEventHandler<HTMLSelectElement>>(
    (e) => {
      const value = e.target.value as RangeOption
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (value) params.set('range', value)
      else params.delete('range')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="relative flex w-full min-w-0 items-stretch">
      <select
        id="range"
        name="range"
        defaultValue={current || '30d'}
        onChange={handleChange}
        className="h-8 w-full min-w-0 flex-1 appearance-none rounded-md border border-slate-200 bg-white pl-2 pr-7 text-xs shadow-sm hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
      >
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="1y">Last 1 year</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
    </div>
  )
}


