import "../globals.css"
import type { Metadata } from "next"
import React from "react"
import AdminLayoutClient from "./AdminLayoutClient"
import { AppProvider } from "@/components/providers/app-provider"

export const metadata: Metadata = {
  title: "Admin - HanalaFood",
  description: "Admin Dashboard for HanalaFood",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-white">
        <AppProvider>
          <AdminLayoutClient>
            {children}
          </AdminLayoutClient>
        </AppProvider>
      </body>
    </html>
  )
}