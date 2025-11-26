"use client";

import { useState } from 'react';
import { useTranslations } from '@/lib/i18n';
import { loginWithGoogle } from '@/lib/client-auth';
import { setAuthToken } from '@/lib/auth-helpers';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function GoogleAuthButton({
  onSuccess,
  onError,
  className = ''
}: GoogleAuthButtonProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Function to open Google OAuth popup
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Create popup window features
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
      
      // Open Google OAuth authorization URL in a popup
      const popup = window.open(
        `/api/auth/google/authorize`, 
        'GoogleLogin',
        features
      );
      
      if (!popup) {
        setIsLoading(false);
        onError?.(t("signin.errors.popupBlocked"));
        return;
      }

      // Listen for messages from the popup
      const messageHandler = async (event: MessageEvent) => {
        // Make sure message is from our domain
        if (event.origin !== window.location.origin) return;
        
        try {
          const data = event.data;
          
          if (data.type === 'GOOGLE_AUTH_SUCCESS' && data.credential) {
            // Cleanup listeners
            cleanup();
            
            if (!popup.closed) popup.close();
            
            const result = await loginWithGoogle({
              credential: data.credential,
            });
            
            if (!result.success) {
              setIsLoading(false);
              onError?.(result.error?.message || t("signin.errors.googleAuthFailed"));
              return;
            }
            
            setAuthToken(result.data.accessToken);
            
            onSuccess?.();
            
            router.replace("/");
          } 
          else if (data.type === 'GOOGLE_AUTH_ERROR') {
            cleanup();
            setIsLoading(false);
            onError?.(data.error || t("signin.errors.googleAuthFailed"));
          }
        } catch (err) {
          console.error('Google auth message handling failed:', err)
          cleanup();
          setIsLoading(false);
          onError?.(t("signin.errors.unexpectedError"));
        }
      };
      
      function cleanup() {
        window.removeEventListener('message', messageHandler);
        clearInterval(checkClosed);
        clearTimeout(timeout);
      }

      // Check if popup is closed manually by user
      const checkClosed = window.setInterval(() => {
        if (popup.closed) {
          cleanup();
          setIsLoading(false);
        }
      }, 1000);
      
      const timeout = window.setTimeout(() => {
        cleanup();
        setIsLoading(false);
        if (!popup.closed) {
          popup.close();
        }
        onError?.(t("signin.errors.timeout"));
      }, 5 * 60 * 1000);
      
      window.addEventListener('message', messageHandler);
      
    } catch (err) {
      console.error('Google auth popup failed:', err)
      setIsLoading(false);
      onError?.(t("signin.errors.unexpectedError"));
    }
  };

  return (
    <div className="relative">
      {/* Custom styled button for Google login */}
      <button
        type="button"
        className={`w-full bg-white text-gray-700 h-12 rounded-lg font-medium transition-all text-sm sm:text-base border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 ${className}`}
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Image
              src={`${process.env.BASE_IMAGE_URL}/icon_google.png`}
              alt="Google icon"
              width={20}
              height={20}
              className="w-5 h-5"
              priority
            />
            {t("common.continueWithGoogle")}
          </>
        )}
      </button>
    </div>
  );
}