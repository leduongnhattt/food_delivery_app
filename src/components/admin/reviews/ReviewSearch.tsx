"use client"

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar } from 'lucide-react'

const SEARCH_DEBOUNCE_MS = 350

export default function ReviewSearch({ 
  currentStatus, 
  currentSearch,
  currentEnterpriseId,
  currentStartDate,
  currentEndDate
}: { 
  currentStatus: string
  currentSearch: string
  currentEnterpriseId?: string
  currentStartDate?: string
  currentEndDate?: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentSearch)
  const [startDate, setStartDate] = useState(currentStartDate || '')
  const [endDate, setEndDate] = useState(currentEndDate || '')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearchValue(currentSearch)
  }, [currentSearch])

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [])

  const updateURL = (updates: {
    search?: string
    startDate?: string
    endDate?: string
  }) => {
    const p = new URLSearchParams(params.toString())
    p.set('status', currentStatus)
    if (currentEnterpriseId) {
      p.set('enterpriseId', currentEnterpriseId)
    }
    
    if (updates.search !== undefined) {
      if (updates.search.trim()) {
        p.set('q', updates.search.trim())
      } else {
        p.delete('q')
      }
    } else if (searchValue.trim()) {
      p.set('q', searchValue.trim())
    } else {
      p.delete('q')
    }

    if (updates.startDate !== undefined) {
      if (updates.startDate) {
        p.set('startDate', updates.startDate)
      } else {
        p.delete('startDate')
      }
    } else if (startDate) {
      p.set('startDate', startDate)
    } else {
      p.delete('startDate')
    }

    if (updates.endDate !== undefined) {
      if (updates.endDate) {
        p.set('endDate', updates.endDate)
      } else {
        p.delete('endDate')
      }
    } else if (endDate) {
      p.set('endDate', endDate)
    } else {
      p.delete('endDate')
    }

    startTransition(() => {
      router.replace(`/admin/reviews?${p.toString()}`, { scroll: false })
    })
  }

  const handleSearch = () => {
    updateURL({ search: searchValue })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (value.trim() === '') {
      updateURL({ search: '' })
      return
    }
    searchDebounceRef.current = setTimeout(() => {
      updateURL({ search: value })
    }, SEARCH_DEBOUNCE_MS)
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartDate(value)
    updateURL({ startDate: value })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEndDate(value)
    updateURL({ endDate: value })
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
        {/* Search */}
        <div className="w-full md:w-[380px]">
          <div className="relative">
            <Search className="pointer-events-none h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
              autoComplete="off"
              placeholder="Search review, customer, or restaurant"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-11 text-[13px] leading-4 font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isPending}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Search"
              aria-label="Search"
            >
              {isPending ? (
                <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-[12px] leading-4 font-medium text-slate-500">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>Date</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-[13px] leading-4 font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              disabled={isPending}
              aria-label="Start date"
              title="Start date"
            />
            <span className="text-slate-300">–</span>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-[13px] leading-4 font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              disabled={isPending}
              aria-label="End date"
              title="End date"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

