"use client"

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface DeleteCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  categoryName: string
  foodCount: number
  isDeleting?: boolean
}

export default function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  foodCount,
  isDeleting = false
}: DeleteCategoryModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isDeleting) onClose()
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, isDeleting, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isDeleting ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-900/5">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Category</h3>
                <p className="text-sm text-red-100">This action cannot be undone</p>
              </div>
            </div>
            {!isDeleting && (
              <button 
                onClick={onClose} 
                className="text-white/80 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Are you sure you want to delete the category <strong>"{categoryName}"</strong>?
              </p>
            </div>

            {foodCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Warning</p>
                    <p className="text-sm text-amber-700 mt-1">
                      This category contains <strong>{foodCount} food item{foodCount !== 1 ? 's' : ''}</strong>. 
                      Deleting this category may affect these items.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>What will happen:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• The category will be permanently removed</li>
                <li>• All associated food items will lose this category</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Category'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
