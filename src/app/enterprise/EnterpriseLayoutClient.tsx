"use client";

import EnterpriseNavBar from "@/components/enterprise/EnterpriseNavbar";
import React from "react";
import { usePathname } from "next/navigation";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActivation = pathname === "/enterprise/activate";

  // Activation is a public, standalone flow (no enterprise nav/sidebar).
  if (isActivation) {
    return <>{children}</>;
  }

  return (
    <>
      <EnterpriseNavBar />

      {/* Main Content */}
      <main
        style={
          {
            ["--ui-header-height" as any]: "56px",
            ["--ui-sidebar-width" as any]: "181px",
          } as React.CSSProperties
        }
        className="ml-[var(--ui-sidebar-width)] pt-[var(--ui-header-height)] min-h-screen bg-gray-50"
      >
        <div className="w-full h-full p-3 sm:p-4">{children}</div>
      </main>
    </>
  );
}
