"use client";

import type { LucideIcon } from "lucide-react";
import { Package, Truck } from "lucide-react";
import { orderManagementService } from "@/services/order-management.service";

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return phone;
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export function money(n: number): string {
  return orderManagementService.formatCurrency(n);
}

export function clampMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  // avoid -0.00
  return Math.abs(n) < 0.00001 ? 0 : n;
}

export type StatusDisplay = {
  icon: LucideIcon;
  message: string | null;
  showViewPickup: boolean;
  showCancelOrder: boolean;
};

export function buildStatusDisplay(statusLower: string): StatusDisplay {
  if (statusLower === "pending") {
    return {
      icon: Package,
      message: "This order is waiting for seller confirmation.",
      showViewPickup: false,
      showCancelOrder: true,
    };
  }

  if (statusLower === "outfordelivery" || statusLower === "delivered") {
    return {
      icon: Truck,
      message: null,
      showViewPickup: true,
      showCancelOrder: false,
    };
  }

  if (statusLower === "completed") {
    return {
      icon: Package,
      message: null,
      showViewPickup: false,
      showCancelOrder: false,
    };
  }

  if (statusLower === "cancelled") {
    return {
      icon: Package,
      message: null,
      showViewPickup: false,
      showCancelOrder: false,
    };
  }

  // confirmed / preparing / readyforpickup / fallback
  return {
    icon: Package,
    message: "There is pending item with your shipment. Please check your shipment to avoid cancellation.",
    showViewPickup: true,
    showCancelOrder: true,
  };
}

export function buildLogisticsTimelineItems(params: {
  statusLower: string;
  orderDate: string;
  deliveredAt: string | null;
}): Array<{ title: string; formattedDate: string }> {
  const { statusLower, orderDate, deliveredAt } = params;
  const items: Array<{ title: string; formattedDate: string }> = [];

  const currentTitle =
    statusLower === "pending"
      ? "New order received"
      : statusLower === "confirmed" || statusLower === "preparing" || statusLower === "readyforpickup"
        ? "Order confirmed, waiting for preparation"
        : statusLower === "outfordelivery"
          ? "Order is out for delivery"
          : statusLower === "delivered"
            ? "Order delivered"
            : statusLower === "completed"
              ? "Completed"
              : "Order confirmed, waiting for preparation";

  const currentTime =
    statusLower === "delivered" || statusLower === "completed" ? deliveredAt || orderDate : orderDate;

  items.push({
    title: currentTitle,
    formattedDate: orderManagementService.formatDate(currentTime),
  });

  // Always include at least one history row so Expand/Collapse works
  if (statusLower !== "pending") {
    items.push({
      title: "New order received",
      formattedDate: orderManagementService.formatDate(orderDate),
    });
  } else {
    items.push({
      title: "Awaiting restaurant confirmation",
      formattedDate: orderManagementService.formatDate(orderDate),
    });
  }

  if (deliveredAt && statusLower !== "pending") {
    items.splice(1, 0, {
      title: "Order is being delivered",
      formattedDate: orderManagementService.formatDate(deliveredAt),
    });
  }

  return items;
}

export function buildActivityDisplayItems(params: {
  statusLower: string;
  orderDate: string;
  deliveredAt: string | null;
}): Array<{ title: string; description?: string; formattedDate: string }> {
  const { statusLower, orderDate, deliveredAt } = params;
  const items: Array<{ title: string; description?: string; formattedDate: string }> = [];

  items.push({
    title: "New order received",
    formattedDate: orderManagementService.formatDate(orderDate),
  });

  if (statusLower === "confirmed" || statusLower === "preparing" || statusLower === "readyforpickup") {
    items.unshift({
      title: "Order confirmed, waiting for preparation",
      formattedDate: orderManagementService.formatDate(orderDate),
    });
  }

  if (deliveredAt) {
    items.unshift({
      title: "Order is being delivered",
      formattedDate: orderManagementService.formatDate(deliveredAt),
    });
  }

  if (statusLower === "completed") {
    items.unshift({
      title: "Completed",
      formattedDate: orderManagementService.formatDate(deliveredAt || orderDate),
    });
  }

  return items.slice(0, 6);
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

