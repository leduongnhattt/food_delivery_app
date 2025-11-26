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
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
]

const timeFilters = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' }
]

export function OrderFilters({ onFilterChange, currentFilters }: OrderFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTimeFilter, setActiveTimeFilter] = useState('')

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...currentFilters, status: status || undefined })
  }

  const handleTimeFilter = (timeFilter: string) => {
    setActiveTimeFilter(timeFilter)
    
    const now = new Date()
    let startDate: string | undefined
    let endDate: string | undefined

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = weekStart.toISOString()
        endDate = now.toISOString()
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        endDate = now.toISOString()
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString()
        endDate = now.toISOString()
        break
      default:
        startDate = undefined
        endDate = undefined
    }

    onFilterChange({ 
      ...currentFilters, 
      startDate, 
      endDate 
    })
  }

  const clearFilters = () => {
    setActiveTimeFilter('')
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 h-6"
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
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
        <div className="flex flex-wrap gap-1">
          {timeFilters.map((option) => (
            <Button
              key={option.value}
              variant={activeTimeFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleTimeFilter(option.value)}
              className={`text-xs px-2 py-1 h-6 ${
                activeTimeFilter === option.value
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Additional Filters (Expanded) */}
      {isExpanded && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">From Date</label>
              <input
                type="date"
                value={currentFilters.startDate?.split('T')[0] || ''}
                onChange={(e) => onFilterChange({ 
                  ...currentFilters, 
                  startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">To Date</label>
              <input
                type="date"
                value={currentFilters.endDate?.split('T')[0] || ''}
                onChange={(e) => onFilterChange({ 
                  ...currentFilters, 
                  endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
