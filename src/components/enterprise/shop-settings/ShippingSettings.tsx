"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

type ShippingTabKey =
  | "address-management"
  | "shipping-channel"
  | "pickup-operating-hours";

type AddressBadge = "Default Address" | "Pickup Address" | "Return Address";

type AddressCard = {
  id: string;
  title: string;
  fullName: string;
  phoneNumber: string;
  addressLines: string[];
  badges: AddressBadge[];
};

function chipClass(badge: AddressBadge) {
  switch (badge) {
    case "Default Address":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Pickup Address":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Return Address":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function ShippingSettings() {
  const [tab, setTab] = useState<ShippingTabKey>("address-management");

  const tabs: { key: ShippingTabKey; label: string }[] = useMemo(
    () => [
      { key: "address-management", label: "Address Management" },
      { key: "shipping-channel", label: "Shipping Channel" },
      { key: "pickup-operating-hours", label: "Pickup Operating Hours" },
    ],
    [],
  );

  const addresses: AddressCard[] = useMemo(
    () => [
      {
        id: "addr-1",
        title: "Address 1",
        fullName: "Bianca Velez",
        phoneNumber: "0997554936",
        addressLines: [
          "24 Jupiter Street",
          "Commonwealth, Quezon City",
          "NCR, Metro Manila 1130",
        ],
        badges: ["Default Address", "Pickup Address", "Return Address"],
      },
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
                  active
                    ? "text-sky-700 font-semibold"
                    : "hover:text-slate-900"
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
        {tab === "address-management" ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                  My Addresses
                </h1>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  Manage your shipping and pickup addresses
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Address
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {addresses.map((addr) => (
                <div key={addr.id}>
                  <h2 className="text-[13px] font-semibold text-slate-900">
                    {addr.title}
                  </h2>

                  <div className="mt-2 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[12px] text-slate-500">
                            Full Name
                          </div>
                          <div className="text-[13px] font-medium text-slate-900">
                            {addr.fullName}
                          </div>
                          <div className="ms-2 flex flex-wrap gap-2">
                            {addr.badges.map((b) => (
                              <span
                                key={b}
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${chipClass(
                                  b,
                                )}`}
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-2 text-[13px] md:grid-cols-[120px_1fr]">
                          <div className="text-[12px] text-slate-500">
                            Phone Number
                          </div>
                          <div className="text-slate-900">
                            {addr.phoneNumber}
                          </div>

                          <div className="text-[12px] text-slate-500">
                            Address
                          </div>
                          <div className="text-slate-900">
                            {addr.addressLines.map((ln) => (
                              <div key={ln}>{ln}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right text-[12px] leading-5">
                        <Link
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="block text-slate-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <Link
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="mt-1 block text-rose-600 hover:underline"
                        >
                          Delete
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-[13px] text-slate-500">
            Content coming soon.
          </div>
        )}
      </div>
    </>
  );
}

