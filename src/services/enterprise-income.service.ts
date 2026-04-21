import { getServerApiBase, requestJson } from "@/lib/http-client";

export type EnterpriseIncomeSummary = {
  success: boolean;
  currency: string;
  period: { start: string; end: string };
  settlement: { id: string; status: string; paidAt: string | null } | null;
  balance: number;
  defaultPayoutDestination:
    | {
        id: string;
        kind: string;
        bankName: string | null;
        accountNumber: string | null;
        walletRef: string | null;
        walletDisplayName: string | null;
      }
    | null;
  canWithdraw: boolean;
};

export type EnterpriseIncomeTx = {
  id: string;
  createdAt: string;
  transactionType: string;
  description: string;
  referenceId: string | null;
  moneyFlow: "in" | "out";
  amount: number;
  status: string;
  metadata: unknown;
};

export class EnterpriseIncomeService {
  static async summary(): Promise<EnterpriseIncomeSummary> {
    const base = getServerApiBase();
    return requestJson(`${base}/enterprise/income/summary`, {
      method: "GET",
      cache: "no-store",
    });
  }

  static async transactions(params?: {
    from?: string;
    to?: string;
    moneyFlow?: "all" | "in" | "out";
    types?: string[];
    searchOrderId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ success: boolean; nextCursor: string | null; transactions: EnterpriseIncomeTx[] }> {
    const base = getServerApiBase();
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.moneyFlow && params.moneyFlow !== "all") qs.set("moneyFlow", params.moneyFlow);
    if (params?.types && params.types.length) qs.set("types", params.types.join(","));
    if (params?.searchOrderId) qs.set("searchOrderId", params.searchOrderId);
    if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
    if (params?.cursor) qs.set("cursor", params.cursor);
    const url = `${base}/enterprise/income/transactions${qs.toString() ? `?${qs.toString()}` : ""}`;
    return requestJson(url, { method: "GET", cache: "no-store" });
  }

  static async withdraw(body: {
    payoutDestinationId?: string;
    settlementId?: string;
    reason?: string;
  }): Promise<{ success: boolean; payoutRequest: { id: string; status: string; createdAt: string; expiresAt: string } }> {
    const base = getServerApiBase();
    return requestJson(`${base}/enterprise/income/withdraw`, {
      method: "POST",
      body: JSON.stringify(body),
      cache: "no-store",
    });
  }
}

