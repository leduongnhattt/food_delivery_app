import { getServerApiBase, requestJson } from "@/lib/http-client";

export class EnterpriseFinanceService {
  static async verifyPassword(body: { password: string }): Promise<{ success: boolean }> {
    const base = getServerApiBase();
    return requestJson(`${base}/enterprise/finance/verify-password`, {
      method: "POST",
      body: JSON.stringify(body),
      cache: "no-store",
    });
  }
}

