"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  SquarePlus,
  LogOut,
  Package,
  TicketPercent,
  BarChart3,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccountHeader } from "@/hooks/use-account-header";
import { useAPICache } from "@/hooks/use-api-cache";
import { buildAuthHeader } from "@/lib/auth-helpers";

const menuItems = [
  { href: "/enterprise/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/enterprise/menu", label: "Menu", icon: Menu },
  { href: "/enterprise/product", label: "Product", icon: Package },
  { href: "/enterprise/add-product", label: "Add Product", icon: SquarePlus },
  { href: "/enterprise/discount", label: "Discount", icon: TicketPercent },
  { href: "/enterprise/profile", label: "Profile", icon: User },
];

export default function EnterpriseNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth()
  const accountHeader = useAccountHeader()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [enterpriseName, setEnterpriseName] = useState<string>("Enterprise")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    logout();
  };


  const { data: enterpriseData } = useAPICache({
    key: 'enterprise-profile',
    fetcher: async () => {
      const res = await fetch('/api/enterprise/profile', { 
        headers: { ...buildAuthHeader() } 
      });
      if (!res.ok) throw new Error('Failed to fetch enterprise profile');
      return await res.json();
    },
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: !!user
  });

  useEffect(() => {
    if (enterpriseData && typeof enterpriseData === 'object' && enterpriseData !== null && 'enterprise' in enterpriseData) {
      const enterprise = (enterpriseData as any).enterprise;
      if (enterprise?.EnterpriseName) {
        setEnterpriseName(enterprise.EnterpriseName);
      }
    }
  }, [enterpriseData]);

  useEffect(() => {
    setLogoUrl(accountHeader.avatar);
  }, [accountHeader.avatar]);

  return (
    <>
      {/* Top Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo */}
          <div>
            <h2 className="text-xl font-bold text-blue-600 truncate max-w-[260px]">{enterpriseName}</h2>
          </div>

          {/* Enterprise Info */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="logo"
                className="w-8 h-8 rounded-full object-cover cursor-zoom-in"
                onClick={() => setPreviewOpen(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-800">{ user?.username }</p>
              <p className="text-xs text-gray-500">Enterprise</p>
            </div>
          </div>
          {previewOpen && logoUrl && (
            <div
              className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 cursor-zoom-out"
              onClick={() => setPreviewOpen(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="logo preview" className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain" />
            </div>
          )}
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
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-50 text-gray-600 hover:text-gray-800"
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        active ? "text-white" : "text-gray-500"
                      }`}
                    />
                    <span className="font-medium text-sm">{label}</span>
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
