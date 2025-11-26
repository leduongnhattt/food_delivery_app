import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
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