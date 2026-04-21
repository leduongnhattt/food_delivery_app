"use client";

import React, { useMemo, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import {
  EnterpriseMenuSelect,
  type EnterpriseMenuSelectOption,
} from "@/components/enterprise/orders/shared/EnterpriseMenuSelect";

type PaymentTabKey = "payment-methods" | "payout" | "billing";

export function PaymentSettings() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<PaymentTabKey>("payment-methods");

  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<
    "cod" | "stripe" | "wallet"
  >("cod");

  const tabs: { key: PaymentTabKey; label: string }[] = useMemo(
    () => [
      { key: "payment-methods", label: "Payment Methods" },
      { key: "payout", label: "Payout" },
      { key: "billing", label: "Billing" },
    ],
    [],
  );

  const preferredPaymentOptions: EnterpriseMenuSelectOption[] = useMemo(
    () => [
      { value: "cod", label: "Cash on delivery" },
      { value: "stripe", label: "Card / Stripe" },
      { value: "wallet", label: "Wallet / QR" },
    ],
    [],
  );

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
        {tab === "payment-methods" ? (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Payment
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Configure payment channels customers can use at checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-[13px] font-semibold text-slate-900">
                  Cash on delivery
                </div>
                <div className="mt-1 text-[12px] text-slate-500">
                  Allow customers to pay when receiving the order.
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[13px] text-slate-700">Enabled</span>
                  <button
                    type="button"
                    className="h-6 w-11 rounded-full bg-emerald-500 p-0.5 transition"
                    aria-label="Toggle cash on delivery"
                    onClick={() => showToast("Wire this to backend later.", "info")}
                  >
                    <span className="block h-5 w-5 translate-x-5 rounded-full bg-white shadow" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-[13px] font-semibold text-slate-900">
                  Card / Stripe
                </div>
                <div className="mt-1 text-[12px] text-slate-500">
                  Accept Visa/Mastercard via Stripe.
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[13px] text-slate-700">Status</span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    Connected
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => showToast("Open connect flow later.", "info")}
                >
                  Manage
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-[13px] font-semibold text-slate-900">
                  Wallet / QR
                </div>
                <div className="mt-1 text-[12px] text-slate-500">
                  Enable local wallet or QR payments.
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[13px] text-slate-700">Status</span>
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Not set
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                  onClick={() => showToast("Setup wizard coming soon.", "info")}
                >
                  Setup
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Preferred payment method
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Used as the default selection in your checkout UI.
                </div>
              </div>
              <div className="px-5 py-5">
                <label className="block max-w-[420px]">
                  <div className="text-[12px] font-medium text-slate-700">
                    Preferred method
                  </div>
                  <div className="mt-1">
                    <EnterpriseMenuSelect
                      value={preferredPaymentMethod}
                      onChange={(v) =>
                        setPreferredPaymentMethod(
                          v as typeof preferredPaymentMethod,
                        )
                      }
                      options={preferredPaymentOptions}
                      aria-label="Preferred payment method"
                    />
                  </div>
                </label>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                    onClick={() => showToast("Saved (UI only).", "success")}
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : tab === "payout" ? (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Payout
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Where we send your earnings from card/wallet payments.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Bank account
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Update payout details for settlements.
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Bank name
                    </div>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="e.g. Vietcombank"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Account number
                    </div>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="•••• •••• ••••"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Account holder
                    </div>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="Full name"
                    />
                  </label>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                    onClick={() => showToast("Saved (UI only).", "success")}
                  >
                    Save payout
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Billing
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Invoice preferences and payout notifications.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Invoice email
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  We'll send monthly statements here.
                </div>
              </div>
              <div className="px-5 py-5">
                <label className="block max-w-[520px]">
                  <div className="text-[12px] font-medium text-slate-700">
                    Email
                  </div>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="billing@yourshop.com"
                  />
                </label>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                    onClick={() => showToast("Saved (UI only).", "success")}
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

