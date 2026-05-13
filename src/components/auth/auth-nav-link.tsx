"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";

type AuthNavLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * Client navigation between auth routes with View Transitions when supported,
 * so the browser can cross-fade instead of an abrupt paint swap.
 */
export function AuthNavLink({ href, className, children }: AuthNavLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      scroll={false}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        const run = () => {
          flushSync(() => {
            router.push(href);
          });
        };
        if (typeof document !== "undefined" && "startViewTransition" in document) {
          (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(run);
        } else {
          run();
        }
      }}
    >
      {children}
    </Link>
  );
}
