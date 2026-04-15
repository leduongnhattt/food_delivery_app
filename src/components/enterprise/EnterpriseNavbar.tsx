"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  LogOut,
  Settings,
  User,
  ChevronDown,
  ChevronRight,
  ChevronRight as ChevronBreadcrumb,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccountHeader } from "@/hooks/use-account-header";
import { useAPICache } from "@/hooks/use-api-cache";
import { buildAuthHeader } from "@/lib/auth-helpers";
import { getServerApiBase } from "@/lib/http-client";

type NavChild = { href: string; label: string };
type NavSection = { key: string; label: string; defaultOpen?: boolean; children: NavChild[] };

const NAV_SECTIONS: NavSection[] = [
  {
    key: "product",
    label: "PRODUCT",
    defaultOpen: true,
    children: [
      { href: "/enterprise/product", label: "My Products" },
      { href: "/enterprise/add-product", label: "Add New Product" },
    ],
  },
  {
    key: "customer_service",
    label: "CUSTOMER SERVICE",
    defaultOpen: true,
    children: [
      { href: "/enterprise/reviews", label: "Review Management" },
    ],
  },
  {
    key: "orders",
    label: "ORDERS",
    defaultOpen: true,
    children: [
      { href: "/enterprise/orders", label: "My Orders" },
      { href: "/enterprise/orders/returns-refunds", label: "Return / Refund" },
      { href: "/enterprise/orders/order-cancellation", label: "Order Cancellation" },
    ],
  },
  {
    key: "finance",
    label: "FINANCE",
    defaultOpen: true,
    children: [
      { href: "/enterprise/analytics", label: "My Income" },
      { href: "/enterprise/bank-accounts", label: "Bank Accounts" },
    ],
  },
  {
    key: "shop",
    label: "SHOP",
    defaultOpen: true,
    children: [
      { href: "/enterprise/profile", label: "Shop Profile" },
      { href: "/enterprise/shop-settings", label: "Shop Settings" },
    ],
  },
];

const ORDERS_SUBPAGE_SEGMENTS = new Set([
  "returns-refunds",
  "order-cancellation",
]);

function titleCase(s: string) {
  const t = s.trim();
  if (!t) return t;
  return t[0].toUpperCase() + t.slice(1);
}

function normalizePath(p: string) {
  const noHash = p.split("#")[0] || "";
  const noQuery = noHash.split("?")[0] || "";
  return noQuery.replace(/\/+$/, "") || "/";
}

function findNavLabel(pathname: string): {
  sectionLabel?: string;
  pageLabel?: string;
  sectionHref?: string;
  pageHref?: string;
} {
  const p = normalizePath(pathname);
  // Home == Dashboard in this app
  if (p === "/enterprise" || p === "/enterprise/dashboard") {
    return {};
  }
  // Order detail: /enterprise/orders/:orderId — not list sub-pages (returns, cancellation).
  if (p.startsWith("/enterprise/orders/") && p !== "/enterprise/orders") {
    const seg = p.replace(/^\/enterprise\/orders\//, "").split("/")[0];
    if (seg && !ORDERS_SUBPAGE_SEGMENTS.has(seg)) {
      return {
        sectionLabel: "Orders",
        pageLabel: "Order Details",
        sectionHref: "/enterprise/orders",
      };
    }
  }
  for (const section of NAV_SECTIONS) {
    const sortedChildren = [...section.children].sort(
      (a, b) => b.href.length - a.href.length,
    );
    for (const child of sortedChildren) {
      const base = normalizePath(child.href);
      if (p === base || p.startsWith(base + "/")) {
        const sectionHref = section.children[0]?.href;
        return {
          sectionLabel: titleCase(section.label.toLowerCase()),
          pageLabel: child.label,
          sectionHref,
          pageHref: child.href,
        };
      }
    }
  }
  return {};
}

export default function EnterpriseNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth()
  const accountHeader = useAccountHeader()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [enterpriseName, setEnterpriseName] = useState<string>("Enterprise")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV_SECTIONS.forEach((s) => {
      init[s.key] = s.defaultOpen ?? true;
    });
    return init;
  });

  // Keep sidebar section state in sync (useful during HMR / when sections change).
  useEffect(() => {
    setOpenSections((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const s of NAV_SECTIONS) {
        if (typeof next[s.key] !== "boolean") {
          next[s.key] = s.defaultOpen ?? true;
        }
      }
      return next;
    });
  }, []);

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (!pathname.startsWith(href + "/")) return false;
    if (href === "/enterprise/orders") {
      const seg = pathname.slice("/enterprise/orders/".length).split("/")[0];
      if (ORDERS_SUBPAGE_SEGMENTS.has(seg)) return false;
      return true;
    }
    return true;
  };

  const handleLogout = () => {
    logout("/signin");
  };

  useEffect(() => {
    if (!userMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const inside = target.closest("[data-enterprise-user-menu]");
      if (!inside) setUserMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [userMenuOpen]);


  const { data: enterpriseData } = useAPICache({
    key: 'enterprise-profile',
    fetcher: async () => {
      const base = getServerApiBase();
      const res = await fetch(`${base}/enterprise/profile`, { 
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
    <div
      style={
        {
          // Match MallPlus layout tokens
          ["--ui-header-height" as any]: "56px",
          ["--ui-sidebar-width" as any]: "181px",
        } as React.CSSProperties
      }
    >
      {/* Top Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 h-[var(--ui-header-height)] bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between h-full px-6">
          {/* Brand + breadcrumb */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/enterprise/dashboard"
              className="shrink-0 text-xl font-extrabold leading-none tracking-tight text-emerald-700 transition-colors hover:text-emerald-800 sm:text-2xl"
            >
              Hanala
            </Link>
            <span
              className="hidden h-5 w-px shrink-0 bg-gray-200 sm:block sm:h-6"
              aria-hidden
            />

            {(() => {
              const b = findNavLabel(pathname);
              const parts: Array<{ label: string; href?: string }> = [
                { label: "Home", href: "/enterprise/dashboard" },
                ...(b.sectionLabel
                  ? [{ label: b.sectionLabel, href: b.sectionHref }]
                  : []),
                ...(b.pageLabel ? [{ label: b.pageLabel, href: b.pageHref }] : []),
              ];
              const lastIdx = parts.length - 1;
              return (
                <nav
                  className="flex min-w-0 items-center gap-2 text-sm leading-snug sm:text-[15px] sm:gap-2.5"
                  aria-label="Breadcrumb"
                >
                  {parts.map((it, idx) => {
                    const isLast = idx === lastIdx;
                    const clickable = !!it.href && !isLast;
                    const cls = `truncate ${
                      isLast
                        ? "font-semibold text-slate-900"
                        : "font-medium text-slate-500 hover:text-slate-800"
                    }`;
                    return (
                      <React.Fragment key={`${it.label}-${idx}`}>
                        {idx > 0 ? (
                          <ChevronBreadcrumb
                            className="h-3.5 w-3.5 shrink-0 text-slate-300 sm:h-4 sm:w-4"
                            aria-hidden
                          />
                        ) : null}
                        {clickable ? (
                          <Link href={it.href!} className={cls} title={it.label}>
                            {it.label}
                          </Link>
                        ) : (
                          <span className={cls} title={it.label}>
                            {it.label}
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </nav>
              );
            })()}
          </div>

          {/* Enterprise Info */}
          <div className="relative" data-enterprise-user-menu>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-50"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                  {(enterpriseName || "E").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                  {enterpriseName}
                </p>
                <p className="text-xs text-gray-500">Enterprise</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {userMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
              >
                <div className="flex flex-col items-center gap-2 px-4 py-4">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt="avatar"
                      className="h-14 w-14 rounded-full object-cover cursor-pointer"
                      onClick={() => setPreviewOpen(true)}
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                      {(enterpriseName || "E").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="text-sm font-semibold text-gray-900">{enterpriseName}</div>
                </div>

                <div className="border-t border-gray-200 py-1">
                  <Link
                    href="/enterprise/profile"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 text-gray-500" />
                    Shop Information
                  </Link>
                  <Link
                    href="/enterprise/shop-settings"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 text-gray-500" />
                    Shop Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-500" />
                      English
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                <div className="border-t border-gray-200 py-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
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
      <aside className="fixed top-[var(--ui-header-height)] left-0 z-40 flex h-[calc(100vh-var(--ui-header-height))] w-[var(--ui-sidebar-width)] flex-col overflow-hidden border-r border-gray-200 bg-white">
        <div className="enterprise-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-0 py-2 [overflow-anchor:none]">
          {/* Sections (match MallPlus UNavigationMenu sidebar classes) */}
          <nav className="relative flex flex-col gap-1.5 pb-4">
            <ul className="isolate min-w-0">
              {NAV_SECTIONS.map((section) => {
                const open = !!openSections[section.key];
                return (
                  <li key={section.key} className="min-w-0">
                    {/* Section header (acts like aria-[controls] link in MallPlus) */}
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setOpenSections((prev) => ({ ...prev, [section.key]: !open }))
                      }
                      className={[
                        "group relative w-full flex items-center gap-1.5 font-medium",
                        "before:absolute before:z-[-1] before:rounded-md before:inset-y-px before:inset-x-0",
                        "focus:outline-none focus-visible:outline-none focus-visible:before:ring-inset focus-visible:before:ring-2 focus-visible:before:ring-[#2563FF]",
                        "flex-row px-4 py-2 rounded-md transition-colors hover:bg-gray-100 text-[13px] text-gray-700",
                        // header style (same as aria-[controls] in MallPlus)
                        "hover:bg-gray-50 text-xs uppercase text-gray-500",
                      ].join(" ")}
                    >
                      <span className="truncate">{section.label}</span>
                      <span className="ms-auto inline-flex items-center gap-1.5">
                        <ChevronRight
                          className={[
                            "transform shrink-0 transition-transform duration-200",
                            "h-3.5 w-3.5",
                            open ? "rotate-90" : "",
                            "text-gray-400",
                          ].join(" ")}
                        />
                      </span>
                    </button>

                    {/* Children */}
                    {open ? (
                      <div className="overflow-hidden">
                        <ul className="isolate ml-0 border-none">
                          {section.children.map((child) => {
                            const active = isActive(child.href);
                            return (
                              <li key={child.href} className="-ms-0 ps-0">
                                <Link
                                  href={child.href}
                                  aria-current={active ? "page" : undefined}
                                  className={[
                                    "group relative w-full flex items-center gap-1.5 font-medium",
                                    "before:absolute before:z-[-1] before:rounded-md before:inset-y-px before:inset-x-0",
                                    "focus:outline-none focus-visible:outline-none focus-visible:before:ring-inset focus-visible:before:ring-2 focus-visible:before:ring-[#2563FF]",
                                    "flex-row px-4 py-2 rounded-md transition-colors hover:bg-gray-100 text-[13px]",
                                    "pl-7",
                                    active ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700",
                                  ].join(" ")}
                                >
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  );
}
