"use client";

import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
  /** Denser layout for auth screens that must fit one viewport without scrolling */
  compact?: boolean;
}

export function PasswordStrength({
  password,
  className = "",
  compact = false,
}: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    if (checks.length) score += 1;
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.number) score += 1;
    if (checks.special) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" };
    if (score <= 4) return { score, label: "Good", color: "bg-blue-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  }, [password]);

  if (!password) return null;

  const barH = compact ? "h-0.5" : "h-1";
  const rootGap = compact ? "space-y-1" : "space-y-2";
  const labelText = compact ? "text-[10px] sm:text-xs" : "text-xs";
  const reqWrap = compact
    ? "grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] leading-tight text-gray-500 sm:text-xs"
    : "space-y-1 text-xs text-gray-500";

  return (
    <div className={`${rootGap} ${className}`}>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`${barH} flex-1 rounded-full transition-colors duration-300 ${
              level <= strength.score ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className={`flex items-center justify-between ${labelText}`}>
        <span className="text-gray-600">Password strength:</span>
        <span
          className={`font-medium ${
            strength.score <= 2
              ? "text-red-600"
              : strength.score <= 3
                ? "text-yellow-600"
                : strength.score <= 4
                  ? "text-blue-600"
                  : "text-green-600"
          }`}
        >
          {strength.label}
        </span>
      </div>

      <div className={reqWrap}>
        <div
          className={`flex items-center space-x-2 ${password.length >= 8 ? "text-green-600" : ""}`}
        >
          <div
            className={`w-1 h-1 shrink-0 rounded-full ${password.length >= 8 ? "bg-green-600" : "bg-gray-300"}`}
          />
          <span>At least 8 characters</span>
        </div>
        <div className={`flex items-center space-x-2 ${/[a-z]/.test(password) ? "text-green-600" : ""}`}>
          <div
            className={`w-1 h-1 shrink-0 rounded-full ${/[a-z]/.test(password) ? "bg-green-600" : "bg-gray-300"}`}
          />
          <span>Lowercase letter</span>
        </div>
        <div className={`flex items-center space-x-2 ${/[A-Z]/.test(password) ? "text-green-600" : ""}`}>
          <div
            className={`w-1 h-1 shrink-0 rounded-full ${/[A-Z]/.test(password) ? "bg-green-600" : "bg-gray-300"}`}
          />
          <span>Uppercase letter</span>
        </div>
        <div className={`flex items-center space-x-2 ${/\d/.test(password) ? "text-green-600" : ""}`}>
          <div
            className={`w-1 h-1 shrink-0 rounded-full ${/\d/.test(password) ? "bg-green-600" : "bg-gray-300"}`}
          />
          <span>Number</span>
        </div>
        <div
          className={`flex items-center space-x-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : ""} ${compact ? "col-span-2" : ""}`}
        >
          <div
            className={`w-1 h-1 shrink-0 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-green-600" : "bg-gray-300"}`}
          />
          <span>Special character</span>
        </div>
      </div>
    </div>
  );
}
