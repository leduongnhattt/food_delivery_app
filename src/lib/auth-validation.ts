/**
 * Shared validation utilities for authentication forms
 * Used across signin, signup, and other auth pages
 */

export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
    fieldToClear?: string;
}

/**
 * Validate username length
 */
export function validateUsernameLength(username: string): ValidationResult {
    if (username.length > 30) {
        return {
            isValid: false,
            errorMessage: "Username must not exceed 30 characters.",
            fieldToClear: "username"
        };
    }
    return { isValid: true };
}

/**
 * Validate password strength requirements
 */
export function validatePasswordStrength(password: string): ValidationResult {
    if (!password.trim()) {
        return {
            isValid: false,
            errorMessage: "Password is required.",
            fieldToClear: "password"
        };
    }
    if (password.length < 6) {
        return {
            isValid: false,
            errorMessage: "Password must be at least 6 characters long.",
            fieldToClear: "password"
        };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return {
            isValid: false,
            errorMessage: "Password must contain at least one special character.",
            fieldToClear: "password"
        };
    }

    if (!/\d/.test(password)) {
        return {
            isValid: false,
            errorMessage: "Password must contain at least one number.",
            fieldToClear: "password"
        };
    }

    if (!/[a-zA-Z]/.test(password)) {
        return {
            isValid: false,
            errorMessage: "Password must contain at least one letter.",
            fieldToClear: "password"
        };
    }

    return { isValid: true };
}

/**
 * Validate password confirmation match
 */
export function validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
    if (password !== confirmPassword) {
        return {
            isValid: false,
            errorMessage: "Passwords do not match.",
            fieldToClear: "both"
        };
    }
    return { isValid: true };
}

/**
 * Common validation patterns for auth forms
 */
export const authValidationPatterns = {
    username: {
        maxLength: 30,
        errorMessage: "Username must not exceed 30 characters."
    },
    password: {
        minLength: 6,
        specialCharPattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        numberPattern: /\d/,
        letterPattern: /[a-zA-Z]/,
        errorMessages: {
            minLength: "Password must be at least 6 characters long.",
            specialChar: "Password must contain at least one special character.",
            number: "Password must contain at least one number.",
            letter: "Password must contain at least one letter."
        }
    }
};

