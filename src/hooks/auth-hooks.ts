"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import {
  getCurrentUser,
  isAuthenticated,
  logoutUser,
  type AuthUser,
} from "@/lib/auth-helpers"
import { useToast } from "@/contexts/toast-context"
import {
  validatePasswordConfirmation,
  validatePasswordStrength,
  validateUsernameLength,
} from "@/lib/auth-validation"

interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  })
  const router = useRouter()
  const { resetAfterLogout } = useCart()

  const checkAuth = async () => {
    try {
      if (!isAuthenticated()) {
        setAuthState({ isAuthenticated: false, user: null, isLoading: false })
        return
      }

      const user = await getCurrentUser()
      setAuthState({ isAuthenticated: user !== null, user, isLoading: false })
    } catch (error) {
      console.error("Auth check failed:", error)
      setAuthState({ isAuthenticated: false, user: null, isLoading: false })
    }
  }

  const logout = async (redirectTo: string = "/") => {
    try {
      await logoutUser()
      await resetAfterLogout()
      setAuthState({ isAuthenticated: false, user: null, isLoading: false })
      router.replace(redirectTo)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  useEffect(() => {
    checkAuth()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        checkAuth()
      }
    }

    const handleAuthTokenChange = () => {
      checkAuth()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("authTokenChanged", handleAuthTokenChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("authTokenChanged", handleAuthTokenChange)
    }
  }, [])

  return { ...authState, logout, checkAuth }
}

/**
 * Custom hook for authentication form validation
 * Provides reusable validation logic for signin/signup forms
 */
export function useAuthValidation() {
  const { showToast } = useToast()

  const validateUsername = (username: string, setUsername: (value: string) => void): boolean => {
    const result = validateUsernameLength(username)
    if (!result.isValid) {
      showToast(result.errorMessage!, "error")
      if (result.fieldToClear === "username") setUsername("")
      return false
    }
    return true
  }

  const validatePassword = (password: string, setPassword: (value: string) => void): boolean => {
    const result = validatePasswordStrength(password)
    if (!result.isValid) {
      showToast(result.errorMessage!, "error")
      if (result.fieldToClear === "password") setPassword("")
      return false
    }
    return true
  }

  const validatePasswordMatch = (
    password: string,
    confirmPassword: string,
    setPassword: (value: string) => void,
    setConfirmPassword: (value: string) => void,
  ): boolean => {
    const result = validatePasswordConfirmation(password, confirmPassword)
    if (!result.isValid) {
      showToast(result.errorMessage!, "error")
      if (result.fieldToClear === "both") {
        setPassword("")
        setConfirmPassword("")
      }
      return false
    }
    return true
  }

  const validateSigninForm = (
    username: string,
    password: string,
    setUsername: (value: string) => void,
    setPassword: (value: string) => void,
  ): boolean => {
    if (!validateUsername(username, setUsername)) return false
    if (!validatePassword(password, setPassword)) return false
    return true
  }

  const validateSignupForm = (
    username: string,
    password: string,
    confirmPassword: string,
    setUsername: (value: string) => void,
    setPassword: (value: string) => void,
    setConfirmPassword: (value: string) => void,
  ): boolean => {
    if (!validateUsername(username, setUsername)) return false
    if (!validatePassword(password, setPassword)) return false
    if (!validatePasswordMatch(password, confirmPassword, setPassword, setConfirmPassword)) return false
    return true
  }

  return {
    validateUsername,
    validatePassword,
    validatePasswordMatch,
    validateSigninForm,
    validateSignupForm,
  }
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000
const STORAGE_KEY_FAILED_ATTEMPTS = "login_failed_attempts"
const STORAGE_KEY_LOCKOUT_UNTIL = "login_lockout_until"

interface LockoutState {
  isLocked: boolean
  remainingSeconds: number
  failedAttempts: number
}

export function useAccountLockout() {
  const [lockoutState, setLockoutState] = useState<LockoutState>(() => {
    if (typeof window === "undefined") {
      return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 }
    }

    const lockoutUntil = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL)
    if (lockoutUntil) {
      const lockoutTime = parseInt(lockoutUntil, 10)
      const now = Date.now()

      if (now < lockoutTime) {
        const remainingMs = lockoutTime - now
        const remainingSeconds = Math.ceil(remainingMs / 1000)
        return { isLocked: true, remainingSeconds, failedAttempts: MAX_FAILED_ATTEMPTS }
      } else {
        localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL)
        localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS)
      }
    }

    const failedAttempts = parseInt(localStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS) || "0", 10)
    return { isLocked: false, remainingSeconds: 0, failedAttempts }
  })

  useEffect(() => {
    if (!lockoutState.isLocked) return

    const interval = setInterval(() => {
      const lockoutUntil = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL)
      if (!lockoutUntil) {
        setLockoutState((prev) => ({
          ...prev,
          isLocked: false,
          remainingSeconds: 0,
          failedAttempts: 0,
        }))
        return
      }

      const lockoutTime = parseInt(lockoutUntil, 10)
      const now = Date.now()
      const remainingMs = lockoutTime - now

      if (remainingMs <= 0) {
        localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL)
        localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS)
        setLockoutState({ isLocked: false, remainingSeconds: 0, failedAttempts: 0 })
      } else {
        const remainingSeconds = Math.ceil(remainingMs / 1000)
        setLockoutState((prev) => ({ ...prev, remainingSeconds }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lockoutState.isLocked])

  const recordFailedAttempt = useCallback(() => {
    if (typeof window === "undefined") return

    const currentAttempts =
      parseInt(localStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS) || "0", 10) + 1

    localStorage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, currentAttempts.toString())

    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS
      localStorage.setItem(STORAGE_KEY_LOCKOUT_UNTIL, lockoutUntil.toString())
      setLockoutState({
        isLocked: true,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        failedAttempts: currentAttempts,
      })
    } else {
      setLockoutState((prev) => ({ ...prev, failedAttempts: currentAttempts }))
    }
  }, [])

  const resetFailedAttempts = useCallback(() => {
    if (typeof window === "undefined") return

    localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS)
    localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL)
    setLockoutState({ isLocked: false, remainingSeconds: 0, failedAttempts: 0 })
  }, [])

  return { ...lockoutState, recordFailedAttempt, resetFailedAttempts }
}

export type EmailInvalidReason = "missing" | "invalid"

export interface UseEmailFieldOptions {
  setValue: (value: string) => void
  onInvalid?: (reason: EmailInvalidReason) => void
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sanitizeEmail = (value: string) => value.trim()

export function useEmailField({ setValue, onInvalid }: UseEmailFieldOptions) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value)
      event.target.setCustomValidity("")
    },
    [setValue],
  )

  const handleInvalid = useCallback(
    (event: React.InvalidEvent<HTMLInputElement>) => {
      event.preventDefault()
      event.currentTarget.setCustomValidity("")
      const reason: EmailInvalidReason = event.currentTarget.validity.valueMissing ? "missing" : "invalid"
      onInvalid?.(reason)
    },
    [onInvalid],
  )

  const validateEmailValue = useCallback((value: string) => {
    const sanitized = sanitizeEmail(value)
    return { sanitized, isValid: EMAIL_REGEX.test(sanitized) }
  }, [])

  return { handleChange, handleInvalid, validateEmailValue }
}

