import { getServerApiBase, requestJson } from "@/lib/http";

export type EnterprisePayoutDestinationKind = "BankAccount" | "EWallet";

export type FieldErrors = Partial<
  Record<
    | "bank_name"
    | "account_holder"
    | "account_number"
    | "provider_code"
    | "wallet_ref"
    | "_form",
    string
  >
>;

export class BankAccountApiError extends Error {
  fieldErrors?: FieldErrors;
  constructor(message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "BankAccountApiError";
    this.fieldErrors = fieldErrors;
  }
}

export type EnterpriseBankAccountRow = {
  id: string;
  kind: EnterprisePayoutDestinationKind;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  bankName: string | null;
  bankCode: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  branchName: string | null;
  countryCode: string | null;
  providerCode: string | null;
  walletRef: string | null;
  walletDisplayName: string | null;
};

function mapServerMessageToFieldErrors(message: string): FieldErrors | undefined {
  const m = (message || "").trim();
  if (!m) return undefined;
  const lower = m.toLowerCase();

  if (lower.includes("bankname")) return { bank_name: m };
  if (lower.includes("accountholdername")) return { account_holder: m };
  if (lower.includes("accountnumber")) return { account_number: m };
  if (lower.includes("providercode")) return { provider_code: m };
  if (lower.includes("walletref")) return { wallet_ref: m };

  if (lower.includes("already exists")) return { _form: m };
  if (lower.includes("unauthorized")) return { _form: m };
  return { _form: m };
}

export class EnterpriseBankAccountsService {
  static async list(): Promise<{ success: boolean; bankAccounts: EnterpriseBankAccountRow[] }> {
    const base = getServerApiBase();
    return requestJson(`${base}/enterprise/bank-accounts`, { method: "GET", cache: "no-store" });
  }

  static async create(body: {
    kind: EnterprisePayoutDestinationKind;
    label?: string;
    isDefault?: boolean;
    // Bank account
    bankName?: string;
    bankCode?: string;
    accountHolderName?: string;
    accountNumber?: string;
    branchName?: string;
    countryCode?: string;
    // Provider
    providerCode?: string;
    walletRef?: string;
    walletDisplayName?: string;
  }): Promise<{ success: boolean; id: string }> {
    const base = getServerApiBase();
    try {
      return await requestJson(`${base}/enterprise/bank-accounts`, {
        method: "POST",
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Failed to create bank account";
      const fieldErrors =
        typeof msg === "string" ? mapServerMessageToFieldErrors(msg) : undefined;
      throw new BankAccountApiError(msg, fieldErrors);
    }
  }

  static async update(
    id: string,
    body: Partial<{
      label: string;
      isDefault: boolean;
      isActive: boolean;
      bankName: string;
      bankCode: string;
      accountHolderName: string;
      accountNumber: string;
      branchName: string;
      countryCode: string;
      providerCode: string;
      walletRef: string;
      walletDisplayName: string;
    }>,
  ): Promise<{ success: boolean }> {
    const base = getServerApiBase();
    try {
      return await requestJson(`${base}/enterprise/bank-accounts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Failed to update bank account";
      const fieldErrors =
        typeof msg === "string" ? mapServerMessageToFieldErrors(msg) : undefined;
      throw new BankAccountApiError(msg, fieldErrors);
    }
  }

  static async delete(id: string): Promise<{ success: boolean }> {
    const base = getServerApiBase();
    try {
      return await requestJson(`${base}/enterprise/bank-accounts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        cache: "no-store",
      });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Failed to delete bank account";
      const fieldErrors =
        typeof msg === "string" ? mapServerMessageToFieldErrors(msg) : undefined;
      throw new BankAccountApiError(msg, fieldErrors);
    }
  }
}

