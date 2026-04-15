"use client";

import AdminNavbar from "@/components/admin/layout/AdminNavbar";
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
      <main
        className="pt-16 min-h-screen bg-[#f5f5f5] transition-[margin-left] duration-200 ease-out"
        style={{ marginLeft: "var(--admin-sidebar-w, 248px)" }}
      >
        <div className="w-full h-full p-4">{children}</div>
      </main>
    </>
  );
}
