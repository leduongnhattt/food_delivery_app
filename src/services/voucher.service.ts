import { requestJson, getServerApiBase } from '@/lib/http-client'

export interface VoucherDTO {
    Code: string
    DiscountAmount?: number
    DiscountPercent?: number
    MinOrderValue?: number
}

export class VoucherService {
    static async list(): Promise<VoucherDTO[]> {
        const base = getServerApiBase()
        const res = await requestJson<any>(`${base}/vouchers`)
        if (res?.success && Array.isArray(res.vouchers)) return res.vouchers
        return []
    }

    static async validate(code: string): Promise<VoucherDTO | null> {
        const base = getServerApiBase()
        const res = await requestJson<any>(`${base}/vouchers?code=${encodeURIComponent(code)}`)
        if (res?.success && res.voucher) return res.voucher
        return null
    }
}


