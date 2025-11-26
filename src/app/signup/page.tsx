"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessPopup } from "@/components/ui/success-popup";
import { PasswordStrength } from "@/components/ui/password-strength";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/client-auth";
import { usePasswordToggle } from "@/hooks/use-password-toggle";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/contexts/toast-context";
import GoogleAuthButton from "@/components/ui/google-auth-button";
import { useAuthValidation } from "@/hooks/use-auth-validation";
import { useEmailField } from "@/hooks/use-email-field";
import Image from "next/image";
import type { EmailInvalidReason } from "@/hooks/use-email-field";

export default function SignupPage() {
  const router = useRouter();
  const { t, isLoading: i18nLoading } = useTranslations();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // Password toggle hooks
  const passwordToggle = usePasswordToggle();
  const confirmPasswordToggle = usePasswordToggle();
  
  // Auth validation hook
  const { validateSignupForm } = useAuthValidation();

  const handleEmailInvalidToast = (reason: EmailInvalidReason) => {
    if (reason === "missing") {
      showToast(t("signup.errors.allFieldsRequired"), "error");
    } else {
      showToast(t("signup.errors.invalidEmail"), "error");
    }
  };

  const {
    handleChange: handleEmailChange,
    handleInvalid: handleEmailInvalid,
    validateEmailValue,
  } = useEmailField({
    setValue: setEmail,
    onInvalid: handleEmailInvalidToast,
  });

  // Clear form fields when needed
  const clearForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  // Handle success popup close
  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    clearForm();
    // Redirect to signin page
    router.push("/signin?registered=success");
  };

  const handleSubmit = async () => {
    // Don't proceed if translations are still loading
    if (i18nLoading) {
      return;
    }
    
    // Validate email format
    const { sanitized, isValid } = validateEmailValue(email);
    if (!isValid) {
      showToast(t("signup.errors.invalidEmail"), "error")
      return
    }
    const sanitizedEmail = sanitized

    // Validate form fields using shared validation logic
    if (!validateSignupForm(username, password, confirmPassword, setUsername, setPassword, setConfirmPassword)) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await registerUser({
        username,
        email: sanitizedEmail,
        password,
        confirmPassword
      });
      
      if (!result.success) {
        const errorMessage = result.error?.message;
        
        // Check if it's a translation key or direct message
        let displayMessage;
        if (errorMessage && errorMessage.includes('signup.errors.')) {
          displayMessage = t(errorMessage);
        } else {
          displayMessage = errorMessage || t("signup.errors.registrationFailed");
        }
        
        showToast(displayMessage, "error");
        
        // Clear specific fields based on error type
        if (result.error?.field === 'username') {
          setUsername("");
        } else if (result.error?.field === 'email') {
          setEmail("");
        } else {
          // Clear all fields for general errors
          clearForm();
        }
        return;
      }
      
      // Registration successful - show success popup
      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Failed to sign up:", err);
      showToast(t("signup.errors.unexpectedError"), "error");
      // Clear all fields for unexpected errors
      clearForm();
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
      <div className="w-full max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-4xl bg-white rounded-lg sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:min-h-[600px]">
          <div className="md:hidden w-full bg-white flex items-center justify-center py-4">
            <div className="w-20 h-20">
              <Image 
                src={`${process.env.BASE_IMAGE_URL}/logo.png`}
                alt="Hanala Food Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
          
          {/* Sign up form */}
          <div className="w-full md:w-1/2 bg-blue-100 flex items-center justify-center p-3 sm:p-6 md:p-8">
            <div className="w-full max-w-sm mx-auto">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-black mb-4 sm:mb-8 text-center">{t("signup.title")}</h1>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3 sm:space-y-6">
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("common.username")}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("common.usernamePlaceholder")}
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value
                      setUsername(value)

                      if (value.length >= 30) {
                        const message = t("signin.errors.usernameTooLong")
                        e.target.setCustomValidity(message)
                        if (value.length === 30) {
                          setTimeout(() => {
                            e.target.reportValidity()
                          }, 0)
                        }
                      } else {
                        e.target.setCustomValidity("")
                      }
                    }}
                    onInvalid={(e) => {
                      if (username.length >= 30) {
                        const message = t("signin.errors.usernameTooLong")
                        e.currentTarget.setCustomValidity(message)
                      } else {
                        const message = t("signin.errors.usernameRequired")
                        e.currentTarget.setCustomValidity(message)
                      }
                    }}
                    maxLength={30}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all text-sm sm:text-base shadow-sm"
                    required
                  />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("signup.email")}
              </label>
              <Input
                type="email"
                placeholder={t("signup.emailPlaceholder")}
                value={email}
                onChange={handleEmailChange}
                onInvalid={handleEmailInvalid}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all text-sm sm:text-base shadow-sm"
                required
              />
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("common.password")}
                  </label>
                  <div className="relative">
                    <Input
                      type={passwordToggle.showPassword ? "text" : "password"}
                      placeholder={t("common.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              
              <PasswordStrength password={password} className="mt-3" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("signup.confirmPassword")}
              </label>
              <div className="relative">
                <Input
                  type={confirmPasswordToggle.showPassword ? "text" : "password"}
                  placeholder={t("signup.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
            
            {/* Actions */}
            <div className="space-y-2">
              <Button 
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white h-12 rounded-lg font-medium transition-all text-sm sm:text-base flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("signup.signingUp")}
                  </div>
                ) : (
                  t("signup.signUpButton")
                )}
              </Button>

              {/* Continue with Google */}
              <GoogleAuthButton 
                onError={(errorMessage) => showToast(errorMessage, "error")}
              />
            </div>
          </form>

          {/* Footer */}
          <div className="mt-3 sm:mt-6 text-center">
            <p className="text-gray-600 text-xs sm:text-base">
              {t("signup.alreadyHaveAccount")}{" "}
                  <Link 
                    href="/signin" 
                    className="text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    {t("common.signIn")}
                  </Link>
            </p>
          </div>
            </div>
          </div>

          <div className="hidden md:flex w-1/2 bg-white items-center justify-center relative p-6">
            <Image 
              src={`${process.env.BASE_IMAGE_URL}/logo.png`}
              alt="Hanala Food Logo"
              width={320}
              height={320}
              className="max-w-full max-h-full object-contain"
              priority
            />
          </div>
        </div>
      </div>

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={handleSuccessPopupClose}
        autoClose={false}
      />
    </div>
  );
}
