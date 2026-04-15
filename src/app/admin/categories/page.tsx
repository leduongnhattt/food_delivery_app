"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Tag, Search, Filter, ArrowUpDown, Check, ChevronDown } from 'lucide-react'
import AddCategoryModal from '@/components/admin/categories/AddCategoryModal'
import DeleteCategoryModal from '@/components/admin/categories/DeleteCategoryModal'
import EditCategoryModal from '@/components/admin/categories/EditCategoryModal'
import { getAllCategories } from '@/services/admin.service'
import { useToast } from '@/contexts/toast-context'

interface Category {
  id: string
  name: string
  description: string
  foodCount: number
  createdAt: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'foodCount'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [openSortByMenu, setOpenSortByMenu] = useState(false)
  const sortByMenuRef = useRef<HTMLDivElement | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    category: Category | null
    isDeleting: boolean
  }>({
    isOpen: false,
    category: null,
    isDeleting: false
  })
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    category: Category | null
    isSaving: boolean
  }>({
    isOpen: false,
    category: null,
    isSaving: false
  })
  const { showToast } = useToast()

  const sortByOptions = useMemo(
    () =>
      [
        { value: 'name' as const, label: 'Sort by Name' },
        { value: 'date' as const, label: 'Sort by Date' },
        { value: 'foodCount' as const, label: 'Sort by Food Count' },
      ] as const,
    [],
  )
  const sortByLabel = useMemo(() => {
    return sortByOptions.find((o) => o.value === sortBy)?.label || 'Sort'
  }, [sortBy, sortByOptions])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'N/A'
      }
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAllCategories()
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        showToast('Failed to fetch categories', 'error', 5000)
      }
    } catch (error) {
      console.error('Error loading categories', error)
      showToast('Error loading categories', 'error', 5000)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const handleEditCategory = (category: Category) => {
    setEditModal({
      isOpen: true,
      category,
      isSaving: false
    })
  }

  const handleDeleteCategory = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      category,
      isDeleting: false
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.category) return

    setDeleteModal(prev => ({ ...prev, isDeleting: true }))

    try {
      // TODO: Implement actual delete API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        category: null,
        isDeleting: false
      })
      
      // Show success message
      showToast(`Category "${deleteModal.category.name}" has been deleted successfully`, 'success', 3000)
      
      // Refresh the categories list
      await fetchCategories()
    } catch (error) {
      console.error('Failed to delete category', error)
      showToast('Failed to delete category. Please try again.', 'error', 5000)
      setDeleteModal(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleCloseDeleteModal = () => {
    if (deleteModal.isDeleting) return // Prevent closing while deleting
    setDeleteModal({
      isOpen: false,
      category: null,
      isDeleting: false
    })
  }

  const handleSaveEdit = async (updatedCategory: { name: string; description: string }) => {
    if (!editModal.category) return

    setEditModal(prev => ({ ...prev, isSaving: true }))

    try {
      // TODO: Implement actual update API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Close modal
      setEditModal({
        isOpen: false,
        category: null,
        isSaving: false
      })
      
      // Show success message
      showToast(`Category "${updatedCategory.name}" has been updated successfully`, 'success', 3000)
      
      // Refresh the categories list
      await fetchCategories()
    } catch (error) {
      console.error('Failed to update category', error)
      showToast('Failed to update category. Please try again.', 'error', 5000)
      setEditModal(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handleCloseEditModal = () => {
    if (editModal.isSaving) return // Prevent closing while saving
    setEditModal({
      isOpen: false,
      category: null,
      isSaving: false
    })
  }

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!openSortByMenu) return
      const t = e.target as Node | null
      if (!t) return
      if (sortByMenuRef.current && !sortByMenuRef.current.contains(t)) {
        setOpenSortByMenu(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openSortByMenu])

  useEffect(() => {
    const filtered = categories.filter(category => {
      // Search filter
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesSearch
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'foodCount':
          comparison = a.foodCount - b.foodCount
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    setFilteredCategories(filtered)
  }, [categories, searchTerm, sortBy, sortOrder])

  return (
    <div className="space-y-3">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            Food Categories
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Manage food categories for the platform.
          </p>
        </div>
        <AddCategoryModal
          triggerClassName="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[13px] leading-4 font-medium text-white hover:bg-blue-700"
          onCategoryAdded={fetchCategories}
        />
      </div>

      {/* Search and Sort Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="w-full flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 min-h-8 py-0 border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 gap-2 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ps-10 text-[13px] leading-normal ring-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <div ref={sortByMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setOpenSortByMenu((v) => !v)}
                className="relative group inline-flex h-8 min-h-8 items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] md:text-[13px] px-3 py-0 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200 w-full shrink-0 sm:w-56"
                aria-haspopup="menu"
                aria-expanded={openSortByMenu}
              >
                <span className="truncate">{sortByLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openSortByMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openSortByMenu && (
                <div className="absolute right-0 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                  {sortByOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value)
                        setOpenSortByMenu(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 min-h-8 inline-flex items-center justify-center px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[13px] leading-4 font-medium text-[oklch(0.208_0.042_265.755)]"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[13px] leading-4 font-normal text-slate-600">
              <Filter className="w-4 h-4" />
              <span>{filteredCategories.length} categories</span>
            </div>
          </div>
        </div>
      </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-2 text-gray-600">Loading categories...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No categories found' : 'No categories yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Get started by creating your first food category'
              }
            </p>
            {!searchTerm && (
              <AddCategoryModal 
                triggerClassName="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                onCategoryAdded={fetchCategories}
              />
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white">
            {/* Table Header */}
            <div className="bg-[#f9fbfc] px-6 py-2 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                <button 
                  onClick={() => {
                    setSortBy('name')
                    setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="col-span-3 text-left flex items-center gap-1"
                >
                  Category Name
                  {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <div className="col-span-3">Description</div>
                <button 
                  onClick={() => {
                    setSortBy('foodCount')
                    setSortOrder(sortBy === 'foodCount' && sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="col-span-2 text-left flex items-center gap-1"
                >
                  Food Count
                  {sortBy === 'foodCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  onClick={() => {
                    setSortBy('date')
                    setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="col-span-2 text-left flex items-center gap-1"
                >
                  Created Date
                  {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="px-6 py-2"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Category Name */}
                    <div className="col-span-3">
                      <h3 className="text-[13px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                        {category.name}
                      </h3>
                    </div>

                    {/* Description */}
                    <div className="col-span-3">
                      <p className="text-[13px] leading-4 font-normal text-slate-600">
                        {category.description || (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </p>
                    </div>

                    {/* Food Count */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category.foodCount} foods
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2">
                      <p className="text-[13px] leading-4 font-normal text-slate-600">{formatDate(category.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <button 
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                          onClick={() => handleEditCategory(category)}
                        >
                          Edit
                        </button>
                        <button 
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      {/* Delete Confirmation Modal */}
      <DeleteCategoryModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        categoryName={deleteModal.category?.name || ''}
        foodCount={deleteModal.category?.foodCount || 0}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={editModal.isOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        category={editModal.category}
        isSaving={editModal.isSaving}
      />
    </div>
  )
}
