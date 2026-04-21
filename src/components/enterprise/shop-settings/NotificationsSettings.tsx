"use client";

import React, { useMemo, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { Switch } from "@/components/ui/switch";

type NotificationsTabKey = "channels" | "order-updates" | "marketing";

export function NotificationsSettings() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<NotificationsTabKey>("channels");

  const [notif, setNotif] = useState({
    email: true,
    push: true,
    sms: false,
    orderCreated: true,
    orderCancelled: true,
    orderRefund: true,
    promotions: false,
    productTips: false,
  });

  const tabs: { key: NotificationsTabKey; label: string }[] = useMemo(
    () => [
      { key: "channels", label: "Channels" },
      { key: "order-updates", label: "Order Updates" },
      { key: "marketing", label: "Marketing" },
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
        {tab === "channels" ? (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Notifications
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Choose how we notify you about activity and updates.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Channels
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Turn channels on/off. Some alerts may still be required for security.
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      Email notifications
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Receive alerts via email.
                    </div>
                  </div>
                  <Switch
                    checked={notif.email}
                    onCheckedChange={(v) => setNotif((p) => ({ ...p, email: v }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      Push notifications
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Get real-time updates on this device.
                    </div>
                  </div>
                  <Switch
                    checked={notif.push}
                    onCheckedChange={(v) => setNotif((p) => ({ ...p, push: v }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      SMS (optional)
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      For critical updates. May incur carrier fees.
                    </div>
                  </div>
                  <Switch
                    checked={notif.sms}
                    onCheckedChange={(v) => setNotif((p) => ({ ...p, sms: v }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-5 py-4">
                <button
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() =>
                    setNotif((p) => ({ ...p, email: true, push: true, sms: false }))
                  }
                >
                  Reset
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
        ) : tab === "order-updates" ? (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Order Updates
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Control which order events trigger notifications.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Events
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Recommended: keep important events enabled.
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      New order created
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Alert when a new order is placed.
                    </div>
                  </div>
                  <Switch
                    checked={notif.orderCreated}
                    onCheckedChange={(v) =>
                      setNotif((p) => ({ ...p, orderCreated: v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      Order cancelled
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Alert when an order is cancelled.
                    </div>
                  </div>
                  <Switch
                    checked={notif.orderCancelled}
                    onCheckedChange={(v) =>
                      setNotif((p) => ({ ...p, orderCancelled: v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      Returns / refunds
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Alert when a return/refund is requested.
                    </div>
                  </div>
                  <Switch
                    checked={notif.orderRefund}
                    onCheckedChange={(v) =>
                      setNotif((p) => ({ ...p, orderRefund: v }))
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
                Marketing
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Optional product updates and tips.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Preferences
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  You can change these anytime.
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      Promotions
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Discounts, campaigns, and seasonal events.
                    </div>
                  </div>
                  <Switch
                    checked={notif.promotions}
                    onCheckedChange={(v) =>
                      setNotif((p) => ({ ...p, promotions: v }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900">
                      Product tips
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-500">
                      Learn how to improve conversion and operations.
                    </div>
                  </div>
                  <Switch
                    checked={notif.productTips}
                    onCheckedChange={(v) =>
                      setNotif((p) => ({ ...p, productTips: v }))
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
        )}
      </div>
    </>
  );
}

