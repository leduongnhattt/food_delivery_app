import { useToast } from "@/contexts/toast-context";
import { validateUsernameLength, validatePasswordStrength, validatePasswordConfirmation } from "@/lib/auth-validation";

/**
 * Custom hook for authentication form validation
 * Provides reusable validation logic for signin/signup forms
 */
export function useAuthValidation() {
    const { showToast } = useToast();

    /**
     * Validate username and show error if invalid
     */
    const validateUsername = (username: string, setUsername: (value: string) => void): boolean => {
        const result = validateUsernameLength(username);
        if (!result.isValid) {
            showToast(result.errorMessage!, "error");
            if (result.fieldToClear === "username") {
                setUsername("");
            }
            return false;
        }
        return true;
    };

    /**
     * Validate password strength and show error if invalid
     */
    const validatePassword = (password: string, setPassword: (value: string) => void): boolean => {
        const result = validatePasswordStrength(password);
        if (!result.isValid) {
            showToast(result.errorMessage!, "error");
            if (result.fieldToClear === "password") {
                setPassword("");
            }
            return false;
        }
        return true;
    };

    /**
     * Validate password confirmation and show error if invalid
     */
    const validatePasswordMatch = (
        password: string,
        confirmPassword: string,
        setPassword: (value: string) => void,
        setConfirmPassword: (value: string) => void
    ): boolean => {
        const result = validatePasswordConfirmation(password, confirmPassword);
        if (!result.isValid) {
            showToast(result.errorMessage!, "error");
            if (result.fieldToClear === "both") {
                setPassword("");
                setConfirmPassword("");
            }
            return false;
        }
        return true;
    };

    /**
     * Validate all signin form fields
     */
    const validateSigninForm = (
        username: string,
        password: string,
        setUsername: (value: string) => void,
        setPassword: (value: string) => void
    ): boolean => {
        if (!validateUsername(username, setUsername)) return false;
        if (!validatePassword(password, setPassword)) return false;
        return true;
    };

    /**
     * Validate all signup form fields
     */
    const validateSignupForm = (
        username: string,
        password: string,
        confirmPassword: string,
        setUsername: (value: string) => void,
        setPassword: (value: string) => void,
        setConfirmPassword: (value: string) => void
    ): boolean => {
        if (!validateUsername(username, setUsername)) return false;
        if (!validatePassword(password, setPassword)) return false;
        if (!validatePasswordMatch(password, confirmPassword, setPassword, setConfirmPassword)) return false;
        return true;
    };

    return {
        validateUsername,
        validatePassword,
        validatePasswordMatch,
        validateSigninForm,
        validateSignupForm
    };
}

