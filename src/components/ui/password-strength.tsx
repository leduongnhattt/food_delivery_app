"use client";

import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className = "" }: PasswordStrengthProps) {
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

    // Calculate score
    if (checks.length) score += 1;
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.number) score += 1;
    if (checks.special) score += 1;

    // Determine strength level
    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" };
    if (score <= 4) return { score, label: "Good", color: "bg-blue-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  }, [password]);

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              level <= strength.score
                ? strength.color
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between text-xs">
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

      {/* Requirements */}
      <div className="space-y-1 text-xs text-gray-500">
        <div className={`flex items-center space-x-2 ${password.length >= 8 ? "text-green-600" : ""}`}>
          <div className={`w-1 h-1 rounded-full ${password.length >= 8 ? "bg-green-600" : "bg-gray-300"}`} />
          <span>At least 8 characters</span>
        </div>
        <div className={`flex items-center space-x-2 ${/[a-z]/.test(password) ? "text-green-600" : ""}`}>
          <div className={`w-1 h-1 rounded-full ${/[a-z]/.test(password) ? "bg-green-600" : "bg-gray-300"}`} />
          <span>Lowercase letter</span>
        </div>
        <div className={`flex items-center space-x-2 ${/[A-Z]/.test(password) ? "text-green-600" : ""}`}>
          <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? "bg-green-600" : "bg-gray-300"}`} />
          <span>Uppercase letter</span>
        </div>
        <div className={`flex items-center space-x-2 ${/\d/.test(password) ? "text-green-600" : ""}`}>
          <div className={`w-1 h-1 rounded-full ${/\d/.test(password) ? "bg-green-600" : "bg-gray-300"}`} />
          <span>Number</span>
        </div>
        <div className={`flex items-center space-x-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : ""}`}>
          <div className={`w-1 h-1 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-green-600" : "bg-gray-300"}`} />
          <span>Special character</span>
        </div>
      </div>
    </div>
  );
}
