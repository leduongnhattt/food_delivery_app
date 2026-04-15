import { Locale } from './i18n'

export const ITEM_ORDER_VALUE_LIMIT_USD = 100 // $10M per item (default currency)
export const ITEM_ORDER_VALUE_LIMIT_VND = 1_000_000 // 1M VND per item
export const ITEM_ORDER_VALUE_LIMIT = ITEM_ORDER_VALUE_LIMIT_USD

export const exceedsItemValueLimit = (unitPriceUsd: number, quantity: number): boolean => {
    if (!Number.isFinite(unitPriceUsd) || !Number.isFinite(quantity)) return false
    return unitPriceUsd * quantity > ITEM_ORDER_VALUE_LIMIT_USD
}

export const getOrderLimitLabel = (locale: Locale, formatUsd: (value: number) => string): string => {
    if (locale === 'vi') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(ITEM_ORDER_VALUE_LIMIT_VND)
    }

    return formatUsd(ITEM_ORDER_VALUE_LIMIT_USD)
}

