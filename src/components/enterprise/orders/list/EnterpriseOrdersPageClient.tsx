"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/toast-context";
import {
  orderManagementService,
  type Order,
} from "@/services/order-management.service";
import {
  csvEscapeCell,
  downloadCsvFile,
  makeTimestampForFilename,
} from "@/lib/csv";
import DeleteOrderPopup from "@/components/enterprise/orders/shared/DeleteOrderPopup";
import { EnterpriseOrdersPrimaryTabs } from "@/components/enterprise/orders/list/EnterpriseOrdersPrimaryTabs";
import { EnterpriseOrdersTable } from "@/components/enterprise/orders/list/EnterpriseOrdersTable";
import {
  ArrangeShipmentModal,
  type DeliveryMethod,
} from "@/components/enterprise/orders/shared/ArrangeShipmentModal";
import { getDeliveryMethodFromMetadata } from "@/components/enterprise/orders/detail/order-actions";
import {
  matchesEnterpriseTab,
  parseTabFromQuery,
  parseToShipSubFromQuery,
  type EnterpriseOrderTab,
  type EnterpriseToShipSubTab,
} from "@/lib/enterprise-orders";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/ui/dropdown-select";
import { EnterprisePageHeader, ENTERPRISE_PANEL_CLASS } from "@/components/enterprise/EnterprisePageHeader";

type SearchField = "product" | "buyer_name" | "order_id" | "tracking_number";
type ShippingPriority = "all" | "overdue" | "today" | "tomorrow";

interface CommittedFilters {
  searchField: SearchField;
  searchInput: string;
  shippingChannel: string;
  selectedPriority: ShippingPriority;
}

function defaultCommittedFilters(): CommittedFilters {
  return {
    searchField: "product",
    searchInput: "",
    shippingChannel: "all",
    selectedPriority: "all",
  };
}

function jsonMetaPickString(meta: unknown, keys: string[]): string {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "";
  const o = meta as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function orderTrackingHaystack(metadata: unknown): string {
  return jsonMetaPickString(metadata, [
    "trackingNumber",
    "trackingNo",
    "tracking_no",
    "carrierTrackingNumber",
    "CarrierTrackingNumber",
    "TrackingNumber",
  ]);
}

function matchesSearch(order: Order, searchField: SearchField, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  switch (searchField) {
    case "buyer_name": {
      const name = order.customerName.toLowerCase();
      const u = (order.customerUsername ?? "").toLowerCase();
      return name.includes(t) || u.includes(t);
    }
    case "order_id":
      return order.id.toLowerCase().includes(t);
    case "tracking_number": {
      const hay = orderTrackingHaystack(order.metadata).toLowerCase();
      return hay.includes(t);
    }
    case "product":
    default:
      return order.orderDetails.some((d) => {
        const dn = d.dishName.toLowerCase();
        const fid = (d.foodId ?? "").toLowerCase();
        const sku = (d.sku ?? "").toLowerCase();
        const ps = (d.parentSku ?? "").toLowerCase();
        return dn.includes(t) || fid.includes(t) || sku.includes(t) || ps.includes(t);
      });
  }
}

function chipClass(active: boolean) {
  return `inline-flex items-center justify-center whitespace-nowrap text-xs font-medium transition-all outline-none h-7 px-3 rounded ${
    active
      ? "bg-[#2563FF] text-white"
      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  }`;
}

const SEARCH_FIELD_OPTIONS: DropdownSelectOption[] = [
  { value: "product", label: "Product" },
  { value: "buyer_name", label: "Buyer Name" },
  { value: "order_id", label: "Order ID" },
  { value: "tracking_number", label: "Tracking Number" },
];

const SEARCH_FIELD_PLACEHOLDER: Record<SearchField, string> = {
  product: "Input product name, parent SKU, SKU or food ID",
  buyer_name: "Input buyer name or username",
  order_id: "Input order ID",
  tracking_number: "Input tracking number",
};

const SHIPPING_CHANNEL_OPTIONS: DropdownSelectOption[] = [
  { value: "all", label: "All Channels" },
];

const SORT_OPTIONS: DropdownSelectOption[] = [
  { value: "newest", label: "Confirmed Date (Newest First)" },
  { value: "oldest", label: "Confirmed Date (Oldest First)" },
  { value: "amount_high", label: "Order Total (High to Low)" },
  { value: "amount_low", label: "Order Total (Low to High)" },
];

const PAGE_SIZE_OPTIONS: DropdownSelectOption[] = [
  { value: "12", label: "12 / page" },
  { value: "24", label: "24 / page" },
  { value: "48", label: "48 / page" },
];

export function EnterpriseOrdersPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState<12 | 24 | 48>(12);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const pagerRef = useRef<HTMLDivElement | null>(null);
  const scrollAfterUpdateRef = useRef(false);
  const isFetchingRef = useRef(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState<string | null>(null);
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const [arrangeOrderId, setArrangeOrderId] = useState<string | null>(null);
  const [arrangeSelected, setArrangeSelected] = useState<DeliveryMethod | null>(null);
  const [arrangeSaving, setArrangeSaving] = useState(false);
  const { showToast } = useToast();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = useMemo(
    () => parseTabFromQuery(searchParams.get("tab")),
    [searchParams],
  );
  const toShipSub = useMemo(
    () => parseToShipSubFromQuery(searchParams.get("sub")),
    [searchParams],
  );

  // committed filters per primary tab (MallPlus behavior)
  const [committedByTab, setCommittedByTab] = useState<
    Record<EnterpriseOrderTab, CommittedFilters>
  >(() => ({
    all: defaultCommittedFilters(),
    unpaid: defaultCommittedFilters(),
    to_ship: defaultCommittedFilters(),
    shipping: defaultCommittedFilters(),
    completed: defaultCommittedFilters(),
    return_refund: defaultCommittedFilters(),
  }));

  // pending: search updates the list as you type; Apply persists filters (incl. search) per tab.
  const committed = committedByTab[tab] ?? defaultCommittedFilters();
  const [pendingSearchField, setPendingSearchField] = useState<SearchField>(committed.searchField);
  const [pendingSearchInput, setPendingSearchInput] = useState<string>(committed.searchInput);
  const [pendingShippingChannel, setPendingShippingChannel] = useState<string>(committed.shippingChannel);
  const [pendingPriority, setPendingPriority] = useState<ShippingPriority>(committed.selectedPriority);

  // When tab changes, load pending values from committed state of that tab
  useEffect(() => {
    const next = committedByTab[tab] ?? defaultCommittedFilters();
    setPendingSearchField(next.searchField);
    setPendingSearchInput(next.searchInput);
    setPendingShippingChannel(next.shippingChannel);
    setPendingPriority(next.selectedPriority);
  }, [tab, committedByTab]);

  const setTabQuery = useCallback(
    (nextTab: EnterpriseOrderTab) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", nextTab);
      if (nextTab !== "to_ship") {
        p.delete("sub");
      }
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setToShipSubQuery = useCallback(
    (sub: EnterpriseToShipSubTab) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", "to_ship");
      p.set("sub", sub);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleApply = useCallback(() => {
    setCommittedByTab((prev) => ({
      ...prev,
      [tab]: {
        searchField: pendingSearchField,
        searchInput: pendingSearchInput,
        shippingChannel: pendingShippingChannel,
        selectedPriority: pendingPriority,
      },
    }));
  }, [pendingPriority, pendingSearchField, pendingSearchInput, pendingShippingChannel, tab]);

  const handleReset = useCallback(() => {
    const def = defaultCommittedFilters();
    setPendingSearchField(def.searchField);
    setPendingSearchInput(def.searchInput);
    setPendingShippingChannel(def.shippingChannel);
    setPendingPriority(def.selectedPriority);
    setCommittedByTab((prev) => ({ ...prev, [tab]: def }));
  }, [tab]);

  const fetchOrders = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (!opts?.silent) setLoading(true);
      // Full list: search runs on the client from pending input (live) and Apply only persists per tab.
      const data = await orderManagementService.fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (!opts?.silent) showToast("Failed to load orders", "error");
    } finally {
      if (!opts?.silent) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (confirmingOrderId || actionLoadingOrderId || arrangeSaving) return;
      await fetchOrders({ silent: true });
    };

    const onFocus = () => void tick();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const id = window.setInterval(() => void tick(), 5000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(id);
    };
  }, [fetchOrders, confirmingOrderId, actionLoadingOrderId, arrangeSaving]);

  const bucketFiltered = useMemo(() => {
    return orders.filter((o) => matchesEnterpriseTab(o, tab, toShipSub));
  }, [orders, tab, toShipSub]);

  const searched = useMemo(() => {
    return bucketFiltered.filter((o) =>
      matchesSearch(o, pendingSearchField, pendingSearchInput),
    );
  }, [bucketFiltered, pendingSearchField, pendingSearchInput]);

  const sortedOrders = useMemo(() => {
    return orderManagementService.sortOrders(searched, sortBy);
  }, [searched, sortBy]);

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const exportRows = sortedOrders;
      if (exportRows.length === 0) {
        showToast("No orders to export", "warning");
        return;
      }

      const header = [
        "OrderID",
        "Buyer",
        "BuyerUsername",
        "Total",
        "Status",
        "OrderDate",
        "Items",
        "PaymentMethod",
        "PaymentStatus",
        "EstimatedDeliveryTime",
        "TrackingNumber",
      ];

      const lines = [
        header.join(","),
        ...exportRows.map((orderRow) => {
          const trackingNumber = orderTrackingHaystack(orderRow.metadata);
          return [
            csvEscapeCell(orderRow.id),
            csvEscapeCell(orderRow.customerName),
            csvEscapeCell(orderRow.customerUsername ?? ""),
            csvEscapeCell(orderRow.totalAmount),
            csvEscapeCell(orderRow.status),
            csvEscapeCell(orderRow.createdAt),
            csvEscapeCell(orderRow.items),
            csvEscapeCell(orderRow.paymentMethod ?? ""),
            csvEscapeCell(orderRow.paymentStatus ?? ""),
            csvEscapeCell(orderRow.estimatedDeliveryTime ?? ""),
            csvEscapeCell(trackingNumber),
          ].join(",");
        }),
      ].join("\n");

      const stamp = makeTimestampForFilename();
      downloadCsvFile(`enterprise-orders-export-${stamp}.csv`, lines);
      showToast(`Exported ${exportRows.length} orders`, "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to export orders";
      showToast(msg, "error");
    } finally {
      setExporting(false);
    }
  }, [exporting, showToast, sortedOrders]);

  // Reset paging when the result set changes (tab, search, sort, etc.)
  useEffect(() => {
    setPage(1);
  }, [tab, toShipSub, pendingSearchField, pendingSearchInput, sortBy, pageSize]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  }, [sortedOrders.length, pageSize]);

  useEffect(() => {
    // Clamp page if data shrinks (e.g. after actions)
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, page, pageSize]);

  const scrollPagerIntoView = useCallback(() => {
    // Keep the pagination controls visible after changing page/size,
    // even when the list height changes (prevents "jump to middle" feel).
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      pagerRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    });
  }, []);

  // Only scroll after explicit user paging action (next/prev/page size).
  useEffect(() => {
    if (!scrollAfterUpdateRef.current) return;
    scrollAfterUpdateRef.current = false;
    scrollPagerIntoView();
  }, [page, pageSize, scrollPagerIntoView]);

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeletePopup(true);
  };

  const handleConfirmOrder = useCallback(
    async (orderId: string) => {
      try {
        setConfirmingOrderId(orderId);
        await orderManagementService.updateOrderStatus(orderId, "Confirmed");
        showToast("Order confirmed", "success");
        await fetchOrders();
      } catch (error: unknown) {
        console.error("Error confirming order:", error);
        const msg =
          error instanceof Error ? error.message : "Could not confirm order";
        showToast(msg, "error");
      } finally {
        setConfirmingOrderId(null);
      }
    },
    [fetchOrders, showToast],
  );

  const handleStartPreparing = useCallback(
    async (orderId: string) => {
      try {
        setActionLoadingOrderId(orderId);
        await orderManagementService.updateOrderStatus(orderId, "Preparing");
        showToast("Order is now preparing", "success");
        await fetchOrders();
      } catch (error: unknown) {
        console.error("Error starting preparing:", error);
        const msg =
          error instanceof Error ? error.message : "Could not start preparing";
        showToast(msg, "error");
      } finally {
        setActionLoadingOrderId(null);
      }
    },
    [fetchOrders, showToast],
  );

  // Start delivery is triggered by Arrange shipment (SelfDelivery) confirm.

  const handleMarkDelivered = useCallback(
    async (orderId: string) => {
      try {
        setActionLoadingOrderId(orderId);
        await orderManagementService.updateOrderStatus(orderId, "Delivered");
        showToast("Order delivered", "success");
        await fetchOrders();
      } catch (error: unknown) {
        console.error("Error marking delivered:", error);
        const msg =
          error instanceof Error ? error.message : "Could not mark delivered";
        showToast(msg, "error");
      } finally {
        setActionLoadingOrderId(null);
      }
    },
    [fetchOrders, showToast],
  );

  const openArrangeShipment = useCallback((orderId: string) => {
    const o = orders.find((x) => x.id === orderId);
    setArrangeOrderId(orderId);
    setArrangeSelected(getDeliveryMethodFromMetadata(o?.metadata) ?? "SelfDelivery");
    setArrangeOpen(true);
  }, [orders]);

  const confirmArrangeShipment = useCallback(async () => {
    if (!arrangeOrderId || !arrangeSelected) return;
    try {
      setArrangeSaving(true);
      await orderManagementService.updateDeliveryMethod(arrangeOrderId, arrangeSelected);
      // SelfDelivery: immediately move to Shipping (OutForDelivery) after arrangement.
      if (arrangeSelected === "SelfDelivery") {
        await orderManagementService.updateOrderStatus(arrangeOrderId, "OutForDelivery");
      }
      showToast("Shipment arranged", "success");
      setArrangeOpen(false);
      setArrangeOrderId(null);
      await fetchOrders();
    } catch (error: unknown) {
      console.error("Error saving delivery method:", error);
      const msg =
        error instanceof Error ? error.message : "Could not save shipping method";
      showToast(msg, "error");
    } finally {
      setArrangeSaving(false);
    }
  }, [arrangeOrderId, arrangeSelected, fetchOrders, showToast]);

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await orderManagementService.deleteOrder(orderToDelete);
      showToast("Order deleted successfully", "success");
      fetchOrders();
      setShowDeletePopup(false);
      setOrderToDelete(null);
    } catch (error: unknown) {
      console.error("Error deleting order:", error);
      const msg =
        error instanceof Error ? error.message : "Failed to delete order";
      showToast(msg, "error");
    }
  };

  const cancelDeleteOrder = () => {
    setShowDeletePopup(false);
    setOrderToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
          <p className="text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Loading orders…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <EnterprisePageHeader
        title="My Orders"
        description="View and manage orders from your customers."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 shadow-sm hover:bg-slate-50"
              onClick={handleExport}
              disabled={exporting || sortedOrders.length === 0}
            >
              {exporting ? "Exporting…" : "Export"}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 shadow-sm hover:bg-slate-50"
              onClick={() => showToast("Export History is not implemented yet", "info")}
            >
              Export History
            </button>
          </div>
        }
      />

      <div className={`${ENTERPRISE_PANEL_CLASS} px-3 py-3 sm:px-4`}>

        <div className="px-2 pt-2">
          <EnterpriseOrdersPrimaryTabs
            tab={tab}
            toShipSub={toShipSub}
            onTabChange={setTabQuery}
          />
        </div>

        <div className="mt-6 border-b border-gray-200 pb-5">
          {tab === "to_ship" ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">Order Status</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={chipClass(toShipSub === "all")}
                    onClick={() => setToShipSubQuery("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={chipClass(toShipSub === "to_process")}
                    onClick={() => setToShipSubQuery("to_process")}
                  >
                    To Process
                  </button>
                  <button
                    type="button"
                    className={chipClass(toShipSub === "processed")}
                    onClick={() => setToShipSubQuery("processed")}
                  >
                    Processed
                  </button>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">Shipping Priority</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={chipClass(pendingPriority === "all")}
                    onClick={() => setPendingPriority("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={chipClass(pendingPriority === "overdue")}
                    onClick={() => setPendingPriority("overdue")}
                  >
                    Overdue (0)
                  </button>
                  <button
                    type="button"
                    className={chipClass(pendingPriority === "today")}
                    onClick={() => setPendingPriority("today")}
                  >
                    Ship by Today (0)
                  </button>
                  <button
                    type="button"
                    className={chipClass(pendingPriority === "tomorrow")}
                    onClick={() => setPendingPriority("tomorrow")}
                  >
                    Ship by Tomorrow (0)
                  </button>
                </div>
              </div>
            </>
          ) : null}

          <div className="flex items-center gap-4">
            <div className="flex min-w-0 flex-1 items-stretch rounded border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-300">
              <DropdownSelect
                value={pendingSearchField}
                onChange={(v) => setPendingSearchField(v as SearchField)}
                options={SEARCH_FIELD_OPTIONS}
                className="w-40 shrink-0"
                borderlessTrigger
                triggerClassName="rounded-none rounded-l-md rounded-r-none"
                aria-label="Search by field"
              />
              <input
                value={pendingSearchInput}
                onChange={(e) => setPendingSearchInput(e.target.value)}
                placeholder={SEARCH_FIELD_PLACEHOLDER[pendingSearchField]}
                className="h-9 min-h-9 min-w-0 flex-1 rounded-none rounded-r-md border-0 border-l border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>

            <div className="flex flex-1 items-center gap-2">
              <label className="shrink-0 text-sm text-gray-600">
                Shipping Channel
              </label>
              <DropdownSelect
                value={pendingShippingChannel}
                onChange={setPendingShippingChannel}
                options={SHIPPING_CHANNEL_OPTIONS}
                className="min-w-0 flex-1"
                aria-label="Shipping channel"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="h-9 rounded border border-[#2563FF] bg-white px-4 text-sm text-[#2563FF] hover:bg-[#2563FF] hover:text-white"
                onClick={handleApply}
              >
                Apply
              </button>
              <button
                type="button"
                className="h-9 rounded border border-gray-300 bg-white px-4 text-sm text-gray-900 hover:bg-gray-50"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-medium text-gray-900">
              {searched.length} Orders
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Sort by:</span>
            <DropdownSelect
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              className="w-72 shrink-0"
              menuClassName="min-w-[18rem]"
              alignMenu="right"
              aria-label="Sort orders"
            />
            {tab === "to_ship" ? (
              <button
                type="button"
                className="h-9 rounded bg-[#2563FF] px-4 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => showToast("Mass Ship is not implemented yet", "info")}
              >
                Mass Ship
              </button>
            ) : null}
          </div>
        </div>

        <EnterpriseOrdersTable
          orders={pagedOrders}
          onDelete={handleDeleteOrder}
          onConfirm={handleConfirmOrder}
          onArrangeShipment={openArrangeShipment}
          onStartPreparing={handleStartPreparing}
          onMarkDelivered={handleMarkDelivered}
          confirmingOrderId={confirmingOrderId}
          actionLoadingOrderId={actionLoadingOrderId}
        />

        <div
          ref={pagerRef}
          className="flex items-center justify-end gap-2 bg-white px-4 py-2"
        >
          <button
            type="button"
            onClick={() => {
              scrollAfterUpdateRef.current = true;
              setPage((p) => Math.max(1, p - 1));
            }}
            disabled={page <= 1}
            className={`inline-flex h-7 w-7 items-center justify-center rounded border text-sm ${
              page <= 1
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            aria-label="Previous page"
          >
            ‹
          </button>

          <div className="text-xs tabular-nums text-gray-700">
            {page} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() => {
              scrollAfterUpdateRef.current = true;
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            disabled={page >= totalPages}
            className={`inline-flex h-7 w-7 items-center justify-center rounded border text-sm ${
              page >= totalPages
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            aria-label="Next page"
          >
            ›
          </button>

          <div className="w-[110px]">
            <DropdownSelect
              value={String(pageSize)}
              onChange={(v) => {
                scrollAfterUpdateRef.current = true;
                setPageSize(Number(v) as 12 | 24 | 48);
              }}
              options={PAGE_SIZE_OPTIONS}
              className="w-full"
              alignMenu="right"
              side="top"
              usePortal
              aria-label="Rows per page"
            />
          </div>
        </div>
      </div>

      <DeleteOrderPopup
        isOpen={showDeletePopup}
        onConfirm={confirmDeleteOrder}
        onCancel={cancelDeleteOrder}
      />

      <ArrangeShipmentModal
        open={arrangeOpen}
        orderIdLabel={arrangeOrderId ? `#${arrangeOrderId}` : ""}
        selected={arrangeSelected}
        onSelect={setArrangeSelected}
        onClose={() => {
          if (arrangeSaving) return;
          setArrangeOpen(false);
          setArrangeOrderId(null);
        }}
        onConfirm={confirmArrangeShipment}
        confirmDisabled={arrangeSaving || !arrangeSelected}
        confirmLabel={arrangeSaving ? "Saving…" : "Confirm"}
      />
    </div>
  );
}
