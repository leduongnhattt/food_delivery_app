"use client";

import React from "react";

export type ShopSettingsTopTabKey =
  | "account-security"
  | "shipping"
  | "payment"
  | "product"
  | "notifications"
  | "partner-management";

export function ShopSettingsTabs({
  value,
  onChange,
}: {
  value: ShopSettingsTopTabKey;
  onChange: (next: ShopSettingsTopTabKey) => void;
}) {
  const tabs: { key: ShopSettingsTopTabKey; label: string }[] = [
    { key: "account-security", label: "Account Security" },
    { key: "shipping", label: "Shipping" },
    { key: "payment", label: "Payment" },
    { key: "product", label: "Product" },
    { key: "notifications", label: "Notifications" },
    { key: "partner-management", label: "Partner Management" },
  ];

  return (
    <div className="border-b border-slate-200">
      <div className="flex flex-wrap gap-6 text-[13px] leading-5 text-slate-600">
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={`relative -mb-px pb-3 transition-colors ${
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
  );
}

