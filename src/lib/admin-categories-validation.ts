export interface CategoryFormData {
    categoryName: string
    description: string
}

export interface CategoryFormErrors {
    categoryName?: string
    description?: string
}

export function validateCategoryForm(form: CategoryFormData): CategoryFormErrors {
    const errors: CategoryFormErrors = {}

    // Category name validation
    if (!form.categoryName) {
        errors.categoryName = 'Category name is required'
    } else if (form.categoryName.length < 2) {
        errors.categoryName = 'Category name must be at least 2 characters'
    } else if (form.categoryName.length > 50) {
        errors.categoryName = 'Category name must be less than 50 characters'
    } else if (!/^[a-zA-Z0-9\s\-&]+$/.test(form.categoryName)) {
        errors.categoryName = 'Category name can only contain letters, numbers, spaces, hyphens, and ampersands'
    }

    // Description validation (optional but if provided, should be reasonable)
    if (form.description && form.description.length > 255) {
        errors.description = 'Description must be less than 255 characters'
    }

    return errors
}

export function canProceedCategoryForm(errors: CategoryFormErrors): boolean {
    return !errors.categoryName && !errors.description
}
