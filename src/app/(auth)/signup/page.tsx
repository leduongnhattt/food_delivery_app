"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessPopup } from "@/components/ui/success-popup";
import { PasswordStrength } from "@/components/ui/password-strength";
import { AuthNavLink } from "@/components/auth/auth-nav-link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/client-auth";
import { usePasswordToggle } from "@/hooks/ui-hooks";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/contexts/toast-context";
import GoogleAuthButton from "@/components/ui/google-auth-button";
import { useAuthValidation, useEmailField, type EmailInvalidReason } from "@/hooks/auth-hooks";

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

  const passwordToggle = usePasswordToggle();
  const confirmPasswordToggle = usePasswordToggle();

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

  const clearForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    clearForm();
    router.push("/signin?registered=success");
  };

  const handleSubmit = async () => {
    if (i18nLoading) {
      return;
    }

    const { sanitized, isValid } = validateEmailValue(email);
    if (!isValid) {
      showToast(t("signup.errors.invalidEmail"), "error");
      return;
    }
    const sanitizedEmail = sanitized;

    if (!validateSignupForm(username, password, confirmPassword, setUsername, setPassword, setConfirmPassword)) {
      return;
    }

    try {
      setIsLoading(true);

      const result = await registerUser({
        username,
        email: sanitizedEmail,
        password,
        confirmPassword,
      });

      if (!result.success) {
        const errorMessage = result.error?.message;

        let displayMessage;
        if (errorMessage && errorMessage.includes("signup.errors.")) {
          displayMessage = t(errorMessage);
        } else {
          displayMessage = errorMessage || t("signup.errors.registrationFailed");
        }

        showToast(displayMessage, "error");

        if (result.error?.field === "username") {
          setUsername("");
        } else if (result.error?.field === "email") {
          setEmail("");
        } else {
          clearForm();
        }
        return;
      }

      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Failed to sign up:", err);
      showToast(t("signup.errors.unexpectedError"), "error");
      clearForm();
    } finally {
      setIsLoading(false);
    }
  };

  if (i18nLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-blue-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-0 w-full">
      <SuccessPopup isOpen={showSuccessPopup} onClose={handleSuccessPopupClose} autoClose={false} />

      <h1 className="mb-2 text-center text-lg font-bold text-black sm:mb-3 sm:text-2xl lg:text-3xl">{t("signup.title")}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-2 sm:space-y-3"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">{t("common.username")}</label>
          <Input
            type="text"
            placeholder={t("common.usernamePlaceholder")}
            value={username}
            onChange={(e) => {
              const value = e.target.value;
              setUsername(value);

              if (value.length >= 30) {
                const message = t("signin.errors.usernameTooLong");
                e.target.setCustomValidity(message);
                if (value.length === 30) {
                  setTimeout(() => {
                    e.target.reportValidity();
                  }, 0);
                }
              } else {
                e.target.setCustomValidity("");
              }
            }}
            onInvalid={(e) => {
              if (username.length >= 30) {
                const message = t("signin.errors.usernameTooLong");
                e.currentTarget.setCustomValidity(message);
              } else {
                const message = t("signin.errors.usernameRequired");
                e.currentTarget.setCustomValidity(message);
              }
            }}
            maxLength={30}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-red-500 sm:h-11 sm:px-4 sm:text-base"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">{t("signup.email")}</label>
          <Input
            type="email"
            placeholder={t("signup.emailPlaceholder")}
            value={email}
            onChange={handleEmailChange}
            onInvalid={handleEmailInvalid}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-red-500 sm:h-11 sm:px-4 sm:text-base"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">{t("common.password")}</label>
          <div className="relative">
            <Input
              type={passwordToggle.showPassword ? "text" : "password"}
              placeholder={t("common.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pr-10 pl-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-red-500 sm:h-11 sm:pr-12 sm:pl-4 sm:text-base"
              required
            />
            <button
              type="button"
              onClick={passwordToggle.togglePasswordVisibility}
              className="absolute right-2 top-1/2 -translate-y-1/2 transform text-gray-500 sm:right-3 hover:text-gray-700"
            >
              {passwordToggle.showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              )}
            </button>
          </div>

          <PasswordStrength password={password} compact className="mt-2" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">{t("signup.confirmPassword")}</label>
          <div className="relative">
            <Input
              type={confirmPasswordToggle.showPassword ? "text" : "password"}
              placeholder={t("signup.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pr-10 pl-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-red-500 sm:h-11 sm:pr-12 sm:pl-4 sm:text-base"
              required
            />
            <button
              type="button"
              onClick={confirmPasswordToggle.togglePasswordVisibility}
              className="absolute right-2 top-1/2 -translate-y-1/2 transform text-gray-500 sm:right-3 hover:text-gray-700"
            >
              {confirmPasswordToggle.showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Button
            type="submit"
            className="flex h-10 w-full items-center justify-center rounded-lg bg-red-500 text-sm font-medium text-white transition-all hover:bg-red-600 sm:h-11 sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {t("signup.signingUp")}
              </div>
            ) : (
              t("signup.signUpButton")
            )}
          </Button>

          <GoogleAuthButton onError={(errorMessage) => showToast(errorMessage, "error")} />
        </div>
      </form>

      <div className="mt-2 text-center sm:mt-3">
        <p className="text-xs text-gray-600 sm:text-sm">
          {t("signup.alreadyHaveAccount")}{" "}
          <AuthNavLink
            href="/signin"
            className="font-medium text-red-500 transition-colors duration-200 ease-out hover:text-red-600"
          >
            {t("common.signIn")}
          </AuthNavLink>
        </p>
      </div>
    </div>
  );
}
