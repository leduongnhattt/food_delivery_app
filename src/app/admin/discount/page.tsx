import { prisma } from '@/lib/db'
import AdminCreateVoucherForm from './AdminCreateVoucherForm'
import VoucherSearch from '@/components/admin/VoucherSearch'
import TabsVouchers from '@/components/admin/TabsVouchers'

export default async function AdminDiscountPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams
  const status = (params?.status || 'all') as 'pending' | 'approved' | 'all'
  const q = (params?.q || '').trim()

  const where: any = {}
  if (status === 'pending') where.Status = 'Pending'
  if (status === 'approved') where.Status = 'Approved'
  if (q) {
    where.OR = [
      { Code: { contains: q } },
      { enterprise: { is: { EnterpriseName: { contains: q } } } },
    ]
  }

  const vouchers = await prisma.voucher.findMany({
    where,
    orderBy: { CreatedAt: 'desc' },
    take: 50,
    select: {
      VoucherID: true,
      Code: true,
      DiscountPercent: true,
      DiscountAmount: true,
      Status: true,
      ExpiryDate: true,
      MaxUsage: true,
      UsedCount: true,
      CreatedAt: true,
      enterprise: { select: { EnterpriseName: true } }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Discounts</h1>
          <p className="text-slate-600 mt-1">Approve pending vouchers from enterprises</p>
        </div>
        <VoucherSearch currentStatus={status} currentSearch={q} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AdminCreateVoucherForm onCreated={async ()=>{ 'use server'; }} />
        </div>
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-4">
          <TabsVouchers current={status} search={q} />

          {/* Search Results Info */}
          {(q || status !== 'all') && (
            <div className="mt-4 mb-2 text-sm text-slate-600">
              {q ? (
                <span>Found {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''} matching "{q}"</span>
              ) : (
                <span>Showing {vouchers.length} {status} voucher{vouchers.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Voucher Code</th>
                  <th className="py-2 pr-4">Discount Percent</th>
                  <th className="py-2 pr-4">Discount Amount</th>
                  <th className="py-2 pr-4">Usage Count</th>
                  <th className="py-2 pr-4">Expiry Date</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 py-8">
                      No vouchers found
                    </td>
                  </tr>
                ) : vouchers.map(v => (
                  <tr key={v.VoucherID} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">{v.Code}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {v.DiscountPercent ? `${v.DiscountPercent}%` : 'N/A'}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {v.DiscountAmount ? `$${v.DiscountAmount}` : 'N/A'}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {v.UsedCount || 0} / {v.MaxUsage || '∞'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {v.ExpiryDate ? new Date(v.ExpiryDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-3 pr-4">
                      {v.Status === 'Approved' ? (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Approved
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
      </div>
    </div>
  )
}

 