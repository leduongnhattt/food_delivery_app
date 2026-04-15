'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

type RangeOption = '30d' | '90d' | '1y'

export default function RangeSelect({ current }: { current: string | undefined }) {
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
    <div className="relative inline-flex items-center">
      <select
        id="range"
        name="range"
        defaultValue={current || '30d'}
        onChange={handleChange}
        className="h-9 appearance-none text-sm rounded-lg border border-slate-200 bg-white pr-8 pl-3 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
      >
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="1y">Last 1 year</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-slate-500" />
    </div>
  )
}


