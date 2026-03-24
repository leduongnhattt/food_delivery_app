"use client";

import AdminNavbar from "@/components/admin/AdminNavbar";
import React from "react";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminNavbar />

      {/* Main Content */}
      <main className="ml-64 pt-16 min-h-screen bg-gray-50">
        <div className="w-full h-full">
          <div className="bg-white shadow-sm border border-gray-200 min-h-[calc(100vh-112px)]">
            <div className="p-6">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
