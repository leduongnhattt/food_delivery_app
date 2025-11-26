"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Briefcase,
  TicketPercent,
  BarChart3,
  Tag,
} from "lucide-react";

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/customers", label: "Customers", icon: User },
  { href: "/admin/enterprises", label: "Enterprises", icon: Briefcase },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  // { href: "/admin/inbox", label: "Inbox", icon: MessageCircle }, // nên loại bỏ phần ni
  { href: "/admin/discount", label: "Discount", icon: TicketPercent },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    // clear client token/local flags
    try { localStorage.removeItem('verified') } catch {}
    router.replace('/signin')
  };

  return (
    <>
      {/* Top Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo */}
          <div>
            <h2 className="text-xl font-bold text-blue-600">Hanala Food</h2>
          </div>

          {/* Admin Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">MR</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Mint Roy</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Below Header */}
      <aside className="fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r border-gray-200 z-40">
        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`
                      flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative
                      ${
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "hover:bg-gray-50 text-gray-600 hover:text-gray-800"
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        active ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                    <span className="font-medium text-sm">{label}</span>
                    {active && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="cursor-pointer w-full flex items-center gap-4 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
