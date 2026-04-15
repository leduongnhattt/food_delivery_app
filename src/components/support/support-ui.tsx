import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-900 border-amber-200',
  InProgress: 'bg-sky-100 text-sky-900 border-sky-200',
  Resolved: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
}

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Pending',
  InProgress: 'In progress',
  Resolved: 'Resolved',
  Closed: 'Closed',
}

export function SupportStatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_STYLES[status] ??
    'bg-slate-100 text-slate-700 border-slate-200'
  const label = STATUS_LABEL[status] ?? status
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        cls,
      )}
    >
      {label}
    </span>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  General: 'General',
  ReviewModeration: 'Review moderation',
  AccountShop: 'Account & store',
  MenuCatalog: 'Menu & catalog',
  OrderOperations: 'Orders & operations',
  SettlementPayment: 'Payouts & payments',
  Promotions: 'Promotions',
  Technical: 'Technical issue',
  Order: 'Order',
  Delivery: 'Delivery',
  PaymentRefund: 'Payment & refund',
  Account: 'Account',
  ComplaintRestaurant: 'Restaurant complaint',
}

const CATEGORY_HELP: Record<string, string> = {
  General: 'General questions and help requests.',
  ReviewModeration: 'Questions about review moderation (system generated).',
  AccountShop: 'Login, profile, shop/store setup and management.',
  MenuCatalog: 'Menu, food items, pricing, availability, catalog updates.',
  OrderOperations: 'Order flow, order issues, cancellations, operations.',
  SettlementPayment: 'Payouts, settlements, invoices, payment-related topics.',
  Promotions: 'Vouchers, discounts, promotions setup and issues.',
  Technical: 'App errors, bugs, performance or unexpected behavior.',
  Order: 'Order related questions.',
  Delivery: 'Delivery tracking, delivery issues.',
  PaymentRefund: 'Payments, refunds, chargebacks.',
  Account: 'Account access and security.',
  ComplaintRestaurant: 'Complaints about restaurant/service.',
}

export function SupportCategoryLabel({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] ?? category
  const help = CATEGORY_HELP[category] ?? ''
  return (
    <span
      title={help || undefined}
      className="text-xs font-medium text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md"
    >
      {label}
    </span>
  )
}

/** Admin list filter — includes every enum value + “All”. */
export const SUPPORT_CATEGORY_FILTER_OPTIONS: { value: string; label: string }[] =
  [{ value: '', label: 'All categories' }].concat(
    Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  )

/** New ticket form — hide system-only categories. */
export const SUPPORT_CATEGORY_CREATE_OPTIONS: { value: string; label: string }[] =
  Object.entries(CATEGORY_LABELS)
    .filter(([key]) => key !== 'ReviewModeration')
    .map(([value, label]) => ({ value, label }))
