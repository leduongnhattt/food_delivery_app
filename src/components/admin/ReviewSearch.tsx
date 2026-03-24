"use client"

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar } from 'lucide-react'

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
    
    // Auto-clear search when input is empty
    if (value.trim() === '') {
      updateURL({ search: '' })
    }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full md:flex-row md:items-center">
      {/* Search Input */}
      <div className="relative flex-1 md:max-w-xs">
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Search review, customer, or restaurant"
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

      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="h-9 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 text-sm"
            disabled={isPending}
            title="Start Date"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="h-9 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 text-sm"
            disabled={isPending}
            title="End Date"
          />
        </div>
      </div>
    </div>
  )
}

