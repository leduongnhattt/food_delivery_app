import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Lock, Unlock } from 'lucide-react'
import ActionButton from '@/components/admin/ActionButton'
import TabsCustomers from '@/components/admin/TabsCustomers'
import CustomerSearch from '@/components/admin/CustomerSearch'

async function lockCustomer(customerId: string) {
  'use server'
  const cust = await prisma.customer.findUnique({ where: { CustomerID: customerId }, select: { AccountID: true } })
  if (!cust) return
  await prisma.account.update({ where: { AccountID: cust.AccountID }, data: { Status: 'Inactive' } })
  revalidatePath('/admin/customers')
  redirect('/admin/customers?status=locked')
}

async function unlockCustomer(customerId: string) {
  'use server'
  const cust = await prisma.customer.findUnique({ where: { CustomerID: customerId }, select: { AccountID: true } })
  if (!cust) return
  await prisma.account.update({ where: { AccountID: cust.AccountID }, data: { Status: 'Active' } })
  revalidatePath('/admin/customers')
  redirect('/admin/customers?status=active')
}

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string }> }) {
  const params = await searchParams
  const tab = (params?.status || 'all') as 'all'|'active'|'locked'
  const search = params?.search?.trim() || ''

  const where: any = {}
  if (tab === 'active') where.account = { is: { Status: 'Active' } }
  if (tab === 'locked') where.account = { is: { Status: 'Inactive' } }
  if (search) {
    where.OR = [
      { FullName: { contains: search } },
      { PhoneNumber: { contains: search } },
      { account: { is: { Email: { contains: search } } } }
    ]
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { account: { CreatedAt: 'desc' } },
    take: 50,
    select: {
      CustomerID: true,
      FullName: true,
      PhoneNumber: true,
      account: { select: { AccountID: true, Email: true, Status: true, CreatedAt: true } }
    }
  })


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-slate-600 mt-1">Manage customer accounts and access</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsCustomers current={tab} search={search} />
          <CustomerSearch currentTab={tab} currentSearch={search} />
        </div>

        {/* Search Results Info */}
        {(search || tab !== 'all') && (
          <div className="mt-4 mb-2 text-sm text-slate-600">
            {search ? (
              <span>Found {customers.length} customer{customers.length !== 1 ? 's' : ''} matching "{search}"</span>
            ) : (
              <span>Showing {customers.length} {tab} customer{customers.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4 w-28">Status</th>
                <th className="py-2 pr-0 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.CustomerID} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 font-medium text-slate-900">{c.FullName}</td>
                  <td className="py-3 pr-4 text-slate-700">{c.account.Email}</td>
                  <td className="py-3 pr-4 text-slate-700">{c.PhoneNumber}</td>
                  <td className="py-3 pr-4 text-slate-700">{formatDate(String(c.account.CreatedAt)).split(',')[0]}</td>
                  <td className="py-3 pr-4 w-28">
                    {c.account.Status === 'Active' ? (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">Locked</span>
                    )}
                  </td>
                  <td className="py-3 pr-0 text-right w-36">
                    <form className="ml-[100px]" action={c.account.Status === 'Active' ? lockCustomer.bind(null, c.CustomerID) : unlockCustomer.bind(null, c.CustomerID)}>
                      <ActionButton pendingText={c.account.Status === 'Active' ? 'Locking...' : 'Unlocking...'}>
                        {c.account.Status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 text-rose-700"><Lock className="w-3 h-3" /> Lock</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700"><Unlock className="w-3 h-3" /> Unlock</span>
                        )}
                      </ActionButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              {tab === 'locked' ? 'No locked customers' : tab === 'active' ? 'No active customers' : 'No customers'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


