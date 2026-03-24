/**
 * Reusable validation utilities for forms and data validation
 * Can be used across the entire application
 */

export interface ValidationResult {
    isValid: boolean
    errors: string[]
}

export interface ValidationRule {
    field: string
    value: string
    rules: {
        required?: boolean
        minLength?: number
        maxLength?: number
        pattern?: RegExp
        custom?: (value: string) => string | null
    }
}

/**
 * Email validation - proper email format
 */
export function validateEmail(email: string): ValidationResult {
    const errors: string[] = []

    if (!email.trim()) {
        errors.push('Email is required')
        return { isValid: false, errors }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address')
    }

    if (email.length > 100) {
        errors.push('Email must be less than 100 characters')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Phone validation - exactly 11 digits, no special characters
 */
export function validatePhone(phone: string): ValidationResult {
    const errors: string[] = []

    if (!phone.trim()) {
        errors.push('Phone number is required')
        return { isValid: false, errors }
    }

    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')

    if (cleanPhone.length !== 11) {
        errors.push('Phone number must be exactly 11 digits')
    }

    // Check if original phone contains non-digit characters
    if (phone !== cleanPhone) {
        errors.push('Phone number can only contain digits')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Full name validation - no special characters, max 100 characters
 */
export function validateFullName(fullName: string): ValidationResult {
    const errors: string[] = []

    if (!fullName.trim()) {
        errors.push('Full name is required')
        return { isValid: false, errors }
    }

    if (fullName.length > 50) {
        errors.push('Full name must be less than 100 characters')
    }

    // Allow letters, numbers, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z0-9\s\-']+$/
    if (!nameRegex.test(fullName)) {
        errors.push('Full name can only contain letters, numbers, spaces, hyphens, and apostrophes')
    }

    // Check for multiple consecutive spaces
    if (/\s{2,}/.test(fullName)) {
        errors.push('Full name cannot contain multiple consecutive spaces')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Address validation - max 200 characters, not empty
 */
export function validateAddress(address: string): ValidationResult {
    const errors: string[] = []

    if (!address.trim()) {
        errors.push('Address is required')
        return { isValid: false, errors }
    }

    if (address.length > 100) {
        errors.push('Address must be less than 100 characters')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Password validation - minimum 6 characters with at least 1 special character, 1 number, 1 letter
 */
export function validatePassword(password: string): ValidationResult {
    const errors: string[] = []

    if (!password.trim()) {
        errors.push('Password is required')
        return { isValid: false, errors }
    }

    if (password.length < 6) {
        errors.push('Password must be at least 6 characters')
    }

    // Check for at least 1 letter
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('Password must contain at least 1 letter')
    }

    // Check for at least 1 number
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least 1 number')
    }

    // Check for at least 1 special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least 1 special character')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Username validation - alphanumeric and underscore only, 3-20 characters
 */
export function validateUsername(username: string): ValidationResult {
    const errors: string[] = []

    if (!username.trim()) {
        errors.push('Username is required')
        return { isValid: false, errors }
    }

    if (username.length < 3) {
        errors.push('Username must be at least 3 characters')
    }

    if (username.length > 20) {
        errors.push('Username must be less than 20 characters')
    }

    // Only alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Generic field validation with custom rules
 */
export function validateField(field: string, value: string, rules: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: string) => string | null
}): ValidationResult {
    const errors: string[] = []

    // Required validation
    if (rules.required && !value.trim()) {
        errors.push(`${field} is required`)
        return { isValid: false, errors }
    }

    // Skip other validations if value is empty and not required
    if (!value.trim() && !rules.required) {
        return { isValid: true, errors: [] }
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`)
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be less than ${rules.maxLength} characters`)
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`)
    }

    // Custom validation
    if (rules.custom) {
        const customError = rules.custom(value)
        if (customError) {
            errors.push(customError)
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Validate multiple fields at once
 */
export function validateFields(fields: ValidationRule[]): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {}

    fields.forEach(field => {
        results[field.field] = validateField(field.field, field.value, field.rules)
    })

    return results
}

/**
 * Check if all validations pass
 */
export function isFormValid(validationResults: Record<string, ValidationResult>): boolean {
    return Object.values(validationResults).every(result => result.isValid)
}

/**
 * Get all errors from validation results
 */
export function getAllErrors(validationResults: Record<string, ValidationResult>): string[] {
    const allErrors: string[] = []

    Object.values(validationResults).forEach(result => {
        allErrors.push(...result.errors)
    })

    return allErrors
}

/**
 * Profile form specific validation
 */
export function validateProfileForm(data: {
    fullName: string
    email: string
    phone: string
    address: string
}): Record<string, ValidationResult> {
    return {
        fullName: validateFullName(data.fullName),
        email: validateEmail(data.email),
        phone: validatePhone(data.phone),
        address: validateAddress(data.address)
    }
}

/**
 * Common validation rules for reuse
 */
export const commonValidationRules = {
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 100
    },
    phone: {
        required: true,
        pattern: /^\d{11}$/,
        custom: (value: string) => {
            const cleanPhone = value.replace(/\D/g, '')
            return cleanPhone.length !== 11 ? 'Phone number must be exactly 11 digits' : null
        }
    },
    fullName: {
        required: true,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s\-']+$/,
        custom: (value: string) => {
            if (/\s{2,}/.test(value)) {
                return 'Full name cannot contain multiple consecutive spaces'
            }
            return null
        }
    },
    address: {
        required: true,
        maxLength: 200
    },
    username: {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_]+$/
    },
    password: {
        required: true,
        minLength: 6,
        custom: (value: string) => {
            if (!/[a-zA-Z]/.test(value)) {
                return 'Password must contain at least 1 letter'
            }
            if (!/\d/.test(value)) {
                return 'Password must contain at least 1 number'
            }
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
                return 'Password must contain at least 1 special character'
            }
            return null
        }
    }
}
