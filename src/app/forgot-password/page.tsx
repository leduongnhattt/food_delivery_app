"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorDisplay } from "@/components/ui/error-display";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n";
import { PasswordService } from "@/services/password.service";
import { useEmailField } from "@/hooks/use-email-field";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t, isLoading: i18nLoading } = useTranslations();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    handleChange: handleEmailChange,
    handleInvalid: handleEmailInvalid,
    validateEmailValue,
  } = useEmailField({
    setValue: (value) => {
      setEmail(value);
      if (error) setError("");
    },
    onInvalid: () => {
      setError(t("forgotPassword.errors.invalidEmail"));
    },
  });

  const handleSubmit = async () => {
    setError("");
    
    const { sanitized, isValid } = validateEmailValue(email);
    if (!isValid) {
      setError(t("forgotPassword.errors.invalidEmail"));
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await PasswordService.sendResetCode(sanitized);
      
      if (!result.success) {
        setError(result.error || t("forgotPassword.errors.sendCodeFailed"));
        return;
      }
      
      // Redirect to verify code page immediately
      router.push(`/forgot-password/verify-code?email=${encodeURIComponent(sanitized)}`);
      
    } catch (err) {
      console.error("Failed to send reset code:", err);
      setError(t("forgotPassword.errors.unexpectedError"));
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

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-lg sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              Reset Your Password
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Enter your email address and we'll send you a reset code
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={handleEmailChange}
                onInvalid={handleEmailInvalid}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all text-sm sm:text-base shadow-sm"
                required
              />
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
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending Reset Code...
                </div>
              ) : (
                "Send Reset Code"
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
