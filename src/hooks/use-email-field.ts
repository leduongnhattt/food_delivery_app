"use client";

import { useCallback } from "react";
import type { ChangeEvent, InvalidEvent } from "react";

export type EmailInvalidReason = "missing" | "invalid";

export interface UseEmailFieldOptions {
    setValue: (value: string) => void;
    onInvalid?: (reason: EmailInvalidReason) => void;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeEmail = (value: string) => value.trim();

export function useEmailField({ setValue, onInvalid }: UseEmailFieldOptions) {
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.value);
            event.target.setCustomValidity("");
        },
        [setValue]
    );

    const handleInvalid = useCallback(
        (event: InvalidEvent<HTMLInputElement>) => {
            event.preventDefault();
            event.currentTarget.setCustomValidity("");
            const reason: EmailInvalidReason = event.currentTarget.validity.valueMissing
                ? "missing"
                : "invalid";
            onInvalid?.(reason);
        },
        [onInvalid]
    );

    const validateEmailValue = useCallback((value: string) => {
        const sanitized = sanitizeEmail(value);
        return {
            sanitized,
            isValid: EMAIL_REGEX.test(sanitized),
        };
    }, []);

    return {
        handleChange,
        handleInvalid,
        validateEmailValue,
    };
}

