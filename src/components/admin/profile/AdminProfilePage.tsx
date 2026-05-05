"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Mail, RefreshCw, Shield, User } from "lucide-react";
import { fetchAdminProfile } from "@/services/admin.service";
import type { AdminProfileResponse } from "@/types/admin-api.types";
import { useToast } from "@/contexts/toast-context";

function getInitials(username: string | undefined, email: string | undefined): string {
  if (username?.trim()) {
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return "AD";
}

export default function AdminProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<AdminProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminProfile();
      setProfile(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load profile";
      setError(msg);
      setProfile(null);
      showToast(msg, "error", 5000);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined" || !profile) return;
    const urlHash = window.location.hash;
    if (urlHash === "#admin-profile-settings" || urlHash === "#settings") {
      const settingsSection = document.getElementById("admin-profile-settings");
      settingsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [profile]);

  const initials = getInitials(profile?.username, profile?.email);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            Profile
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)] max-w-xl">
            HanalaFood operations — account details from the admin API. Enterprise shop settings are managed
            separately in the merchant console.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && !loading ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
          Account overview
        </div>
        <div className="p-4 sm:p-6">
          {loading && !profile ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500 text-[13px]">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              Loading profile…
            </div>
          ) : profile ? (
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              <div className="flex flex-col items-center md:items-start shrink-0">
                {profile.avatar ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                    <Image
                      src={profile.avatar}
                      alt={profile.username || "Admin avatar"}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-fuchsia-500 to-rose-500 text-2xl font-bold text-white shadow-sm"
                    aria-hidden
                  >
                    {initials}
                  </div>
                )}
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-800">
                  <Shield className="h-3 w-3" aria-hidden />
                  Administrator
                </span>
              </div>

              <dl className="min-w-0 flex-1 space-y-4">
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <User className="h-3.5 w-3.5" aria-hidden />
                    Username
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-slate-900 break-words">
                    {profile.username || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Email
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-slate-900 break-all">
                    {profile.email || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      <section
        id="admin-profile-settings"
        className="rounded-lg border border-slate-200 bg-white overflow-hidden scroll-mt-24"
      >
        <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
          Account settings
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-[13px] font-medium text-slate-900">Time zone</p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Order times, audit logs, and reports use the platform default. A per-admin time zone setting is
                not available yet.
              </p>
            </div>
            <span className="shrink-0 text-[12px] font-medium text-slate-400">Platform default</span>
          </div>
          <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-[13px] font-medium text-slate-900">Password & security</p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Password changes use your account security flow outside this screen (for example the sign-in
                page and forgot-password recovery, or your IdP policy).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
