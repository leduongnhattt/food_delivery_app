"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { OrderFilters } from '@/services/order.service'
import { Filter, X } from 'lucide-react'
import { useState } from 'react'

interface OrderFiltersProps {
  onFilterChange: (filters: OrderFilters) => void
  currentFilters: OrderFilters
}

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'bucket_to_ship', label: 'To ship' },
  { value: 'bucket_to_receive', label: 'To receive' },
  { value: 'bucket_completed', label: 'Completed' },
  { value: 'bucket_return_refund', label: 'Return / Refund' },
  { value: 'bucket_cancel', label: 'Cancel' }
]

export function OrderFilters({ onFilterChange, currentFilters }: OrderFiltersProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [activeTimePreset, setActiveTimePreset] = useState<'all' | 'today' | 'week' | 'month' | 'date'>('all')

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...currentFilters, status: status || undefined })
  }

  const handlePickDate = (value: string) => {
    setSelectedDate(value)
    setActiveTimePreset(value ? 'date' : 'all')
    if (!value) {
      onFilterChange({ ...currentFilters, startDate: undefined, endDate: undefined })
      return
    }
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
    onFilterChange({ ...currentFilters, startDate: start.toISOString(), endDate: end.toISOString() })
  }

  const handleTimePreset = (preset: 'all' | 'today' | 'week' | 'month') => {
    setActiveTimePreset(preset)
    setSelectedDate('')

    const now = new Date()
    let startDate: string | undefined
    let endDate: string | undefined

    switch (preset) {
      case 'today': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        startDate = start.toISOString()
        endDate = end.toISOString()
        break
      }
      case 'week': {
        const weekStart = new Date(now)
        weekStart.setHours(0, 0, 0, 0)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = weekStart.toISOString()
        endDate = now.toISOString()
        break
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        startDate = start.toISOString()
        endDate = now.toISOString()
        break
      }
      case 'all':
      default:
        startDate = undefined
        endDate = undefined
    }

    onFilterChange({ ...currentFilters, startDate, endDate })
  }

  const clearFilters = () => {
    setSelectedDate('')
    setActiveTimePreset('all')
    onFilterChange({})
  }

  const hasActiveFilters = currentFilters.status || currentFilters.startDate || currentFilters.endDate

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-900 text-sm">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-2 py-1">
              Active
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 h-6"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Status</h4>
        <div className="flex flex-wrap gap-1">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentFilters.status === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(option.value)}
              className={`text-xs px-2 py-1 h-6 ${
                currentFilters.status === option.value
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Time Filter */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Time</h4>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTimePreset === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimePreset('all')}
            className={`text-xs px-2 py-1 h-6 ${
              activeTimePreset === 'all'
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            All time
          </Button>

          <Button
            variant={activeTimePreset === 'today' ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimePreset('today')}
            className={`text-xs px-2 py-1 h-6 ${
              activeTimePreset === 'today'
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Today
          </Button>
          <Button
            variant={activeTimePreset === 'week' ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimePreset('week')}
            className={`text-xs px-2 py-1 h-6 ${
              activeTimePreset === 'week'
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            This week
          </Button>
          <Button
            variant={activeTimePreset === 'month' ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimePreset('month')}
            className={`text-xs px-2 py-1 h-6 ${
              activeTimePreset === 'month'
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            This month
          </Button>

          <span className="text-xs text-gray-400">or</span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handlePickDate(e.target.value)}
              className="h-7 rounded-md border border-gray-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {selectedDate ? (
              <button
                type="button"
                onClick={() => handlePickDate('')}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
