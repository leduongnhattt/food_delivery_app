"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorDisplay } from "@/components/ui/error-display";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePasswordToggle } from "@/hooks/use-password-toggle";
import { useTranslations } from "@/lib/i18n";
import { PasswordService } from "@/services/password.service";
import { validatePasswordStrength, validatePasswordConfirmation } from "@/lib/auth-validation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: i18nLoading } = useTranslations();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  // Password toggle hook
  const passwordToggle = usePasswordToggle();
  const confirmPasswordToggle = usePasswordToggle();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");
    
    if (!tokenParam || !emailParam) {
      router.push("/forgot-password");
      return;
    }
    
    setToken(tokenParam);
    setEmail(emailParam);
  }, [searchParams, router]);

  // Clear error when user starts typing
  const handleFieldFocus = () => {
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    // Validate password strength using shared auth logic (inline message)
    const strengthResult = validatePasswordStrength(newPassword);
    if (!strengthResult.isValid) {
      setError(strengthResult.errorMessage || "Password must meet the requirements.");
      if (strengthResult.fieldToClear === "password") {
        setNewPassword("");
      }
      return;
    }

    const matchResult = validatePasswordConfirmation(newPassword, confirmPassword);
    if (!matchResult.isValid) {
      setError(matchResult.errorMessage || "Passwords do not match.");
      if (matchResult.fieldToClear === "both") {
        setNewPassword("");
        setConfirmPassword("");
      }
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await PasswordService.resetPassword(token, newPassword);
      
      if (!result.success) {
        setError(result.error || "Failed to reset password");
        return;
      }
      
      // Redirect to signin page immediately
      router.push("/signin");
      
    } catch (err) {
      console.error("Failed to reset password:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while translations are loading
  if (i18nLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token || !email) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-lg sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              Create New Password
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Create a new password for <strong>{email}</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={passwordToggle.showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={handleFieldFocus}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all pr-10 sm:pr-12 text-sm sm:text-base shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={passwordToggle.togglePasswordVisibility}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {passwordToggle.showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={confirmPasswordToggle.showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={handleFieldFocus}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all pr-10 sm:pr-12 text-sm sm:text-base shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={confirmPasswordToggle.togglePasswordVisibility}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {confirmPasswordToggle.showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            <ErrorDisplay 
              error={error} 
              type="error"
              onClose={() => setError("")}
              className="mb-4"
            />

            
            {/* Submit button */}
            <Button 
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white h-12 rounded-lg font-medium transition-all text-sm sm:text-base flex items-center justify-center"
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Resetting Password...
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Remember your password?{" "}
              <Link 
                href="/signin" 
                className="text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
