"use client"

import { useEffect, useState, useMemo } from 'react'
import { Edit3 } from 'lucide-react'
import { validateCategoryForm, canProceedCategoryForm, CategoryFormData } from '@/lib/admin-categories-validation'

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updatedCategory: { name: string; description: string }) => void
  category: {
    name: string
    description: string
  } | null
  isSaving?: boolean
}

export default function EditCategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  isSaving = false
}: EditCategoryModalProps) {
  const [form, setForm] = useState<CategoryFormData>({
    categoryName: '',
    description: ''
  })
  const [touched, setTouched] = useState<Partial<Record<keyof CategoryFormData, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const errors = useMemo(() => validateCategoryForm(form), [form])
  const showError = (key: keyof CategoryFormData) => (submitAttempted || touched[key]) && errors[key]

  // Initialize form when category changes
  useEffect(() => {
    if (category) {
      setForm({
        categoryName: category.name,
        description: category.description || ''
      })
      setTouched({})
      setSubmitAttempted(false)
    }
  }, [category])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSaving) onClose()
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, isSaving, onClose])

  const onChange = (k: keyof CategoryFormData, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    
    if (!canProceedCategoryForm(errors)) return
    
    onSave({
      name: form.categoryName,
      description: form.description
    })
  }

  if (!isOpen || !category) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-slate-900/5">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Edit Category</h3>
                <p className="text-sm text-blue-100">Update category information</p>
              </div>
            </div>
            {!isSaving && (
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <div className={`relative ${showError('categoryName') ? 'text-rose-600' : ''}`}>
                <input 
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-300 ${
                    showError('categoryName') ? 'border-rose-300' : 'border-gray-300'
                  }`} 
                  placeholder="e.g. Pizza, Burger, Dessert" 
                  value={form.categoryName} 
                  onChange={e => onChange('categoryName', e.target.value)} 
                  onBlur={() => setTouched(t => ({ ...t, categoryName: true }))}
                  disabled={isSaving}
                />
              </div>
              {showError('categoryName') && (
                <p className="text-sm text-rose-600 mt-1">{errors.categoryName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea 
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-300 ${
                  showError('description') ? 'border-rose-300' : 'border-gray-300'
                }`} 
                rows={3} 
                placeholder="Optional description for this category" 
                value={form.description} 
                onChange={e => onChange('description', e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, description: true }))}
                disabled={isSaving}
              />
              {showError('description') && (
                <p className="text-sm text-rose-600 mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !canProceedCategoryForm(errors)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
