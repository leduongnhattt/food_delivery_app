import { BaseService } from '@/lib/base-service'
import { buildHeaders, requestJson } from '@/lib/http-client'

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
            const response = await requestJson<{ customer: CustomerDTO }>(
                `/api/customers/by-account?accountId=${accountId}`,
                {
                    method: 'GET',
                    headers: buildHeaders(),
                    cache: 'no-store'
                }
            )
            return response.customer
        } catch (error) {
            console.error('Error fetching customer:', error)
            return null
        }
    }

    static async updateSelf(payload: { fullName?: string; phone?: string; address?: string }): Promise<{ success: boolean; customer?: CustomerDTO; error?: string }> {
        try {
            const response = await requestJson<{ customer: CustomerDTO }>(
                '/api/customers/update-profile',
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


