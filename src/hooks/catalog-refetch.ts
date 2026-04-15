/**
 * Default interval for re-fetching storefront catalog (restaurants / foods) so changes
 * from admin (activate / deactivate) appear without a manual refresh.
 * Not truly real-time; use WebSockets/SSE if you need instant cross-user updates.
 */
export const CATALOG_REFETCH_INTERVAL_MS = 30_000
