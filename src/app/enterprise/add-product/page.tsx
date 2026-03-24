"use client";
import { Camera, ChevronDown } from "lucide-react";
import { useFoodForm } from "@/hooks/use-food-form";
import Image from "next/image";
import { Button } from "@/components/ui/button";


export default function FoodUploadForm() {
  const {
    // Form data
    formData,
    imagePreview,
    previewOpen,
    setPreviewOpen,
    
    // Categories
    categories,
    isLoadingCategories,
    showDropdown,
    setShowDropdown,
    
    // States
    isSubmitting,
    isUploading,
    uploadError,
    isFormValid,
    
    // Actions
    handleImageUpload,
    handleImageFile,
    removeImage,
    handleInputChange,
    handleCategorySelect,
    resetForm,
    handleSubmit,
  } = useFoodForm();


  return (
    <div className="relative">
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-blue-50 via-indigo-50 to-fuchsia-50" />
        <div className="absolute -top-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-200/30 blur-3xl" />
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-indigo-200/30 blur-2xl" />
      </div>

      {/* Header */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl border border-white/50 bg-white/70 p-6 shadow-md backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create a Stunning Dish</h1>
              <p className="mt-1 text-sm text-gray-600">Craft a beautiful product card with image, price and category.</p>
            </div>
            <div className="hidden gap-2 sm:flex">
              <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting || isUploading}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Saving
                  </div>
                ) : (
                  "Publish Dish"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Image Upload & Live Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-4 space-y-4">
              {/* Upload Card */}
              <div
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    handleImageFile(file);
                  }
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Dish Image</h3>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        width={420}
                        height={420}
                        src={imagePreview}
                        alt="Preview"
                        className="h-72 lg:h-96 w-full cursor-zoom-in rounded-xl border object-contain bg-gray-50"
                        onClick={() => setPreviewOpen(true)}
                      />
                    </div>
                  ) : (
                  <label className="block cursor-pointer">
                      <div className="flex h-72 lg:h-96 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white text-center transition-all hover:border-blue-400">
                        {isUploading ? (
                          <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-blue-500"></div>
                        ) : (
                          <>
                            <Camera className="h-10 w-10 text-gray-400" />
                            <span className="mt-2 text-sm text-gray-500">Click or drag & drop image here</span>
                            <span className="mt-1 text-xs text-gray-400">JPG, PNG or WEBP up to 5MB</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
                {uploadError && (
                  <p className="mt-2 text-xs text-red-500">{uploadError}</p>
                )}
              </div>

              {/* Live Product Card Preview */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview || "/images/hero-image.png"}
                    alt="preview"
                    className="h-44 w-full object-contain bg-gray-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formData.foodName || "Untitled Dish"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formData.category || "No category"}
                      </div>
                    </div>
                    <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {formData.price ? `$${Number(formData.price).toFixed(2)}` : "$0.00"}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                    {formData.description || "A short delicious description will appear here."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-7">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Basic information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700">Food name</label>
                    <input
                      type="text"
                      placeholder="e.g., Spicy Tuna Bowl"
                      value={formData.foodName}
                      onChange={(e) => handleInputChange("foodName", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <label className="mb-2 block text-xs font-medium text-gray-700">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      disabled={isLoadingCategories}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className={formData.category ? "text-gray-900" : "text-gray-500"}>
                        {isLoadingCategories ? "Loading..." : formData.category || "Select a category"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    {showDropdown && !isLoadingCategories && (
                      <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {categories.map((category) => (
                          <button
                            key={category.CategoryID}
                            type="button"
                            onClick={() => handleCategorySelect(category)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="text-sm font-medium text-gray-900">{category.CategoryName}</div>
                            {category.Description && (
                              <div className="text-xs text-gray-500">{category.Description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing & Availability */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Pricing & availability</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700">Price</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Description</h3>
                <textarea
                  placeholder="Describe the taste, ingredients, and any special notes"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions (mobile) */}
              <div className="flex gap-2 sm:hidden">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Reset</Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting || isUploading}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Saving
                    </div>
                  ) : (
                    "Publish Dish"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {showDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
      )}

      {/* Fullscreen preview */}
      {previewOpen && imagePreview && (
        <div
          className="fixed inset-0 z-[100] cursor-zoom-out bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="preview"
            className="mx-auto max-h-[95vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
