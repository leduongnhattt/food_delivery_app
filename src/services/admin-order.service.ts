/**
 * HTTP helpers for admin orders.
 */

import {
  buildQueryString,
  getServerApiBase,
  requestJson,
} from '@/lib/http'
import { AdminOrderDetailResponse, AdminOrdersListResponse } from '@/types/admin-api.types'

export type AdminOrdersListQuery = {
  orderId?: string;
  enterpriseId?: string;
  buyerSearch?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  cursor?: string;
};

function nestApiBase(): string {
  return getServerApiBase().replace(/\/$/, '')
}

function urlAdminOrders(): string {
  return `${nestApiBase()}/admin/orders`
}

function urlAdminOrderDetail(orderId: string): string {
  return `${urlAdminOrders()}/${encodeURIComponent(orderId)}`
}

/**
 * @param params Filter + cursor pagination
 */
export async function listAdminOrders(
  params: AdminOrdersListQuery,
): Promise<AdminOrdersListResponse> {
  const qs = buildQueryString({
    orderId: params.orderId,
    enterpriseId: params.enterpriseId,
    buyerSearch: params.buyerSearch,
    status: params.status,
    paymentMethod: params.paymentMethod,
    paymentStatus: params.paymentStatus,
    fromDate: params.fromDate,
    toDate: params.toDate,
    limit: params.limit,
    cursor: params.cursor,
  })

  const url = qs ? `${urlAdminOrders()}?${qs}` : urlAdminOrders()

  return requestJson<AdminOrdersListResponse>(url, {
    method: 'GET',
  })
}

/**
 * @param orderId OrderID
 */
export async function getAdminOrderDetail(
  orderId: string,
): Promise<AdminOrderDetailResponse> {
  return requestJson<AdminOrderDetailResponse>(
    urlAdminOrderDetail(orderId),
    {
      method: 'GET',
    },
  )
}

export async function deleteAdminOrder(orderId: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(urlAdminOrderDetail(orderId), {
    method: 'DELETE',
  })
}