"use client";

import React, { useMemo, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/ui/dropdown-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductTabKey = "catalog" | "pricing" | "inventory";

export function ProductSettings() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<ProductTabKey>("catalog");

  const [productNewItemStatus, setProductNewItemStatus] = useState<
    "visible" | "hidden"
  >("visible");
  const [pricingCurrency, setPricingCurrency] = useState<"VND" | "USD">("VND");
  const [pricingTaxIncluded, setPricingTaxIncluded] = useState<"yes" | "no">(
    "yes",
  );
  const [inventoryZeroStockBehavior, setInventoryZeroStockBehavior] = useState<
    "hide" | "sold-out"
  >("hide");
  const [inventoryAllowBackorders, setInventoryAllowBackorders] = useState<
    "no" | "yes"
  >("no");

  const tabs: { key: ProductTabKey; label: string }[] = useMemo(
    () => [
      { key: "catalog", label: "Catalog" },
      { key: "pricing", label: "Pricing" },
      { key: "inventory", label: "Inventory" },
    ],
    [],
  );

  const newItemStatusOptions: DropdownSelectOption[] = useMemo(
    () => [
      { value: "visible", label: "Visible" },
      { value: "hidden", label: "Hidden" },
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
        {tab === "catalog" ? (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Product
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Defaults for how your foods and menus appear to customers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Catalog visibility
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Control listing behavior for new items.
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      New item status
                    </div>
                    <div className="mt-1">
                      <DropdownSelect
                        value={productNewItemStatus}
                        onChange={(v) =>
                          setProductNewItemStatus(
                            v as typeof productNewItemStatus,
                          )
                        }
                        options={newItemStatusOptions}
                        aria-label="New item status"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Default preparation time
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        className="w-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="15"
                      />
                      <span className="text-[13px] text-slate-600">mins</span>
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Auto-approve edits
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                      <span className="text-[13px] text-slate-700">Enable</span>
                      <button
                        type="button"
                        className="h-6 w-11 rounded-full bg-slate-200 p-0.5 transition"
                        aria-label="Toggle auto-approve"
                        onClick={() =>
                          showToast("Wire this to backend later.", "info")
                        }
                      >
                        <span className="block h-5 w-5 rounded-full bg-white shadow" />
                      </button>
                    </div>
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
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : tab === "pricing" ? (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Pricing
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Default pricing rules for items and discounts.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Price display
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Choose how prices are shown on the storefront.
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Currency
                    </div>
                    <div className="mt-1">
                      <Select
                        value={pricingCurrency}
                        onValueChange={(v) =>
                          setPricingCurrency(v as typeof pricingCurrency)
                        }
                      >
                        <SelectTrigger className="h-10 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VND">VND</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Tax included
                    </div>
                    <div className="mt-1">
                      <Select
                        value={pricingTaxIncluded}
                        onValueChange={(v) =>
                          setPricingTaxIncluded(v as typeof pricingTaxIncluded)
                        }
                      >
                        <SelectTrigger className="h-10 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Default discount label
                    </div>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="e.g. Limited offer"
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
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="min-w-0">
              <h1 className="text-[18px] leading-6 font-semibold text-slate-900">
                Inventory
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                Stock behavior when items are unavailable.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="text-[14px] font-semibold text-slate-900">
                  Out-of-stock rules
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  Decide what happens if an item runs out.
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      When stock hits 0
                    </div>
                    <div className="mt-1">
                      <Select
                        value={inventoryZeroStockBehavior}
                        onValueChange={(v) =>
                          setInventoryZeroStockBehavior(
                            v as typeof inventoryZeroStockBehavior,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hide">Hide item</SelectItem>
                          <SelectItem value="sold-out">
                            Mark as sold out
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Allow backorders
                    </div>
                    <div className="mt-1">
                      <Select
                        value={inventoryAllowBackorders}
                        onValueChange={(v) =>
                          setInventoryAllowBackorders(
                            v as typeof inventoryAllowBackorders,
                          )
                        }
                      >
                        <SelectTrigger className="h-10 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-medium text-slate-700">
                      Low-stock warning
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        className="w-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="5"
                      />
                      <span className="text-[13px] text-slate-600">items</span>
                    </div>
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

