"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { EnterpriseFinanceService } from "@/services/enterprise-finance.service";

type FinanceVerifyGateProps = {
  storageKey?: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
};

type Stored = { verifiedAt: number };

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

function safeParseStored(v: string | null): Stored | null {
  if (!v) return null;
  try {
    const obj = JSON.parse(v) as any;
    if (obj && typeof obj.verifiedAt === "number") return { verifiedAt: obj.verifiedAt };
    return null;
  } catch {
    return null;
  }
}

export function FinanceVerifyGate({ storageKey, children, preview }: FinanceVerifyGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const key = useMemo(() => storageKey ?? `enterprise_finance_verified:${pathname}`, [storageKey, pathname]);

  const [hydrated, setHydrated] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifyInFlightRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    const stored = safeParseStored(sessionStorage.getItem(key));
    const ok = !!(stored && now - stored.verifiedAt <= DEFAULT_TTL_MS);
    setVerified(ok);
    setHydrated(true);
  }, [key]);

  const canShow = hydrated && verified;

  const verify = async () => {
    if (verifyInFlightRef.current) return;
    const p = password.trim();
    if (!p) return;
    verifyInFlightRef.current = true;
    try {
      setVerifying(true);
      setError(null);
      await EnterpriseFinanceService.verifyPassword({ password: p });
      sessionStorage.setItem(key, JSON.stringify({ verifiedAt: Date.now() } satisfies Stored));
      setVerified(true);
      setPassword("");
    } catch {
      try {
        sessionStorage.removeItem(key);
      } catch {}
      setVerified(false);
      setError("Incorrect password");
      router.replace("/enterprise/dashboard");
    } finally {
      setVerifying(false);
      verifyInFlightRef.current = false;
    }
  };

  if (canShow) return <>{children}</>;

  return (
    <div className="relative w-full">
      <div className="pointer-events-none select-none opacity-40">{preview ?? null}</div>

      <div className="fixed inset-0 z-50 bg-black/55" aria-hidden />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-md rounded-md bg-white p-6 shadow-xl">
          <button
            type="button"
            onClick={() => router.replace("/enterprise/dashboard")}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ×
          </button>

          <h3 className="text-base font-semibold text-gray-900">Enter your password</h3>
          <p className="mt-1 text-xs text-gray-500">
            To protect your account safety, please enter your Login Password for verification.
          </p>

          <div className="mt-4">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter password"
              className="h-9 w-full rounded border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-blue-400"
              autoFocus
            />
            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.replace("/enterprise/dashboard")}
              className="h-9 min-w-24 rounded border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={verify}
              disabled={!password.trim() || verifying}
              className="h-9 min-w-24 rounded bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Verify
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {}}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Verify With Phone Number
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

