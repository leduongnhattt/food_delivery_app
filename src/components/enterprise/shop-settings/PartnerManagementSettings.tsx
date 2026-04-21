"use client";

import React, { useMemo, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { Switch } from "@/components/ui/switch";

type PartnerTabKey = "integrations" | "access" | "webhooks";

export function PartnerManagementSettings() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<PartnerTabKey>("integrations");

  const [partner, setPartner] = useState({
    allowOrderSync: true,
    allowMenuSync: false,
    allowWebhookEvents: true,
    webhookUrl: "",
  });

  const tabs: { key: PartnerTabKey; label: string }[] = useMemo(
    () => [
      { key: "integrations", label: "Integrations" },
      { key: "access", label: "Access" },
      { key: "webhooks", label: "Webhooks" },
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
        {tab === "integrations" ? (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Partner Management
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Manage integrations and permissions for connected partners.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-[13px] font-semibold text-slate-900">
                  POS integration
                </div>
                <div className="mt-1 text-[12px] text-slate-500">
                  Sync orders and menu with your POS (coming soon).
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => showToast("Integration setup coming soon.", "info")}
                >
                  Configure
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-[13px] font-semibold text-slate-900">
                  Delivery partner
                </div>
                <div className="mt-1 text-[12px] text-slate-500">
                  Connect a third-party courier service.
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                  onClick={() => showToast("Partner connect flow coming soon.", "info")}
                >
                  Connect
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-[13px] font-semibold text-slate-900">
                  Accounting export
                </div>
                <div className="mt-1 text-[12px] text-slate-500">
                  Export payouts and invoices to your system.
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => showToast("Coming soon.", "info")}
                >
                  Setup
                </button>
              </div>
            </div>
          </div>
        ) : tab === "access" ? (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Partner Access
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Control what partners can read or modify.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Permissions
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Apply to all connected partners.
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      Allow order sync
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Partners can fetch order list and statuses.
                    </div>
                  </div>
                  <Switch
                    checked={partner.allowOrderSync}
                    onCheckedChange={(v) =>
                      setPartner((p) => ({ ...p, allowOrderSync: v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      Allow menu sync
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Partners can read and update your menu.
                    </div>
                  </div>
                  <Switch
                    checked={partner.allowMenuSync}
                    onCheckedChange={(v) =>
                      setPartner((p) => ({ ...p, allowMenuSync: v }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-5 py-4">
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
        ) : (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Webhooks
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Receive event callbacks for orders and refunds (UI only).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Endpoint
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Your server URL to receive events.
                </div>
              </div>
              <div className="px-5 py-5">
                <label className="block">
                  <div className="text-[12px] font-medium text-slate-700">
                    Webhook URL
                  </div>
                  <input
                    value={partner.webhookUrl}
                    onChange={(e) =>
                      setPartner((p) => ({ ...p, webhookUrl: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="https://example.com/webhooks/orders"
                  />
                  <div className="mt-1 text-[12px] text-slate-500">
                    We'll sign webhook payloads once backend is implemented.
                  </div>
                </label>

                <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900">
                      Enable webhooks
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Turn off to stop sending all events.
                    </div>
                  </div>
                  <Switch
                    checked={partner.allowWebhookEvents}
                    onCheckedChange={(v) =>
                      setPartner((p) => ({ ...p, allowWebhookEvents: v }))
                    }
                  />
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

