/** Display labels for Prisma OrderStatus values (PascalCase from API). */

export function orderStatusLabel(status: string): string {
  const s = status.trim();
  const map: Record<string, string> = {
    Pending: "Pending",
    Confirmed: "Confirmed",
    Preparing: "Preparing",
    ReadyForPickup: "Ready for pickup",
    OutForDelivery: "Out for delivery",
    Delivered: "Delivered",
    Completed: "Completed",
    Cancelled: "Cancelled",
    Refunded: "Refunded",
  };
  return map[s] || s;
}

export function orderStatusBadgeClass(status: string): string {
  const st = status.toLowerCase();
  if (st === "pending") return "bg-amber-100 text-amber-900 border-amber-200";
  if (st === "confirmed") return "bg-blue-100 text-blue-900 border-blue-200";
  if (st === "preparing" || st === "readyforpickup")
    return "bg-indigo-100 text-indigo-900 border-indigo-200";
  if (st === "outfordelivery") return "bg-purple-100 text-purple-900 border-purple-200";
  if (st === "delivered" || st === "completed")
    return "bg-green-100 text-green-900 border-green-200";
  if (st === "cancelled" || st === "refunded")
    return "bg-red-100 text-red-900 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}
