"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n";

interface AccountLockoutPopupProps {
  isOpen: boolean;
  remainingSeconds: number;
}

export function AccountLockoutPopup({ isOpen, remainingSeconds }: AccountLockoutPopupProps) {
  const { t } = useTranslations();
  const [timeRemaining, setTimeRemaining] = useState(remainingSeconds);

  useEffect(() => {
    if (!isOpen) return;

    // Update time remaining from prop
    setTimeRemaining(remainingSeconds);

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, remainingSeconds]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop - non-clickable, blocks all interaction */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Popup - centered, no close button */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100">
        {/* Content */}
        <div className="p-8 text-center">
          {/* Lock Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg 
              className="w-10 h-10 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {t("signin.lockout.title") || "Tài khoản tạm thời bị khóa"}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {t("signin.lockout.message") || "Bạn đã nhập sai mật khẩu hoặc tên đăng nhập quá 5 lần. Tài khoản của bạn đã bị khóa tạm thời trong 5 phút."}
          </p>

          {/* Countdown Timer */}
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-xl p-6 mb-6 border-2 border-red-200">
            <p className="text-sm text-gray-600 mb-2">
              {t("signin.lockout.timeRemaining") || "Thời gian còn lại"}
            </p>
            <div className="text-4xl font-bold text-red-600 font-mono">
              {formattedTime}
            </div>
          </div>

          {/* Info Message */}
          <p className="text-sm text-gray-500">
            {t("signin.lockout.info") || "Vui lòng đợi cho đến khi hết thời gian để thử lại."}
          </p>
        </div>
      </div>
    </div>
  );
}

