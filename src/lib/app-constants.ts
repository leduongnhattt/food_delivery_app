// Static assets base URL
export const BASE_IMAGE_URL =
  "https://raw.githubusercontent.com/leduongnhattt/food-delivery-static/master/images";

// App configuration
export const APP_NAME = "HanalaFood";
export const APP_EMAIL = "support@hanalafood.com";

// Email templates
export const EMAIL_TEMPLATES = {
  LOGO_URL: `${BASE_IMAGE_URL}/logo_48.png`,
  SUPPORT_EMAIL: APP_EMAIL,
  APP_NAME: APP_NAME,
} as const;

// Password reset configuration
export const PASSWORD_RESET = {
  CODE_LENGTH: 6,
  EXPIRY_SECONDS: 60,
  MAX_ATTEMPTS_PER_HOUR: 3,
  MAX_RESEND_ATTEMPTS_PER_MINUTE: 3,
} as const;

// Rate limiting
export const RATE_LIMITS = {
  FORGOT_PASSWORD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_ATTEMPTS: 3,
  },
  RESEND_CODE: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_ATTEMPTS: 3,
  },
} as const;

export function cartByIdKey(cartId: string): string {
  return `cart:by-id:${cartId}`;
}

export function cartItemsKey(cartId: string): string {
  return `cart:items:${cartId}`;
}

export function cartIdByUserKey(userId: string): string {
  return `cart:id:by-user:${userId}`;
}

export function cartIdByGuestKey(guestToken: string): string {
  return `cart:id:by-guest:${guestToken}`;
}

export const ONE_DAY_SECONDS = 60 * 60 * 24;

export const CATEGORY_ICON_MAP: Record<string, string> = {
  Pizza: "🍕",
  Sushi: "🍣",
  Pho: "🍜",
  Burger: "🍔",
  Salad: "🥗",
  Dessert: "🍰",
  Drinks: "🥤",
  Coffee: "☕",
  Chicken: "🍗",
  Pasta: "🍝",
  "Hot Pot": "🍲",
  Sandwich: "🥖",
};

export const CATEGORY_TONE_MAP: Record<string, string> = {
  Pizza: "bg-red-50 text-red-700 border-red-100",
  Sushi: "bg-blue-50 text-blue-700 border-blue-100",
  Pho: "bg-orange-50 text-orange-700 border-orange-100",
  Burger: "bg-amber-50 text-amber-700 border-amber-100",
  Salad: "bg-green-50 text-green-700 border-green-100",
  Dessert: "bg-pink-50 text-pink-700 border-pink-100",
  Drinks: "bg-purple-50 text-purple-700 border-purple-100",
  Coffee: "bg-stone-50 text-stone-700 border-stone-100",
  Chicken: "bg-orange-50 text-orange-700 border-orange-100",
  Pasta: "bg-yellow-50 text-yellow-700 border-yellow-100",
  "Hot Pot": "bg-red-50 text-red-700 border-red-100",
  Sandwich: "bg-amber-50 text-amber-700 border-amber-100",
};

function normalize(name: string): string {
  return (name || "")
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getCategoryIcon(name: string, fallback = "🍽️"): string {
  const key = normalize(name);
  return CATEGORY_ICON_MAP[key] ?? fallback;
}

export function getCategoryTone(
  name: string,
  fallback = "bg-gray-50 text-gray-700 border-gray-100",
): string {
  const key = normalize(name);
  return CATEGORY_TONE_MAP[key] ?? fallback;
}

