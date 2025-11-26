"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Tag, FileText } from 'lucide-react'
import { validateCategoryForm, canProceedCategoryForm, CategoryFormData } from '@/lib/admin-categories-validation'
import { useToast } from '@/contexts/toast-context'
import { createCategory } from '@/services/admin-categories.service'

export default function AddCategoryModal({ 
  triggerClassName = '',
  onCategoryAdded
}: { 
  triggerClassName?: string
  onCategoryAdded?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const [form, setForm] = useState<CategoryFormData>({
    categoryName: '',
    description: ''
  })

  const onChange = (k: keyof CategoryFormData, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const [touched, setTouched] = useState<Partial<Record<keyof CategoryFormData, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const errors = useMemo(() => validateCategoryForm(form), [form])

  const showError = (key: keyof CategoryFormData) => (submitAttempted || touched[key]) && errors[key]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitAttempted(true)
    
    if (!canProceedCategoryForm(errors)) return
    
    startTransition(async () => {
      const res = await createCategory(form)
      if (res.ok) {
        setOpen(false)
        showToast('Category created successfully', 'success', 3000)
        // Reset form
        setForm({ categoryName: '', description: '' })
        setTouched({})
        setSubmitAttempted(false)
        // Refresh the categories list
        onCategoryAdded?.()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Failed to create category', 'error', 5000)
      }
    })
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)}>
        + Add Category
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-slate-900/5">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Tag className="w-5 h-5" /> Add Category
                  </h3>
                  <p className="text-xs text-emerald-100">Create a new food category for the system</p>
                </div>
                <button 
                  onClick={() => setOpen(false)} 
                  className="text-white/90 hover:text-white text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={onSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Category Name *
                  </label>
                  <div className={`relative ${showError('categoryName') ? 'text-rose-600' : ''}`}>
                    <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className={`border rounded-md h-10 pl-9 pr-3 w-full ${
                        showError('categoryName') ? 'border-rose-300' : 'border-slate-200'
                      } focus:ring-2 focus:ring-emerald-200`} 
                      placeholder="e.g. Pizza, Burger, Dessert" 
                      value={form.categoryName} 
                      onChange={e => onChange('categoryName', e.target.value)} 
                      onBlur={() => setTouched(t => ({ ...t, categoryName: true }))} 
                    />
                  </div>
                  {showError('categoryName') && (
                    <p className="text-xs text-rose-600 mt-1">{errors.categoryName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Description
                  </label>
                  <div className={`relative ${showError('description') ? 'text-rose-600' : ''}`}>
                    <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <textarea 
                      className={`border rounded-md px-3 py-2 pl-9 w-full border-slate-200 focus:ring-2 focus:ring-emerald-200 ${
                        showError('description') ? 'border-rose-300' : 'border-slate-200'
                      }`} 
                      rows={3} 
                      placeholder="Optional description for this category" 
                      value={form.description} 
                      onChange={e => onChange('description', e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, description: true }))}
                    />
                  </div>
                  {showError('description') && (
                    <p className="text-xs text-rose-600 mt-1">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setOpen(false)} 
                  className="h-10 px-4 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={isPending || !canProceedCategoryForm(errors)} 
                  type="submit" 
                  className="h-10 px-5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  {isPending ? 'Creating…' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
