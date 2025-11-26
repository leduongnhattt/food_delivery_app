import { useState, useEffect } from "react";
import { useEnterpriseUpload } from "./use-enterprise-upload";
import { foodManagementService, type Category } from "@/services/food-management.service";
import { useToast } from "@/contexts/toast-context";

export interface FoodFormData {
    foodName: string;
    category: string;
    categoryId: string;
    price: string;
    isAvailable?: boolean;
    description: string;
}

const initialFormData: FoodFormData = {
    foodName: "",
    category: "",
    categoryId: "",
    price: "",
    isAvailable: true,
    description: "",
};

export const useFoodForm = () => {
    const [formData, setFormData] = useState<FoodFormData>(initialFormData);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { uploadImage, isUploading, uploadError } = useEnterpriseUpload();
    const { showToast } = useToast();

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categories = await foodManagementService.getCategories();
                setCategories(categories);
            } catch (error) {
                console.error("Error fetching categories:", error);
                showToast("Failed to load categories. Please try again.", "error");
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, [showToast]);

    // Handle image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setImagePreview(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Support direct File (for drag & drop)
    const handleImageFile = (file: File) => {
        if (!file) return;
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setImagePreview(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    // Remove image
    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    // Handle input changes
    const handleInputChange = (field: keyof FoodFormData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle category selection
    const handleCategorySelect = (category: Category) => {
        setFormData((prev) => ({
            ...prev,
            category: category.CategoryName,
            categoryId: category.CategoryID,
        }));
        setShowDropdown(false);
    };

    // Reset form
    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedImage(null);
        setImagePreview(null);
    };

    // Submit form
    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // 1. Upload image to Cloudinary if selected and get URL
            const imageURL = selectedImage ? await uploadImage(selectedImage) : "";

            if (selectedImage && !imageURL) {
                throw new Error("Failed to upload image");
            }

            // 2. Build payload
            const foodData = {
                DishName: formData.foodName.trim(),
                Description: formData.description?.trim() || "",
                Price: Number(formData.price),
                IsAvailable: formData.isAvailable !== false,
                ImageURL: imageURL || undefined,
                FoodCategoryID: formData.categoryId,
                Stock: 0,
            };

            // 3. Call API
            await foodManagementService.createFood(foodData);

            // 4. Success feedback + reset form
            showToast("Food item created successfully!", "success");
            resetForm();
        } catch (error) {
            console.error("Error creating food:", error);
            showToast("Failed to create food item. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Form validation
    const isFormValid =
        formData.foodName &&
        formData.categoryId &&
        formData.price;

    return {
        // Form data
        formData,
        selectedImage,
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
    };
};
