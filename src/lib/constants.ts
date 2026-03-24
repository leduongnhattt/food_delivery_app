// Base URLs and constants for the application

// Static assets base URL
export const BASE_IMAGE_URL = "https://raw.githubusercontent.com/leduongnhattt/food-delivery-static/master/images";

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
