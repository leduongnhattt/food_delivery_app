/**
 * `filterId` is sent as `paymentChannel` query param on list API.
 * `postValue` is sent as `paymentChannel` JSON field on create/update (must match server `parseUiPaymentChannelToDb`).
 */
export const TRANSACTION_FEE_PAYMENT_CHANNELS = [
  { filterId: "Cash", postValue: "Cash", label: "Cash" },
  { filterId: "CreditCard", postValue: "Credit Card", label: "Credit Card" },
  { filterId: "Stripe", postValue: "Stripe", label: "Stripe" },
  { filterId: "MoMo", postValue: "MoMo", label: "MoMo" },
  { filterId: "VNPay", postValue: "VNPay", label: "VNPay" },
  { filterId: "BankTransfer", postValue: "Bank Transfer", label: "Bank Transfer" },
] as const

export type TransactionFeePaymentChannelFilterId =
  (typeof TRANSACTION_FEE_PAYMENT_CHANNELS)[number]["filterId"]

export const TRANSACTION_FEE_PAYMENT_CHANNEL_FILTER_MENU: ReadonlyArray<{
  filterId: "all" | TransactionFeePaymentChannelFilterId
  label: string
}> = [
  { filterId: "all", label: "All Payment Channels" },
  ...TRANSACTION_FEE_PAYMENT_CHANNELS.map((c) => ({
    filterId: c.filterId,
    label: c.label,
  })),
]
