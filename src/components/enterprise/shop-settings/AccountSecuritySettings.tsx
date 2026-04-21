"use client";

import React, { useMemo, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import { changePassword } from "@/services/change-password.service";
import { logoutUser } from "@/lib/auth-helpers";
import {
  validatePasswordConfirmation,
  validatePasswordStrength,
} from "@/lib/auth-validation";

type AccountSecurityTabKey = "password" | "two-factor" | "sessions";

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordFormErrors = Partial<Record<keyof PasswordFormState, string>>;

export function AccountSecuritySettings() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<AccountSecurityTabKey>("password");

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [pw, setPw] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState<PasswordFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const tabs: { key: AccountSecurityTabKey; label: string }[] = useMemo(
    () => [
      { key: "password", label: "Password" },
      { key: "two-factor", label: "Two-factor" },
      { key: "sessions", label: "Sessions" },
    ],
    [],
  );

  const canSubmit =
    !submitting &&
    pw.currentPassword.trim().length > 0 &&
    pw.newPassword.trim().length > 0 &&
    pw.confirmPassword.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const nextErrors: PasswordFormErrors = {};
    if (!pw.currentPassword.trim()) {
      nextErrors.currentPassword = "Current password is required.";
    }

    const strength = validatePasswordStrength(pw.newPassword);
    if (!strength.isValid) {
      nextErrors.newPassword = strength.errorMessage || "Invalid password.";
    }

    const confirm = validatePasswordConfirmation(pw.newPassword, pw.confirmPassword);
    if (!confirm.isValid) {
      nextErrors.confirmPassword = confirm.errorMessage || "Passwords do not match.";
    }

    if (pw.currentPassword && pw.newPassword && pw.currentPassword === pw.newPassword) {
      nextErrors.newPassword = "New password must be different from current password.";
    }

    setPwErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast("Please check the password fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      if (!res.success) {
        const msg = res.error?.message || "Failed to change password.";
        if (msg.toLowerCase().includes("current password")) {
          setPw((p) => ({ ...p, currentPassword: "" }));
          setPwErrors((p) => ({ ...p, currentPassword: msg }));
        }
        showToast(msg, "error");
        return;
      }

      showToast("Password changed successfully. Please sign in again.", "success");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwErrors({});

      try {
        await logoutUser();
      } finally {
        window.location.href = "/";
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="border-b border-slate-200 px-5">
        <div className="flex flex-wrap gap-8 text-[13px] leading-5 text-slate-600">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative -mb-px py-3 transition-colors ${
                  active ? "text-sky-700 font-semibold" : "hover:text-slate-900"
                }`}
              >
                {t.label}
                {active ? (
                  <span
                    className="absolute left-0 right-0 -bottom-px h-0.5 bg-sky-600"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {tab === "password" ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                  Account Security
                </h1>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  Manage password and login security for your shop account.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Secure
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Change password
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Use a strong password to protect your account.
                </div>
              </div>

              <form className="px-5 py-5" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Current password
                    </div>
                    <div className="mt-1 relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={pw.currentPassword}
                        onChange={(ev) => {
                          const v = ev.target.value;
                          setPw((p) => ({ ...p, currentPassword: v }));
                          setPwErrors((p) => ({ ...p, currentPassword: undefined }));
                        }}
                        className={`w-full rounded-md border bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 ${
                          pwErrors.currentPassword ? "border-rose-300" : "border-slate-200"
                        }`}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-50"
                        aria-label="Toggle current password visibility"
                      >
                        {showCurrentPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {pwErrors.currentPassword ? (
                      <div className="mt-1 text-[12px] text-rose-600">
                        {pwErrors.currentPassword}
                      </div>
                    ) : null}
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      New password
                    </div>
                    <div className="mt-1 relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={pw.newPassword}
                        onChange={(ev) => {
                          const v = ev.target.value;
                          setPw((p) => ({ ...p, newPassword: v }));
                          setPwErrors((p) => ({ ...p, newPassword: undefined }));
                        }}
                        className={`w-full rounded-md border bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 ${
                          pwErrors.newPassword ? "border-rose-300" : "border-slate-200"
                        }`}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-50"
                        aria-label="Toggle new password visibility"
                      >
                        {showNewPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="mt-1 text-[12px] text-slate-500">
                      At least 6 characters, include letter, number, and special character.
                    </div>
                    {pwErrors.newPassword ? (
                      <div className="mt-1 text-[12px] text-rose-600">
                        {pwErrors.newPassword}
                      </div>
                    ) : null}
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Confirm password
                    </div>
                    <div className="mt-1 relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        value={pw.confirmPassword}
                        onChange={(ev) => {
                          const v = ev.target.value;
                          setPw((p) => ({ ...p, confirmPassword: v }));
                          setPwErrors((p) => ({ ...p, confirmPassword: undefined }));
                        }}
                        className={`w-full rounded-md border bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 ${
                          pwErrors.confirmPassword ? "border-rose-300" : "border-slate-200"
                        }`}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-50"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {pwErrors.confirmPassword ? (
                      <div className="mt-1 text-[12px] text-rose-600">
                        {pwErrors.confirmPassword}
                      </div>
                    ) : null}
                  </label>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setPwErrors({});
                    }}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : tab === "two-factor" ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-[13px] text-slate-500">
            Two-factor setup coming soon.
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-[13px] text-slate-500">
            Active sessions coming soon.
          </div>
        )}
      </div>
    </>
  );
}

