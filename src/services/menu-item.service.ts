import { buildQueryString, getServerApiBase, requestJson } from '@/lib/http-client'
import type {
    MenuItemAfterUpdateApi,
    MenuItemDeleteApiResponse,
    MenuItemRecordApi,
    MenuItemsListApiResponse,
} from '@/types/menu-item-api.types'

function menuItemsBaseUrl(): string {
    return `${getServerApiBase().replace(/\/$/, '')}/menu-items`
}

export interface CreateMenuItemPayload {
    name: string
    description: string
    price: number | string
    category: string
    restaurantId: string
    image?: string | null
    isAvailable?: boolean
}

export interface UpdateMenuItemPayload {
    name?: string
    description?: string
    price?: number | string
    image?: string | null
    isAvailable?: boolean
}

/**
 * Calls Nest `MenuItemsModule` (`/api/menu-items`).
 * Legacy Next routes under `src/app/api/menu-items` stay unchanged until you remove them.
 */
export class MenuItemService {
    static async list(
        params: Record<string, string | number | boolean | undefined>
    ): Promise<MenuItemsListApiResponse> {
        const qs = buildQueryString(params)
        const url = `${menuItemsBaseUrl()}${qs ? `?${qs}` : ''}`
        return requestJson<MenuItemsListApiResponse>(url, {
            method: 'GET',
            cache: 'no-store',
        })
    }

    static async getById(id: string): Promise<MenuItemRecordApi> {
        return requestJson<MenuItemRecordApi>(
            `${menuItemsBaseUrl()}/${encodeURIComponent(id)}`,
            { method: 'GET', cache: 'no-store' }
        )
    }

    static async create(payload: CreateMenuItemPayload): Promise<MenuItemRecordApi> {
        return requestJson<MenuItemRecordApi>(menuItemsBaseUrl(), {
            method: 'POST',
            body: JSON.stringify(payload),
            cache: 'no-store',
        })
    }

    static async update(
        id: string,
        payload: UpdateMenuItemPayload
    ): Promise<MenuItemAfterUpdateApi> {
        return requestJson<MenuItemAfterUpdateApi>(
            `${menuItemsBaseUrl()}/${encodeURIComponent(id)}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
                cache: 'no-store',
            }
        )
    }

    static async remove(id: string): Promise<MenuItemDeleteApiResponse> {
        return requestJson<MenuItemDeleteApiResponse>(
            `${menuItemsBaseUrl()}/${encodeURIComponent(id)}`,
            { method: 'DELETE', cache: 'no-store' }
        )
    }
}
