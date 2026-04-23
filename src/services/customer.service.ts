import { getServerApiBase, requestJson, buildQueryString } from '@/lib/http'

const GET_OPTIONS: RequestInit = { method: 'GET', cache: 'no-store' }

export type CustomerRow = {
  CustomerID: string
  AccountID: string
  FullName: string | null
  PhoneNumber: string | null
  Address: string | null
  Latitude?: unknown
  Longitude?: unknown
  LocationUpdatedAt?: string | null
}

export type CustomerMe = {
  phone: string | null
  address: string | null
  lat: number | null
  lng: number | null
}

function getCustomersBase(): string {
  return `${getServerApiBase()}/customers`
}

export class CustomerService {
  static async getByAccount(accountId: string): Promise<CustomerRow | null> {
    const qs = buildQueryString({ accountId })
    const url = `${getCustomersBase()}/by-account?${qs}`
    const res = await requestJson<{ customer?: CustomerRow; error?: string }>(url, GET_OPTIONS)
    return res?.customer ?? null
  }

  static async getMe(): Promise<CustomerMe | null> {
    const url = `${getCustomersBase()}/me`
    const res = await requestJson<{ customer?: CustomerMe; error?: string }>(url, GET_OPTIONS)
    return res?.customer ?? null
  }

  static async updateSelf(params: {
    fullName?: string
    phone?: string
    address?: string
    lat?: number
    lng?: number
  }): Promise<{ success: boolean; customer?: CustomerRow; error?: string }> {
    try {
      const url = `${getCustomersBase()}/update-profile`
      const res = await requestJson<{ customer?: CustomerRow; error?: string }>(url, {
        method: 'PUT',
        body: JSON.stringify(params),
      })
      if (res?.error) {
        return { success: false, error: res.error }
      }
      if (!res?.customer) {
        return { success: false, error: 'Failed to update profile' }
      }
      return { success: true, customer: res.customer }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update profile'
      return { success: false, error: msg }
    }
  }
}
