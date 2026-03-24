"use client"

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export default function VoucherSearch({ currentStatus, currentSearch }: { currentStatus: string; currentSearch: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentSearch)

  const handleSearch = () => {
    const p = new URLSearchParams(params.toString())
    p.set('status', currentStatus)
    if (searchValue.trim()) {
      p.set('q', searchValue.trim())
    } else {
      p.delete('q')
    }
    startTransition(() => {
      router.replace(`/admin/discount?${p.toString()}`, { scroll: false })
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    
    // Auto-clear search when input is empty
    if (value.trim() === '') {
      const p = new URLSearchParams(params.toString())
      p.set('status', currentStatus)
      p.delete('q')
      startTransition(() => {
        router.replace(`/admin/discount?${p.toString()}`, { scroll: false })
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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
            onKeyPress={handleKeyPress}
            placeholder="Search code or enterprise"
            className="pl-9 pr-3 w-full h-9 rounded-md border border-slate-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
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
