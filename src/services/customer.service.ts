import { BaseService } from '@/lib/base-service'
import { buildHeaders, getServerApiBase, requestJson } from '@/lib/http-client'

export type CustomerDTO = {
    CustomerID: string
    AccountID: string
    FullName: string | null
    PhoneNumber: string | null
    Address: string | null
    DateOfBirth: string | null
    Gender: string | null
    PreferredPaymentMethod: string | null
}

export class CustomerService extends BaseService {
    constructor() {
        super('/api/customers')
    }

    static async getByAccount(accountId: string): Promise<CustomerDTO | null> {
        try {
            const base = getServerApiBase()
            const response = await requestJson<{ customer: CustomerDTO }>(
                `${base}/customers/by-account?accountId=${encodeURIComponent(accountId)}`,
                {
                    method: 'GET',
                    headers: buildHeaders(),
                    cache: 'no-store'
                }
            )
            return response.customer ?? null
        } catch (error) {
            const err = error as Error & { status?: number }
            if (err.status === 404) {
                return null
            }
            console.error('Error fetching customer:', error)
            return null
        }
    }

    static async updateSelf(payload: { fullName?: string; phone?: string; address?: string }): Promise<{ success: boolean; customer?: CustomerDTO; error?: string }> {
        try {
            const base = getServerApiBase()
            const response = await requestJson<{ customer: CustomerDTO }>(
                `${base}/customers/update-profile`,
                {
                    method: 'PUT',
                    headers: buildHeaders(),
                    body: JSON.stringify(payload)
                }
            )
            return { success: true, customer: response.customer }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Update failed'
            return { success: false, error: errorMessage }
        }
    }
}


