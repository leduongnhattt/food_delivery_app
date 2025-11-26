"use client";

import EnterpriseNavBar from "@/components/enterprise/EnterpriseNavbar";
import React from "react";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EnterpriseNavBar />

      {/* Main Content */}
      <main className="ml-64 pt-16 min-h-screen bg-gray-50">
        <div className="w-full h-full">
          <div className="bg-white shadow-sm border border-gray-200 min-h-screen">
            <div className="p-6">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
