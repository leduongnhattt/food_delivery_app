"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";

export function FooterGate() {
  const pathname = usePathname();
  if (!pathname) return <Footer />;

  // Keep more vertical space for order tracking/management pages.
  if (pathname === "/orders" || pathname.startsWith("/orders/")) {
    return null;
  }

  return <Footer />;
}

