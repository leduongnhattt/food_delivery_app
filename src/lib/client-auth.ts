// Client-side authentication utilities

export interface AuthError {
    message: string;
    field?: string;
    code?: string;
    status?: number;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface LoginData {
    username: string;
    password: string;
}

export interface GoogleLoginData {
    credential: string; // Google ID token
}

export interface AuthResponse {
    success: boolean;
    error?: AuthError;
    data?: any;
}

/**
 * Register a new user
 * @param data Registration data
 * @returns Response with success status and error information if any
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
    try {
        // Client-side validation
        if (!data.username || !data.email || !data.password || !data.confirmPassword) {
            return {
                success: false,
                error: { message: "signup.errors.allFieldsRequired" }
            };
        }

        if (data.password !== data.confirmPassword) {
            return {
                success: false,
                error: { message: "signup.errors.passwordMismatch", field: "confirmPassword" }
            };
        }

        if (data.password.length < 6) {
            return {
                success: false,
                error: { message: "Password must be at least 6 characters long.", field: "password" }
            };
        }

        // Check for at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.password)) {
            return {
                success: false,
                error: { message: "Password must contain at least one special character.", field: "password" }
            };
        }

        // Check for at least one number
        if (!/\d/.test(data.password)) {
            return {
                success: false,
                error: { message: "Password must contain at least one number.", field: "password" }
            };
        }

        // Check for at least one letter
        if (!/[a-zA-Z]/.test(data.password)) {
            return {
                success: false,
                error: { message: "Password must contain at least one letter.", field: "password" }
            };
        }

        // Call the API
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    message: typeof result.error === 'string' ? result.error : "signup.errors.registrationFailed",
                    field: result.field
                }
            };
        }

        return {
            success: true,
            data: result.account
        };
    } catch (err) {
        return {
            success: false,
            error: {
                message: err instanceof Error ? err.message : "signup.errors.unexpectedError"
            }
        };
    }
}

/**
 * Authenticate a user
 * @param data Login credentials
 * @returns Response with success status and auth tokens if successful
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
    try {
        // Client-side validation
        if (!data.username || !data.password) {
            return {
                success: false,
                error: { message: "Username and password are required" }
            };
        }

        // Call the API
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            // Map locked account to a friendly popup message (vi)
            if (response.status === 403) {
                return {
                    success: false,
                    error: {
                        message: "Your account has been locked. Please contact support.",
                        code: 'ACCOUNT_LOCKED',
                        status: 403
                    }
                };
            }
            return {
                success: false,
                error: {
                    message: result.error || "Invalid username or password"
                }
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (err) {
        return {
            success: false,
            error: {
                message: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        };
    }
}

/**
 * Authenticate with Google
 * @param data Google credential data
 * @returns Response with success status and auth tokens if successful
 */
export async function loginWithGoogle(data: GoogleLoginData): Promise<AuthResponse> {
    try {
        // Client-side validation
        if (!data.credential) {
            return {
                success: false,
                error: { message: "Google credential is required" }
            };
        }

        // Call the API
        const response = await fetch("/api/auth/google", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    message: result.error || "Google authentication failed"
                }
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (err) {
        return {
            success: false,
            error: {
                message: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        };
    }
}
