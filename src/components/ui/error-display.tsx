"use client";

import { useCallback, useEffect, useState } from "react";

interface ErrorDisplayProps {
  error: string | null;
  type?: "error" | "warning" | "info";
  autoHide?: boolean;
  autoHideDelay?: number;
  onClose?: () => void;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  type = "error", 
  autoHide = false, 
  autoHideDelay = 5000,
  onClose,
  className = ""
}: ErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for animation to complete
  }, [onClose]);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay, handleClose]);

  if (!error || !isVisible) return null;

  const getStyles = () => {
    switch (type) {
      case "warning":
        return {
          container: "bg-yellow-50 border-yellow-200",
          text: "text-yellow-800",
          icon: "text-yellow-600",
          closeButton: "text-yellow-400 hover:text-yellow-600"
        };
      case "info":
        return {
          container: "bg-blue-50 border-blue-200",
          text: "text-blue-800",
          icon: "text-blue-600",
          closeButton: "text-blue-400 hover:text-blue-600"
        };
      default: // error
        return {
          container: "bg-red-50 border-red-200",
          text: "text-red-800",
          icon: "text-red-600",
          closeButton: "text-red-400 hover:text-red-600"
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case "warning":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case "info":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default: // error
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const styles = getStyles();

  return (
    <div 
      className={`transform transition-all duration-300 ${
        isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
      } ${className}`}
    >
      <div className={`p-4 border rounded-lg ${styles.container}`}>
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${styles.text}`}>
              {error}
            </p>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={handleClose}
              className={`flex-shrink-0 ${styles.closeButton} transition-colors`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
