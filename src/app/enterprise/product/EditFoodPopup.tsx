"use client";
import { useState, useEffect } from "react";
import { Camera, ChevronDown, X } from "lucide-react";
import { useEnterpriseUpload } from "@/hooks/use-enterprise-upload";
import { apiClient } from "@/services/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast-context";
import { Food } from "./FoodList";
import { buildAuthHeader } from "@/lib/auth-helpers";
import { Category } from "@/types/models";

interface EditFoodPopupProps {
  food: Food;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditFoodPopup({
  food,
  isOpen,
  onClose,
  onSuccess,
}: EditFoodPopupProps) {
  const { showToast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    food.ImageURL
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    foodName: food.DishName,
    category: food.foodCategory.CategoryName,
    categoryId: food.foodCategory.CategoryID,
    price: food.Price.toString(),
    isAvailable: food.IsAvailable ?? true,
    description: food.Description,
  });

  const { uploadImage, isUploading, uploadError, deleteImage } =
    useEnterpriseUpload();

  // Fetch categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/enterprise/category", {
          headers: { ...buildAuthHeader() },
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
        } else {
          console.error("Failed to fetch categories");
          setError("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Error fetching categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(food.ImageURL); // Reset to original image
  };

  const handleCategorySelect = (category: Category) => {
    setFormData((prev) => ({
      ...prev,
      category: category.CategoryName,
      categoryId: category.CategoryID,
    }));
    setShowDropdown(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.foodName.trim()) {
      setError("Food name is required");
      return false;
    }
    if (!formData.categoryId) {
      setError("Category is required");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Valid price is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let imageUrl = food.ImageURL;

      // Upload new image if selected
      if (selectedImage) {
        // Delete old image if it exists and is different from new one
        if (food.ImageURL) {
          try {
            await deleteImage(food.ImageURL);
          } catch (deleteError) {
            console.warn("Failed to delete old image:", deleteError);
            // Continue with upload even if delete fails
          }
        }

        // Upload new image
        const uploadResult = await uploadImage(selectedImage);
        if (uploadResult) {
          imageUrl = uploadResult;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // Update food item
      const updateData = {
        FoodID: food.FoodID,
        DishName: formData.foodName,
        Description: formData.description,
        Price: parseFloat(formData.price),
        IsAvailable: !!formData.isAvailable,
        FoodCategoryID: formData.categoryId,
        ImageURL: imageUrl,
      };

      await apiClient.put("/enterprise/food", updateData);
      showToast('Food item updated successfully', 'success', 3000)
      onSuccess();
    } catch (error) {
      console.error("Error updating food item:", error);
      setError("Failed to update food item. Please try again.");
      showToast('Failed to update food item', 'error', 4000)
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-1/2 w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Edit Food Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Display */}
          {(error || uploadError) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-800 text-sm">{error || uploadError}</p>
            </div>
          )}

          <form id="edit-food-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Food Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Food preview"
                      width={200}
                      height={200}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">Upload food image</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading || isSubmitting}
                />
                <label
                  htmlFor="image-upload"
                  className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Choose Image"}
                </label>
              </div>
            </div>

            {/* Food Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Name *
              </label>
              <input
                type="text"
                name="foodName"
                value={formData.foodName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center text-left"
                  disabled={isLoadingCategories || isSubmitting}
                >
                  <span
                    className={
                      formData.category ? "text-black" : "text-gray-500"
                    }
                  >
                    {isLoadingCategories
                      ? "Loading categories..."
                      : formData.category || "Select a category"}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>

                {showDropdown && categories.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category.CategoryID}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        disabled={isSubmitting}
                      >
                        {category.CategoryName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Availability Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available for sale
              </label>
              <div className="flex items-center space-x-3">
                <input
                  id="isAvailable"
                  type="checkbox"
                  checked={!!formData.isAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="isAvailable" className="text-sm text-gray-700">
                  {formData.isAvailable ? 'Currently selling' : 'Temporarily unavailable'}
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={isSubmitting}
              />
            </div>
          </form>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-food-form"
              className="flex-1 bg-blue-600 text-white"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? "Updating..." : "Update Food"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
