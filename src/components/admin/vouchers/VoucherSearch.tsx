"use client"

import { useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useAdminSearchInput } from '@/hooks/use-admin-search-input'

export default function VoucherSearch({ currentStatus, currentSearch }: { currentStatus: string; currentSearch: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const applySearch = useCallback(
    (q: string) => {
      const p = new URLSearchParams(params.toString())
      p.set('status', currentStatus)
      if (q) {
        p.set('q', q)
      } else {
        p.delete('q')
      }
      startTransition(() => {
        router.replace(`/admin/discount?${p.toString()}`, { scroll: false })
      })
    },
    [params, currentStatus, router, startTransition],
  )

  const { value: searchValue, onChange: handleInputChange } = useAdminSearchInput(
    currentSearch,
    applySearch,
  )

  const handleSearch = () => {
    applySearch(searchValue.trim())
  }

  return (
    <div className="relative w-full md:w-80">
      <div className="flex gap-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            placeholder="Search code or enterprise"
            className="pl-9 pr-3 w-full h-9 rounded-md border border-slate-200 text-[13px] leading-4 font-normal text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            disabled={isPending}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isPending}
          className="px-2 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[60px]"
          title="Search"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
