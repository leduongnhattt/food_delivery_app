"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

const LOGO_SRC = `${process.env.BASE_IMAGE_URL}/logo.png`;

function AuthFormTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const innerRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current === pathname) {
      return;
    }
    prevPathRef.current = pathname;

    el.classList.remove("auth-form-route-enter");
    void el.offsetWidth;
    el.classList.add("auth-form-route-enter");
  }, [pathname]);

  return (
    <div
      ref={innerRef}
      className="mx-auto flex min-h-0 w-full max-w-sm flex-col justify-center px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4"
    >
      {children}
    </div>
  );
}

/**
 * Persistent chrome for /signin and /signup so switching routes does not remount
 * the card or side branding. Form column height is clamped so sign-in vs sign-up
 * does not resize the shell; inner content cross-fades when route changes.
 */
export function AuthShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-0 box-border flex items-center justify-center overflow-hidden bg-gray-50 p-2 sm:p-3">
      <div className="flex max-h-full w-full max-w-md min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-white shadow-xl transition-shadow duration-300 ease-out sm:max-w-lg sm:rounded-2xl lg:max-w-4xl">
        {/* Min height ≈ taller signup stack so switching to sign-in does not jump */}
        <div className="flex min-h-[min(720px,calc(100dvh-3rem))] w-full flex-1 flex-col lg:min-h-[min(560px,calc(100dvh-3.5rem))] lg:flex-row">
          <div className="flex shrink-0 items-center justify-center bg-white py-1.5 lg:hidden">
            <div className="relative h-12 w-12 sm:h-14 sm:w-14">
              <Image
                src={LOGO_SRC}
                alt="Hanala Food Logo"
                fill
                className="object-contain"
                priority
                sizes="56px"
              />
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 items-stretch overflow-hidden bg-blue-100 lg:w-1/2">
            <AuthFormTransition>{children}</AuthFormTransition>
          </div>

          <div className="relative hidden min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-white p-4 lg:flex lg:w-1/2 lg:p-6">
            <Image
              src={LOGO_SRC}
              alt="Hanala Food Logo"
              width={320}
              height={320}
              className="max-h-[min(40dvh,320px)] w-auto max-w-[min(85%,280px)] object-contain xl:max-w-[min(85%,320px)]"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
