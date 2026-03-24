"use client"

import React from 'react'
import { StockValidationResult } from '@/lib/stock-validation'

interface StockValidationPopupProps {
  isOpen: boolean
  onClose: () => void
  validationResult: StockValidationResult | null
}

export function StockValidationPopup({
  isOpen,
  onClose,
  validationResult
}: StockValidationPopupProps) {
  if (!isOpen || !validationResult) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border-0 transform animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Insufficient Stock
          </h3>
          <p className="text-gray-600 text-lg">
            {validationResult.message}
          </p>
        </div>

        {/* Stock Comparison */}
        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-2xl p-6 mb-8 border border-red-100">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">{validationResult.availableStock}</div>
              <div className="text-sm font-medium text-gray-700">Available</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">{validationResult.requestedQuantity}</div>
              <div className="text-sm font-medium text-gray-700">Requested</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing stock validation popup state
export function useStockValidationPopup() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [validationResult, setValidationResult] = React.useState<StockValidationResult | null>(null)

  const showValidation = (result: StockValidationResult) => {
    setValidationResult(result)
    setIsOpen(true)
  }

  const hideValidation = () => {
    setIsOpen(false)
    setValidationResult(null)
  }

  return {
    isOpen,
    validationResult,
    showValidation,
    hideValidation
  }
}
