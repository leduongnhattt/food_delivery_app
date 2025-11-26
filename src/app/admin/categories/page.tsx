"use client"

import { useCallback, useEffect, useState } from 'react'
import { Tag, Search, Filter, ArrowUpDown } from 'lucide-react'
import AddCategoryModal from '@/components/admin/AddCategoryModal'
import DeleteCategoryModal from '@/components/admin/DeleteCategoryModal'
import EditCategoryModal from '@/components/admin/EditCategoryModal'
import { getAllCategories } from '@/services/admin-categories.service'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-6 h-6 text-emerald-600" />
                Food Categories
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage food categories for the platform
              </p>
            </div>
            <AddCategoryModal 
              triggerClassName="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              onCategoryAdded={fetchCategories}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Search and Sort Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
              />
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'foodCount')}
                className="px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="foodCount">Sort by Food Count</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 text-sm text-gray-600 hover:text-gray-800"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{filteredCategories.length} categories</span>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                <button 
                  onClick={() => {
                    setSortBy('name')
                    setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="col-span-3 text-left hover:text-gray-800 flex items-center gap-1"
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
                  className="col-span-2 text-left hover:text-gray-800 flex items-center gap-1"
                >
                  Food Count
                  {sortBy === 'foodCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  onClick={() => {
                    setSortBy('date')
                    setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                  className="col-span-2 text-left hover:text-gray-800 flex items-center gap-1"
                >
                  Created Date
                  {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Category Name */}
                    <div className="col-span-3">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    </div>

                    {/* Description */}
                    <div className="col-span-3">
                      <p className="text-sm text-gray-600">
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
                      <p className="text-sm text-gray-600">{formatDate(category.createdAt)}</p>
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
      </div>

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
