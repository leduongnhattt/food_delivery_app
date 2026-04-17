import { getServerApiBase, requestJson } from "@/lib/http-client";

export type ReturnRequestStatus =
  | "PendingReview"
  | "Approved"
  | "Rejected"
  | "CancelledByCustomer"
  | "Completed";

export type ReturnReasonCode =
  | "missing_items"
  | "wrong_item"
  | "quality_issue"
  | "damaged_spill"
  | "late_delivery"
  | "other";

export type ReturnRequestedSolution = "RefundOnly" | "Replace" | "StoreCredit";

export interface EnterpriseReturnRequestItem {
  id: string;
  orderDetailId: string;
  foodId: string;
  foodName: string;
  imageUrl: string | null;
  quantity: number;
  lineAmount: number;
}

export interface EnterpriseReturnRequestRow {
  id: string;
  orderId: string;
  status: ReturnRequestStatus;
  reasonCode: ReturnReasonCode;
  reasonText: string | null;
  requestedSolution: ReturnRequestedSolution;
  requestedAmount: number;
  metadata: unknown;
  requestedAt: string;
  updatedAt: string;
  customer: { name: string };
  order: {
    orderDate: string | null;
    totalAmount: number | null;
    cancelReason: string | null;
    refundPending: boolean;
  };
  items: EnterpriseReturnRequestItem[];
}

export class EnterpriseReturnsService {
  static async list(params?: {
    status?: ReturnRequestStatus | "All";
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{ success: boolean; totalCount: number; returns: EnterpriseReturnRequestRow[] }> {
    const base = getServerApiBase();
    const qp = new URLSearchParams();
    if (params?.status && params.status !== "All") qp.set("status", params.status);
    if (params?.startDate) qp.set("startDate", params.startDate);
    if (params?.endDate) qp.set("endDate", params.endDate);
    if (params?.search) qp.set("search", params.search);
    const url = `${base}/enterprise/returns${qp.toString() ? `?${qp.toString()}` : ""}`;
    return requestJson(url, { method: "GET", cache: "no-store" });
  }

  static async updateStatus(
    id: string,
    body: { status: "Approved" | "Rejected"; internalNote?: string },
  ): Promise<{ success: boolean; id: string; status: ReturnRequestStatus; orderId: string }> {
    const base = getServerApiBase();
    return requestJson(`${base}/enterprise/returns/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
      cache: "no-store",
    });
  }
}

