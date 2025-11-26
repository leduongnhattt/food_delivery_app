"use server"
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { invalidateApprovedVouchersCache } from '@/lib/redis'

export async function approveVoucherAction(formData: FormData) {
    const id = formData.get('id') as string
    if (!id) return
    await prisma.voucher.update({ where: { VoucherID: id }, data: { Status: 'Approved' } })
    // Invalidate approved vouchers cache for customers
    await invalidateApprovedVouchersCache()
    revalidatePath('/admin/discount')
}


