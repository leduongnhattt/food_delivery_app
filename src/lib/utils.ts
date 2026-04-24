import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function mergeClasses(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  // Round to 2 decimal places to fix floating point precision issues
  const roundedPrice = Math.round(price * 100) / 100

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundedPrice)
}

// Format currency without cents for concise display on cards/lists
export function formatPriceNoCents(price: number): string {
  // Round to nearest integer to avoid floating point issues
  const roundedPrice = Math.round(price)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedPrice)
}

// Format currency with up to 2 decimals, trimming unnecessary zeros.
// Examples: 8   -> $8, 8.5 -> $8.5, 8.25 -> $8.25
export function formatPriceCompact(price: number): string {
  const roundedPrice = Math.round(price * 100) / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(roundedPrice)
}

// Finance pages sometimes need fixed-precision currency display (2 decimals).
export function formatCurrency(value: number, currency: string = 'USD'): string {
  const roundedValue = Math.round(value * 100) / 100
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(roundedValue)
  } catch {
    return `${roundedValue.toFixed(2)} ${currency}`
  }
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' })
}

export function clampISODate(s: string): string {
  const t = (s || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ''
}

/**
 * Safely calculate price to avoid floating point precision issues
 * @param price Base price
 * @param quantity Quantity to multiply
 * @returns Rounded price with 2 decimal places
 */
export function calculatePrice(price: number, quantity: number = 1): number {
  // Use Math.round to avoid floating point precision issues
  return Math.round((price * quantity) * 100) / 100
}

/**
 * Safely add prices to avoid floating point precision issues
 * @param prices Array of prices to sum
 * @returns Rounded total with 2 decimal places
 */
export function sumPrices(prices: number[]): number {
  // Use Math.round to avoid floating point precision issues
  return Math.round(prices.reduce((sum, price) => sum + price, 0) * 100) / 100
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'

  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const hh = String(hours).padStart(2, '0')

  return `${dd}/${mm}/${yyyy}, ${hh}:${minutes} ${ampm}`
}

/**
 * Generates a clean username from email address
 * @param email Email address
 * @returns Clean username without special characters
 */
export function generateUsernameFromEmail(email: string): string {
  // Extract the part before @
  const emailPrefix = email.split('@')[0];

  // Remove special characters and replace with underscores
  const cleanUsername = emailPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')  // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')         // Replace multiple underscores with single
    .replace(/^_|_$/g, '');      // Remove leading/trailing underscores

  // Ensure minimum length
  if (cleanUsername.length < 3) {
    return `user_${cleanUsername}`;
  }

  return cleanUsername;
}

export function renderPreview(tpl: string, params: Record<string, string>): string {
  let out = tpl
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v)
  }
  return out
}

export function htmlToText(html: string): string {
  if (!html) return ""
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function textToHtml(text: string): string {
  const safe = escapeHtml(text || "")
  const body = safe.replace(/\n/g, "<br/>")
  return `<!doctype html><html><head><meta charset="utf-8"/></head><body style="font-family:Inter,Arial,sans-serif;white-space:normal;">${body}</body></html>`
}