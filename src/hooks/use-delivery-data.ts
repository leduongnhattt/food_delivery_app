import { useState, useEffect } from 'react'
import { CustomerService } from '@/services/customer.service'
import { useAuth } from './use-auth'

export interface DeliveryData {
    phone: string
    address: string
}

export function useDeliveryData() {
    const { user, isAuthenticated } = useAuth()
    const [deliveryData, setDeliveryData] = useState<DeliveryData>({
        phone: '',
        address: ''
    })
    const [isLoading, setIsLoading] = useState(true)

    // Fetch customer delivery data on mount/auth ready
    useEffect(() => {
        const loadDeliveryData = async () => {
            if (!isAuthenticated || !user?.id) {
                setIsLoading(false)
                return
            }

            try {
                const customer = await CustomerService.getByAccount(user.id)
                if (customer) {
                    setDeliveryData({
                        phone: normalizePhone(customer.PhoneNumber),
                        address: normalizeAddress(customer.Address)
                    })
                }
            } catch (error) {
                console.error('Failed to load delivery data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadDeliveryData()
    }, [isAuthenticated, user?.id])

    return {
        deliveryData,
        isLoading
    }
}

function normalizePhone(value: string | null | undefined): string {
    if (!value) return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^0+$/.test(trimmed)) return ''
    if (trimmed.length < 8) return ''
    return trimmed
}

function normalizeAddress(value: string | null | undefined): string {
    if (!value) return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (trimmed.toLowerCase() === 'default address') return ''
    if (trimmed.length < 5) return ''
    return trimmed
}
