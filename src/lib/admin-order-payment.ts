/**
 * Display helpers for admin order checkout / summary (maps Prisma `PaymentMethod` enum strings).
 */

export type AdminOrderPaymentRow = {
  PaymentMethod: string;
  PaymentDate: string | null;
  PaymentStatus: string;
  TransactionID?: string | null;
};

export function primaryPaymentRow(
  payments: AdminOrderPaymentRow[] | undefined | null,
): AdminOrderPaymentRow | null {
  if (!payments?.length) return null;
  return payments[0];
}

/** COD vs online (checkout "Payment Type"). */
export function adminPaymentTypeLabel(method: string | undefined): string {
  if (!method) return "—";
  if (method === "Cash") return "Cash on delivery (COD)";
  return "Online payment";
}

/** Provider / rail (checkout "Payment Channel Name"). */
export function adminPaymentChannelLabel(method: string | undefined): string {
  if (!method) return "—";
  switch (method) {
    case "Cash":
      return "Cash";
    case "CreditCard":
      return "Credit card";
    case "MoMo":
      return "MoMo";
    case "VNPay":
      return "VNPay";
    case "BankTransfer":
      return "Bank transfer";
    default:
      return method;
  }
}

/** Summary card: same as channel label (transaction id is not shown in admin UI). */
export function adminPaymentSummaryLine(row: AdminOrderPaymentRow | null): string {
  if (!row) return "—";
  return adminPaymentChannelLabel(row.PaymentMethod);
}
