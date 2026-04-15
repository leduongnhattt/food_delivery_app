export const CHECKOUT_PAYMENT_METHOD = {
  Cash: 'cash',
  Card: 'card',
  Stripe: 'stripe',
  VnPay: 'vnpay',
} as const;

export type CheckoutPaymentMethod =
  (typeof CHECKOUT_PAYMENT_METHOD)[keyof typeof CHECKOUT_PAYMENT_METHOD];

/** Order used in the checkout payment grid (matches previous UX). */
export const CHECKOUT_PAYMENT_METHOD_UI_ORDER: readonly CheckoutPaymentMethod[] = [
  CHECKOUT_PAYMENT_METHOD.Cash,
  CHECKOUT_PAYMENT_METHOD.Card,
  CHECKOUT_PAYMENT_METHOD.Stripe,
  CHECKOUT_PAYMENT_METHOD.VnPay,
];

export function getCheckoutPrimaryButtonLabel(
  method: CheckoutPaymentMethod,
  totalFormatted: string,
): string {
  switch (method) {
    case CHECKOUT_PAYMENT_METHOD.Stripe:
      return `Pay Now — ${totalFormatted}`;
    case CHECKOUT_PAYMENT_METHOD.VnPay:
      return `Pay with VNPAY — ${totalFormatted}`;
    case CHECKOUT_PAYMENT_METHOD.Cash:
      return `Confirm Order — ${totalFormatted}`;
    default:
      return `Proceed to Payment — ${totalFormatted}`;
  }
}
