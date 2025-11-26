"use client";

import { useState, useEffect, useCallback } from "react";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const STORAGE_KEY_FAILED_ATTEMPTS = "login_failed_attempts";
const STORAGE_KEY_LOCKOUT_UNTIL = "login_lockout_until";

interface LockoutState {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
}

export function useAccountLockout() {
  const [lockoutState, setLockoutState] = useState<LockoutState>(() => {
    if (typeof window === "undefined") {
      return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
    }

    // Check if account is locked
    const lockoutUntil = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL);
    if (lockoutUntil) {
      const lockoutTime = parseInt(lockoutUntil, 10);
      const now = Date.now();
      
      if (now < lockoutTime) {
        // Still locked
        const remainingMs = lockoutTime - now;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        return {
          isLocked: true,
          remainingSeconds,
          failedAttempts: MAX_FAILED_ATTEMPTS,
        };
      } else {
        // Lockout expired, clear it
        localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
        localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
      }
    }

    // Get current failed attempts
    const failedAttempts = parseInt(
      localStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS) || "0",
      10
    );

    return {
      isLocked: false,
      remainingSeconds: 0,
      failedAttempts,
    };
  });

  // Update countdown every second when locked
  useEffect(() => {
    if (!lockoutState.isLocked) return;

    const interval = setInterval(() => {
      const lockoutUntil = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL);
      if (!lockoutUntil) {
        setLockoutState((prev) => ({
          ...prev,
          isLocked: false,
          remainingSeconds: 0,
          failedAttempts: 0,
        }));
        return;
      }

      const lockoutTime = parseInt(lockoutUntil, 10);
      const now = Date.now();
      const remainingMs = lockoutTime - now;

      if (remainingMs <= 0) {
        // Lockout expired
        localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
        localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
        setLockoutState({
          isLocked: false,
          remainingSeconds: 0,
          failedAttempts: 0,
        });
      } else {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setLockoutState((prev) => ({
          ...prev,
          remainingSeconds,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutState.isLocked]);

  const recordFailedAttempt = useCallback(() => {
    if (typeof window === "undefined") return;

    const currentAttempts =
      parseInt(
        localStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS) || "0",
        10
      ) + 1;

    localStorage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, currentAttempts.toString());

    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lock account
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(STORAGE_KEY_LOCKOUT_UNTIL, lockoutUntil.toString());
      setLockoutState({
        isLocked: true,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        failedAttempts: currentAttempts,
      });
    } else {
      setLockoutState((prev) => ({
        ...prev,
        failedAttempts: currentAttempts,
      }));
    }
  }, []);

  const resetFailedAttempts = useCallback(() => {
    if (typeof window === "undefined") return;

    localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
    setLockoutState({
      isLocked: false,
      remainingSeconds: 0,
      failedAttempts: 0,
    });
  }, []);

  return {
    ...lockoutState,
    recordFailedAttempt,
    resetFailedAttempts,
  };
}

