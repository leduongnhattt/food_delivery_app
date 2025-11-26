"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorDisplay } from "@/components/ui/error-display";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/i18n";
import { PasswordService } from "@/services/password.service";

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: i18nLoading } = useTranslations();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (!emailParam) {
      router.push("/forgot-password");
      return;
    }
    setEmail(emailParam);
  }, [searchParams, router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsExpired(true);
    }
  }, [timeLeft]);

  // Clear error when user starts typing
  const handleFieldFocus = () => {
    if (error) {
      setError("");
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    try {
      setIsResending(true);
      setError("");
      setResendSuccess(false);
      
      const result = await PasswordService.resendResetCode(email);

      if (result.success) {
        setResendSuccess(true);
        setTimeLeft(60);
        setIsExpired(false);
        setCode("");
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setResendSuccess(false);
        }, 3000);
      } else {
        setError(result.error || "Failed to resend code. Please try again.");
      }
    } catch (error) {
      console.error("Failed to resend reset code:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Handle code input with formatting
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    if (value.length <= 6) {
      setCode(value);
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    // Check if code is expired
    if (isExpired) {
      setError("The verification code has expired. Please request a new one.");
      return;
    }
    
    // Validate code
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await PasswordService.verifyResetCode(email, code);
      
      if (!result.success) {
        setError(result.error || "Invalid or expired reset code");
        return;
      }
      
      // Redirect to reset password page with token
      router.push(`/forgot-password/reset?token=${result.tokenId}&email=${encodeURIComponent(email)}`);
      
    } catch (err) {
      console.error("Failed to verify reset code:", err);
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

  if (!email) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-lg sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              Verify Your Identity
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reset Code
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                onFocus={handleFieldFocus}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all shadow-sm text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code sent to your email
            </p>
            
            {/* Countdown Timer */}
            <div className="mt-4">
              {!isExpired ? (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-800">Verification Code</p>
                        <p className="text-xs text-orange-600">Valid for {timeLeft} seconds</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">{timeLeft}</div>
                      <div className="text-xs text-orange-500">seconds</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-orange-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / 60) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-800">Code Expired</p>
                        <p className="text-xs text-red-600">Please request a new code</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">0</div>
                      <div className="text-xs text-red-500">seconds</div>
                    </div>
                  </div>
                  
                  {/* Expired Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full w-0"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Error message */}
            <ErrorDisplay 
              error={error} 
              type="error"
              onClose={() => setError("")}
              className="mb-4"
            />
            
            {/* Success message for resend */}
            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm mb-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  New verification code has been sent to your email!
                </div>
              </div>
            )}
            
            {/* Submit button */}
            <Button 
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white h-12 rounded-lg font-medium transition-all text-sm sm:text-base flex items-center justify-center"
              disabled={isLoading || code.length !== 6 || isExpired}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying Code...
                </div>
              ) : (
                "Verify Code"
              )}
            </Button>
            
            {/* Request New Code Button (when expired) */}
            {isExpired && (
              <Button 
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-lg font-medium transition-all text-sm sm:text-base flex items-center justify-center mt-3"
              >
                {isResending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Request New Code
                  </>
                )}
              </Button>
            )}
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600 text-sm">
              Didn't receive the code?{" "}
              <button 
                onClick={handleResendCode}
                disabled={isResending}
                className="text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </button>
            </p>
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

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyCodeContent />
    </Suspense>
  );
}
