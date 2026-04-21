/**
 * Vietnam bank list for Enterprise payout destinations.
 * International payouts are handled by providers (e.g. Stripe) and are NOT included here.
 */
export const ENTERPRISE_VN_BANK_NAMES: string[] = [
  "Vietcombank",
  "VietinBank",
  "BIDV",
  "Agribank",
  "Techcombank",
  "ACB",
  "MBBank",
  "VPBank",
  "Sacombank",
  "SHB",
  "VIB",
  "HDBank",
  "TPBank",
];

export const ENTERPRISE_PAYOUT_PROVIDERS = {
  stripe: "Stripe",
  paypal: "PayPal",
  wise: "Wise",
  payoneer: "Payoneer",
} as const;
