"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  Globe,
  Settings,
  User,
  ChevronRight,
  ChefHat,
} from "lucide-react";
import { getAuthToken, logoutUser } from "@/lib/auth-helpers";
import { fetchAdminProfile } from "@/services/admin.service";

interface AdminProfile {
  username: string;
  email: string;
  avatar: string | null;
}

const NAV_SECTIONS: {
  title: string;
  items: Array<
    | { kind?: "link"; href: string; label: string }
    | {
        kind: "group";
        id: string;
        label: string;
        items: { href: string; label: string }[];
      }
  >;
}[] = [
  {
    title: "ORDER MANAGEMENT",
    items: [
      { href: "/admin/orders", label: "Order List" },
      { href: "/admin/orders/returns-refunds", label: "Return & Refund" },
      { href: "/admin/orders/bulk-update-tools", label: "Bulk Update Tools" },
    ],
  },
  {
    title: "ACCESS CONTROL",
    items: [
      { href: "/admin/customers", label: "Users" },
      { href: "/admin/access/roles", label: "Roles" },
      { href: "/admin/access/permissions", label: "Permissions" },
    ],
  },
  {
    title: "ENTERPRISES",
    items: [
      { href: "/admin/enterprises/list", label: "Enterprise List" },
      { href: "/admin/enterprises/invitations", label: "Enterprise Invitations" },
      { href: "/admin/enterprises/template", label: "Invitation Template" },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/discount", label: "Discount" },
      { href: "/admin/reviews", label: "Reviews" },
    ],
  },
  {
    title: "FINANCE SETTINGS",
    items: [
      { href: "/admin/finance/commission-fees", label: "Commission Fees" },
      { href: "/admin/finance/payment-channels", label: "Payment Channels" },
      { href: "/admin/finance/transaction-fees", label: "Transaction Fees" },
    ],
  },
  {
    title: "PLATFORM",
    items: [
      { href: "/admin/support", label: "Support" },
      { href: "/admin/platform/audit-logs", label: "Audit Logs" },
    ],
  },
];

type AdminBreadcrumbCrumb = { label: string; href?: string };

function humanizePathRest(rest: string): string {
  return rest
    .split("/")
    .map((part) =>
      part
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    )
    .join(" / ");
}

function flatNavLinks(): { href: string; label: string }[] {
  const out: { href: string; label: string }[] = [];
  for (const sec of NAV_SECTIONS) {
    for (const item of sec.items) {
      if ((item as { kind?: string }).kind === "group") {
        const g = item as { items: { href: string; label: string }[] };
        out.push(...g.items);
      } else {
        const link = item as { href: string; label: string };
        out.push({ href: link.href, label: link.label });
      }
    }
  }
  return out;
}

function matchNavBase(
  path: string,
  items: { href: string; label: string }[],
): { href: string; label: string } | null {
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const it of sorted) {
    if (path === it.href || path.startsWith(it.href + "/")) return it;
  }
  return null;
}

/** Home = dashboard; no intermediate "Dashboard overview" — only Home → current section. */
function adminBreadcrumbs(pathname: string): AdminBreadcrumbCrumb[] {
  const path = (pathname.split("?")[0] || "").replace(/\/$/, "") || "/";

  if (path === "/admin" || path === "/admin/dashboard") {
    return [{ label: "Home" }];
  }

  const items = flatNavLinks();

  const entEdit = path.match(/^\/admin\/enterprises\/([^/]+)\/edit$/);
  if (entEdit) {
    const seg = entEdit[1];
    if (seg !== "list" && seg !== "invitations" && seg !== "template") {
      return [
        { label: "Home", href: "/admin/dashboard" },
        { label: "Enterprise List", href: "/admin/enterprises/list" },
        { label: "Edit Enterprise" },
      ];
    }
  }

  const entOne = path.match(/^\/admin\/enterprises\/([^/]+)$/);
  if (entOne) {
    const seg = entOne[1];
    if (seg !== "list" && seg !== "invitations" && seg !== "template") {
      return [
        { label: "Home", href: "/admin/dashboard" },
        { label: "Enterprise List", href: "/admin/enterprises/list" },
        { label: "Enterprise details" },
      ];
    }
  }

  const base = matchNavBase(path, items);
  if (!base) {
    return [{ label: "Home", href: "/admin/dashboard" }, { label: "Admin" }];
  }

  if (path === base.href) {
    return [{ label: "Home", href: "/admin/dashboard" }, { label: base.label }];
  }

  const rest = path.slice(base.href.length).replace(/^\//, "");
  let tail = "Details";
  if (rest === "send") tail = "Send invitation";
  else if (base.href === "/admin/enterprises/invitations" && rest) tail = "Invitation details";
  else if (base.href === "/admin/support" && rest) tail = "Ticket details";
  else if (
    rest &&
    (base.href.startsWith("/admin/finance/") ||
      base.href.startsWith("/admin/orders/") ||
      base.href.startsWith("/admin/access/") ||
      base.href.startsWith("/admin/platform/"))
  ) {
    tail = humanizePathRest(rest);
  }

  return [
    { label: "Home", href: "/admin/dashboard" },
    { label: base.label, href: base.href },
    { label: tail },
  ];
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Default all sections open.
    setOpenSections((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const sec of NAV_SECTIONS) {
        if (next[sec.title] === undefined) next[sec.title] = true;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      document.documentElement.style.setProperty(
        "--admin-sidebar-w",
        "248px",
      );
    } catch {}
  }, []);

  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.replace('/signin');
          return;
        }

        try {
          const data = await fetchAdminProfile();
          setAdminProfile(data);
        } catch {
          console.error("Failed to fetch admin profile");
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminProfile();
  }, [router]);

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as Node | null;
      if (openProfileMenu && profileMenuRef.current && target) {
        if (!profileMenuRef.current.contains(target)) setOpenProfileMenu(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openProfileMenu]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    try {
      localStorage.removeItem('verified');
    } catch {}
    router.replace('/signin');
  };

  // Get initials from username or email
  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const initials = getInitials(adminProfile?.username, adminProfile?.email);

  const crumbs = adminBreadcrumbs(pathname);

  return (
    <>
      {/* Top Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 h-16 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between h-full px-6 gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Link href="/admin/dashboard" className="flex items-center gap-3 shrink-0">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
                aria-hidden
              >
                <ChefHat className="h-[18px] w-[18px]" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <div className="text-base font-extrabold tracking-tight text-slate-900">
                  HanalaFood
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  Operations
                </div>
              </div>
            </Link>

            <nav
              className="flex items-center gap-2 min-w-0 overflow-hidden text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]"
              aria-label="Breadcrumb"
            >
              <span
                className="shrink-0 w-[3px] h-[18px] rounded-sm bg-emerald-500"
                aria-hidden
              />
              {crumbs.map((it, idx) => {
                const isLast = idx === crumbs.length - 1;
                const clickable = Boolean(it.href) && !isLast;
                const cls = clickable
                  ? "truncate hover:opacity-80 transition-opacity"
                  : "truncate";
                return (
                  <React.Fragment key={`${it.label}-${idx}`}>
                    {idx > 0 ? (
                      <ChevronRight
                        className="w-4 h-4 shrink-0 text-[oklch(0.551_0.027_264.364)] opacity-80"
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
          </div>

          {/* Admin Info */}
          <div ref={profileMenuRef} className="relative flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
                <div>
                  <div className="w-20 h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setOpenProfileMenu((v) => !v);
                  }}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                  aria-label="Open profile menu"
                >
                  {adminProfile?.avatar ? (
                    <Image
                      src={adminProfile.avatar}
                      alt={adminProfile.username}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-fuchsia-500 to-rose-500 shadow-sm ring-2 ring-white">
                      <span className="text-white text-sm font-semibold">{initials}</span>
                    </div>
                  )}

                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">
                      {adminProfile?.username || adminProfile?.email || "Admin"}
                    </p>
                    <p className="text-xs text-slate-500">Admin</p>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 ml-1 transition-transform duration-200 ${
                      openProfileMenu ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                <div
                  className={`absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg origin-top-right transition-all duration-150 ease-out ${
                    openProfileMenu
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                  }`}
                >
                    <div className="px-4 py-3 border-b border-slate-200">
                      <div className="flex flex-col items-center">
                        <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <span className="text-slate-600 font-semibold">
                            {getInitials(adminProfile?.username, adminProfile?.email)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 text-center">
                          {adminProfile?.username || adminProfile?.email || "Admin"}
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="flex-1">Shop Information</span>
                      </a>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span className="flex-1">Shop Setting</span>
                      </a>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
                      >
                        <Globe className="w-4 h-4 text-slate-500" />
                        <span className="flex-1">English</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </a>
                    </div>

                    <div className="border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
                      >
                        <LogOut className="w-4 h-4 text-slate-500" />
                        Logout
                      </button>
                    </div>
                  </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar - Light, sectioned */}
      <aside
        className="fixed top-16 left-0 h-[calc(100vh-64px)] w-[248px] bg-white border-r border-slate-200 z-40"
      >
        <div className="h-full flex flex-col">
          {/* Navigation */}
          <nav className="flex-1 py-2 overflow-y-auto bg-white">
            {NAV_SECTIONS.map((sec) => {
              const isOpen = openSections[sec.title] !== false;
              return (
                <div key={sec.title} className="pb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [sec.title]: !isOpen,
                      }))
                    }
                    className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
                      isOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="py-1">
                      {sec.items.map((item) => {
                        if ((item as any).kind === "group") {
                          const g = item as {
                            id: string;
                            label: string;
                            items: { href: string; label: string }[];
                          };
                          const groupActive = g.items.some((x) => isActive(x.href));
                          const isGroupOpen = openGroups[g.id] ?? true;
                          return (
                            <li key={`group:${g.id}`} className="px-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenGroups((prev) => ({
                                    ...prev,
                                    [g.id]: !(prev[g.id] ?? true),
                                  }))
                                }
                                className={`w-full px-2 py-2 rounded-lg flex items-center justify-between text-[13px] leading-4 transition-colors ${
                                  groupActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <span className="font-semibold truncate">
                                  {g.label}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                                    isGroupOpen ? "rotate-0" : "-rotate-90"
                                  }`}
                                />
                              </button>
                              <div
                                className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
                                  isGroupOpen
                                    ? "max-h-[420px] opacity-100"
                                    : "max-h-0 opacity-0"
                                }`}
                              >
                                <ul className="py-1">
                                  {g.items.map(({ href, label }) => {
                                    const active = isActive(href);
                                    return (
                                      <li key={href}>
                                        <Link
                                          href={href}
                                          prefetch
                                          className={`relative block px-4 py-2 pl-10 text-[13px] leading-4 font-medium text-[#3D4046] transition-colors ${
                                            active
                                              ? "bg-blue-50"
                                              : "hover:bg-slate-50"
                                          }`}
                                        >
                                          <span
                                            className={`absolute left-0 top-1 bottom-1 w-1 bg-blue-600 transition-opacity ${
                                              active ? "opacity-100" : "opacity-0"
                                            }`}
                                            aria-hidden="true"
                                          />
                                          <span>{label}</span>
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            </li>
                          );
                        }

                        const link = item as { href: string; label: string };
                        const active = isActive(link.href);
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              prefetch
                              className={`relative block px-4 py-2 pl-9 text-[13px] leading-4 font-medium text-[#3D4046] transition-colors ${
                                active
                                  ? "bg-blue-50"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`absolute left-0 top-1 bottom-1 w-1 bg-blue-600 transition-opacity ${
                                  active ? "opacity-100" : "opacity-0"
                                }`}
                                aria-hidden="true"
                              />
                              <span>{link.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>

        </div>
      </aside>
    </>
  );
}
